# 🧠 Life OS — Command Center

A unified **command center** for life and project management, built with Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, and Supabase.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Dashboard** | Grid layout with project cards, progress bars, stats, and guardian feed |
| **Projects** | CRUD lifecycle tracking (Backlog → Understand → Document → Freeze → Implement → Verify) |
| **Tasks** | Task management with priority, status, due dates, and JSONB metadata for agent audit notes |
| **System Logs** | Real-time audit log viewer with level filtering (Critical/Warning/Info) |
| **Agent API** | REST endpoint (`/api/agent/sync`) for "Son of Anton" external agent integration |
| **Auth** | Supabase Auth with email/password, middleware-protected routes |
| **Settings** | System config viewer for operational settings |

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── (authenticated)/          # Protected route group
│   │   ├── dashboard/            # Main command center view
│   │   ├── projects/             # Project list + [id] detail
│   │   ├── tasks/                # Task management
│   │   ├── logs/                 # System audit logs
│   │   └── settings/             # System config
│   ├── api/agent/sync/           # Agent REST API
│   ├── auth/callback/            # OAuth/magic link callback
│   ├── login/                    # Login page
│   └── layout.tsx                # Root layout (dark mode)
├── components/
│   ├── dashboard/                # ProjectCard, GuardianFeed, SystemStatus, StatsCard
│   ├── layout/                   # AppSidebar, AppShell
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── supabase/                 # Client, server, middleware Supabase setup
│   ├── agent-auth.ts             # Agent API key validation
│   └── utils.ts                  # cn() utility
├── types/
│   └── database.ts               # TypeScript types for all DB tables
└── middleware.ts                  # Route protection
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
cd life-os
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and API keys from **Settings → API**
3. Update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
AGENT_API_KEY=your_custom_agent_api_key
```

### 3. Run Database Migration

Open the **SQL Editor** in your Supabase dashboard and run the contents of:

```
supabase/schema.sql
```

This creates all tables, indexes, RLS policies, triggers, and seed data.

### 4. Start Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → you'll be redirected to `/login`.

---

## 🛡️ Security

### User Authentication
- Supabase Auth with email/password
- Middleware protects all routes except `/login`, `/auth/*`, and `/api/agent/*`
- Session tokens managed via cookies (SSR-safe)

### Agent API Authentication
The `/api/agent/sync` endpoint accepts authentication via:
- `X-AGENT-API-KEY` header with your `AGENT_API_KEY`
- `Authorization: Bearer <token>` with either `AGENT_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

---

## 🤖 Agent API Reference

### `POST /api/agent/sync`

Push updates from Son of Anton:

```json
{
  "audit_logs": [
    { "level": "Critical", "message": "Build failed on main", "source": "CI/CD" }
  ],
  "project_updates": [
    { "id": "uuid", "progress": 75, "status": "Implement" }
  ],
  "task_updates": [
    { "id": "uuid", "status": "Done", "metadata": { "audit_note": "Verified by agent" } }
  ]
}
```

### `GET /api/agent/sync`

Pull current system state (all projects, tasks, config).

### Example cURL

```bash
curl -X POST http://localhost:3000/api/agent/sync \
  -H "Content-Type: application/json" \
  -H "X-AGENT-API-KEY: your_agent_key" \
  -d '{"audit_logs": [{"level": "Info", "message": "Agent online", "source": "Son of Anton"}]}'
```

---

## 📊 Database Schema

| Table | Purpose |
|---|---|
| `projects` | Name, status (6-stage lifecycle), progress %, last audit timestamp |
| `tasks` | Linked to projects, with priority, status, due date, and JSONB metadata |
| `audit_logs` | Append-only log with level (Critical/Warning/Info), message, source |
| `system_config` | Key-value (JSONB) store for operational settings |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (@supabase/ssr)

---

## 📁 Environment Variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `AGENT_API_KEY` | Custom API key for Son of Anton agent access |
