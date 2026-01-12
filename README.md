# AutoSubtitlesApp

A complete web application for automatic subtitle generation, translation, editing, and video rendering with burned-in subtitles.

## Features

- 🎬 **Video Upload**: Drag-and-drop or file input for video files
- 🤖 **AI Subtitle Generation**: Automatic speech-to-text using Whisper AI
- 🌍 **Multi-Language Support**: Support for 99+ languages including Vietnamese (vi) and Korean (ko)
- 🔄 **Translation**: Translate subtitles to multiple languages using Google Translate
- ✏️ **Advanced Editor**: Edit subtitle text, timing, and styles (colors, stroke, background)
- 🎨 **Style Customization**: Customize text color, background, stroke, and opacity
- 📹 **Video Preview**: Real-time preview with subtitle overlay
- 🔥 **Render**: Burn subtitles into video using FFmpeg

## Tech Stack

### Frontend
- React 18+
- Material-UI
- Video.js
- Axios
- React Dropzone
- React Color

### Backend
- Node.js 18+
- Express
- FFmpeg
- Whisper AI (@xenova/transformers)
- Google Translate API
- Multer

## Prerequisites

- Node.js v18 or higher
- npm or yarn
- FFmpeg (automatically installed via npm packages)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd subauto2
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Copy environment file:
```bash
copy .env.example .env
```

4. Start the application:
```bash
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. **Upload Video**: Drag and drop a video file or click to browse
2. **Select Source Language**: Choose the video's language or use auto-detect
3. **Generate Subtitles**: Click to generate subtitles using AI
4. **Edit Subtitles**: Modify text, timing, and styles in the editor
5. **Translate** (Optional): Select target language and translate
6. **Render Video**: Burn subtitles into the video
7. **Download**: Download the final video with embedded subtitles

## Supported Languages

The app supports 99+ languages including:
- English (en)
- Vietnamese (vi)
- Korean (ko)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)
- And many more...

## Project Structure

```
subauto2/
├── client/              # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── App.js
│       └── index.js
├── server/              # Express backend
│   ├── routes/
│   ├── utils/
│   ├── uploads/         # Temporary file storage
│   └── index.js
├── package.json         # Root package.json
├── .gitignore
├── .env.example
└── README.md
```

## Development

- `npm start` - Run both client and server concurrently
- `npm run client` - Run only the frontend
- `npm run server` - Run only the backend
- `npm run build` - Build frontend for production

## API Endpoints

- `POST /api/upload` - Upload video file
- `POST /api/generate-subs` - Generate subtitles from video
- `POST /api/translate` - Translate subtitles
- `POST /api/update-subs` - Update subtitle data
- `POST /api/render` - Render video with burned-in subtitles
- `GET /api/download/:filename` - Download rendered video

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
