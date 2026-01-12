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

import SubtitleOverlay from './SubtitleOverlay';
import Timeline from './Timeline';

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

const MODELS = [
  { id: 'Xenova/whisper-tiny', name: 'Tiny (Fastest)' },
  { id: 'Xenova/whisper-small', name: 'Small (Balanced - TurboScribe Dolphin)' },
  { id: 'Xenova/whisper-large-v2', name: 'Large V2 (Best Accuracy - TurboScribe Whale)' },
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
  const [selectedModel, setSelectedModel] = useState('Xenova/whisper-small');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [localSubtitles, setLocalSubtitles] = useState(subtitles);
  const [selectedSubIndex, setSelectedSubIndex] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const subtitleListRef = useRef(null);

  useEffect(() => {
    setLocalSubtitles(subtitles);
  }, [subtitles]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.ctrlKey || e.metaKey) {
        switch(e.key.toLowerCase()) {
          case 'p':
            e.preventDefault();
            if (playerRef.current) {
              playerRef.current.paused() ? playerRef.current.play() : playerRef.current.pause();
            }
            break;
          case '1':
            e.preventDefault();
            if (selectedSubIndex !== null && localSubtitles[selectedSubIndex]) {
              handleSeekToSubtitle(selectedSubIndex);
            }
            break;
          case '2':
            e.preventDefault();
            if (selectedSubIndex !== null && localSubtitles[selectedSubIndex]) {
              if (playerRef.current) {
                playerRef.current.currentTime(parseFloat(localSubtitles[selectedSubIndex].end));
              }
            }
            break;
          case '3':
            e.preventDefault();
            if (selectedSubIndex !== null && playerRef.current) {
              handleSubtitleChange(selectedSubIndex, 'start', playerRef.current.currentTime().toFixed(3));
            }
            break;
          case '4':
            e.preventDefault();
            if (selectedSubIndex !== null && playerRef.current) {
              handleSubtitleChange(selectedSubIndex, 'end', playerRef.current.currentTime().toFixed(3));
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSubIndex, localSubtitles]);

  useEffect(() => {
    // Initialize Video.js player
    if (videoRef.current && !playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        fluid: true,
        preload: 'auto',
        textTrackSettings: false // Disable default caption settings UI
      });

      // Track time updates
      playerRef.current.on('timeupdate', () => {
        setCurrentTime(playerRef.current.currentTime());
      });

      playerRef.current.on('loadedmetadata', () => {
        setDuration(playerRef.current.duration());
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

  // Scroll to active subtitle
  useEffect(() => {
    if (selectedSubIndex !== null && subtitleListRef.current) {
      const activeEl = subtitleListRef.current.children[selectedSubIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedSubIndex]);

  const handleGenerateSubtitles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/generate-subs', {
        jobId,
        language: sourceLang === 'auto' ? null : sourceLang,
        model: selectedModel
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

  const handleApplyStyleToAll = (sourceStyle) => {
    const updated = localSubtitles.map(sub => ({
      ...sub,
      style: { ...sourceStyle }
    }));
    setLocalSubtitles(updated);
    onSubtitlesUpdated(updated);
    alert('Style applied to all subtitles!');
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
    setSelectedSubIndex(localSubtitles.length); // Select newly added sub
  };

  const handleDeleteSubtitle = (index) => {
    const updated = localSubtitles.filter((_, i) => i !== index);
    setLocalSubtitles(updated);
    onSubtitlesUpdated(updated);
    if (selectedSubIndex === index) {
      setSelectedSubIndex(null);
    } else if (selectedSubIndex > index) {
      setSelectedSubIndex(selectedSubIndex - 1);
    }
  };

  const handleSeekToSubtitle = (index) => {
    if (playerRef.current) {
      const time = parseFloat(localSubtitles[index].start);
      playerRef.current.currentTime(time);
      playerRef.current.play();
    }
    setSelectedSubIndex(index);
  };

  const handleTimelineSeek = (time) => {
    if (playerRef.current) {
      playerRef.current.currentTime(time);
    }
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

  // const formatTime = (seconds) => { ... } // Removed helper used in Tooltip to avoid duplication/unused var warning if not needed, or keep if used.
  // Actually, let's keep it inline or simple if used.

  const [hoverTime, setHoverTime] = useState(null);

  // Helper to format time as HH:mm:ss.SSS
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00:00.000';
    const date = new Date(0);
    date.setUTCMilliseconds(seconds * 1000);
    const hh = date.getUTCHours().toString().padStart(2, '0');
    const mm = date.getUTCMinutes().toString().padStart(2, '0');
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    const ms = date.getUTCMilliseconds().toString().padStart(3, '0');
    return `${hh}:${mm}:${ss}.${ms}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Edit Subtitles
        <Typography variant="caption" sx={{ ml: 2, color: 'text.secondary' }}>
          Shortcuts: Ctrl+P (Play/Pause), Ctrl+1/2 (Seek Start/End), Ctrl+3/4 (Set Start/End)
        </Typography>
      </Typography>

      {/* Language & Model Selection */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
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
          <FormControl fullWidth size="small">
            <InputLabel>AI Model</InputLabel>
            <Select
              value={selectedModel}
              label="AI Model"
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loading || localSubtitles.length > 0}
            >
              {MODELS.map((model) => (
                <MenuItem key={model.id} value={model.id}>
                  {model.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={handleGenerateSubtitles}
            disabled={loading || localSubtitles.length > 0}
            sx={{ height: '40px' }}
          >
            Generate (AI)
          </Button>
        </Grid>

        <Grid item xs={12} md={2}>
          <FormControl fullWidth size="small">
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

        <Grid item xs={12} md={2}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={loading ? <CircularProgress size={20} /> : <TranslateIcon />}
            onClick={handleTranslate}
            disabled={loading || localSubtitles.length === 0}
            sx={{ height: '40px' }}
          >
            Translate
          </Button>
        </Grid>
        
        <Grid item xs={12} md={1}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            startIcon={<SaveIcon />}
            onClick={handleSaveSubtitles}
            disabled={loading}
            sx={{ height: '40px' }}
          >
            Save
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Video Player Container */}
      <Box sx={{ position: 'relative', mb: 1 }}>
        <Box sx={{ bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
          <video
            ref={videoRef}
            className="video-js vjs-default-skin vjs-big-play-centered"
            controls
            preload="auto"
            style={{ width: '100%', height: 'auto' }}
          >
            {/* Custom overlay handles subtitles */}
          </video>
        </Box>
        
        <SubtitleOverlay 
          currentTime={currentTime} 
          subtitles={localSubtitles} 
        />
      </Box>
      
      {/* Timeline */}
      {videoData && (
        <Timeline 
          duration={duration || videoData.duration} 
          subtitles={localSubtitles} 
          currentTime={currentTime}
          onSeek={handleTimelineSeek}
          hoverTime={hoverTime}
        />
      )}

      {/* Subtitle List & Editor - Compact Layout */}
      {localSubtitles.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Subtitle List ({localSubtitles.length})
            </Typography>
            <Box>
              <Button size="small" startIcon={<AddIcon />} onClick={handleAddSubtitle}>Add New Line</Button>
            </Box>
          </Box>

          <Grid container spacing={2}>
            {/* Left: Compact List */}
            <Grid item xs={12} md={7}>
              <Box 
                ref={subtitleListRef}
                sx={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 1
                }}
              >
                {localSubtitles.map((sub, index) => {
                   const isActive = currentTime >= parseFloat(sub.start) && currentTime <= parseFloat(sub.end);
                   const isSelected = selectedSubIndex === index;
                   
                   return (
                    <Box
                      key={index}
                      sx={{
                        p: 1,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        bgcolor: isSelected ? 'rgba(102, 126, 234, 0.2)' : (isActive ? 'rgba(102, 126, 234, 0.05)' : 'transparent'),
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                      onClick={() => setSelectedSubIndex(index)}
                      onMouseEnter={() => setHoverTime(parseFloat(sub.start))}
                      onMouseLeave={() => setHoverTime(null)}
                    >
                      <Box sx={{ minWidth: 25, color: 'text.secondary', fontSize: '0.75rem', mr: 0.5 }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, minWidth: 100 }}>
                        <TextField
                          variant="standard"
                          value={sub.start}
                          onChange={(e) => handleSubtitleChange(index, 'start', e.target.value)}
                          inputProps={{ style: { fontSize: '0.8rem', padding: 0 } }}
                          InputProps={{ disableUnderline: true }}
                          helperText={formatTime(parseFloat(sub.start))}
                          FormHelperTextProps={{ style: { fontSize: '0.65rem' } }}
                        />
                        <TextField
                          variant="standard"
                          value={sub.end}
                          onChange={(e) => handleSubtitleChange(index, 'end', e.target.value)}
                          inputProps={{ style: { fontSize: '0.8rem', padding: 0, color: 'text.secondary' } }}
                          InputProps={{ disableUnderline: true }}
                          helperText={formatTime(parseFloat(sub.end))}
                          FormHelperTextProps={{ style: { fontSize: '0.65rem' } }}
                        />
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        variant="standard"
                        value={sub.text}
                        onChange={(e) => handleSubtitleChange(index, 'text', e.target.value)}
                        InputProps={{ disableUnderline: !isSelected }}
                        sx={{ ml: 1 }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                         <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleSeekToSubtitle(index); }}>
                            <PlayArrowIcon fontSize="small" />
                         </IconButton>
                         <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteSubtitle(index); }}>
                            <DeleteIcon fontSize="small" />
                         </IconButton>
                      </Box>
                    </Box>
                   );
                })}
              </Box>
            </Grid>

            {/* Right: Style Editor & Actions (Fixed position or sticky could be better, but standard grid for now) */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, height: '400px', overflowY: 'auto' }}>
                {selectedSubIndex !== null ? (
                   <>
                      <Typography variant="subtitle2" gutterBottom>
                         Edit Style (Line {selectedSubIndex + 1})
                      </Typography>
                      <Box sx={{ mb: 2, display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          onClick={() => handleApplyStyleToAll(localSubtitles[selectedSubIndex].style)}
                          fullWidth
                        >
                          Apply Style to All
                        </Button>
                      </Box>
                      
                      <SubtitleStyleEditor
                        style={localSubtitles[selectedSubIndex].style}
                        onChange={(field, value) => handleSubtitleChange(selectedSubIndex, `style.${field}`, value)}
                        compact={true} // Hint to make style editor smaller if implemented
                      />
                   </>
                ) : (
                   <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                      <Typography>Select a subtitle line to edit style</Typography>
                   </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifySelf: 'center', width: '100%' }}>
              <Button
                fullWidth
                size="large"
                startIcon={rendering ? <CircularProgress size={20} /> : <MovieIcon />}
                onClick={handleRender}
                variant="contained"
                disabled={rendering}
                color="secondary"
              >
                Render & Download Final Video
              </Button>
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
