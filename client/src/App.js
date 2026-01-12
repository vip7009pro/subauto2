import React, { useState, useEffect } from 'react';
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
  CssBaseline,
  Button // Added missing Button import
} from '@mui/material';
import ProjectList from './components/ProjectList';
import UploadComponent from './components/UploadComponent';
import SubtitleEditor from './components/SubtitleEditor';
import RenderComponent from './components/RenderComponent';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50', // Green 500
    },
    secondary: {
      main: '#009688', // Teal 500
    },
    background: {
      default: 'transparent',
      paper: 'rgba(20, 20, 20, 0.8)', // Darker background for better contrast
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(76, 175, 80, 0.3)', // Green border
        },
      },
    },
  },
});

const steps = ['Upload Video', 'Edit Subtitles', 'Render Video'];

function App() {
  const [view, setView] = useState('loading'); // 'loading', 'home', 'editor'
  
  // Project State
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);

  // Editor State (Derived/synced with currentProject)
  const [activeStep, setActiveStep] = useState(0);
  const [jobId, setJobId] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [renderUrl, setRenderUrl] = useState(null);

  // Load projects on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('subauto_projects');
    const lastProjectId = localStorage.getItem('subauto_last_project_id');
    
    let parsedProjects = [];
    if (savedProjects) {
        try {
            parsedProjects = JSON.parse(savedProjects);
            setProjects(parsedProjects);
        } catch (e) {
            console.error("Failed to parse projects", e);
        }
    }

    // Try to restore last active project
    if (lastProjectId) {
        const found = parsedProjects.find(p => p.id === lastProjectId);
        if (found) {
            loadProject(found);
            return;
        }
    }

    // Default to home if no active project
    setView('home');
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (projects.length > 0) {
        localStorage.setItem('subauto_projects', JSON.stringify(projects));
    }
  }, [projects]);

  // Persist current project state to the projects array
  useEffect(() => {
    if (view === 'editor' && currentProject && videoData) {
        setProjects(prevProjects => {
            const updated = prevProjects.map(p => {
                if (p.id === currentProject.id) {
                    return {
                        ...p,
                        activeStep,
                        jobId,
                        videoData,
                        subtitles,
                        renderUrl,
                        lastModified: Date.now()
                    };
                }
                return p;
            });
            return updated;
        });
        
        // Also update persistence immediately for F5 safety
        localStorage.setItem('subauto_last_project_id', currentProject.id);
    }
  }, [activeStep, jobId, videoData, subtitles, renderUrl, view]);

  const loadProject = (project) => {
    setCurrentProject(project);
    setJobId(project.jobId || null);
    setVideoData(project.videoData || null);
    setSubtitles(project.subtitles || []);
    setActiveStep(project.activeStep || 0);
    setRenderUrl(project.renderUrl || null);
    
    localStorage.setItem('subauto_last_project_id', project.id);
    setView('editor');
  };

  const handleCreateProject = () => {
    // We create a temporary project structure, finalized on upload
    // For now, just reset editor state and go to step 0
    const newProject = {
        id: crypto.randomUUID(),
        name: 'New Project',
        created: Date.now(),
        lastModified: Date.now(),
        // Checkpoints
        activeStep: 0,
        jobId: null,
        videoData: null,
        subtitles: [],
    };

    setProjects(prev => [newProject, ...prev]);
    loadProject(newProject);
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        if (currentProject && currentProject.id === projectId) {
            handleBackToHome();
        }
    }
  };

  const handleBackToHome = () => {
    setView('home');
    setCurrentProject(null);
    localStorage.removeItem('subauto_last_project_id');
    
    // Reset editor state visually (optional, but cleaner)
    setJobId(null);
    setVideoData(null);
    setSubtitles([]);
    setActiveStep(0);
  };

  const handleUploadComplete = (data) => {
    setJobId(data.jobId);
    setVideoData(data);
    setSubtitles([]); 
    setActiveStep(1);
    
    // Update project name based on video file
    if (currentProject) {
        setProjects(prev => prev.map(p => 
            p.id === currentProject.id 
            ? { ...p, name: data.videoName, filename: data.videoName, videoData: data } 
            : p
        ));
    }
  };

  const handleSubtitlesGenerated = (subs) => {
    setSubtitles(subs);
  };

  const handleRenderComplete = (url) => {
    setRenderUrl(url);
    setActiveStep(2);
  };

  const handleReset = () => {
     // Instead of full reset, maybe just go back to step 1 or clear subs?
     // For "Start Over" inside a project:
    setActiveStep(0);
    setJobId(null);
    setVideoData(null);
    setSubtitles([]);
    setRenderUrl(null);
    // Keep project alive, just reset its content
  };

  // Render
  if (view === 'loading') return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {view === 'home' && (
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ py: 4, textAlign: 'center', background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.1) 30%, rgba(0, 150, 136, 0.1) 90%)' }}>
                 <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                    background: 'linear-gradient(45deg, #4caf50 30%, #009688 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 'bold',
                    mb: 1
                    }}
                >
                    🎬 AutoSubtitlesApp
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Manage your subtitle projects
                </Typography>
            </Box>
            
            <ProjectList 
                projects={projects}
                onCreateProject={handleCreateProject}
                onOpenProject={(id) => {
                    const p = projects.find(proj => proj.id === id);
                    if (p) loadProject(p);
                }}
                onDeleteProject={handleDeleteProject}
            />
          </Box>
      )}

      {view === 'editor' && (
          <Container maxWidth="xl" sx={{ py: 4 }}>
           {/* Header with Home Button */}
            <Paper elevation={3} sx={{ p: 2, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button onClick={handleBackToHome} color="inherit">
                      &larr; Back to Projects
                  </Button>
                  <Typography variant="h6">
                      {currentProject?.name || 'Untitled Project'}
                  </Typography>
              </Box>

              <Box>
                <Stepper activeStep={activeStep} sx={{ minWidth: 400 }}>
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
      )}
    </ThemeProvider>
  );
}

export default App;
