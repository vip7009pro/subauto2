const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { pipeline } = require('@xenova/transformers');
const { WaveFile } = require('wavefile');
const { extractAudio, renderVideoWithSubtitles } = require('./ffmpegUtils');
const { toASS } = require('./subtitleUtils');

// Shared jobs map (in a real app, use Redis or a Database)
const jobs = new Map();

/**
 * Update job status and data
 */
const updateJob = (jobId, data) => {
  const currentJob = jobs.get(jobId) || {};
  jobs.set(jobId, { ...currentJob, ...data, updatedAt: new Date() });
  console.log(`[Job ${jobId}] Status: ${data.status || currentJob.status}`);
};

/**
 * Process Subtitle Generation
 */
async function processTranscription(jobId, language, modelName = 'Xenova/whisper-small') {
  try {
    const job = jobs.get(jobId);
    if (!job) return;

    updateJob(jobId, { status: 'extracting_audio' });

    // 1. Extract audio
    const audioPath = path.join(__dirname, '../uploads', `${uuidv4()}.wav`);
    await extractAudio(job.videoPath, audioPath);

    updateJob(jobId, { status: 'transcribing' });

    // 2. Load audio data
    const wavBuffer = fs.readFileSync(audioPath);
    const wav = new WaveFile(wavBuffer);
    wav.toBitDepth('32f');
    let audioData = wav.getSamples(false, Float32Array);
    
    if (Array.isArray(audioData)) {
      audioData = audioData[0];
    }
    
    // 3. Transcription with Whisper
    const transcriber = await pipeline('automatic-speech-recognition', modelName);
    const result = await transcriber(audioData, {
      language: language && language !== 'auto' ? language : null,
      task: 'transcribe',
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true
    });

    // Cleanup audio
    if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

    // 4. Convert to subtitles format
    const subtitles = [];
    if (result.chunks && result.chunks.length > 0) {
      result.chunks.forEach((chunk, index) => {
        if (chunk.text && chunk.text.trim()) {
          const start = chunk.timestamp && chunk.timestamp[0] !== null ? chunk.timestamp[0] : (index > 0 ? subtitles[index-1].end : 0);
          const end = chunk.timestamp && chunk.timestamp[1] !== null ? chunk.timestamp[1] : start + 2;

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
    }

    updateJob(jobId, { 
      subtitles: subtitles.length > 0 ? subtitles : null, 
      status: 'generated',
      progress: 100
    });

  } catch (error) {
    console.error(`[Job ${jobId}] Transcription Error:`, error);
    updateJob(jobId, { status: 'error', error: error.message });
  }
}

/**
 * Process Video Rendering
 */
async function processRendering(jobId) {
  try {
    const job = jobs.get(jobId);
    if (!job || !job.subtitles) return;

    updateJob(jobId, { status: 'rendering' });

    // 1. Generate ASS file
    const assContent = toASS(job.subtitles);
    const assPath = path.join(__dirname, '../uploads', `${uuidv4()}.ass`);
    fs.writeFileSync(assPath, assContent, 'utf8');

    // 2. Render
    const outputPath = path.join(
      __dirname,
      '../uploads',
      `rendered_${uuidv4()}${path.extname(job.videoPath)}`
    );

    await renderVideoWithSubtitles(job.videoPath, assPath, outputPath);

    // Cleanup ASS
    if (fs.existsSync(assPath)) fs.unlinkSync(assPath);

    updateJob(jobId, { 
      status: 'completed', 
      renderedPath: outputPath,
      progress: 100
    });

  } catch (error) {
    console.error(`[Job ${jobId}] Render Error:`, error);
    updateJob(jobId, { status: 'error', error: error.message });
  }
}

/**
 * Cleanup all files associated with a job
 */
function cleanupJobFiles(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;

  const filesToDelete = [
    job.videoPath,
    job.renderedPath,
    // Add any other temporary paths if they were stored
  ];

  filesToDelete.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Cleanup] Deleted: ${filePath}`);
      } catch (err) {
        console.error(`[Cleanup] Error deleting ${filePath}:`, err.message);
      }
    }
  });

  jobs.delete(jobId);
}

module.exports = {
  jobs,
  processTranscription,
  processRendering,
  cleanupJobFiles,
  updateJob
};
