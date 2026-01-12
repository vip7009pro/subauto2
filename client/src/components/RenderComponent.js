import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const RenderComponent = ({ renderUrl, videoName, onReset }) => {
  const handleDownload = () => {
    window.open(renderUrl, '_blank');
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <CheckCircleIcon
          sx={{
            fontSize: 100,
            color: 'success.main',
            mb: 3
          }}
        />

        <Typography variant="h4" gutterBottom>
          Video Rendered Successfully!
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Your video with burned-in subtitles is ready to download.
        </Typography>

        <Alert severity="success" sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          <Typography variant="body2">
            <strong>File:</strong> {videoName ? `rendered_${videoName}` : 'rendered_video.mp4'}
          </Typography>
        </Alert>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Download Video
          </Button>

          <Button
            variant="outlined"
            size="large"
            startIcon={<RestartAltIcon />}
            onClick={onReset}
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1.1rem'
            }}
          >
            Process Another Video
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            What's Next?
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Share your video on social media
            <br />
            • Upload to video platforms
            <br />
            • Process more videos with different languages
            <br />
            • Experiment with different subtitle styles
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default RenderComponent;
