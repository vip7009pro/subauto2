import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api/config';
import {
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VideoFileIcon from '@mui/icons-material/VideoFile';

const UploadComponent = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('video', file);

    setUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const response = await api.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      onUploadComplete(response.data);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    maxFiles: 1,
    maxSize: 5368709120, // 5GB
    disabled: uploading
  });

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Upload Video
      </Typography>

      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.3)',
          borderRadius: 2,
          p: 6,
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          bgcolor: isDragActive ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: uploading ? 'rgba(255, 255, 255, 0.3)' : 'primary.main',
            bgcolor: uploading ? 'transparent' : 'rgba(102, 126, 234, 0.05)',
          },
        }}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <Box>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Uploading... {uploadProgress}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}
            />
          </Box>
        ) : (
          <Box>
            {isDragActive ? (
              <>
                <VideoFileIcon sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6">Drop the video here...</Typography>
              </>
            ) : (
              <>
                <CloudUploadIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Drag & drop a video file here
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  or
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }}>
                  Browse Files
                </Button>
                <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
                  Supported formats: MP4, AVI, MOV, MKV, WebM (Max 5GB)
                </Typography>
              </>
            )}
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
};

export default UploadComponent;
