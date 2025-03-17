# ov-event-photo-share Development Guide

## Build/Test/Lint Commands
- **Install all dependencies**: `npm install`
- **Start development servers**: `npm start` (starts both frontend and server)
- **Build project**: `npm run build` (builds both frontend and server)
- **Build with clean**: `npm run build:clean` (removes build dir first)
- **Frontend dev server**: `cd frontend && npm start`
- **Frontend tests**: `cd frontend && npm test`
- **Frontend specific test**: `cd frontend && npm test -- -t "test name"`
- **Server dev server**: `cd server && npm start`
- **Server build**: `cd server && npm run build`

## Code Style Guidelines
- **TypeScript**: Use strict mode with proper type definitions
- **Components**: Use functional React components with hooks
- **Import Order**: React imports → third-party → services → types → components → styles
- **Naming**: PascalCase for components/types, camelCase for variables/functions
- **Types**: Define in dedicated files under `common/types` with `Model` suffix for API models
- **Styling**: Use Tailwind CSS classes and imported CSS for layout
- **Error Handling**: Use try/catch blocks for async operations with proper user feedback
- **State Management**: Use React's hooks (useState, useCallback, useMemo) for component state