# SWL Issue Summary → Internal Issue Platform: Expansion Plan

---

## Overview

Transform the current hardcoded Google Sheets dashboard into a **multi-tenant, configurable internal issue tracking platform** — where teams connect their own Google Sheets, map their own columns, define their own statuses, and view dashboards per project.

Current implementation becomes **Project #1** with its config stored as default values in the database.

---

## Phase 1 — Database & Auth Foundation

> Migrate from hardcoded env-var config to a real database-backed, multi-tenant system.

### 1.1 Auth System
- **Google OAuth only** — no email/password signup
- Google OAuth token is used for **both authentication and Google Sheets API access**
- Scopes requested at login:
  - `openid`, `email`, `profile` (standard login)
  - `https://www.googleapis.com/auth/spreadsheets` (full read + write access to sheets)
- Roles per project: `OWNER`, `ADMIN`, `VIEWER`
- Public dashboard URL per project (no login required to view)
- Private settings URL (login required to edit)

### 1.2 Tech Stack
- **Database:** PostgreSQL via **Supabase**
- **ORM:** Prisma
- **Auth:** NextAuth.js with Google Provider
- **Sheet API:** Google Sheets API v4 using the logged-in user's OAuth token (no service account needed)

---

## Phase 2 — Database Schema

```sql
-- Users (employees who log in via Google)
Table: users
  id              UUID PRIMARY KEY
  email           TEXT UNIQUE NOT NULL
  name            TEXT
  google_id       TEXT UNIQUE NOT NULL   -- Google account sub ID
  avatar_url      TEXT                   -- Google profile picture
  created_at      TIMESTAMP

-- Projects (one Google Sheet = one project)
Table: projects
  id              UUID PRIMARY KEY
  name            TEXT NOT NULL
  slug            TEXT UNIQUE NOT NULL   -- used in public URL: /p/{slug}
  owner_id        UUID REFERENCES users(id)
  created_at      TIMESTAMP

-- Project Members
Table: project_members
  id              UUID PRIMARY KEY
  project_id      UUID REFERENCES projects(id)
  user_id         UUID REFERENCES users(id)
  role            ENUM('OWNER', 'ADMIN', 'VIEWER')

-- OAuth Tokens (stored per user, refreshed by NextAuth)
Table: oauth_tokens
  id              UUID PRIMARY KEY
  user_id         UUID REFERENCES users(id) UNIQUE
  access_token    TEXT NOT NULL           -- used to call Sheets API
  refresh_token   TEXT                    -- used to get new access tokens
  expires_at      TIMESTAMP

-- Sheet Config (one per project — one entry per selected sheet tab)
Table: sheet_configs
  id              UUID PRIMARY KEY
  project_id      UUID REFERENCES projects(id)
  sheet_url       TEXT NOT NULL           -- full Google Sheet URL
  sheet_id        TEXT NOT NULL           -- extracted from URL
  selected_tabs   TEXT[]                  -- e.g. ["Admin", "App"]
  header_row      INT NOT NULL DEFAULT 9  -- row number where column headers are
  data_start_row  INT NOT NULL DEFAULT 10 -- row where data begins

-- Column Mapping (per project, per sheet tab)
Table: column_mappings
  id              UUID PRIMARY KEY
  project_id      UUID REFERENCES projects(id)
  tab_name        TEXT NOT NULL           -- e.g. "Admin"
  field_key       TEXT NOT NULL           -- e.g. "issueStatus", "assignee"
  column_index    INT NOT NULL            -- 0-based column index
  -- Together: one row per (project, tab, field_key)
  UNIQUE(project_id, tab_name, field_key)

-- Status Config (per project — custom statuses)
Table: status_configs
  id              UUID PRIMARY KEY
  project_id      UUID REFERENCES projects(id)
  status_value    TEXT NOT NULL           -- raw value as it appears in sheet
  display_label   TEXT NOT NULL           -- label shown in dashboard
  color           TEXT NOT NULL           -- hex color
  category        ENUM('open', 'closed', 'fixed', 'qa', 'other')
  sort_order      INT
  -- category drives which metric cards it counts toward

-- Metric Visibility (which metric cards are enabled per project)
Table: metric_visibility
  id              UUID PRIMARY KEY
  project_id      UUID REFERENCES projects(id)
  metric_key      TEXT NOT NULL           -- e.g. "todayFound", "openIssues"
  enabled         BOOLEAN DEFAULT TRUE
  UNIQUE(project_id, metric_key)
```

---

## Phase 3 — Current Metrics & Required Columns

Every metric card has column dependencies. If a required column is not mapped in settings, that metric is **automatically disabled**.

| Metric Card | Required Columns | Optional Columns |
|---|---|---|
| **Today's Found** | `issueStatus`, `assignedDate` | — |
| **Today's Resolved** | `issueStatus`, `resolutionDate` | — |
| **Open Issues** | `issueStatus` | — |
| **In QA** | `issueStatus` | — |
| **Fixed & Deployed** | `issueStatus` | — |
| **Resolved Issues** | `issueStatus` | — |
| **Workload Estimation** | `issueStatus`, `estimation` | `spentTime` |
| **Today's Workload** | `issueStatus`, `estimation`, `assignedDate`, `assignee` | — |
| **Issues by Status (chart)** | `issueStatus` | — |
| **Open Issues by Assignee** | `issueStatus`, `assignee` | `assignedDate` |
| **Assignee Status Table** | `issueStatus`, `assignee` | — |
| **Issues by Module** | `module` | — |
| **Issues Reported By** | `reportedBy`, `issueStatus` | — |
| **Issue Table** | `issueTitle`, `issueStatus` | all other columns |
| **Kanban Board** | `issueTitle`, `issueStatus` | `assignee`, `module` |

> **Rule:** If `issueStatus` is not mapped, the entire platform is non-functional for that project. It is the only **hard required** column. `issueTitle` is required for the issue table.

---

## Phase 4 — Settings Page Structure

The settings page is only accessible to project OWNER and ADMINs.

### 4.1 Sheet Configuration
1. **Paste Google Sheet URL** → system extracts Sheet ID
2. **Fetch available tab names** → show as checkboxes (e.g. ✅ Admin, ✅ App)
3. **Set header row number** → system reads that row and shows column names
4. **Set data start row** → default is header_row + 1

### 4.2 Column Mapping
- System reads the header row from the sheet
- Shows a list of **detected column names** from that row
- For each **platform field** (issueTitle, issueStatus, assignee, etc.), user picks which detected column maps to it
- Fields with no mapping = their dependent metrics are hidden automatically

### 4.3 Status Configuration
- User sees a list of all unique values found in the `issueStatus` column (auto-detected)
- For each value, user can:
  - Set a display label
  - Pick a color
  - Assign to a category: `open`, `closed`, `fixed`, `qa`, `other`
- User can manually add statuses (for values not yet in sheet)
- Category determines which metric card counts it:
  - `open` → Open Issues card
  - `closed` → Resolved Issues card
  - `fixed` → Fixed & Deployed card
  - `qa` → In QA card

### 4.4 Metric Visibility
- List of all metric cards
- Cards that have all required columns mapped → toggleable ON/OFF
- Cards missing required columns → locked OFF with tooltip explaining which column is missing

---

## Phase 5 — Migration Path (Current → Platform)

### Step 1: Database Setup
- Add Prisma + PostgreSQL
- Run migration to create all tables above

### Step 2: Seed Default Project
- Create a "default" project from current env vars:
  - `GOOGLE_SHEET_ID` → `sheet_configs.sheet_id`
  - Current `COLUMN_MAP` values → `column_mappings` rows
  - Current `ISSUE_STATUSES` → `status_configs` rows with categories
  - All metrics enabled by default → `metric_visibility` rows

### Step 3: Replace Hardcoded Config
- `columnMapping.ts` → read from DB instead of hardcoded object
- `sheets.ts` → use `sheet_configs` from DB for URL, tabs, row numbers
- `engine.ts` → use `status_configs.category` to group statuses for metrics
- `constants/index.ts` → `ISSUE_STATUSES` becomes dynamic from DB

### Step 4: Add Auth
- Add NextAuth.js
- Protect `/settings` routes
- Public routes: `/`, `/p/{slug}`, `/p/{slug}/board`

### Step 5: Settings UI
- New page: `/settings` → Sheet Config → Column Mapping → Status Config → Metrics
- New page: `/projects` → list all projects, create new project

### Step 6: Kanban Board (with Write-Back)
- New page: `/p/{slug}/board`
- Columns = statuses from `status_configs`
- Cards = issues filtered to open statuses
- Filter by assignee
- **Drag-and-drop** to change status → uses the project owner's stored OAuth token to write back to Google Sheet via Sheets API v4 `values.update`
- Write-back updates the cell at the exact row/column of `issueStatus` for that issue

---

## Phase 6 — New Pages Summary

| Route | Access | Description |
|---|---|---|
| `/` | Public | Redirect to first project dashboard or login |
| `/p/{slug}` | Public | Project dashboard |
| `/p/{slug}/board` | Public (view) / Auth (drag) | Kanban board — read free, write requires login |
| `/p/{slug}/settings` | Auth (Admin+) | Sheet, column, status, metric config |
| `/projects` | Auth required | List & create projects |
| `/login` | Public | Google OAuth login |

---

## Current Implementation → Default Values Reference

```typescript
// These become the seed data for the default project

// sheet_configs
sheet_id: process.env.GOOGLE_SHEET_ID
selected_tabs: ["Admin", "App"]
header_row: 9
data_start_row: 10

// column_mappings (0-indexed)
module: 0 (A)
feature: 1 (B)
issueTitle: 2 (C)
issueDescription: 3 (D)
stepsToReproduce: 4 (E)
resources: 5 (F)
issueStatus: 6 (G)
reportedBy: 7 (H)
devComments: 8 (I)
estimation: 9 (J)
spentTime: 10 (K)
assignedDate: 11 (L)
assignee: 12 (M)
resolutionDate: 13 (N)
qaComments: 14 (O)

// status_configs
TODO          → category: open
IN PROGRESS   → category: open
NOT RESOLVED  → category: open
IN QA         → category: qa
FIXED         → category: fixed
RESOLVED      → category: closed
NOT NEEDED    → category: other
```

---

## Decisions Made

| Question | Decision |
|---|---|
| Database provider | **Supabase** (Postgres) + Prisma |
| Auth | **Google OAuth only** — token reused for Sheets API |
| Write-back to sheets | **Yes** — drag-and-drop on Kanban writes status back via user's OAuth token |
| Project URLs | **Pretty slugs** — `/p/my-project` |
| Public dashboard | **Anyone with the link** can view — no password needed |
