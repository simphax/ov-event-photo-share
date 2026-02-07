# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Event media sharing web application with React frontend and Express backend. Users can upload photos and videos, view a gallery, and leave notes. Features asynchronous media processing with persistent queue for video encoding and image optimization.

## Commands

### Development
```bash
npm start                    # Run frontend (port 3000) + server (port 3050) concurrently
```

### Production
```bash
npm run build               # Build frontend and server
npm start:prod              # Run production build from /build directory
```

### Testing
```bash
cd frontend && npm test     # Run React tests (Jest)
```

### Individual Builds
```bash
npm run build:frontend      # Build React app only
npm run build:server        # Compile TypeScript server only
```

## Architecture

### Monorepo Structure
- `frontend/` - React 18 TypeScript app (Create React App)
- `server/` - Express TypeScript API (single `server.ts` file)
- `common/types/` - Shared TypeScript types (ImageItem, Note, User responses)

### Media Types & Status
- **Types**: `image` | `video`
- **Status**: `processing` | `ready` | `error`
- Media items are created immediately but processed asynchronously

### Path Aliases
Both frontend and server use `@common/*` to import from `common/` directory.

### Backend Storage
- **Media Files**: File-based storage, not database
  - `uploads/tmp/` - Temporary upload directory (Multer)
  - `uploads/` - Original media files (stored with file extension)
  - `thumbnails/` - 200x200 WebP thumbnails (for both images and videos)
  - `gallery/` - Optimized media: 1080px-wide JPEGs for images, H.264 MP4 for videos
  - `metadata/` - JSON files with media metadata (type, status, uploadedDateTime, fileExtension)
  - `notes/` - JSON files for user notes
- **Database**: SQLite via Sequelize, only stores User records (id, name)

### Media Processing Pipeline
1. Upload received via Multer (temp folder with size limit: 600MB)
2. File validation (images or supported video formats)
3. Video validation: max 60 seconds duration
4. Metadata saved with `processing` status and queued for background processing
5. Response returned immediately to client with `processing` status
6. **Background Processing Queue** (p-queue with concurrency: 1):
   - **Images**: Sharp creates thumbnail (200x200 WebP) + gallery version (1080px JPEG)
   - **Videos**: FFmpeg extracts frame for thumbnail → Sharp converts to WebP + FFmpeg converts to H.264 MP4 (1080px wide, web-optimized with faststart)
7. Metadata updated to `ready` or `error` status
8. **Queue Persistence**: On server restart, scans metadata folder and restores `processing` items to queue

### Video Support
- **Allowed Formats**: MP4, MOV, AVI, WebM, MKV
- **Limits**: Max 60 seconds, 600MB file size
- **Processing**: FFmpeg converts to H.264 MP4 with AAC audio, web-optimized
- **Thumbnail**: Extracted from 10% timestamp or 1 second (whichever is less)
- **Dependencies**: `@ffmpeg-installer/ffmpeg`, `@ffprobe-installer/ffprobe`, `fluent-ffmpeg`, `p-queue`

### Real-Time Updates
Server-Sent Events (SSE) stream at `/gallery/count-stream` broadcasts gallery count changes. Frontend uses EventSource with polling fallback.

### Frontend Services
- `BackendService` - Centralized API calls with axios (max 3 concurrent requests)
- `UserService` - LocalStorage-based user session (UUID v4)

### Key Frontend Components
- `AppView.tsx` - Main orchestrator component
- `ImageGallery.tsx` - Gallery display with lightbox
- `SelectImages.tsx` - Upload interface
- `NoteDialog.tsx` / `NoteSlide.tsx` - Notes feature

## Environment Variables

### Server (.env)
- `SERVER_PORT` - Default: 5050
- `SERVER_URL` - Base URL for server
- `SERVER_BASE_PATH` - Base path for router, default: "/"
- `TMP_UPLOAD_FOLDER_PATH` - Temporary upload directory, default: "uploads/tmp/"
- `UPLOAD_FOLDER_PATH` - Original media files, default: "uploads/"
- `THUMBNAILS_FOLDER_PATH` - Thumbnail directory, default: "thumbnails/"
- `GALLERY_FOLDER_PATH` - Optimized media directory, default: "gallery/"
- `METADATA_FOLDER_PATH` - Metadata JSON files, default: "metadata/"
- `NOTES_FOLDER_PATH` - Notes JSON files, default: "notes/"
- `SSL_PRIVATE_KEY_PATH`, `SSL_CERTIFICATE_PATH` - Optional HTTPS

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL
- `PUBLIC_URL` - Base path for assets
