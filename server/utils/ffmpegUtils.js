const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

/**
 * Extract audio from video file
 */
function extractAudio(videoPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec('pcm_s16le')
      .audioChannels(1)
      .audioFrequency(16000)
      .format('wav')
      .on('start', (cmd) => {
        console.log('Extracting audio:', cmd);
      })
      .on('end', () => {
        console.log('Audio extraction completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error extracting audio:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Get video metadata
 */
function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

/**
 * Render video with burned-in subtitles
 */
function renderVideoWithSubtitles(videoPath, subtitlePath, outputPath) {
  return new Promise((resolve, reject) => {
    // Escape path for FFmpeg filter (Windows paths need special handling)
    const escapedSubPath = subtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    const isASS = path.extname(subtitlePath).toLowerCase() === '.ass';
    const subtitleFilter = isASS 
      ? `ass='${escapedSubPath}'`
      : `subtitles='${escapedSubPath}':force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,Alignment=2'`;

    ffmpeg(videoPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-vf', subtitleFilter,
        '-preset', 'medium',
        '-crf', '23'
      ])
      .on('start', (cmd) => {
        console.log('Rendering video with subtitles:', cmd);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Processing: ${Math.floor(progress.percent)}% done`);
        }
      })
      .on('end', () => {
        console.log('Video rendering completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Error rendering video:', err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * Get video duration in seconds
 */
async function getVideoDuration(videoPath) {
  const metadata = await getVideoMetadata(videoPath);
  return metadata.format.duration;
}

/**
 * Clean up old files in uploads directory
 */
function cleanupOldFiles(directory, maxAgeHours = 24) {
  try {
    const files = fs.readdirSync(directory);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    });
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
}

module.exports = {
  extractAudio,
  getVideoMetadata,
  renderVideoWithSubtitles,
  getVideoDuration,
  cleanupOldFiles
};
