# Quick Start Guide

## 🚀 Start the Application

```bash
npm start
```

This will start both the frontend (port 3000) and backend (port 5000).

## 🌐 Access the App

Open your browser and navigate to:
```
http://localhost:3000
```

## 📋 Workflow

1. **Upload Video**
   - Drag & drop a video file (MP4, AVI, MOV, MKV, WebM)
   - Or click "Browse Files"
   - Max size: 100MB

2. **Generate Subtitles**
   - Select source language (or auto-detect)
   - Click "Generate Subtitles"
   - Wait for AI processing (Whisper AI)

3. **Edit Subtitles**
   - Watch video with subtitle overlay
   - Click on any subtitle to edit:
     - Text content
     - Start/end times
     - Styles (colors, stroke, background)
   - Add new subtitles with "Add" button
   - Delete unwanted subtitles

4. **Translate** (Optional)
   - Select target language
   - Click "Translate"
   - All subtitles will be translated

5. **Render Video**
   - Click "Render Video"
   - Wait for processing (FFmpeg burns subtitles)
   - Download the final video

## 🛠️ Troubleshooting

### Port Already in Use
If port 3000 or 5000 is already in use:
1. Edit `.env` file
2. Change `PORT=5000` to another port
3. Restart the app

### Dependencies Not Installed
```bash
npm run install-all
```

### Clear Temporary Files
Delete files in `server/uploads/` folder

## 📦 Build for Production

```bash
npm run build
```

This builds the React app and copies it to `server/public/`

## 🎯 Supported Languages

**Source Languages (for subtitle generation):**
- Auto-detect
- Vietnamese (vi)
- Korean (ko)
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)
- And 90+ more languages

**Translation Languages:**
All languages supported by Google Translate (100+)

## 💡 Tips

- Use **auto-detect** if you're unsure of the video language
- **Edit timing** by clicking on start/end time fields
- **Preview styles** in real-time before rendering
- **Save subtitles** before rendering to avoid losing changes
- **Rendered videos** are saved in `server/uploads/` folder

## 🔧 Advanced

### Run Frontend Only
```bash
npm run client
```

### Run Backend Only
```bash
npm run server
```

### Install Dependencies Separately
```bash
# Root
npm install

# Client
cd client && npm install

# Server
cd server && npm install
```

## 📝 Environment Variables

Edit `.env` file:
```
PORT=5000                    # Backend port
NODE_ENV=development         # Environment
MAX_FILE_SIZE=104857600      # Max upload size (100MB)
```

## 🎨 Features

✅ AI-powered subtitle generation (Whisper)  
✅ 99+ language support  
✅ Real-time translation  
✅ Advanced style editor  
✅ Video preview with overlay  
✅ Timeline-based editing  
✅ FFmpeg video rendering  
✅ Drag-and-drop upload  
✅ Material-UI design  

Enjoy creating subtitles! 🎬
