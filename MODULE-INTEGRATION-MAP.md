# LifeOS — Module Integration Map

> **Purpose:** Shows exactly how Phase 2-5 features fit into the Cockpit/Focus/Plan model
> **Date:** February 12, 2026
> **Context:** Answers the question: "The design feels empty now. How will the rest fit?"

---

## The Core Insight

Cockpit/Focus/Plan is not a navigation structure — it's a **paradigm**. New modules don't add new pages or navigation items. They surface as:

- New **widgets/sections** on an existing screen
- New **tabs** in an existing panel
- New **ritual steps** in the Plan flow
- New **cross-cutting views** accessible via Command Palette (`Cmd+K`)

Think of it like a phone OS. The home screen (cockpit) gets new app icons. The full-screen app (focus) gets new features inside it. The settings (plan) gets new sections. But the fundamental interaction model — home, app, settings — never changes.

---

## How Each Screen Grows

### COCKPIT (Home) — What Gets Added Over Time

```
PHASE 1 (NOW)                    PHASE 2-5 (LATER)
┌───────────────────────┐        ┌───────────────────────────────────┐
│ AI Recommendation     │        │ AI Recommendation (smarter)       │
│                       │        │ + Morning briefing summary        │
├───────────────────────┤        ├───────────────────────────────────┤
│ Active Projects (cards)│        │ Active Projects (richer cards)    │
│  - timeline           │        │  - timeline                       │
│  - phase              │        │  - phase                          │
│  - deadline           │        │  - deadline                       │
│  - last session       │        │  - last session                   │
│                       │        │  + client name & sentiment        │
│                       │        │  + invoice status (paid/overdue)  │
│                       │        │  + deployment health dot          │
│                       │        │  + behind/ahead indicator         │
├───────────────────────┤        ├───────────────────────────────────┤
│ Financial Snapshot    │        │ Financial Snapshot (clickable)     │
│  $0 outstanding      │        │  → opens Finance cross-cut view   │
│                       │        │  + revenue trend sparkline        │
│                       │        │  + cash flow indicator            │
├───────────────────────┤        ├───────────────────────────────────┤
│ Personal Tasks        │        │ Personal Tasks                    │
│                       │        │  + habit streaks                  │
│                       │        │  + today's learning progress      │
│                       │        │  + goal progress bars             │
├───────────────────────┤        ├───────────────────────────────────┤
│                       │        │ + Health Scores (Phase 3)         │
│                       │        │   Business: 72  Financial: 85     │
│                       │        │   Operations: 68  Personal: 45    │
│                       │        │                                   │
│                       │        │ + Pipeline Summary (Phase 2)      │
│                       │        │   3 opportunities worth $45k      │
│                       │        │                                   │
│                       │        │ + Upcoming (Phase 5)              │
│                       │        │   Calendar events for today       │
└───────────────────────┘        └───────────────────────────────────┘
```

**Key:** The cockpit doesn't get more pages — it gets **denser cards** and **more widgets below projects**. The layout stays the same. Progressive disclosure means these widgets appear only when there's data to show.

---

### FOCUS MODE — What Gets Added Over Time

```
PHASE 1 (NOW)                          PHASE 2-5 (LATER)
┌─────────────────────────────────┐    ┌──────────────────────────────────────┐
│ Session Banner                  │    │ Session Banner                       │
│  started 2h ago | last notes   │    │  + AI-generated session summary      │
├─────────────────────────────────┤    ├──────────────────────────────────────┤
│ Project Timeline                │    │ Project Timeline                     │
│  [phases] ← YOU ARE HERE        │    │  (same, more accurate with data)     │
├─────────┬───────────────────────┤    ├──────────┬───────────────────────────┤
│ TASKS   │ CONTEXT PANEL         │    │ TASKS    │ CONTEXT PANEL (tabbed)    │
│         │                       │    │          │                           │
│ □ task  │ Client: ACME          │    │ □ task   │ [Overview] [Client]       │
│ □ task  │ Finance: $8k/$15k     │    │ + delegate│ [Finance] [Deploy] [Comms]│
│ □ task  │ Deploy: staging url   │    │ + AI     │                           │
│         │                       │    │ □ task   │ Client tab:               │
│ [+Add]  │                       │    │          │  - Contact info           │
│ [?AI]   │                       │    │ [+Add]   │  - Sentiment score        │
│         │                       │    │ [?AI]    │  - Recent comms           │
│         │                       │    │ [Delegate]│  - Meeting notes          │
│         │                       │    │          │                           │
│         │                       │    │          │ Finance tab:              │
│         │                       │    │          │  - All invoices           │
│         │                       │    │          │  - Payment timeline       │
│         │                       │    │          │  - Revenue vs contract    │
│         │                       │    │          │                           │
│         │                       │    │          │ Deploy tab:               │
│         │                       │    │          │  - Environments           │
│         │                       │    │          │  - Last deploy status     │
│         │                       │    │          │  - Health metrics         │
│         │                       │    │          │                           │
│         │                       │    │          │ Comms tab:                │
│         │                       │    │          │  - All messages           │
│         │                       │    │          │  - Unread count           │
└─────────┴───────────────────────┘    └──────────┴───────────────────────────┘
```

**Key:** Focus mode doesn't change structurally. The context panel just gets **tabs** instead of showing everything flat. The task list gets a **delegate button** and **smarter AI suggestions**. The layout is identical.

**Automator (Phase 2):** Runs in the background — no new UI. Auto-generates invoices at milestones, triggers contract creation on offer acceptance. Results surface as notifications in the inbox badge and as new entries in the Finance tab.

---

### PLAN MODE — What Gets Added Over Time

```
PHASE 1 (NOW)                          PHASE 2-5 (LATER)
┌─────────────────────────────────┐    ┌──────────────────────────────────────┐
│ Today's Review                  │    │ Today's Review                       │
│  5 tasks done, 2 in progress   │    │  + focus time chart                  │
│                                 │    │  + which projects consumed most time │
├─────────────────────────────────┤    ├──────────────────────────────────────┤
│ AI Recommendation               │    │ AI Recommendation (smarter)          │
│  Morning: Alpha, Afternoon: Beta│    │  + considers client meetings         │
│  [Accept] [Edit]                │    │  + considers invoice deadlines       │
│                                 │    │  + considers calendar events         │
├─────────────────────────────────┤    ├──────────────────────────────────────┤
│ Task Commitment                 │    │ Task Commitment                      │
│  Project Alpha: 2 tasks         │    │  + delegation queue review           │
│  Project Beta: 1 task           │    │  + "Agent completed: X" results      │
├─────────────────────────────────┤    ├──────────────────────────────────────┤
│ Capture Triage                  │    │ Capture Triage                       │
│  3 items to process             │    │  + AI suggests categorization        │
│                                 │    │  + Telegram captures included        │
├─────────────────────────────────┤    ├──────────────────────────────────────┤
│                                 │    │ + Weekly Review (Phase 3)            │
│                                 │    │   Shown on Sundays                   │
│                                 │    │   - Completion rates                 │
│                                 │    │   - Migration patterns               │
│                                 │    │   - Pipeline check                   │
│                                 │    │   - Goal progress                    │
│                                 │    │                                      │
│                                 │    │ + Habits Check-in (Phase 5)          │
│                                 │    │   Did you: exercise? read? learn?    │
│                                 │    │                                      │
│                                 │    │ + Reflection Prompt (Phase 3)        │
│                                 │    │   "What went well today?"            │
│                                 │    │   "What would you do differently?"   │
├─────────────────────────────────┤    ├──────────────────────────────────────┤
│ [Complete Plan]                 │    │ [Complete Plan]                      │
└─────────────────────────────────┘    └──────────────────────────────────────┘
```

**Key:** Plan mode grows vertically — more sections in the ritual. But the ritual stays one scrollable page. Weekly and monthly views are variants of the same route (`/plan?view=weekly`), not new pages.

---

### CROSS-CUTTING VIEWS — Accessed via Command Palette

These are full-page views that cut across all projects. They are NOT in the top bar. They're accessed via `Cmd+K` search or by clicking summary numbers on the cockpit.

```
Phase 2:
  Cmd+K → "clients"     → /views/clients      (all clients, health scores)
  Cmd+K → "invoices"    → /views/finance       (all invoices, payments)
  Cmd+K → "pipeline"    → /views/pipeline      (opportunities across clients)
  Cmd+K → "deployments" → /views/deployments   (all environments)
  Cmd+K → "comms"       → /views/comms         (all communications)

  Also accessible by clicking:
    Cockpit "$4,800 outstanding" → /views/finance
    Cockpit "3 clients" → /views/clients

Phase 3:
  Cmd+K → "goals"       → /views/goals         (all goals with progress)
  Cmd+K → "health"      → /views/health        (detailed health breakdown)
  Cmd+K → "trends"      → /views/trends        (historical charts)

Phase 4:
  Smart notifications → Inbox badge + Telegram push (no new page)
  Proactive insights  → Cockpit: insight cards below health scores
                         "You've been ignoring Project Beta for 5 days"
                         "Client X hasn't been invoiced in 45 days"

Phase 5:
  Cmd+K → "learning"    → /views/learning      (courses, books, progress)
  Cmd+K → "movies"      → /views/entertainment (lists, ratings)
  Cmd+K → "calendar"    → /views/calendar       (integrated calendar)
  Cmd+K → "people"      → /views/relationships  (contacts, interactions, reminders)

  Relationships also surface in:
    Focus mode → Client tab already shows contact info
    Plan mode  → "You haven't talked to X in 30 days" prompts
    Cockpit    → Relationship health in Personal section
```

**Key:** Cross-cutting views live at `/views/*`. They have the cockpit variant of the top bar with a back button. They feel like "zooming in" on a cockpit widget, not like navigating to a separate app.

---

## The Growth Pattern — Visual Summary

```
            PHASE 1          PHASE 2          PHASE 3          PHASE 4          PHASE 5
            ─────────        ─────────        ─────────        ─────────        ─────────
COCKPIT     Projects         + Client info    + Health scores  + Briefing       + Calendar
            Financial $      + Pipeline       + Goal progress  + Agent status   + Habits
            Personal tasks   + Cmd+K          + Behind/ahead   + Smart notif    + Learning

FOCUS       Timeline         + Client tab     + Goal context   + AI breakdown   + Personal
            Tasks            + Finance tab    + Reflection     + Delegation     + project
            Basic context    + Deploy tab     + Trends         + Auto-summary   + types
                             + Comms tab      + Automator runs   + Insights

PLAN        Today review     + Invoice check  + Weekly review  + Agent results  + Habits
            AI recommend     + Client check   + Monthly review + Smart suggest  + Learning
            Commit tasks     + Pipeline check + Reflection     + Briefing edit  + goals
            Capture triage

CAPTURE     Text input       (unchanged)      (unchanged)     + AI categorize   (unchanged)
                                                              + Voice input
                                                              + Smart notif

CMD+K       (not built)      clients, finance goals, health   (smarter search) learning,
                             pipeline, comms  trends           insights        entertainment
                                                                              relationships
```

---

## Why It Won't Feel Empty Later

Right now the cockpit has:
- 0 projects → empty cards section
- $0 financial → empty snapshot
- 0 personal tasks → empty queue
- No recommendation → generic banner

When you add your 2 ERP projects, it becomes:
- 2 project cards with timelines, phases, deadlines
- Real financial numbers from invoices
- Real tasks in the personal queue
- A recommendation: "Focus on Project Alpha — deadline in 5 days"

And as you build Phase 2-5, the cockpit doesn't restructure — it **fills in**. New widgets appear below. Project cards get richer metadata. The context panel in Focus gets tabs. The Plan ritual gets more steps.

The empty feeling is the feeling of a system designed for growth, not one designed to impress on day one.

---

## The Rule

> **If a new feature needs a new top-level navigation item, the architecture is wrong.**

Everything in LifeOS surfaces through one of these four entry points:
1. A widget or card on the **Cockpit**
2. A tab or panel in **Focus** mode
3. A section in the **Plan** ritual
4. A result in the **Command Palette**

No exceptions. No sidebar creep. No "Settings" page with 20 tabs. The three modes + one overlay is the permanent interaction model.

---

*This map should be re-validated before each phase begins. Update if the architecture evolves.*
