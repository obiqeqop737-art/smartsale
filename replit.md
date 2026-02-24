# Sales AI Agent - 企业级销售AI智能体门户

## Overview
An enterprise Sales AI Agent portal built with Express + React + PostgreSQL + Gemini AI. Features personal knowledge base with RAG, intelligence radar, task kanban board, and daily AI summary generation.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui, dark industrial theme
- **Backend**: Express.js with session-based auth via Replit Auth
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: Gemini 3.1 via Replit AI Integrations (RAG architecture)
- **Auth**: Replit OpenID Connect (OIDC)

## Key Tables
- `users` / `sessions` - Auth (managed by Replit Auth integration)
- `knowledge_files` - User-uploaded documents for RAG
- `tasks` - Kanban task management
- `intelligence_posts` - Industry intel feed (seeded)
- `chat_sessions` / `chat_messages` - AI chat history
- `activity_logs` - User activity tracking for daily summary

## Project Structure
```
client/src/
  pages/         - Landing, Knowledge, Intelligence, Tasks, Summary
  components/    - AppSidebar, UI components
  hooks/         - useAuth
server/
  routes.ts      - All API endpoints
  storage.ts     - DatabaseStorage with all CRUD
  seed.ts        - Intelligence posts seed data
  db.ts          - PostgreSQL connection
  replit_integrations/  - Auth, Chat, Image modules
shared/
  schema.ts      - All Drizzle schemas
  models/        - Auth schema
```

## Running
- `npm run dev` starts Express (backend) + Vite (frontend) on port 5000
- `npm run db:push` syncs Drizzle schema to PostgreSQL
