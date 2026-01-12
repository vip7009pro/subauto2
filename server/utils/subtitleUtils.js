const subtitle = require('subtitle');

/**
 * Convert subtitle array to SRT format
 */
function toSRT(subtitles) {
  const srtData = subtitles.map((sub, index) => ({
    type: 'cue',
    data: {
      start: parseFloat(sub.start) * 1000, // Convert to milliseconds
      end: parseFloat(sub.end) * 1000,
      text: sub.text
    }
  }));

  return subtitle.stringify(srtData);
}

/**
 * Convert subtitle array to ASS format with styles
 */
function toASS(subtitles) {
  let ass = `[Script Info]
Title: AutoSubtitlesApp
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
`;

  // Create unique styles
  const styleMap = new Map();
  subtitles.forEach((sub, index) => {
    const style = sub.style || {};
    const styleKey = JSON.stringify(style);
    
    if (!styleMap.has(styleKey)) {
      const styleName = `Style${styleMap.size}`;
      styleMap.set(styleKey, styleName);
      
      // Convert hex colors to ASS format (&H00BBGGRR)
      const textColor = hexToASSColor(style.textColor || '#FFFFFF');
      const outlineColor = hexToASSColor(style.strokeColor || '#000000');
      const bgColor = hexToASSColor(style.bgColor || '#000000');
      const bgOpacity = style.bgOpaque ? '00' : 'FF';
      
      ass += `Style: ${styleName},Arial,${style.fontSize || 48},${textColor},${textColor},${outlineColor},&H${bgOpacity}${bgColor.substring(3)},0,0,0,0,100,100,0,0,1,${style.strokeWidth || 2},0,2,10,10,10,1\n`;
    }
  });

  ass += `\n[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  // Add dialogue lines
  subtitles.forEach((sub, index) => {
    const style = sub.style || {};
    const styleKey = JSON.stringify(style);
    const styleName = styleMap.get(styleKey);
    
    const start = formatASSTime(parseFloat(sub.start));
    const end = formatASSTime(parseFloat(sub.end));
    const text = sub.text.replace(/\n/g, '\\N');
    
    ass += `Dialogue: 0,${start},${end},${styleName},,0,0,0,,${text}\n`;
  });

  return ass;
}

/**
 * Parse SRT content to subtitle array
 */
function fromSRT(srtContent) {
  try {
    const parsed = subtitle.parse(srtContent);
    return parsed
      .filter(item => item.type === 'cue')
      .map(item => ({
        start: (item.data.start / 1000).toFixed(3),
        end: (item.data.end / 1000).toFixed(3),
        text: item.data.text,
        style: {
          textColor: '#FFFFFF',
          bgColor: '#000000',
          strokeColor: '#000000',
          strokeWidth: 2,
          bgOpaque: false,
          bgOpacity: 0.5,
          fontSize: 48
        }
      }));
  } catch (error) {
    console.error('Error parsing SRT:', error);
    return [];
  }
}

/**
 * Parse ASS content to subtitle array (basic parsing)
 */
function fromASS(assContent) {
  const subtitles = [];
  const lines = assContent.split('\n');
  let inEvents = false;

  for (const line of lines) {
    if (line.trim() === '[Events]') {
      inEvents = true;
      continue;
    }

    if (inEvents && line.startsWith('Dialogue:')) {
      const parts = line.substring(9).split(',');
      if (parts.length >= 10) {
        const start = parseASSTime(parts[1].trim());
        const end = parseASSTime(parts[2].trim());
        const text = parts.slice(9).join(',').replace(/\\N/g, '\n');

        subtitles.push({
          start: start.toFixed(3),
          end: end.toFixed(3),
          text: text,
          style: {
            textColor: '#FFFFFF',
            bgColor: '#000000',
            strokeColor: '#000000',
            strokeWidth: 2,
            bgOpaque: false,
            bgOpacity: 0.5,
            fontSize: 48
          }
        });
      }
    }
  }

  return subtitles;
}

/**
 * Convert hex color to ASS color format (&H00BBGGRR)
 */
function hexToASSColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = hex.substring(0, 2);
  const g = hex.substring(2, 4);
  const b = hex.substring(4, 6);
  
  return `&H00${b}${g}${r}`;
}

/**
 * Format time in seconds to ASS time format (H:MM:SS.CC)
 */
function formatASSTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

/**
 * Parse ASS time format to seconds
 */
function parseASSTime(timeStr) {
  const parts = timeStr.split(':');
  const h = parseInt(parts[0]);
  const m = parseInt(parts[1]);
  const secParts = parts[2].split('.');
  const s = parseInt(secParts[0]);
  const cs = parseInt(secParts[1] || 0);
  
  return h * 3600 + m * 60 + s + cs / 100;
}

/**
 * Format time in seconds to SRT time format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

module.exports = {
  toSRT,
  toASS,
  fromSRT,
  fromASS,
  formatSRTTime,
  formatASSTime
};
