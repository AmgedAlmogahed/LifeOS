# LifeOS — Architecture Blueprint

> **Status:** Living Document — Source of Truth
> **Owner:** Rabwa
> **Last Updated:** February 12, 2026
> **Version:** 0.2.0

---

## 1. Vision & Core Principles

### 1.1 What Is LifeOS?

LifeOS is a personal operating system for a solo entrepreneur who does everything — from drafting price offers to deploying production systems, from managing client relationships to tracking personal goals. It is not a project management tool. It is not a CRM. It is not a dashboard. It is a **context machine** — a system that holds your mental state so you don't have to.

The core problem LifeOS solves is **cognitive load**. The user can execute work — the struggle is knowing what to do next, where they are across multiple massive projects, and recovering context after every interruption. The system exists to eliminate the cost of context switching, make project clarity instant, and turn AI into a true partner that recommends, breaks down work, and executes.

### 1.2 The Four Pillars

Everything in LifeOS is built on four pillars. Every feature, every screen, every interaction must serve at least one:

**Pillar 1 — Clarity**
The system eliminates cognitive load. At any moment, the user knows exactly where every project stands, what needs attention, and what to do next. The system holds context so the brain doesn't have to.

**Pillar 2 — Focus**
When working on a project, everything else disappears. The system loads full context for one project — timeline, last session, next actions, client, finances — so the user can start working in seconds, not minutes.

**Pillar 3 — Reflection**
Show reality clearly across every dimension — financial health, business health, personal progress, goal trajectory. The feeling of "I'm behind" is fuel, not anxiety. The system makes the invisible visible so the user feels compelled to act.

**Pillar 4 — Agency**
The AI partner (OpenClaw) doesn't just inform — it acts. It recommends which project to focus on, breaks down phases into tasks, executes delegated work, and handles communication. It's the chief of staff you can't afford to hire.

### 1.3 Design Principles

These are non-negotiable UX rules:

1. **Zero Context-Switch Cost** — When you leave a project and come back, the system reconstructs your mental state instantly: what you did last, where you stopped, what's next. No "where was I?" moments.

2. **AI Recommends, Human Decides** — The system always suggests which project to focus on, which tasks to do next, how to break down work. But the human confirms or overrides. Never auto-pilot.

3. **Project-Centric, Not Feature-Centric** — There is no "Clients page" or "Finance page" that you navigate to. Client info, finances, comms, deployments appear as context WITHIN the project you're working on. Cross-cutting views exist but are secondary.

4. **Interrupt Without Losing Focus** — Capturing an interruption (family, client, random thought) takes one action and returns you to exactly where you were. Interruptions go to a queue you process on YOUR schedule.

5. **Progressive Disclosure** — Show the minimum by default. The cockpit shows project cards. Focus mode shows full context. Details exist one click deeper. Calm by default, rich when needed.

6. **The Bullet Journal Test** — If it's slower than writing in a journal, redesign it. Speed of capture and planning is sacred.

7. **Reflection Creates Action** — Every data visualization must connect to an action. A chart that doesn't lead to a decision is decoration.

---

## 2. User Scenarios & Rituals

### 2.1 The Daily Cycle

The entire system is designed around a daily rhythm with two primary modes:

#### Morning / During Work — Cockpit + Focus

1. **Open the app → Cockpit.** See all active projects. System recommends which to focus on ("Project Alpha — deadline in 5 days, client asked about progress"). See personal tasks queue, financial snapshot.

2. **Enter Focus on a project.** Full context loads: project timeline with "you are here," last session summary, next 3-5 tasks, client context, financial status, deployment health. Everything needed to start working immediately.

3. **Work.** Complete tasks, mark progress. If tasks aren't clear, ask AI to break down the current phase. If interrupted, hit capture → type it → back to focus.

4. **Switch projects (if needed).** Back to cockpit → enter focus on another project. The system remembers where you were on each project.

5. **Exit focus.** Optionally leave a session note: "Left off at login endpoint, need to connect middleware next." This shows up when you resume.

#### Evening — Plan Tomorrow (10-15 min)

1. **Review today.** System shows which projects you worked on, tasks completed across all projects, what's still open.

2. **AI recommends tomorrow's focus.** "Spend morning on Alpha (deadline closer), afternoon on Beta (client meeting prep)." User confirms or overrides.

3. **Commit tasks.** For each project you'll work on tomorrow, confirm which specific tasks you'll tackle. The act of choosing creates commitment.

4. **Triage interruptions.** Process the capture queue: convert to tasks, dismiss, or delegate.

5. **Delegate.** Mark tasks for OpenClaw. Add instructions. It works while you sleep.

#### Weekly — Reflect & Migrate (30 min)

1. Week in review — completion rates, patterns, which projects consumed the most time
2. Migration — unfinished tasks: keep, reschedule, delegate, or kill
3. Pipeline check — opportunities, contracts, overdue invoices
4. Goal progress — ahead or behind?
5. Plan next week — high-level focus areas

#### Monthly — Deep Reflection (1 hour)

1. Financial health report
2. Business health report
3. Personal health report
4. Strategic review — right clients? right rates? right priorities?
5. Course correction

### 2.2 Key Business Workflows

#### Scenario A: New Client Acquisition

```
1. Quick capture: Add lead (name, contact, what they need)
2. Discovery meeting → Log meeting minutes, record requirements
3. Draft price offer (AI can help generate based on service catalog)
4. Send offer → Track status (Sent → Viewed → Negotiating)
5. Offer accepted → Auto-generate contract draft
6. Contract signed → Auto-create project, auto-create first milestone invoice
7. Kickoff meeting → Auto-populate project lifecycle stages
```

#### Scenario B: Active Project Management (THE CORE WORKFLOW)

```
1. Open cockpit → System recommends: "Project Alpha needs attention"
2. Enter Focus → See timeline: currently in Building phase, auth module
3. See last session: "Completed signup flow, left off at login endpoint"
4. See next tasks: 1) Login API endpoint, 2) Auth middleware, 3) Login form
5. No tasks defined? → Ask AI to break down the current phase
6. Work → Complete tasks → Progress updates automatically
7. Client messages on WhatsApp → Capture it → Deal with it later
8. Done for now → Leave session note → Back to cockpit
9. Enter Focus on Project Beta → Full context loads → No mental overhead
```

#### Scenario C: Handling Interruptions

```
1. Deep in focus on Project Alpha
2. Brother calls: "Need help setting up printer"
3. Hit capture button → Type: "Help brother with printer"
4. Instantly back in focus on Project Alpha
5. During evening plan → See capture → Schedule for Saturday or delegate
```

#### Scenario D: Financial Management

```
1. Cockpit shows financial snapshot: revenue this month, outstanding invoices
2. Click overdue amount → See all overdue invoices across projects
3. Invoices auto-generated at project milestones
4. OpenClaw sends payment reminders via Telegram
```

#### Scenario E: Delegation to OpenClaw

```
1. In Focus mode → Task: "Set up GitHub repo for auth module"
2. Mark as delegate → Add notes: "Next.js + Supabase + Vercel"
3. OpenClaw picks it up, executes, reports back
4. Next time you enter Focus: "Agent completed: repo setup. URL: ..."
```

---

## 3. Information Architecture

### 3.1 Core Mental Model

The user thinks in **projects**, not in features:

```
"Where am I across ALL my projects?"
  → COCKPIT: bird's-eye view of every project

"I'm working on Project Alpha right now."
  → FOCUS: everything about this project in one place

"What am I doing tomorrow?"
  → PLAN: evening ritual across all projects

"Something just came up."
  → CAPTURE: instant, zero-friction, back to work
```

All other data (clients, finances, communications, deployments) exists as **context within projects**, not as separate destinations.

### 3.2 Entity Relationship Map

```
                         ┌─────────────┐
                         │   CLIENTS   │
                         └──────┬──────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                  │
       ┌──────▼──────┐  ┌──────▼──────┐   ┌──────▼──────┐
       │ OPPORTUNITY │  │   COMMS     │   │  MEETINGS   │
       └──────┬──────┘  └─────────────┘   └─────────────┘
              │
       ┌──────▼──────┐
       │ PRICE OFFER │
       └──────┬──────┘
              │ (accepted)
       ┌──────▼──────┐
       │  CONTRACT   │──── Amendments
       └──────┬──────┘
              │ (activated)
       ┌──────▼──────┐
       │   PROJECT   │──── Assets · Lifecycle · Deployments
       └──────┬──────┘     Focus Sessions
              │
       ┌──────▼──────┐
       │    TASKS    │──── Can also be personal/standalone
       └──────┬──────┘
              │
       ┌──────▼──────┐
       │  INVOICES   │──── Payments
       └─────────────┘

Cross-cutting:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    GOALS     │  │ HEALTH SCORES│  │  AUDIT LOG   │  │QUICK CAPTURES│
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### 3.3 Data Dimensions

| Dimension | Contains | Health Score Inputs |
|-----------|----------|-------------------|
| **Business** | Clients, Pipeline, Projects, Deployments | Client satisfaction, pipeline value, project completion rate, deployment health |
| **Financial** | Invoices, Payments, Revenue, Expenses | Cash flow, outstanding amounts, overdue ratio, revenue trend |
| **Operations** | Tasks, Meetings, Communications, Focus Sessions | Task completion rate, delegation ratio, response time |
| **Personal** | Goals, Habits, Learning, Relationships | Goal progress, streak counts, learning hours |

---

## 4. Interaction Model: Cockpit / Focus / Plan

### 4.1 The Three Modes

The entire application operates in three modes. There is no traditional sidebar navigation with feature lists. The user moves between these three modes:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│   ┌──────────┐     ┌──────────┐     ┌──────────┐       │
│   │ COCKPIT  │────►│  FOCUS   │     │   PLAN   │       │
│   │ (home)   │◄────│ (project)│     │ (evening)│       │
│   └──────────┘     └──────────┘     └──────────┘       │
│        │                                   ▲             │
│        └───────────────────────────────────┘             │
│                                                          │
│   ┌──────────────────────────────────────────┐          │
│   │           CAPTURE (always available)      │          │
│   └──────────────────────────────────────────┘          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### COCKPIT — "Where do I stand?"
- Home screen. Shows all active projects as cards.
- Each card: project timeline with phase marker, next action, deadline, last session, task counts.
- System recommendation at top: which project to focus on and why.
- Below projects: personal tasks queue, financial snapshot, upcoming deadlines.
- Cross-cutting links: click financial snapshot → see all invoices. Click a client name → see client details.

#### FOCUS — "I'm working on this."
- Entered from a project card in cockpit.
- Full screen dedicated to ONE project. Everything else disappears.
- Shows: timeline with "you are here," last session context, prioritized tasks, AI task suggestions, client/financial/deployment context panel.
- When you complete tasks, progress updates in real-time.
- "Ask AI to break down this phase" button for when tasks aren't clear.
- Session tracking: when you exit, optionally leave a note.

#### PLAN — "What's tomorrow?"
- Evening ritual. Accessible anytime but nudged after 6 PM.
- Shows: today's review across all projects, AI recommendation for tomorrow, task commitment, capture triage, delegation.
- Operates at the COCKPIT level (all projects) not focused on one.

#### CAPTURE — "Don't forget this."
- Not a mode — a global overlay.
- Available everywhere: floating button + keyboard shortcut + Telegram.
- Type anything → it's captured → you're back where you were.
- Captures get triaged during evening plan or in the inbox.

### 4.2 Navigation Elements

No sidebar. Instead:

```
┌──────────────────────────────────────────────────────────┐
│ Context Bar (always visible at top)                       │
│                                                           │
│ COCKPIT MODE:                                             │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ LifeOS              [🌙 Plan]    📥 3    [+ Capture]│  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ FOCUS MODE:                                               │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ← Cockpit    PROJECT ALPHA · ACME Corp    📥  [+]  │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
│ PLAN MODE:                                                │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ ← Cockpit    🌙 Evening Plan    📥    [+]          │  │
│ └─────────────────────────────────────────────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

- **Logo/Home**: Always takes you back to cockpit
- **Context title**: Shows where you are (cockpit / project name / plan)
- **Plan button**: Quick access to evening plan (shows moon icon after 6 PM)
- **Inbox badge**: Count of unprocessed captures + unplanned tasks
- **Capture button**: Opens capture overlay

### 4.3 Cross-Cutting Views

Sometimes the user needs a view across ALL projects (e.g., "show me all overdue invoices" or "show me all clients"). These are accessed via:

1. **Links from cockpit**: Click "$4,800 outstanding" → opens finance overview
2. **Command palette**: `Cmd+K` → search "invoices" or "clients" → navigate
3. **NOT in primary navigation** — these are secondary views

Cross-cutting views available:
- Finance overview (all invoices, payments, revenue across projects)
- All clients (list with health scores)
- Pipeline (all opportunities across clients)
- Deployments (all environments across projects)
- Communications log (all comms across clients)
- Audit log (system events)

---

## 5. Module Architecture

### 5.1 Layer Diagram

```
┌─────────────────────────────────────────────────────┐
│              INTERACTION LAYER                        │
│  Cockpit → Focus → Plan → Capture                    │
│  (3 modes + 1 overlay = entire UI)                   │
└──────────────────────┬──────────────────────────────┘
                       │ surfaces data from
┌──────────────────────▼──────────────────────────────┐
│                  INTELLIGENCE LAYER                   │
│  AI Recommendations │ Task Breakdown │ Health Scores │
│  Session Tracking   │ Insights       │ Trends        │
└──────────────────────┬──────────────────────────────┘
                       │ computed from
┌──────────────────────▼──────────────────────────────┐
│                 OPERATIONS LAYER                      │
│                                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │ Clients │ │Projects │ │ Finance │ │  Tasks   │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │
│  │Pipeline │ │ Deploy  │ │  Comms  │ │ Meetings │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ orchestrated by
┌──────────────────────▼──────────────────────────────┐
│                   AGENT LAYER                        │
│  OpenClaw │ Automator │ Notifications │ Delegation   │
└──────────────────────┬──────────────────────────────┘
                       │ built on
┌──────────────────────▼──────────────────────────────┐
│                    DATA LAYER                        │
│  Supabase (PostgreSQL) │ RLS │ Real-time │ Storage   │
└─────────────────────────────────────────────────────┘
```

### 5.2 Intelligence Layer (NEW)

| Module | Purpose | Key Question It Answers |
|--------|---------|------------------------|
| **AI Recommendation Engine** | Suggest which project to focus on, based on deadlines, blocked tasks, client activity | "What should I work on right now?" |
| **Task Breakdown Engine** | Analyze a project phase and suggest actionable tasks | "What are the specific things I need to do in this phase?" |
| **Session Tracker** | Record what was done in each focus session, enable instant context restoration | "Where was I when I left off?" |
| **Health Score Engine** | Compute composite scores per dimension from real data | "How healthy is my business/finances/life?" |

### 5.3 Interaction Layer

| Mode | Purpose | Key Question It Answers |
|------|---------|------------------------|
| **Cockpit** | Bird's-eye view of all projects, recommendations, financial snapshot | "Where do I stand across everything?" |
| **Focus** | Deep work on one project with full loaded context | "What exactly do I need to do right now on THIS project?" |
| **Plan** | Evening ritual — review, commit, delegate across all projects | "What am I doing tomorrow?" |
| **Capture** | Instant, zero-friction entry from anywhere | "Don't forget this" |

---

## 6. AI/Agent Architecture (OpenClaw)

### 6.1 Agent Role Definition

OpenClaw operates as a **Chief of Staff** with four capabilities:

#### Capability 1 — Recommender
- Analyzes all projects and recommends which to focus on
- Ranking factors: deadline proximity, blocked tasks, client urgency, time since last session
- Recommendation appears on cockpit: "Focus on Alpha — deadline in 5 days, 3 tasks ready"
- User can always override

#### Capability 2 — Task Architect
- When user enters a project phase without clear tasks, AI breaks it down
- Example: "Building phase: Auth Module" → suggests: Login endpoint, Auth middleware, Login form, Tests
- Based on project scope, technology stack, and industry patterns
- User confirms, modifies, or rejects suggestions

#### Capability 3 — Executor
- Receives delegated tasks from the delegation queue
- Executes: creates repos, drafts documents, sets up projects, generates code
- Reports back with results and any issues encountered
- All actions logged in audit trail

#### Capability 4 — Guardian
- Monitors system health continuously
- Enforces business rules (overdue invoice alerts, contract expiry warnings)
- Proactive notifications when attention is needed
- Morning and evening briefings via Telegram

### 6.2 Communication Architecture

```
┌──────────┐     ┌──────────────┐     ┌───────────┐
│  LifeOS  │◄───►│   Supabase   │◄───►│  OpenClaw  │
│  (Web)   │     │  (Database)  │     │  (Agent)  │
└──────────┘     └──────────────┘     └─────┬─────┘
                                            │
                                     ┌──────▼──────┐
                                     │  Telegram   │
                                     │  (User I/O) │
                                     └─────────────┘
```

### 6.3 Delegation Protocol

```
1. User marks task as "Delegate" in Focus mode or Plan
2. Task enters Delegation Queue with status: QUEUED
3. OpenClaw picks up task, status: IN_PROGRESS
4. OpenClaw executes, reports result
5. Status: COMPLETED (with result) or NEEDS_INPUT (needs human decision)
6. User sees results in Focus mode context panel or cockpit
7. Audit log records everything
```

### 6.4 Briefing System

**Morning Briefing (via Telegram):**
```
Good morning, Rabwa. Here's your day:

🎯 Recommended focus: Project Alpha (deadline in 5 days)
📋 3 committed tasks today
⚠️ 1 overdue invoice (Client X, $2,400)
🤖 I completed: GitHub repo setup for Project W
🚀 All deployments healthy

Ready? [Open LifeOS]
```

**Evening Briefing (via Telegram):**
```
Evening review time, Rabwa.

✅ 5/7 tasks completed across 2 projects
📝 2 tasks carried forward
📊 Pipeline value: $45,000

Ready to plan tomorrow? [Open LifeOS]
```

---

## 7. Data Model

### 7.1 Schema Evolution

The current Supabase schema is a strong foundation. Key changes needed:

#### New Tables Required

| Table | Purpose | Why It's Needed |
|-------|---------|-----------------|
| `focus_sessions` | Track when user enters/exits focus on a project | Context restoration ("where was I?") |
| `daily_plans` | Store the nightly commitment — tomorrow's plan | The ritual needs a persistent record |
| `quick_captures` | Raw inbox entries before categorization | Frictionless capture needs a landing zone |
| `goals` | Quarterly/yearly goals with measurable targets | Reflection layer needs goal data |
| `goal_progress` | Point-in-time snapshots of goal metrics | Trend tracking for motivation |
| `health_snapshots` | Daily health scores per dimension | Dashboard and briefing data |
| `delegations` | Task delegation queue with agent status | Track what OpenClaw is working on |
| `briefings` | Generated briefing content with timestamps | History of AI communications |

#### Modifications to Existing Tables

| Table | Change | Reason |
|-------|--------|--------|
| `tasks` | Add `committed_date`, `migrated_from`, `delegated_to`, `delegation_status`, `delegation_notes`, `completed_at` | Ritual and delegation tracking |
| `projects` | Add `recommended_priority` computed field | AI recommendation ranking |
| `clients` | Expand `health_score` calculation logic | More dimensions |
| `invoices` | Add `auto_generated` flag | Track which were automation-created |

### 7.2 Health Score Computation

```
Financial Health = weighted average of:
  - Cash flow trend (30%)
  - Outstanding invoice ratio (25%)
  - Revenue vs goal (25%)
  - Overdue invoice count (20%)

Business Health = weighted average of:
  - Pipeline value vs target (25%)
  - Active project health (25%)
  - Client satisfaction scores (25%)
  - Deployment stability (25%)

Operations Health = weighted average of:
  - Task completion rate (30%)
  - Delegation success rate (20%)
  - On-time delivery rate (30%)
  - Response time to clients (20%)

Personal Health = weighted average of:
  - Goal progress (40%)
  - Learning hours (20%)
  - Habit streaks (20%)
  - Work-life balance score (20%)
```

### 7.3 AI Recommendation Scoring (Phase 1: Simple)

```
Project Priority Score = weighted sum of:
  - Days until deadline (40%) — closer = higher score
  - Overdue tasks count (20%) — more overdue = higher score
  - Days since last focus session (20%) — longer gap = higher score
  - Unread client communications (10%) — more unread = higher score
  - Blocked tasks count (10%) — more blocked = higher score

Recommendation = project with highest priority score
Reason = the dominant factor (e.g., "deadline in 5 days")
```

---

## 8. Implementation Phases

### Phase 1 — Cockpit + Focus + Plan (Weeks 1-4)
**Goal:** The cockpit/focus/plan cycle works. User can see all projects, enter focus with full context, plan tomorrow, and capture interruptions.

- [ ] Cockpit view with project cards (timeline, phase, next action, deadline)
- [ ] Focus mode with context loading (timeline, last session, tasks, client/finance panel)
- [ ] Focus session tracking (start/end times, session notes)
- [ ] Evening Plan (review today, AI recommendation, commit tasks, triage captures)
- [ ] Quick Capture (global FAB + keyboard shortcut + inbox)
- [ ] Simple AI recommendation (deadline-based project prioritization)
- [ ] Task commitment to dates
- [ ] Task migration (carry forward unfinished)
- [ ] Contextual top bar (replaces sidebar entirely)
- [ ] Inbox refactor (captures + unplanned tasks)

### Phase 2 — Business Engine Polish (Weeks 5-8)
**Goal:** Client lifecycle and financial tracking work seamlessly within the focus/cockpit model.

- [ ] Client context panel in Focus mode (full client info, comms, sentiment)
- [ ] Pipeline management (opportunities → offers → contracts → projects)
- [ ] Finance panel in Focus mode (project invoices, payment status)
- [ ] Cross-cutting views (all invoices, all clients, pipeline)
- [ ] Automator enhancements (auto-invoice at milestones)
- [ ] Command palette for quick navigation

### Phase 3 — Reflection Engine (Weeks 9-11)
**Goal:** Health scores and goals create the motivation loop.

- [ ] Automated health score computation
- [ ] Goal setting and tracking
- [ ] Weekly reflection view
- [ ] Monthly review view
- [ ] Trend visualizations
- [ ] "Behind/ahead" indicators in cockpit

### Phase 4 — AI Partner (Weeks 12-15)
**Goal:** OpenClaw becomes the chief of staff.

- [ ] AI task breakdown engine
- [ ] Delegation queue with execution tracking
- [ ] Morning/evening briefings via Telegram
- [ ] Smart notifications
- [ ] Proactive insights generation
- [ ] AI-generated session summaries

### Phase 5 — Personal Life Modules (Weeks 16+)
**Goal:** Expand beyond business to full life OS.

- [ ] Personal goals & habits
- [ ] Learning tracker (courses, books, audiobooks)
- [ ] Entertainment lists (movies, books, etc.)
- [ ] Relationship management
- [ ] Calendar integration

---

## 9. Technical Architecture

### 9.1 Stack (Confirmed)

| Layer | Technology | Status |
|-------|-----------|--------|
| Frontend | Next.js 16+ (App Router) | ✅ Deployed |
| Styling | Tailwind CSS + Shadcn UI | ✅ In place |
| Database | Supabase (PostgreSQL) | ✅ Connected |
| Auth | Supabase Auth | ✅ Working |
| Hosting | Vercel | ✅ Deployed |
| AI Agent | OpenClaw | ✅ Running |
| Agent Comm | Telegram Bot | ✅ Connected |
| Agent Host | Hostinger | ✅ Deployed |

### 9.2 Architecture Decisions

**No Sidebar** — The app uses a contextual top bar that changes based on mode (cockpit/focus/plan). No permanent sidebar navigation.

**Server Actions over API Routes** — Use Next.js server actions for all CRUD operations from the web app. Reserve API routes for agent communication only.

**Real-time via Supabase** — Use Supabase Realtime subscriptions for live updates (task completions, deployment status changes, payment notifications).

**Edge Middleware** — Auth checking and session refresh at the edge.

**Health Scores: Computed on Read** — Calculate health scores when the dashboard loads rather than storing them. Cache with short TTL if performance becomes an issue.

**Session Tracking: Automatic** — Focus sessions start when entering focus mode and end when leaving. No manual tracking required.

---

## Appendix A: Glossary

| Term | Definition |
|------|-----------|
| **Cockpit** | Home screen showing all projects at a glance with AI recommendations |
| **Focus Mode** | Full-screen, single-project workspace with loaded context |
| **Plan Mode** | Evening ritual for reviewing today and committing to tomorrow |
| **Capture** | Instant, zero-friction entry of any thought, task, or interruption |
| **Context Panel** | Side panel in Focus mode showing client, financial, and deployment info for the current project |
| **Session** | A recorded period of focused work on a project, with notes and completed tasks |
| **Migration** | Moving unfinished tasks to a future date (from bullet journal methodology) |
| **Health Score** | A 0-100 composite metric representing the state of a life dimension |
| **Delegation** | Assigning a task to OpenClaw for autonomous execution |
| **Briefing** | AI-generated summary of current state, delivered at scheduled times |
| **Recommendation** | AI-generated suggestion of which project to focus on and why |
| **Task Breakdown** | AI-generated list of actionable tasks for a project phase |

---

*This document is the source of truth for LifeOS architecture. All implementation decisions should reference this blueprint. Update this document before changing direction.*
