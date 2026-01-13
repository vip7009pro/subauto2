const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Set FFmpeg paths
process.env.FFMPEG_PATH = require('@ffmpeg-installer/ffmpeg').path;
process.env.FFPROBE_PATH = require('@ffprobe-installer/ffprobe').path;

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '5000mb' }));
app.use(express.urlencoded({ extended: true, limit: '5000mb' }));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const publicDir = path.join(__dirname, 'public');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// API Routes
app.use('/api', require('./routes/api'));

// Serve static files (for rendered videos and built frontend)
app.use('/downloads', express.static(uploadsDir));
app.use(express.static(publicDir));

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend not built yet. Run npm run build from root.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const https = require('https');

const PORT = process.env.PORT || 3004;

const startServer = () => {
  try {
    const keyPath = 'G:\\NODEJS\\hnpssl\\private.key';
    const certPath = 'G:\\NODEJS\\hnpssl\\certificate.crt';
    const caPath = 'G:\\NODEJS\\hnpssl\\ca_bundle.crt';

    if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
      const sslOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
        ca: fs.existsSync(caPath) ? fs.readFileSync(caPath) : undefined
      };

      https.createServer(sslOptions, app).listen(PORT, () => {
        console.log(`🚀 HTTPS Server running on port ${PORT}`);
        console.log(`📁 Uploads directory: ${uploadsDir}`);
      });
    } else {
      throw new Error('SSL certificates not found');
    }
  } catch (error) {
    console.log(`⚠️ SSL Setup failed: ${error.message}`);
    console.log('Falling back to HTTP...');
    app.listen(PORT, () => {
      console.log(`🚀 HTTP Server running on port ${PORT}`);
      console.log(`📁 Uploads directory: ${uploadsDir}`);
    });
  }
};

startServer();

module.exports = app;
