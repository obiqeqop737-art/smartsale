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
- `users` / `sessions` - Auth (managed by Replit Auth integration). Users have `role` (admin/user), `userType` (user/department_head), `departmentId`
- `departments` - Department hierarchy (id, name, parentId)
- `folders` - 3-level hierarchical directory system (parentId self-reference, level 1-3)
- `knowledge_files` - User-uploaded documents for RAG (with folderId FK)
- `tasks` - Kanban task management (todo/in_progress/done)
- `task_comments` - Department head task reviews/comments (taskId, userId, content)
- `intelligence_posts` - Industry intel feed (seeded, lithium battery/new energy)
- `chat_sessions` / `chat_messages` - AI chat history
- `activity_logs` - User activity tracking for daily summary
- `user_favorites` - Intelligence post bookmarks per user
- `handover_logs` - Asset transfer records (admin handover center)

## Key Features
- **Knowledge Base**: 3-level folder tree, file upload with batch progress, RAG AI chat
- **Intelligence Radar**: News cards with detail dialog, AI insights, favorite/share, daily AI auto-update at 12:00 (scheduler), admin manual trigger
- **Task Kanban**: Drag-drop columns, edit/delete dialogs, priority badges, deadline alerts
- **Team Tasks**: Department heads can view subordinate tasks and add comments/reviews
- **Daily Summary**: AI-generated structured sales daily report with copy/export
- **Admin Panel**: Tab-based (Users/Departments/Handover). User type management (普通用户/部门长), department assignment, asset transfer
- **Department Management**: Admin CRUD for departments with parent hierarchy
- **Profile**: Avatar upload (local file), department selection from DB, superior selection
- **Plugin Hub**: Grid layout with enterprise plugin cards; only "内部报销审批" and "CRM客户管理" are connectable (rest show "敬请期待"); connected plugins auto-appear in sidebar as nav entries; state shared via PluginProvider context + localStorage
- **Mobile Responsive**: Sidebar overlay, collapsible panels, horizontal scroll kanban

## User Types & Roles
- `role`: "admin" or "user" - controls access to admin panel
- `userType`: "user" (普通用户) or "department_head" (部门长)
  - Department heads see "团队任务" toggle on tasks page
  - Can view tasks of: direct subordinates (same dept regular users), sub-department heads (superiorId), and their dept's regular users
  - Can add comments/reviews on subordinate tasks

## Auth Pattern
- Replit OIDC via passport.js, user ID from `req.user.claims.sub`
- Session stored in PostgreSQL `sessions` table
- User data in `users` table, upserted on login

## CSS Classes (Glassmorphism)
- `glass-card` / `glass-card-hover` - Semi-transparent card with blur
- `glass-sidebar` - Sidebar with backdrop blur
- `glass-dialog` / `glass-dialog-header` - Dialog with blur and gradient header
- `glass-input` - Input with blur and focus glow (dark mode: light text color)
- `glow-btn` - Blue gradient button with glow
- `glow-border` / `glow-border-active` - Blue glow border effects
- `glow-text` - Text with blue glow shadow

## Project Structure
```
client/src/
  pages/         - Landing, Knowledge, Intelligence, Tasks, Summary, Admin, Plugins, Profile, PluginExpense, PluginCrm
  components/    - AppSidebar, TopBar (avatar dropdown with profile link), UI components
  hooks/         - useAuth, useTheme, usePlugins (shared plugin connection state via context + localStorage)
server/
  routes.ts      - All API endpoints (folders, files, tasks, chat, summary, admin, departments, comments, team-tasks)
  storage.ts     - DatabaseStorage with all CRUD + admin operations
  seed.ts        - Intelligence posts seed data
  db.ts          - PostgreSQL connection
  replit_integrations/  - Auth (OIDC), Chat, Image modules
shared/
  schema.ts      - All Drizzle schemas (departments, folders, knowledge_files, tasks, task_comments, handover_logs, etc.)
  models/auth.ts - Users and sessions table definitions
```

## Running
- `npm run dev` starts Express (backend) + Vite (frontend) on port 5000
- `npm run db:push` syncs Drizzle schema to PostgreSQL
