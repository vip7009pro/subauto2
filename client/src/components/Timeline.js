import React, { useRef, useEffect } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';

const Timeline = ({ duration, subtitles, currentTime, onSeek }) => {
  const containerRef = useRef(null);

  // Helper to convert time to percentage
  const timeToPercent = (time) => {
    if (!duration) return 0;
    return (parseFloat(time) / duration) * 100;
  };

  const handleClick = (e) => {
    if (!containerRef.current || !duration) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percent * duration);
  };

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Typography variant="subtitle2" gutterBottom>
        Timeline Preview
      </Typography>
      
      <Box 
        sx={{ 
          position: 'relative', 
          height: 60, 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderRadius: 1,
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        ref={containerRef}
        onClick={handleClick}
      >
        {/* Playhead */}
        <Box
          sx={{
            position: 'absolute',
            left: `${timeToPercent(currentTime)}%`,
            top: 0,
            bottom: 0,
            width: 2,
            bgcolor: 'red',
            zIndex: 10,
            transition: 'left 0.1s linear'
          }}
        />

        {/* Subtitle blocks */}
        {subtitles.map((sub, index) => {
          const startPercent = timeToPercent(sub.start);
          const endPercent = timeToPercent(sub.end);
          const widthPercent = Math.max(0.5, endPercent - startPercent); // Min width for visibility

          return (
            <Tooltip key={index} title={`${sub.text} (${sub.start}s - ${sub.end}s)`}>
              <Box
                sx={{
                  position: 'absolute',
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                  top: 10,
                  height: 40,
                  bgcolor: 'primary.main',
                  opacity: 0.6,
                  borderRadius: 1,
                  '&:hover': {
                    opacity: 1,
                    bgcolor: 'primary.light',
                    zIndex: 5
                  }
                }}
              />
            </Tooltip>
          );
        })}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">00:00</Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
        </Typography>
      </Box>
    </Box>
  );
};

export default Timeline;
