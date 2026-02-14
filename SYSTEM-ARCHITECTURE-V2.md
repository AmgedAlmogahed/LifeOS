# LifeOS — System Architecture v2
## A Second Brain for a Solo Entrepreneur

**Author:** Claude (Architectural Review)
**Date:** February 13, 2026
**Status:** Design Document — Requires Rabwa's Review
**Revised:** Incorporates Rabwa's corrections on framing and OpenClaw integration

---

## 1. Executive Summary

LifeOS Phase 1 (the Ritual Core) is 85% complete. You have a working Cockpit, Focus Mode, Evening Plan, Sprint system, and Flow Board. The question now is: **how does this grow into a full second brain without losing what makes it good?**

LifeOS is not an ERP. It's a personal operating system — a second brain for someone who is simultaneously an engineer, a designer, a business owner, and a human with a life outside of work. The system needs to hold all of that without feeling corporate.

This document covers:
- A critical review of your vision (what works, what doesn't, what's overengineered)
- How 15+ modules become accessible without a sidebar
- How OpenClaw fits in (it already has direct access — no API layer needed)
- The client lifecycle flow (the "golden thread")
- Build priority for the next 3 phases

**The core thesis:** Your Cockpit already IS your sidebar. We don't add navigation — we make the Cockpit smarter.

---

## 2. Critical Analysis of the Vision

### What's Strong (Keep As-Is)

**The 3-mode paradigm works.** Cockpit/Focus/Plan maps to how your brain actually works: survey → execute → reflect. Don't break this.

**"Entering Focus IS starting a session."** This philosophy (now implemented) eliminates a decision point. Good.

**Quick Capture as the universal inbox.** Every interruption goes to one place. The Evening Plan triages it. This is psychologically sound and already working.

**Personal projects use the same system.** Your `ProjectCategory` enum already has "Personal." A gym routine IS a project with sprints and tasks. Learning Arabic IS a project. Don't build separate "personal modules" — use what exists. This is a second brain, and your brain doesn't separate "work tasks" from "life tasks" into different apps.

**The client lifecycle tables already exist.** You have `clients`, `opportunities`, `price_offers`, `contracts`, `projects`, `invoices`, `payments`. The data model is there. What's missing is the automation and the flows.

**OpenClaw already has direct access.** OpenClaw has the GitHub repo, knows the database schema, and can access Supabase directly. No API layer, no AgentSkill manifest, no middleware needed. It's already part of the system.

### What Needs Refinement

**The sidebar toggle idea — don't do it.** You have 22 route pages already built (`/clients`, `/finance`, `/pipeline`, `/comms`, etc). The problem isn't that these pages don't exist. The problem is there's no way to reach them. A sidebar toggle would create a "which mode am I in?" meta-question that defeats the whole point.

**Solution:** The Cockpit becomes a hub with widget-sections that summarize and link to full views. Cmd+K is the power shortcut. Details in Section 4.

**"4 Pillars Health Score" — defer and simplify.** You won't maintain a 4-dimensional health tracking system while running a business. What you'll actually check: "Am I delivering on time?" and "Did I take care of myself today?"

**Simplification:** Two metrics on the Cockpit: Business Health (auto-calculated from overdue tasks + invoice status) and Personal Pulse (habits checked off + personal project hours). No separate health module. This data accumulates naturally from using the system.

**"Morning Briefing" — let OpenClaw own this, not LifeOS.** If you're communicating via WhatsApp/Telegram through OpenClaw, the morning briefing should come TO YOU there. LifeOS provides the data (via API). OpenClaw formats and delivers it. Don't build a morning briefing screen in the web app that you'll never open because you're checking your phone.

**"Habit Streaks" — embed in Evening Plan, not a separate module.** During task commitment, you also check today's habits. Three checkboxes at the bottom of the Plan: "Gym," "Read," "Pray" (or whatever yours are). Stored in `daily_plans.habits_json`. No separate habits page needed.

**Lifecycle stage automation should SUGGEST, not force.** "Accept offer → auto-create contract → auto-create project" sounds clean but real life is messy. What if you start a project before the contract? What if there's no offer (referral client)? The system should suggest the next step and pre-fill data, but let you skip or override.

### What's Overengineered for Now

| Idea | Status | Recommendation |
|------|--------|----------------|
| 4-pillar health scores | Defer | Auto-calculate 2 simple scores from existing data |
| Guardian automated monitoring | Defer | Keep as audit log viewer. Cron-based monitoring is Phase 4+ |
| Timeline/Gantt view | Defer | Board + Flow views cover 95% of needs |
| Relationship management | Defer | Client notes field covers this for now |
| Entertainment tracking | Drop | Use a dedicated app — LifeOS tracks projects and tasks, not media consumption |
| Voice input capture | Defer | OpenClaw via Telegram voice notes handles this externally |
| Calendar integration | Phase 3 | Useful but not blocking |

---

## 3. Module Inventory

Here's every module LifeOS needs, organized by what exists vs what's needed:

### Already Built (Route + Server Actions + DB)

| Module | Route | Tables | Actions | UI Quality |
|--------|-------|--------|---------|------------|
| Cockpit | `/cockpit` | projects, tasks | multiple | 90% — needs widget sections |
| Focus Mode | `/focus/[id]` | focus_sessions, tasks | 12+ | 85% — gaps fixed |
| Evening Plan | `/plan` | daily_plans, captures | 8+ | 100% |
| Projects | `/projects`, `/projects/[id]` | projects, project_assets | 5 | 80% |
| Clients | `/clients`, `/clients/[id]` | clients | 4 | 60% — basic CRUD |
| Finance | `/finance` | invoices, payments | 4 | 50% — list view only |
| Pipeline | `/pipeline` | opportunities, price_offers | 5 | 50% — list view only |
| Contracts | (via clients) | contracts, amendments | 3 | 40% — basic CRUD |
| Comms | `/comms` | communication_logs | 2 | 30% — log viewer |
| Meetings | `/meetings` | meeting_minutes | 2 | 30% — basic |
| Deployments | `/deployments` | deployments | 3 | 40% — status cards |
| Sprints | (in Focus) | sprints | 6 | 85% — carry-forward done |
| Quick Capture | (global overlay) | quick_captures | 4 | 95% |
| Inbox | `/inbox` | quick_captures | 4 | 70% |
| Settings | `/settings` | system_config | — | Placeholder |

### Needs Building

| Module | Purpose | Priority | Complexity |
|--------|---------|----------|------------|
| **Cockpit Hub Redesign** | Widget sections linking to admin views | HIGH | Medium |
| **Command Palette (Cmd+K v2)** | Search across all entities | HIGH | Medium |
| **Agent Activity Widget** | View delegated tasks + artifacts from OpenClaw | HIGH | Low |
| **Lifecycle Automator** | Offer→Contract→Project transitions | MEDIUM | Medium |
| **Client Dossier** | Rich client detail (projects, invoices, comms, contracts in one view) | MEDIUM | Medium |
| **Financial Dashboard** | Revenue charts, overdue alerts, cash flow | MEDIUM | Medium |
| **Habit Tracking** | Checkboxes in Evening Plan + streak display | LOW | Low |
| **Weekly Review** | Weekly reflection ceremony (extends Plan) | LOW | Low |

---

## 4. Navigation Architecture — "The Cockpit IS Your Sidebar"

### The Problem

You have 22 pages but only 3 entry points (Cockpit, Focus, Plan). How do users reach `/finance`, `/clients`, `/pipeline`?

### The Solution: Three Layers of Access

```
Layer 1: COCKPIT SECTIONS (daily view, always visible)
  → Scrollable widgets that summarize each domain
  → Each widget has a "View All →" link to the full page

Layer 2: CMD+K COMMAND PALETTE (power user)
  → Search anything: "invoice acme" → jump to that invoice
  → Quick actions: "new client" → opens client form
  → Fuzzy matching across all entities

Layer 3: CONTEXT BAR QUICK LINKS (situational)
  → Focus mode context bar shows project-relevant links
  → Client name links to client dossier
  → Finance icon links to project invoices
```

### Cockpit Layout (Redesigned)

```
┌─────────────────────────────────────────────────────────┐
│  CONTEXT BAR: [LifeOS ⚡] ........... [🔍 Cmd+K] [+ Capture] [🌙 Plan] │
└─────────────────────────────────────────────────────────┘

┌─ AI RECOMMENDATION BANNER ──────────────────────────────┐
│  "Focus on Project X — deadline in 3 days, 2 tasks left" │
│                                           [Enter Focus →] │
└─────────────────────────────────────────────────────────┘

┌─ MY PROJECTS ───────────────────────────────────────────┐
│  [Project Card] [Project Card] [Project Card] ...        │
│  Business + Personal projects, sorted by recommendation  │
│                                                          │
│  Filters: [All] [Business] [Personal] [Frozen]           │
└─────────────────────────────────────────────────────────┘

┌─ PIPELINE ──────────────────────── [View All →] ────────┐
│  3 leads · 2 offers sent · 1 negotiating                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐           │
│  │Lead │→ │Offer│→ │Nego │→ │ Won │  │Lost │           │
│  │  3  │  │  2  │  │  1  │  │  5  │  │  1  │           │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘           │
└─────────────────────────────────────────────────────────┘

┌─ FINANCIAL PULSE ───────────────── [View All →] ────────┐
│  Revenue this month: $12,400                             │
│  Outstanding: $3,200 (2 invoices)                        │
│  Overdue: $1,800 ⚠️ (1 invoice, 14 days late)            │
└─────────────────────────────────────────────────────────┘

┌─ AGENT ACTIVITY ────────────────── [View All →] ────────┐
│  🤖 OpenClaw completed "Draft API docs" — 2h ago         │
│  🤖 OpenClaw is working on "Generate test data" — in progress │
│  📎 3 artifacts ready for review                          │
└─────────────────────────────────────────────────────────┘

┌─ TODAY'S PULSE ─────────────────────────────────────────┐
│  ✅ 4 tasks done · 🎯 12 points · ⏱ 3h 20m focused      │
│  📋 Habits: [✓ Gym] [✓ Read] [○ Journal]                 │
│  Business Health: ████████░░ 78%                         │
└─────────────────────────────────────────────────────────┘
```

### Why This Works Better Than a Sidebar

- **Daily view:** You see everything at a glance on Cockpit without clicking through menus
- **Zero navigation tax:** The 3 modes remain clean for daily workflow (cockpit → focus → plan)
- **Progressive disclosure:** Widget shows summary → "View All" goes to full page
- **Power users:** Cmd+K bypasses everything and goes straight to any entity
- **No mode confusion:** There's no "am I in sidebar mode or ritual mode?" question

### Routes Stay As-Is

The existing 22 routes (`/clients`, `/finance`, `/pipeline`, etc) remain. They just become accessible via Cockpit widgets and Cmd+K instead of needing a sidebar.

---

## 5. OpenClaw Integration

### How It Actually Works

OpenClaw already has direct access to the LifeOS codebase (GitHub repo) and can query the Supabase database directly. There is **no need** for a custom API layer, authentication middleware, or AgentSkill manifest. OpenClaw is smart enough to understand the schema and use the existing server actions or query the database on its own.

```
┌──────────────┐                     ┌──────────────┐
│              │  Direct DB Access    │              │
│   LifeOS     │ ◄─────────────────► │   OpenClaw   │
│  (Supabase)  │  (reads schema,     │  (Local AI)  │
│              │   queries tables)    │              │
└──────┬───────┘                     └──────┬───────┘
       │                                    │
       │ Dashboard                          │ Messaging
       ▼                                    ▼
   You (Browser)                     You (WhatsApp/Telegram)
                                     Clients (WhatsApp)
```

### What LifeOS Provides (Already)

OpenClaw can already:
- Read/write to all 27 Supabase tables (tasks, projects, clients, invoices, etc.)
- Use the existing server action patterns as reference for business logic
- Create tasks, update statuses, log communications, manage sprints
- Access Supabase Storage for file-based artifacts

### Task Delegation Flow

The `tasks` table already has `delegated_to` and `delegation_status` columns. The flow:

```
You (in LifeOS or via WhatsApp to OpenClaw):
  "Hey OpenClaw, set up the Supabase project for Client X"
       │
       ▼
OpenClaw writes directly to DB:
  INSERT INTO tasks (title, project_id, delegated_to, delegation_status)
  VALUES ('Set up Supabase project', '...', 'openclaw', 'pending')
       │
       ▼
OpenClaw executes:
  - Runs commands, creates resources, generates files
  - Updates: delegation_status → 'in_progress'
       │
       ▼
OpenClaw completes:
  - Updates: delegation_status → 'completed'
  - Writes delegation_notes with results
  - Stores artifacts in Supabase Storage or agent_artifacts table
       │
       ▼
LifeOS shows in Agent Activity widget (Cockpit):
  "Completed: Set up Supabase project — 1 artifact"
  [View Report] [Accept & Close] [Needs Revision]
```

### Artifact Storage

New table needed: `agent_artifacts`

```sql
CREATE TABLE agent_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  artifact_type TEXT NOT NULL, -- 'file', 'report', 'code', 'summary'
  title TEXT NOT NULL,
  content TEXT,              -- For text-based artifacts
  file_url TEXT,             -- For file-based artifacts (Supabase Storage)
  metadata JSONB,            -- Flexible metadata
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### The "Guardian" Use Case

OpenClaw queries LifeOS directly on a schedule:
- Check for overdue invoices → send WhatsApp reminder to you
- Check for stale projects (no focus session in 5+ days) → nudge
- Check for uncommitted tasks at 3 PM → send reminder
- Morning briefing at 7 AM → summarize today's plan from `daily_plans` and `tasks`

This replaces building push notifications in the web app. OpenClaw IS the notification layer.

---

## 6. Client Lifecycle — The "Golden Thread"

### The Full Flow

```
STAGE 1: DISCOVERY
  A lead comes in (WhatsApp via OpenClaw or manual entry)
  → OpenClaw creates client record + pipeline entry directly in DB
  → LifeOS Cockpit: Pipeline widget shows new lead

STAGE 2: PROPOSAL
  You decide to make an offer
  → From /pipeline or Cmd+K: "Create offer for [Client]"
  → System pre-fills from service_catalog
  → You customize → Send (status: 'Sent')
  → OpenClaw can send the PDF via WhatsApp

STAGE 3: NEGOTIATION
  Client responds (via WhatsApp → OpenClaw logs to communication_logs)
  → Opportunity stage: 'Negotiating'
  → You revise offer if needed

STAGE 4: ACTIVATION (The Magic Moment)
  Client accepts → You mark offer as 'Accepted'
  → System SUGGESTS (not forces):
    "Create contract from this offer?" [Yes] [Skip]
    → Pre-fills contract with offer terms
    "Create project for this contract?" [Yes] [Skip]
    → Pre-fills project with client, contract link
    "Create first milestone invoice?" [Yes] [Skip]
    → Pre-fills from contract value

STAGE 5: EXECUTION
  Project moves through lifecycle stages:
  Understand → Document → Freeze → Implement → Verify
  → Each stage loads specific context in Focus Mode
  → Sprint-based task execution within stages
  → OpenClaw handles delegated tasks (repo setup, docs, etc)

STAGE 6: DELIVERY & BILLING
  Milestone completed → Invoice status check
  → System: "Milestone 2 complete. Invoice #12 is still unpaid."
  → You: Send reminder (manual or via OpenClaw Guardian)
  → Payment recorded → Next milestone begins

STAGE 7: COMPLETION
  Project delivered → Final invoice paid
  → System: "Generate project retrospective?" [Yes]
  → Client health score updated
  → Opportunity: 'Won' (already was, but lifecycle complete)
```

### What Needs Building for This Flow

| Step | What Exists | What's Missing |
|------|-------------|----------------|
| Client creation | CRUD works | — (OpenClaw already has direct access) |
| Opportunity tracking | CRUD + stages | Stage transition suggestions in UI |
| Price offer creation | CRUD + line items | PDF generation, send via OpenClaw |
| Offer → Contract | Server action exists | UI flow: "Create contract from offer?" |
| Contract → Project | Both exist separately | Suggested linking: pre-fill project from contract |
| Project → Invoice | Both exist | Milestone-based auto-suggestion |
| Invoice reminders | Invoice status tracking | OpenClaw Guardian scheduled check |
| Communication logging | Table exists | OpenClaw auto-logs from WhatsApp conversations |

---

## 7. Data Model Extensions

### New Tables Needed

```sql
-- Agent artifacts (files/results from OpenClaw)
-- OpenClaw writes to this directly when completing delegated tasks
CREATE TABLE agent_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  project_id UUID REFERENCES projects(id),
  user_id UUID REFERENCES auth.users(id),
  artifact_type TEXT NOT NULL DEFAULT 'file',
  title TEXT NOT NULL,
  content TEXT,
  file_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

Note: No API key table needed — OpenClaw accesses Supabase directly using the same service role or connection method it already has.

### Column Additions to Existing Tables

```sql
-- daily_plans: add habits tracking
ALTER TABLE daily_plans
  ADD COLUMN habits_json JSONB DEFAULT '[]';
  -- e.g. [{ "name": "Gym", "done": true }, { "name": "Read", "done": false }]

-- tasks: delegation status values (if not already enum)
-- Already has: delegated_to, delegation_status, delegation_notes
-- Just needs consistent usage

-- opportunities: link to resulting contract/project
ALTER TABLE opportunities
  ADD COLUMN converted_contract_id UUID REFERENCES contracts(id),
  ADD COLUMN converted_project_id UUID REFERENCES projects(id);
```

---

## 8. Build Priority

### Phase 2a — Access & Navigation (1 week)

**Goal:** Make all existing modules reachable without a sidebar.

1. **Cockpit Hub Redesign** — Add widget sections (Pipeline, Financial Pulse, Agent Activity, Today's Pulse) above the existing project grid. Each widget is a summary card with "View All →" linking to the existing route page.

2. **Cmd+K v2** — Upgrade the command palette to search across projects, clients, invoices, tasks. Quick actions: "new client," "new task for [project]," "invoice for [client]."

3. **Context Bar Links** — In Focus Mode, show the client name (linked to client dossier) and a finance icon (linked to project invoices).

**Files to modify:** `cockpit/page.tsx`, `context-bar.tsx`, `quick-capture-modal.tsx` (expand to command palette)

### Phase 2b — Agent Visibility + Task Delegation (1 week)

**Goal:** See what OpenClaw is doing and delegate tasks to it from LifeOS.

OpenClaw already has direct DB access — so this phase is about making delegated work **visible** in the LifeOS UI, not about building an integration layer.

1. **Agent Artifacts table** — Migration + server actions + display in Cockpit widget. OpenClaw writes artifacts directly to this table.

2. **Agent Activity Widget** — Cockpit section showing recent OpenClaw activity (completed tasks, in-progress work, artifacts ready for review).

3. **Task Delegation UI** — In task detail, add "Delegate to OpenClaw" button that sets `delegated_to = 'openclaw'`. OpenClaw picks up tasks with this flag on its own.

**New files:** `agent_artifacts` migration, `src/lib/actions/agent.ts`, Agent Activity widget component

### Phase 2c — Client Lifecycle Automation (1 week)

**Goal:** Smooth flow from offer → contract → project → invoice.

1. **"Convert" buttons** — On accepted price offer: "Create Contract" (pre-fills). On contract: "Create Project" (pre-fills). On project milestone: "Create Invoice" (pre-fills).

2. **Opportunity tracking** — Link opportunities to contracts and projects via `converted_contract_id` and `converted_project_id`.

3. **Client Dossier page** — Redesign `/clients/[id]` to show all related entities (projects, contracts, invoices, comms, meetings) in a tabbed view.

4. **Communication logging** — OpenClaw logs WhatsApp conversations directly to `communication_logs` table.

**Files to modify:** Price offer detail page, contract detail page, project creation flow, client detail page.

### Phase 3 — Personal & Reflection (1 week)

1. **Habits in Evening Plan** — Add habit checkboxes to Plan page. Store in `daily_plans.habits_json`.

2. **Personal project category** — Cockpit filter for Business vs Personal projects (already supported by `ProjectCategory` enum).

3. **Weekly Review** — New ritual page (`/review`) that shows weekly metrics: tasks completed, focus hours, sprint velocity, habits streaked.

4. **Auto-calculated health metrics** — Cockpit widget showing Business Health (from overdue/delivery data) and Personal Pulse (from habits + personal project hours).

### Phase 4 — Intelligence (2+ weeks)

1. **OpenClaw Guardian** — Scheduled checks for overdue invoices, stale projects, uncommitted tasks. Delivers alerts via WhatsApp.

2. **Morning Briefing** — OpenClaw queries `daily_plans`, `tasks`, and `invoices` directly, then sends a formatted summary via WhatsApp/Telegram.

3. **Smart task suggestions** — Factor in skip_count, deadline proximity, sprint context into next-task recommendations.

4. **Proactive insights** — "You've been in Implement phase for 3 weeks on Project X, which usually takes 2 weeks."

---

## 9. What NOT to Build

| Feature | Reason | Alternative |
|---------|--------|-------------|
| Sidebar toggle | Breaks the 3-mode paradigm | Cockpit hub + Cmd+K |
| OpenClaw API layer | OpenClaw already has direct DB access | No middleware needed |
| OpenClaw AgentSkill | OpenClaw reads the schema itself | No manifest or plugin needed |
| Separate habits module | Overengineered for one person | Checkboxes in Evening Plan |
| Separate health module | Won't be maintained daily | Auto-calculated Cockpit widget |
| Morning briefing in web app | You'll check phone first | OpenClaw delivers via WhatsApp |
| Timeline/Gantt view | Low ROI for solo work | Board + Flow views sufficient |
| Entertainment tracking | Not what a second brain tracks | Use a dedicated app |
| Full CRM system | Overscoped — you have a handful of clients, not hundreds | Client notes + comms log |
| Calendar integration | Phase 4 at earliest | Manual for now, OpenClaw can read calendar |
| Voice input in web app | Complex, fragile | Telegram voice notes → OpenClaw → direct DB insert |
| Push notifications | Requires service worker setup | OpenClaw WhatsApp notifications |

---

## 10. Summary: The LifeOS Mental Model

```
┌─────────────────────────────────────────────────────────┐
│                  YOUR SECOND BRAIN                        │
│                                                          │
│   MORNING          DAYTIME           EVENING             │
│   ┌────────┐      ┌────────┐       ┌────────┐           │
│   │Cockpit │ ───► │ Focus  │ ───►  │  Plan  │           │
│   │(Survey)│      │(Execute)│      │(Reflect)│           │
│   └────┬───┘      └────────┘       └────────┘           │
│        │                                                 │
│   Widgets link to deeper views when needed:              │
│   /clients  /finance  /pipeline  /contracts              │
│                                                          │
│   Cmd+K reaches anything instantly                       │
│                                                          │
│   Business + Personal — same system, same rituals        │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  OPENCLAW (Your AI Chief of Staff)        │
│                                                          │
│   WhatsApp/Telegram ◄──► OpenClaw ◄──► LifeOS DB        │
│                          (direct access)                 │
│   Roles:                                                 │
│   • Receives client messages → logs to LifeOS            │
│   • Executes delegated tasks → stores artifacts          │
│   • Sends you briefings and alerts                       │
│   • You can command LifeOS by texting OpenClaw            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**The key insight:** LifeOS is the brain (data + decisions + rituals). OpenClaw is the hands (execution + communication). You interact with whichever is closest — the dashboard when you're at your desk, WhatsApp when you're on the move. They share the same database — no middleware needed.

This is a second brain that holds your entire life: business projects and client work, personal projects and self-improvement, the messy overlap between them. It's built for one person who keeps refining it until it fits.

---

## Next Step

Create a project called "LifeOS Development" inside LifeOS itself with these sprints:

**Sprint 1:** Cockpit Hub Redesign + Cmd+K v2 (access layer)
**Sprint 2:** Agent Visibility + Task Delegation UI (see what OpenClaw is doing)
**Sprint 3:** Client Lifecycle Automation (the golden thread)
**Sprint 4:** Personal + Reflection (habits, weekly review)

Each sprint is roughly 1 week. You can delegate LifeOS development tasks to OpenClaw from day one — it already has access to everything.
