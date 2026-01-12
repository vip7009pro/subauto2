import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';

const SubtitleOverlay = ({ currentTime, subtitles }) => {
  const activeSubtitle = useMemo(() => {
    if (!subtitles || subtitles.length === 0) return null;
    
    return subtitles.find(sub => {
      const start = parseFloat(sub.start);
      const end = parseFloat(sub.end);
      return currentTime >= start && currentTime <= end;
    });
  }, [currentTime, subtitles]);

  if (!activeSubtitle) return null;

  const style = activeSubtitle.style || {};
  const isOpaque = style.bgOpaque;
  
  // Calculate text shadow for stroke effect
  const strokeWidth = style.strokeWidth || 0;
  const strokeColor = style.strokeColor || '#000000';
  const textShadow = strokeWidth > 0 
    ? `-${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
       ${strokeWidth}px -${strokeWidth}px 0 ${strokeColor},
       -${strokeWidth}px ${strokeWidth}px 0 ${strokeColor},
       ${strokeWidth}px ${strokeWidth}px 0 ${strokeColor}`
    : 'none';

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: '8%',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '90%',
        zIndex: 10,
        pointerEvents: 'none' // Let clicks pass through to video
      }}
    >
      <Box
        sx={{
          display: 'inline-block',
          backgroundColor: isOpaque ? (style.bgColor || 'rgba(0,0,0,0.5)') : 'transparent',
          padding: isOpaque ? '4px 12px' : '0',
          borderRadius: '4px',
          opacity: isOpaque ? (style.bgOpacity !== undefined ? style.bgOpacity : 1) : 1,
        }}
      >
        <Typography
          component="div"
          sx={{
            color: style.textColor || '#FFFFFF',
            fontSize: `${(style.fontSize || 48) / 2}px`, // Scale down for preview
            lineHeight: 1.2,
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textShadow: textShadow,
            whiteSpace: 'pre-wrap'
          }}
        >
          {activeSubtitle.text}
        </Typography>
      </Box>
    </Box>
  );
};

export default SubtitleOverlay;
