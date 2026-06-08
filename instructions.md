# instructions.md

# QA Issue Dashboard — Project Plan

## Project Overview

Build a lightweight internal dashboard application using:

- Next.js
- TypeScript
- Tailwind CSS
- Vercel hosting
- Google Sheets as the data source

The application will function as a real-time Issue Management Dashboard for clients and internal QA/dev teams.

Goal:
- Replace manual spreadsheet analysis
- Provide live metrics
- Provide filters and searchable issue views
- Reduce reporting overhead
- Give client a clean visual dashboard

---

# 1. High-Level Architecture

```text
Google Sheet
    ↓
Google Sheets API
    ↓
Next.js API Route / Server Action
    ↓
Dashboard UI
```

---

# 2. Core Features

## A. Dashboard Metrics

These should appear at the top as metric cards.

### Metrics Required

#### 1. Today's Found Issues

Definition:
Issues created today.

Logic:
- Compare `Assigned Date` with current date.

---

#### 2. Today's Resolved Issues

Definition:
Issues resolved today.

Logic:
- Compare `Resolution Date` with current date.
- Status should be:
  - RESOLVED
  - FIXED

---

#### 3. Issues Per Assignee

Display:
- Team member name
- Total assigned issues
- Status distribution

Example:

```text
John Doe
- Total: 14
- In QA: 4
- Fixed: 6
- Todo: 4
```

---

#### 4. Issues Per Status

Statuses:

- TODO
- IN PROGRESS
- FIXED
- IN QA
- RESOLVED
- NOT RESOLVED

Display:
- Count
- Percentage

---

# 3. Additional Recommended Metrics

These will make the dashboard much more professional.

## A. Total Open Issues

Statuses:
- TODO
- IN PROGRESS
- IN QA
- NOT RESOLVED

---

## B. Total Closed Issues

Statuses:
- FIXED
- RESOLVED

---

## C. QA Bottleneck Count

Issues stuck in:
- IN QA

Useful for identifying blocked verification.

---

## D. Developer Workload Distribution

Bar chart:
- X axis → Assignee
- Y axis → Total assigned issues

---

## E. Module-wise Issue Distribution

Pie chart or horizontal bars.

Shows:
- Which module is most problematic.

---

## F. Resolution Velocity

Issues resolved per day/week.

Useful for client visibility.

---

# 4. Table Requirements

Main issue table with:

## Columns

```text
Module
Feature
Issue Title
Issue Description
Steps to reproduce
Resources
Issue Status
Dev Comments
Estimation
Assigned Date
Assignee
Resolution Date
QA Comments
```

---

# 5. Filters

Add dropdown filters above the table.

## Required Filters

### A. Module Filter
Dropdown

---

### B. Status Filter
Multi-select preferred.

---

### C. Assignee Filter

---

### D. Date Range Filter

Filter by:
- Assigned Date
- Resolution Date

---

### E. Search Input

Search across:
- Issue title
- Description
- Assignee
- Module

---

# 6. Recommended UI Layout

## Top Navbar

Contains:
- App logo/title
- Last synced time
- Refresh button

---

## Section 1 — KPI Cards

Grid of cards:

```text
[Today's Found]
[Today's Resolved]
[Open Issues]
[Closed Issues]
```

---

## Section 2 — Charts

### Left:
Issues by Status

### Right:
Issues by Assignee

---

## Section 3 — Filters

Sticky filter bar.

---

## Section 4 — Issues Table

Scrollable
Paginated
Sortable

---

# 7. Recommended Tech Stack

## Framework

### Frontend
- Next.js App Router

Reason:
- Easy deployment
- API routes included
- Server-side support
- Excellent with Vercel

---

## Styling

### Use:
- Tailwind CSS

Optional:
- shadcn/ui

Reason:
- Extremely fast dashboard development
- Professional UI

---

## Charts

Recommended:
- Recharts

Needed for:
- Pie chart
- Bar chart
- Line chart

---

## Table

Recommended:
- TanStack Table

Reason:
- Sorting
- Filtering
- Pagination
- Scalable

---

## Icons

Use:
- lucide-react

---

# 8. Google Sheets Integration

## Recommended Approach

Use:
- Google Sheets API

Do NOT scrape sheet HTML.

---

## Authentication

Use:
- Google Service Account

Steps:

1. Create Google Cloud Project
2. Enable Sheets API
3. Create Service Account
4. Generate JSON credentials
5. Share sheet with service account email

---

## Environment Variables

```env
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_SHEET_ID=
```

---

# 9. Backend Data Strategy

## Recommended Structure

Create:

```text
/app/api/issues/route.ts
```

This API:
- Fetches sheet rows
- Converts rows to JSON
- Cleans invalid data
- Returns structured issue objects

---

# 10. Data Model

Recommended interface:

```ts
interface Issue {
  module: string
  feature: string
  issueTitle: string
  issueDescription: string
  stepsToReproduce: string
  resources: string
  issueStatus:
    | "TODO"
    | "IN PROGRESS"
    | "FIXED"
    | "IN QA"
    | "RESOLVED"
    | "NOT RESOLVED"

  devComments: string
  estimation: string
  assignedDate: string
  assignee: string
  resolutionDate: string
  qaComments: string
}
```

---

# 11. Performance Considerations

Since Google Sheets is slow:

## Add Server-side Caching

Recommended:
- Cache API response for 30–60 seconds

Using:
- Next.js fetch cache
- or memory cache

---

# 12. Refresh Strategy

## Option A — Manual Refresh Button
Simplest.

---

## Option B — Auto Refresh
Every:
- 60 seconds

---

# 13. UI/UX Recommendations

## Theme

Use:
- Dark mode support

---

## Table UX

Add:
- Row hover
- Sticky headers
- Copy issue title button

---

## Status Colors

```text
TODO → Gray
IN PROGRESS → Blue
FIXED → Purple
IN QA → Orange
RESOLVED → Green
NOT RESOLVED → Red
```

---

# 14. Security

Since this is internal/client-facing:

## Recommended

### Option A
Password-protected route

Using:
- NextAuth
- Simple middleware auth

---

### Option B
Vercel protected deployment

---

# 15. Suggested Folder Structure

```text
/app
  /api
    /issues
      route.ts

/components
  DashboardCards.tsx
  IssuesChart.tsx
  AssigneeChart.tsx
  Filters.tsx
  IssuesTable.tsx
  StatusBadge.tsx

/lib
  sheets.ts
  analytics.ts
  utils.ts

/types
  issue.ts
```

---

# 16. Recommended Analytics Functions

Create utility functions:

```ts
getTodayFoundIssues()
getTodayResolvedIssues()
getIssuesByStatus()
getIssuesByAssignee()
getModuleDistribution()
getOpenIssueCount()
```

---

# 17. Scalability Considerations

Future additions:

- Multiple sheets
- Multiple projects
- Sprint tracking
- Priority support
- Severity levels
- SLA monitoring
- Export to CSV/PDF
- Slack notifications
- Email summaries

Build architecture with extensibility in mind.

---

# 18. Recommended MVP Scope

## Phase 1 (Fast Delivery)

Implement:

- Google Sheets fetch
- KPI cards
- Filters
- Table
- Status chart
- Assignee chart

This is enough for client visibility.

---

## Phase 2

Add:
- Authentication
- Export
- Auto refresh
- Better analytics
- Historical tracking

---

# 19. Deployment Plan

## Hosting

Deploy on:
- Vercel

---

## CI/CD

Connect:
- GitHub repository

Every push auto-deploys.

---

# 20. Recommended Libraries

```bash
npm install \
googleapis \
recharts \
@tanstack/react-table \
lucide-react \
date-fns \
clsx \
tailwind-merge
```

Optional:

```bash
npm install shadcn-ui
```

---

# 21. Recommended UI Style

Use a modern admin dashboard style similar to:

- Linear
- Vercel dashboard
- Jira analytics
- GitLab insights

Design principles:
- Minimal
- Spacious
- Fast readability
- Client-friendly
- Clean typography

---

# 22. Best Development Order

## Step 1
Setup Next.js project

---

## Step 2
Connect Google Sheets

---

## Step 3
Create typed issue model

---

## Step 4
Create analytics helpers

---

## Step 5
Build KPI cards

---

## Step 6
Build charts

---

## Step 7
Build filters

---

## Step 8
Build table

---

## Step 9
Add caching

---

## Step 10
Deploy to Vercel

---

# 23. Important Recommendation

DO NOT treat Google Sheets as a database long-term.

For now:
- Perfectly fine
- Fast to deliver

Future:
- Migrate to:
  - PostgreSQL
  - Supabase
  - Firebase

if:
- Row count becomes large
- Multiple users edit simultaneously
- Analytics become complex

---

# 24. Final Suggested Product Name

Optional names:

- QA Pulse
- Issue Lens
- Sprint Board
- BugScope
- QA Metrics
- TestTrack
- QA Insight

---

# 25. Final Vision

This should feel like:

```text
A lightweight Jira analytics dashboard
powered by Google Sheets
```

NOT just:

```text
a spreadsheet viewer
```

The value is:
- instant visibility
- client transparency
- reduced manual reporting
- professional delivery
- live analytics



# 26. Architecture Rules (MANDATORY)

This project MUST follow:

- Modular Architecture
- Clean Architecture
- Feature-based structure
- Strict separation of concerns
- Reusable UI patterns
- Fully scalable frontend architecture

The codebase should feel like:
- enterprise-grade
- maintainable
- scalable
- cleanly organized

NOT:
- quick spaghetti dashboard code
- huge page.tsx files
- inline logic everywhere

---

# 27. Core Architectural Principles

## Rule 1 — Pages Must Stay Thin

Pages should ONLY:
- compose components
- pass props
- call hooks/actions

Pages MUST NOT contain:
- business logic
- analytics logic
- data transformation
- chart processing
- table filtering logic

BAD:

```tsx
export default function Page() {
  const data = processAnalytics(rawData)

  return (...)
}
```

GOOD:

```tsx
export default function DashboardPage() {
  return <DashboardContainer />
}
```

---

## Rule 2 — Component Isolation

EVERY component must have:

```text
ComponentName/
 ├── ComponentName.tsx
 ├── ComponentName.mobile.tsx
 ├── ComponentName.types.ts
 ├── ComponentName.constants.ts
 ├── ComponentName.utils.ts
 ├── ComponentName.hooks.ts
 ├── index.ts
```

Even if some files start empty.

Purpose:
- future scalability
- easy maintenance
- predictable structure

---

## Rule 3 — Mobile UI Separation

Desktop and mobile UI MUST be separated.

DO NOT create giant responsive JSX blocks.

BAD:

```tsx
<div className="hidden md:block">...</div>
<div className="block md:hidden">...</div>
```

GOOD:

```tsx
return isMobile
  ? <DashboardCardMobile />
  : <DashboardCard />
```

Each mobile component gets its own file.

Example:

```text
DashboardCard/
 ├── DashboardCard.tsx
 ├── DashboardCard.mobile.tsx
```

---

## Rule 4 — Business Logic Must Be Isolated

Business logic belongs ONLY in:
- services
- hooks
- utils
- analytics layer

NEVER inside UI files.

---

## Rule 5 — Reusable Components Only

Avoid repeated JSX.

If repeated twice:
→ extract component.

Examples:
- MetricCard
- StatusBadge
- FilterDropdown
- TableToolbar
- EmptyState
- LoadingState

---

# 28. Mandatory Technology Rules

## UI Library

ONLY use:
- shadcn/ui

DO NOT use:
- raw HTML buttons
- custom modal systems
- random UI libraries

Everything must use:
- shadcn components
- shadcn patterns

---

## Allowed UI Stack

```text
shadcn/ui
Tailwind CSS
lucide-react
```

ONLY.

---

# 29. Mandatory shadcn Components

Use these wherever applicable.

## Layout

- Card
- Separator
- ScrollArea
- Sheet
- Tabs

---

## Inputs

- Input
- Select
- Multi Select
- Calendar
- Popover
- Checkbox

---

## Data Display

- Table
- Badge
- Tooltip
- Skeleton
- Avatar

---

## Feedback

- Toast
- Alert
- Dialog

---

# 30. Clean Folder Structure

```text
/src
 ├── app
 │
 ├── components
 │   ├── common
 │   ├── layouts
 │   ├── charts
 │   ├── metrics
 │   ├── filters
 │   ├── tables
 │   └── issue
 │
 ├── features
 │   └── dashboard
 │       ├── api
 │       ├── hooks
 │       ├── services
 │       ├── analytics
 │       ├── adapters
 │       ├── types
 │       ├── constants
 │       ├── schemas
 │       └── utils
 │
 ├── lib
 │
 ├── services
 │
 ├── hooks
 │
 ├── providers
 │
 ├── store
 │
 ├── types
 │
 └── config
```

---

# 31. Component Folder Standard

Example:

```text
MetricCard/
 ├── MetricCard.tsx
 ├── MetricCard.mobile.tsx
 ├── MetricCard.types.ts
 ├── MetricCard.constants.ts
 ├── MetricCard.utils.ts
 ├── MetricCard.hooks.ts
 ├── MetricCard.test.tsx
 ├── MetricCard.stories.tsx
 └── index.ts
```

---

# 32. Container vs Presentational Pattern

Use strict separation.

## Container Components

Responsible for:
- fetching data
- calling hooks
- analytics
- transformations

Example:
- DashboardContainer

---

## Presentational Components

Responsible ONLY for:
- rendering UI

Example:
- MetricCard
- IssueTable
- FilterBar

---

# 33. API Layer Rules

Google Sheets interaction MUST stay isolated.

Example:

```text
/features/dashboard/api
```

NEVER call Sheets API directly from components.

---

# 34. Service Layer Rules

Create service layer:

```text
/features/dashboard/services
```

Responsibilities:
- formatting data
- normalization
- filtering
- aggregation
- analytics calculations

---

# 35. Analytics Layer

Create dedicated analytics engine.

```text
/features/dashboard/analytics
```

Functions:

```ts
calculateIssueStatusMetrics()
calculateDeveloperMetrics()
calculateTodayResolved()
calculateOpenIssues()
calculateModuleDistribution()
```

Analytics must NEVER be inside components.

---

# 36. Hooks Architecture

Custom hooks ONLY.

Examples:

```text
useIssues()
useDashboardMetrics()
useIssueFilters()
useIsMobile()
```

Avoid logic duplication.

---

# 37. Type Safety Rules

STRICT TypeScript.

Mandatory:
- no any
- proper interfaces
- reusable types
- centralized enums

Create:

```text
/types
/features/dashboard/types
```

---

# 38. Constants Management

All constants centralized.

Example:

```ts
export const ISSUE_STATUSES = [
  "TODO",
  "IN PROGRESS",
  "FIXED",
  "IN QA",
  "RESOLVED",
  "NOT RESOLVED",
]
```

No hardcoded strings in components.

---

# 39. Validation Layer

Use:
- zod

Purpose:
- validate Google Sheets data
- avoid malformed rows
- ensure predictable frontend behavior

---

# 40. State Management

Prefer:
- local component state
- context only if needed

Avoid heavy state libraries initially.

Optional later:
- Zustand

ONLY if scaling requires it.

---

# 41. Responsive Design Strategy

Desktop-first dashboard.

Separate:
- desktop tables
- mobile cards

Mobile should NOT attempt to render giant tables.

---

# 42. Table Strategy

Desktop:
- advanced table
- sorting
- pagination
- sticky columns

Mobile:
- stacked issue cards
- accordion layout

Separate implementations.

---

# 43. Performance Rules

Mandatory:
- memoization
- lazy loading
- server-side caching
- avoid unnecessary rerenders

Use:
- React.memo
- useMemo
- useCallback

Where appropriate.

---

# 44. Loading UX

Every async section must have:
- skeleton loader
- loading state
- empty state
- error state

Using shadcn Skeleton component.

---

# 45. Error Handling

Global error boundaries.

Create:
- fallback UI
- retry button
- graceful API failure handling

---

# 46. Naming Conventions

## Components

```text
PascalCase
```

Example:
- IssueTable

---

## Hooks

```text
camelCase with use prefix
```

Example:
- useIssueFilters

---

## Constants

```text
UPPER_SNAKE_CASE
```

---

# 47. Styling Rules

ONLY:
- Tailwind
- shadcn variants
- clsx
- tailwind-merge

Avoid:
- inline styles
- giant className chains
- duplicated utility classes

---

# 48. Accessibility

Mandatory:
- keyboard navigation
- aria labels
- semantic HTML
- focus states

Use shadcn accessibility defaults.

---

# 49. Future Scalability Requirements

Architecture must support future additions:

- Multiple projects
- Multiple sheets
- Role management
- Team dashboards
- Export systems
- Notifications
- Realtime sync
- WebSockets
- Audit logs

Without major refactor.

---

# 50. Final Engineering Goal

The project should feel like:

```text
A production-grade internal analytics platform
```

NOT:

```text
A quickly hacked dashboard from spreadsheet data
```

Key priorities:
- maintainability
- modularity
- scalability
- developer experience
- clean architecture
- reusable systems
- enterprise structure

---

# 51. Multi-Sheet Integration & Metric Breakdown

To support complex business requirements and separate scopes, the Google Sheet is integrated with two sheets: **Admin** and **App**.

## Architecture & Integration Rules

1. **Sheet Scope & Ranges**:
   - `Admin!A2:M`: Issues originating from the administrative backend/panel.
   - `App!A2:M`: Issues originating from the client-facing application.

2. **Fetching Strategy**:
   - Sequential sheet fetches utilizing structured try-catch isolates. If one sheet fails or is missing, the other should still successfully load.
   - Combine results dynamically with proper `sheetSource` tagging (`"Admin"` or `"App"`).

3. **Metric Breakdown Calculations**:
   - All core KPI metric cards display the **Total** combined count.
   - Each KPI must also display individual subset counts for **App** and **Admin** issues.
   - Metric card footers display the detailed App vs. Admin breakdown side-by-side with harmonized, premium aesthetics.

4. **Visual Indicators**:
   - **App** source issues use an Indigo/Slate Badge (`bg-indigo-500/10 text-indigo-400 border-indigo-500/20`).
   - **Admin** source issues use a Teal Badge (`bg-teal-500/10 text-teal-400 border-teal-500/20`).
   - Both Desktop and Mobile layouts (issue tables, lists, and detail drawers) must display the Source sheet indicator clearly.