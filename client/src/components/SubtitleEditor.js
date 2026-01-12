import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Paper,
  Typography,
  Box,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  IconButton,
  Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TranslateIcon from '@mui/icons-material/Translate';
import SaveIcon from '@mui/icons-material/Save';
import MovieIcon from '@mui/icons-material/Movie';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import SubtitleStyleEditor from './SubtitleStyleEditor';

// Supported languages
const LANGUAGES = [
  { code: 'auto', name: 'Auto-detect' },
  { code: 'en', name: 'English' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'ko', name: 'Korean' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ja', name: 'Japanese' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
];

const SubtitleEditor = ({
  jobId,
  videoData,
  subtitles,
  onSubtitlesGenerated,
  onSubtitlesUpdated,
  onRenderComplete
}) => {
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSubtitles, setLocalSubtitles] = useState(subtitles);
  const [selectedSubIndex, setSelectedSubIndex] = useState(null);
  const [rendering, setRendering] = useState(false);
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    setLocalSubtitles(subtitles);
  }, [subtitles]);

  useEffect(() => {
    // Initialize Video.js player
    if (videoRef.current && !playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        preload: 'auto'
      });
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  // Update video source when videoData changes
  useEffect(() => {
    if (playerRef.current && videoData) {
      playerRef.current.src({
        src: `/downloads/${videoData.videoPath}`,
        type: 'video/mp4'
      });
    }
  }, [videoData]);

  const handleGenerateSubtitles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/generate-subs', {
        jobId,
        language: sourceLang === 'auto' ? null : sourceLang
      });

      setLocalSubtitles(response.data.subtitles);
      onSubtitlesGenerated(response.data.subtitles);
      onSubtitlesUpdated(response.data.subtitles);
    } catch (err) {
      console.error('Generate subtitles error:', err);
      setError(err.response?.data?.error || 'Failed to generate subtitles');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (localSubtitles.length === 0) {
      setError('No subtitles to translate');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/translate', {
        jobId,
        targetLanguage: targetLang,
        subtitles: localSubtitles
      });

      setLocalSubtitles(response.data.subtitles);
      onSubtitlesUpdated(response.data.subtitles);
    } catch (err) {
      console.error('Translate error:', err);
      setError(err.response?.data?.error || 'Failed to translate subtitles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubtitleChange = (index, field, value) => {
    const updated = [...localSubtitles];
    if (field.startsWith('style.')) {
      const styleField = field.split('.')[1];
      updated[index].style = {
        ...updated[index].style,
        [styleField]: value
      };
    } else {
      updated[index][field] = value;
    }
    setLocalSubtitles(updated);
    onSubtitlesUpdated(updated);
  };

  const handleAddSubtitle = () => {
    const newSub = {
      start: localSubtitles.length > 0 
        ? (parseFloat(localSubtitles[localSubtitles.length - 1].end) + 0.1).toFixed(3)
        : '0.000',
      end: localSubtitles.length > 0
        ? (parseFloat(localSubtitles[localSubtitles.length - 1].end) + 5).toFixed(3)
        : '5.000',
      text: 'New subtitle',
      style: {
        textColor: '#FFFFFF',
        bgColor: '#000000',
        strokeColor: '#000000',
        strokeWidth: 2,
        bgOpaque: false,
        bgOpacity: 0.5,
        fontSize: 48
      }
    };
    setLocalSubtitles([...localSubtitles, newSub]);
  };

  const handleDeleteSubtitle = (index) => {
    const updated = localSubtitles.filter((_, i) => i !== index);
    setLocalSubtitles(updated);
    onSubtitlesUpdated(updated);
    if (selectedSubIndex === index) {
      setSelectedSubIndex(null);
    }
  };

  const handleSeekToSubtitle = (index) => {
    if (playerRef.current) {
      playerRef.current.currentTime(parseFloat(localSubtitles[index].start));
    }
    setSelectedSubIndex(index);
  };

  const handleSaveSubtitles = async () => {
    try {
      await axios.post('/api/update-subs', {
        jobId,
        subtitles: localSubtitles
      });
      alert('Subtitles saved successfully!');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save subtitles');
    }
  };

  const handleRender = async () => {
    if (localSubtitles.length === 0) {
      setError('No subtitles to render');
      return;
    }

    setRendering(true);
    setError(null);

    try {
      // First save the subtitles
      await axios.post('/api/update-subs', {
        jobId,
        subtitles: localSubtitles
      });

      // Then render
      const response = await axios.post('/api/render', { jobId });
      onRenderComplete(response.data.downloadUrl);
    } catch (err) {
      console.error('Render error:', err);
      setError(err.response?.data?.error || 'Failed to render video');
      setRendering(false);
    }
  };

  const formatTime = (seconds) => {
    const sec = parseFloat(seconds);
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, '0')}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Edit Subtitles
      </Typography>

      {/* Language Selection and Actions */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Source Language</InputLabel>
            <Select
              value={sourceLang}
              label="Source Language"
              onChange={(e) => setSourceLang(e.target.value)}
              disabled={loading || localSubtitles.length > 0}
            >
              {LANGUAGES.map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={handleGenerateSubtitles}
            disabled={loading || localSubtitles.length > 0}
            sx={{ height: '56px' }}
          >
            Generate Subtitles
          </Button>
        </Grid>

        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Target Language</InputLabel>
            <Select
              value={targetLang}
              label="Target Language"
              onChange={(e) => setTargetLang(e.target.value)}
              disabled={loading || localSubtitles.length === 0}
            >
              {LANGUAGES.filter(l => l.code !== 'auto').map((lang) => (
                <MenuItem key={lang.code} value={lang.code}>
                  {lang.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <TranslateIcon />}
            onClick={handleTranslate}
            disabled={loading || localSubtitles.length === 0}
            sx={{ height: '56px' }}
          >
            Translate
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Video Player */}
      <Box sx={{ mb: 3, bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
        <video
          ref={videoRef}
          className="video-js vjs-default-skin"
          controls
          preload="auto"
          style={{ width: '100%', height: 'auto' }}
        >
          <track kind="captions" />
        </video>
      </Box>

      {/* Subtitle List */}
      {localSubtitles.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Subtitles ({localSubtitles.length})
            </Typography>
            <Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddSubtitle}
                sx={{ mr: 1 }}
              >
                Add
              </Button>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleSaveSubtitles}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Save
              </Button>
              <Button
                startIcon={rendering ? <CircularProgress size={20} /> : <MovieIcon />}
                onClick={handleRender}
                variant="contained"
                disabled={rendering}
              >
                Render Video
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
            {localSubtitles.map((sub, index) => (
              <Paper
                key={index}
                elevation={selectedSubIndex === index ? 8 : 1}
                sx={{
                  p: 2,
                  mb: 2,
                  border: selectedSubIndex === index ? '2px solid' : 'none',
                  borderColor: 'primary.main',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedSubIndex(index)}
              >
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="Start"
                      value={sub.start}
                      onChange={(e) => handleSubtitleChange(index, 'start', e.target.value)}
                      size="small"
                      fullWidth
                      helperText={formatTime(sub.start)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField
                      label="End"
                      value={sub.end}
                      onChange={(e) => handleSubtitleChange(index, 'end', e.target.value)}
                      size="small"
                      fullWidth
                      helperText={formatTime(sub.end)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Text"
                      value={sub.text}
                      onChange={(e) => handleSubtitleChange(index, 'text', e.target.value)}
                      size="small"
                      fullWidth
                      multiline
                      maxRows={3}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeekToSubtitle(index);
                        }}
                      >
                        <PlayArrowIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubtitle(index);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Grid>

                  {selectedSubIndex === index && (
                    <Grid item xs={12}>
                      <SubtitleStyleEditor
                        style={sub.style}
                        onChange={(field, value) => handleSubtitleChange(index, `style.${field}`, value)}
                      />
                    </Grid>
                  )}
                </Grid>
              </Paper>
            ))}
          </Box>
        </>
      )}

      {rendering && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Rendering video with subtitles...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may take a few minutes depending on video length
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SubtitleEditor;
