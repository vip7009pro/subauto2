import React from 'react';
import { Box, Typography, Grid, TextField, Switch, FormControlLabel, Slider } from '@mui/material';
import { ChromePicker } from 'react-color';

const SubtitleStyleEditor = ({ style, onChange, compact = false }) => {
  const [showTextColorPicker, setShowTextColorPicker] = React.useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = React.useState(false);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = React.useState(false);

  return (
    <Box sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.2)', borderRadius: 1 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
        Style Settings
      </Typography>

      <Grid container spacing={2}>
        {/* Text Color */}
        <Grid item xs={12} md={4}>
          <Typography variant="caption" display="block" gutterBottom>
            Text Color
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 40,
              bgcolor: style.textColor,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowTextColorPicker(!showTextColorPicker)}
          >
            <Typography variant="caption">{style.textColor}</Typography>
          </Box>
          {showTextColorPicker && (
            <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
              <Box
                sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
                onClick={() => setShowTextColorPicker(false)}
              />
              <ChromePicker
                color={style.textColor}
                onChange={(color) => onChange('textColor', color.hex)}
              />
            </Box>
          )}
        </Grid>

        {/* Background Color */}
        <Grid item xs={12} md={4}>
          <Typography variant="caption" display="block" gutterBottom>
            Background Color
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 40,
              bgcolor: style.bgColor,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowBgColorPicker(!showBgColorPicker)}
          >
            <Typography variant="caption" sx={{ color: style.textColor }}>
              {style.bgColor}
            </Typography>
          </Box>
          {showBgColorPicker && (
            <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
              <Box
                sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
                onClick={() => setShowBgColorPicker(false)}
              />
              <ChromePicker
                color={style.bgColor}
                onChange={(color) => onChange('bgColor', color.hex)}
              />
            </Box>
          )}
        </Grid>

        {/* Stroke Color */}
        <Grid item xs={12} md={4}>
          <Typography variant="caption" display="block" gutterBottom>
            Stroke Color
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 40,
              bgcolor: style.strokeColor,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 1,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={() => setShowStrokeColorPicker(!showStrokeColorPicker)}
          >
            <Typography variant="caption" sx={{ color: style.textColor }}>
              {style.strokeColor}
            </Typography>
          </Box>
          {showStrokeColorPicker && (
            <Box sx={{ position: 'absolute', zIndex: 2, mt: 1 }}>
              <Box
                sx={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0 }}
                onClick={() => setShowStrokeColorPicker(false)}
              />
              <ChromePicker
                color={style.strokeColor}
                onChange={(color) => onChange('strokeColor', color.hex)}
              />
            </Box>
          )}
        </Grid>

        {/* Font Size */}
        <Grid item xs={12} md={4}>
          <TextField
            label="Font Size"
            type="number"
            value={style.fontSize || 48}
            onChange={(e) => onChange('fontSize', parseInt(e.target.value))}
            size="small"
            fullWidth
            inputProps={{ min: 12, max: 120 }}
          />
        </Grid>

        {/* Stroke Width */}
        <Grid item xs={12} md={4}>
          <TextField
            label="Stroke Width"
            type="number"
            value={style.strokeWidth || 2}
            onChange={(e) => onChange('strokeWidth', parseInt(e.target.value))}
            size="small"
            fullWidth
            inputProps={{ min: 0, max: 10 }}
          />
        </Grid>

        {/* Background Opacity */}
        <Grid item xs={12} md={4}>
          <Typography variant="caption" display="block" gutterBottom>
            Background Opacity: {((style.bgOpacity || 0.5) * 100).toFixed(0)}%
          </Typography>
          <Slider
            value={style.bgOpacity || 0.5}
            onChange={(e, value) => onChange('bgOpacity', value)}
            min={0}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${(value * 100).toFixed(0)}%`}
          />
        </Grid>

        {/* Background Opaque Toggle */}
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Switch
                checked={style.bgOpaque || false}
                onChange={(e) => onChange('bgOpaque', e.target.checked)}
              />
            }
            label="Opaque Background Box"
          />
        </Grid>
      </Grid>

      {/* Preview - Only show if NOT compact, since we have video overlay now */}
      {!compact && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'black', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="caption" display="block" gutterBottom color="text.secondary">
            Preview
          </Typography>
          <Box
            sx={{
              display: 'inline-block',
              px: style.bgOpaque ? 2 : 0,
              py: style.bgOpaque ? 1 : 0,
              bgcolor: style.bgOpaque ? style.bgColor : 'transparent',
              opacity: style.bgOpaque ? style.bgOpacity : 1,
            }}
          >
            <Typography
              sx={{
                color: style.textColor,
                fontSize: `${(style.fontSize || 48) / 3}px`,
                textShadow: `
                  -${style.strokeWidth}px -${style.strokeWidth}px 0 ${style.strokeColor},
                  ${style.strokeWidth}px -${style.strokeWidth}px 0 ${style.strokeColor},
                  -${style.strokeWidth}px ${style.strokeWidth}px 0 ${style.strokeColor},
                  ${style.strokeWidth}px ${style.strokeWidth}px 0 ${style.strokeColor}
                `,
                fontWeight: 'bold'
              }}
            >
              Sample Subtitle Text
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SubtitleStyleEditor;
