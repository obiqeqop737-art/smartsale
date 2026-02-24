# DocuMind AI - 企业级智能文档管理平台

## Overview
An enterprise document management platform built with Express + React + PostgreSQL + Gemini AI. Features RAG knowledge base with 3-level folder hierarchy, intelligence radar, task kanban board, and daily AI summary generation. Blue glassmorphism (毛玻璃) visual theme with sci-tech aesthetics.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui, blue glassmorphism theme
- **Backend**: Express.js with session-based auth via Replit Auth
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Gemini 3.1 via Replit AI Integrations (RAG architecture)
- **Auth**: Replit OpenID Connect (OIDC)
- **Theme**: Blue glassmorphism with backdrop-blur, glow borders, semi-transparent layers

## Key Tables
- `users` / `sessions` - Auth (managed by Replit Auth integration)
- `folders` - 3-level hierarchical directory system (parentId self-reference, level 1-3)
- `knowledge_files` - User-uploaded documents for RAG (with folderId FK)
- `tasks` - Kanban task management (todo/in_progress/done)
- `intelligence_posts` - Industry intel feed (seeded, lithium battery/new energy)
- `chat_sessions` / `chat_messages` - AI chat history
- `activity_logs` - User activity tracking for daily summary

## Key Features
- **Knowledge Base**: 3-level folder tree, file upload with batch progress, RAG AI chat
- **Intelligence Radar**: News cards with detail dialog, AI insights, favorite/share
- **Task Kanban**: Drag-drop columns, edit/delete dialogs, priority badges, deadline alerts
- **Daily Summary**: AI-generated structured sales daily report with copy/export
- **Mobile Responsive**: Sidebar overlay, collapsible panels, horizontal scroll kanban

## CSS Classes (Glassmorphism)
- `glass-card` / `glass-card-hover` - Semi-transparent card with blur
- `glass-sidebar` - Sidebar with backdrop blur
- `glass-dialog` / `glass-dialog-header` - Dialog with blur and gradient header
- `glass-input` - Input with blur and focus glow
- `glow-btn` - Blue gradient button with glow
- `glow-border` / `glow-border-active` - Blue glow border effects
- `glow-text` - Text with blue glow shadow

## Project Structure
```
client/src/
  pages/         - Landing, Knowledge, Intelligence, Tasks, Summary
  components/    - AppSidebar (custom glassmorphism sidebar), UI components
  hooks/         - useAuth
server/
  routes.ts      - All API endpoints (folders, files, tasks, chat, summary)
  storage.ts     - DatabaseStorage with all CRUD
  seed.ts        - Intelligence posts seed data
  db.ts          - PostgreSQL connection
  replit_integrations/  - Auth, Chat, Image modules
shared/
  schema.ts      - All Drizzle schemas (folders, knowledge_files, tasks, etc.)
  models/        - Auth schema
```

## Running
- `npm run dev` starts Express (backend) + Vite (frontend) on port 5000
- `npm run db:push` syncs Drizzle schema to PostgreSQL

## Recent Changes (2026-02-24)
- Complete UI redesign from dark industrial to blue glassmorphism theme
- Added folders table with 3-level hierarchy and server-side level validation
- Rebuilt all pages: landing, knowledge, intelligence, tasks, summary
- Added mobile responsive support with sidebar overlay and panel toggles
- Added task edit/delete, intelligence detail dialog, batch file upload
