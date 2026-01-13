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

const { 
  jobs, 
  processTranscription, 
  processRendering, 
  cleanupJobFiles, 
  updateJob 
} = require('../utils/jobProcessor');

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

    updateJob(jobId, {
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

    // Cleanup old files (periodically)
    cleanupOldFiles(path.join(__dirname, '../uploads'), 24);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/generate-subs
 * Start generation in background
 */
router.post('/generate-subs', async (req, res) => {
  try {
    const { jobId, language, model } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    // Start processing in background (don't await)
    processTranscription(jobId, language, model);

    res.json({
      jobId,
      message: 'Transcription started in background',
      status: 'generating'
    });
  } catch (error) {
    console.error('Generate subs error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/translate
 * Translate subtitles (Synchronous for now, but updates job)
 */
router.post('/translate', async (req, res) => {
  try {
    const { jobId, targetLanguage, subtitles } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    const job = jobs.get(jobId);
    const subsToTranslate = subtitles || job.subtitles;

    if (!subsToTranslate || subsToTranslate.length === 0) {
      return res.status(400).json({ error: 'No subtitles to translate' });
    }

    const CHUNK_SIZE = 50; 
    const batches = [];
    for (let i = 0; i < subsToTranslate.length; i += CHUNK_SIZE) {
      batches.push(subsToTranslate.slice(i, i + CHUNK_SIZE));
    }

    const translatedSubs = [];
    for (const batch of batches) {
      try {
        const delimiter = " <<<BR>>> ";
        const textToTranslate = batch.map(s => s.text).join(delimiter);
        const result = await translate(textToTranslate, { to: targetLanguage });
        const translatedTexts = result.text.split(/\s*<<<BR>>>\s*/);

        batch.forEach((sub, index) => {
          translatedSubs.push({
            ...sub,
            text: (translatedTexts[index] || sub.text).trim()
          });
        });
        await new Promise(r => setTimeout(r, 100));
      } catch (err) {
        batch.forEach(sub => translatedSubs.push(sub));
      }
    }

    updateJob(jobId, { subtitles: translatedSubs });

    res.json({
      jobId,
      subtitles: translatedSubs,
      targetLanguage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/render
 * Start rendering in background
 */
router.post('/render', async (req, res) => {
  try {
    const { jobId } = req.body;

    if (!jobId || !jobs.has(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }

    // Start processing in background
    processRendering(jobId);

    res.json({
      jobId,
      message: 'Rendering started in background',
      status: 'rendering'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/job/:jobId
 * Detailed job status
 */
router.get('/job/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = jobs.get(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({
      jobId,
      status: job.status,
      videoName: job.videoName,
      duration: job.duration,
      subtitles: job.subtitles,
      renderedPath: job.renderedPath ? path.basename(job.renderedPath) : null,
      downloadUrl: job.renderedPath ? `/api/download/${path.basename(job.renderedPath)}` : null,
      error: job.error
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/project/:jobId
 * Delete project and associated files
 */
router.delete('/project/:jobId', (req, res) => {
  try {
    const jobId = req.params.jobId;
    if (!jobs.has(jobId)) {
      return res.status(404).json({ error: 'Project not found' });
    }

    cleanupJobFiles(jobId);
    res.json({ message: 'Project and files deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export subtitles
router.post('/export-subs', (req, res) => {
  try {
    const { subtitles, format } = req.body;
    
    if (!subtitles || !Array.isArray(subtitles)) {
      return res.status(400).json({ error: 'Invalid subtitles data' });
    }

    let content = '';
    let contentType = 'text/plain';
    let extension = 'txt';

    if (format === 'srt') {
      content = toSRT(subtitles);
      contentType = 'application/x-subrip';
      extension = 'srt';
    } else if (format === 'ass') {
      content = toASS(subtitles);
      contentType = 'text/x-ass';
      extension = 'ass';
    } else {
      return res.status(400).json({ error: 'Unsupported format' });
    }

    res.json({
      content,
      filename: `subtitles.${extension}`,
      type: contentType
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export subtitles' });
  }
});

module.exports = router;
