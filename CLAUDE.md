# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Event photo sharing web application with React frontend and Express backend. Users can upload photos, view a gallery, and leave notes.

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

### Path Aliases
Both frontend and server use `@common/*` to import from `common/` directory.

### Backend Storage
- **Images**: File-based storage, not database
  - `uploads/` - Original images
  - `thumbnails/` - 200x200 WebP thumbnails
  - `gallery/` - 1080x1920 optimized JPEGs
  - `metadata/` - JSON files with image metadata
  - `notes/` - JSON files for user notes
- **Database**: SQLite via Sequelize, only stores User records (id, name)

### Image Processing Pipeline
1. Upload received via Multer (temp folder)
2. Sharp processes image: creates thumbnail + gallery version in parallel
3. Metadata extracted and saved as JSON
4. Original moved to permanent uploads folder

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
- `UPLOAD_FOLDER_PATH`, `THUMBNAILS_FOLDER_PATH`, `GALLERY_FOLDER_PATH`, `METADATA_FOLDER_PATH`, `NOTES_FOLDER_PATH`
- `SSL_PRIVATE_KEY_PATH`, `SSL_CERTIFICATE_PATH` - Optional HTTPS

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL
- `PUBLIC_URL` - Base path for assets
