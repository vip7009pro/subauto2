import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  IconButton,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VideoFileIcon from '@mui/icons-material/VideoFile';

const ProjectList = ({ projects, onCreateProject, onOpenProject, onDeleteProject }) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          My Projects
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          onClick={onCreateProject}
          sx={{
            background: 'linear-gradient(45deg, #4caf50 30%, #009688 90%)',
            color: 'white'
          }}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center', 
            border: '2px dashed rgba(255,255,255,0.1)',
            bgcolor: 'transparent'
          }}
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No projects yet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Create a new project to start generating subtitles!
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onCreateProject}
          >
            Create Your First Project
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} md={6} lg={4} key={project.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Chip 
                      icon={<VideoFileIcon />} 
                      label={project.filename || 'Untitled Video'} 
                      color="primary" 
                      variant="outlined" 
                      size="small"
                      sx={{ maxWidth: '80%' }}
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom noWrap>
                    {project.name || project.filename || 'Untitled Project'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', mb: 1 }}>
                    <AccessTimeIcon fontSize="small" />
                    <Typography variant="caption">
                      {formatDate(project.lastModified)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {project.subtitles ? `${project.subtitles.length} lines` : 'No subtitles'}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', p: 2, pt: 0 }}>
                  <Button 
                    size="small" 
                    startIcon={<FolderOpenIcon />}
                    onClick={() => onOpenProject(project.id)}
                  >
                    Open
                  </Button>
                  <IconButton 
                    size="small" 
                    color="error" 
                    onClick={() => onDeleteProject(project.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default ProjectList;
