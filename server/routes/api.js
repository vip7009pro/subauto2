const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { pipeline } = require('@xenova/transformers');
const translate = require('google-translate-api-x');
const { extractAudio, renderVideoWithSubtitles, getVideoDuration, cleanupOldFiles } = require('../utils/ffmpegUtils');
const { toSRT, toASS, fromSRT, fromASS } = require('../utils/subtitleUtils');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 104857600 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|mkv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed (mp4, avi, mov, mkv, webm)'));
    }
  }
});

// Store for processing jobs (in production, use Redis or database)
const jobs = new Map();

/**
 * POST /api/upload
 * Upload video file
 */
router.post('/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const jobId = uuidv4();
    const videoPath = req.file.path;
    const duration = await getVideoDuration(videoPath);

    jobs.set(jobId, {
      videoPath,
      videoName: req.file.originalname,
      duration,
      subtitles: null,
      status: 'uploaded'
    });

    res.json({
      jobId,
      videoPath: path.basename(videoPath),
      videoName: req.file.originalname,
      duration
    });

    // Cleanup old files
    cleanupOldFiles(path.join(__dirname, '../uploads'), 24);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate-subs
 * Generate subtitles from video using Whisper AI
 */
router.post('/generate-subs', async (req, res) => {
  try {
    const { jobId, language } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = jobs.get(jobId);
    job.status = 'generating';

    // Extract audio from video
    const audioPath = path.join(__dirname, '../uploads', `${uuidv4()}.wav`);
    await extractAudio(job.videoPath, audioPath);

    const modelName = req.body.model || 'Xenova/whisper-small';
    console.log(`Generating subtitles using model: ${modelName} for language: ${language || 'auto-detect'}`);

    // Read WAV file data
    const { WaveFile } = require('wavefile');
    const wavBuffer = fs.readFileSync(audioPath);
    const wav = new WaveFile(wavBuffer);
    
    // Convert to 32-bit float (normalized to -1.0 to 1.0)
    wav.toBitDepth('32f');
    
    // Get samples
    let audioData = wav.getSamples(false, Float32Array);
    
    // Handle mono/stereo: if array of arrays (channels), take first channel
    if (Array.isArray(audioData)) {
      if (audioData.length > 0) {
        audioData = audioData[0];
      } else {
        throw new Error('No audio channels found');
      }
    }
    
    // Ensure it's Float32Array
    if (!(audioData instanceof Float32Array)) {
      audioData = new Float32Array(audioData);
    }
    
    const sampleRate = wav.fmt.sampleRate;

    console.log(`Audio loaded: ${audioData.length} samples at ${sampleRate}Hz (Running Whisper...)`);

    // Use Whisper for transcription
    console.log(`Loading Whisper model (${modelName})... this may take a moment`);
    const transcriber = await pipeline(
      'automatic-speech-recognition',
      modelName
    );

    const result = await transcriber(audioData, {
      language: language && language !== 'auto' ? language : null,
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true
    });

    // Clean up audio file
    fs.unlinkSync(audioPath);

    console.log('Transcription result:', result);

    // Convert Whisper output to subtitle format
    const subtitles = [];
    
    if (result.chunks && result.chunks.length > 0) {
      result.chunks.forEach((chunk, index) => {
        if (chunk.text && chunk.text.trim()) {
          // Handle potentially null timestamps
          const start = chunk.timestamp && chunk.timestamp[0] !== null 
            ? chunk.timestamp[0] 
            : (index > 0 ? subtitles[index-1].end : 0);
            
          const end = chunk.timestamp && chunk.timestamp[1] !== null 
            ? chunk.timestamp[1] 
            : start + 2; // Default duration 2s if missing

          subtitles.push({
            start: Number(start).toFixed(3),
            end: Number(end).toFixed(3),
            text: chunk.text.trim(),
            style: {
              textColor: '#FFFFFF',
              bgColor: '#000000',
              strokeColor: '#000000',
              strokeWidth: 2,
              bgOpaque: false,
              bgOpacity: 0.5,
              fontSize: 48
            }
          });
        }
      });
    } else {
      // Fallback: create subtitle from full text
      subtitles.push({
        start: '0.000',
        end: job.duration.toFixed(3),
        text: result.text || 'No speech detected',
        style: {
          textColor: '#FFFFFF',
          bgColor: '#000000',
          strokeColor: '#000000',
          strokeWidth: 2,
          bgOpaque: false,
          bgOpacity: 0.5,
          fontSize: 48
        }
      });
    }

    job.subtitles = subtitles;
    job.status = 'generated';

    res.json({
      jobId,
      subtitles,
      detectedLanguage: language || 'auto'
    });
  } catch (error) {
    console.error('Generate subtitles error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/translate
 * Translate subtitles to target language
 */
router.post('/translate', async (req, res) => {
  try {
    const { jobId, targetLanguage, subtitles } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }

    const subsToTranslate = subtitles || jobs.get(jobId).subtitles;

    if (!subsToTranslate || subsToTranslate.length === 0) {
      return res.status(400).json({ error: 'No subtitles to translate' });
    }

    // Translate each subtitle
    const translatedSubs = [];
    
    for (const sub of subsToTranslate) {
      try {
        const result = await translate(sub.text, { to: targetLanguage });
        translatedSubs.push({
          ...sub,
          text: result.text
        });
      } catch (err) {
        console.error('Translation error for subtitle:', err);
        // Keep original text if translation fails
        translatedSubs.push(sub);
      }
    }

    const job = jobs.get(jobId);
    job.subtitles = translatedSubs;

    res.json({
      jobId,
      subtitles: translatedSubs,
      targetLanguage
    });
  } catch (error) {
    console.error('Translate error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/update-subs
 * Update subtitle data (after editing)
 */
router.post('/update-subs', async (req, res) => {
  try {
    const { jobId, subtitles } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    if (!subtitles || !Array.isArray(subtitles)) {
      return res.status(400).json({ error: 'Invalid subtitles data' });
    }

    const job = jobs.get(jobId);
    job.subtitles = subtitles;

    res.json({
      jobId,
      message: 'Subtitles updated successfully'
    });
  } catch (error) {
    console.error('Update subtitles error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/render
 * Render video with burned-in subtitles
 */
router.post('/render', async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = jobs.get(jobId);

    if (!job.subtitles || job.subtitles.length === 0) {
      return res.status(400).json({ error: 'No subtitles to render' });
    }

    job.status = 'rendering';

    // Generate ASS file from subtitles
    const assContent = toASS(job.subtitles);
    const assPath = path.join(__dirname, '../uploads', `${uuidv4()}.ass`);
    fs.writeFileSync(assPath, assContent, 'utf8');

    // Render video
    const outputPath = path.join(
      __dirname,
      '../uploads',
      `rendered_${uuidv4()}${path.extname(job.videoPath)}`
    );

    await renderVideoWithSubtitles(job.videoPath, assPath, outputPath);

    // Clean up ASS file
    fs.unlinkSync(assPath);

    job.status = 'completed';
    job.renderedPath = outputPath;

    res.json({
      jobId,
      downloadUrl: `/api/download/${path.basename(outputPath)}`,
      filename: `rendered_${job.videoName}`
    });
  } catch (error) {
    console.error('Render error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/download/:filename
 * Download rendered video
 */
router.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Error downloading file' });
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/job/:jobId
 * Get job status
 */
router.get('/job/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;

    if (!jobs.has(jobId)) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const job = jobs.get(jobId);

    res.json({
      jobId,
      status: job.status,
      videoName: job.videoName,
      duration: job.duration,
      hasSubtitles: !!job.subtitles
    });
  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
