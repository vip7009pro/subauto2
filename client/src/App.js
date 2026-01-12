import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import UploadComponent from './components/UploadComponent';
import SubtitleEditor from './components/SubtitleEditor';
import RenderComponent from './components/RenderComponent';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#667eea',
    },
    secondary: {
      main: '#764ba2',
    },
    background: {
      default: 'transparent',
      paper: 'rgba(255, 255, 255, 0.05)',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
});

const steps = ['Upload Video', 'Edit Subtitles', 'Render Video'];

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [renderUrl, setRenderUrl] = useState(null);

  const handleUploadComplete = (data) => {
    setJobId(data.jobId);
    setVideoData(data);
    setActiveStep(1);
  };

  const handleSubtitlesGenerated = (subs) => {
    setSubtitles(subs);
  };

  const handleRenderComplete = (url) => {
    setRenderUrl(url);
    setActiveStep(2);
  };

  const handleReset = () => {
    setActiveStep(0);
    setJobId(null);
    setVideoData(null);
    setSubtitles([]);
    setRenderUrl(null);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            align="center"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              mb: 3
            }}
          >
            🎬 AutoSubtitlesApp
          </Typography>
          
          <Typography variant="subtitle1" align="center" color="text.secondary" gutterBottom>
            Generate, translate, and edit subtitles with AI
          </Typography>

          <Box sx={{ mt: 4, mb: 4 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        </Paper>

        {activeStep === 0 && (
          <UploadComponent onUploadComplete={handleUploadComplete} />
        )}

        {activeStep === 1 && (
          <SubtitleEditor
            jobId={jobId}
            videoData={videoData}
            subtitles={subtitles}
            onSubtitlesGenerated={handleSubtitlesGenerated}
            onSubtitlesUpdated={setSubtitles}
            onRenderComplete={handleRenderComplete}
          />
        )}

        {activeStep === 2 && (
          <RenderComponent
            renderUrl={renderUrl}
            videoName={videoData?.videoName}
            onReset={handleReset}
          />
        )}
      </Container>
    </ThemeProvider>
  );
}

export default App;
