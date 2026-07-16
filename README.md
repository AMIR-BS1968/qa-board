# QA Board — Next.js & Google Sheets Bidirectional Sync

A lightweight, premium, high-performance QA issue management board that synchronizes bidirectionally with Google Sheets in real-time. Designed to act as an internal onboarding dashboard for QA engineers and a clean, public-facing read-only metrics tracker for external stakeholders.

---

## 🚀 Key Features

### 1. Bidirectional Google Sheets Sync
- **Automatic Sync:** Syncs Google Sheets rows dynamically to local caches. Issues are retrieved instantly from SQL caches on load, saving Google API quota limits.
- **Real-Time Writes:** Updating issue statuses via Kanban board drag-and-drop writes updates back to the corresponding cell in Google Sheets instantly.
- **Sync Limits:** Synchronizes automatically once per browser session, or manually on-demand via the **Sync Data** action button.

### 2. Interactive Kanban Board
- **Horizontal Scroll Navigation:** Built-in horizontal track navigations with button scroll hooks for large boards.
- **Drag-and-Drop Columns:** HTML5 drag-and-drop updates state synchronously on the client, updating the local database cache and remote Google Sheets cell in the background.
- **Configurable Visibility:** Toggle which statuses appear on the board, and set sorting priority orders.

### 3. Clickable KPI Metrics with Inline Drill-Down
- **Dynamic Calculation Engine:** Computes statistics (Today's Found, Open Issues, Awaiting Deployment, In QA, Resolved) dynamically based on custom mapping configurations.
- **Drill-down Modals:** Click metrics cards to launch a dialog displaying the list of issues contributing to the metric. Expands inline to show steps to reproduce, estimations vs actuals, and comments.

### 4. Custom KPI & Status Badges Mapping
- **KPI Mapping Tab:** Visual map settings interface to toggle which sheet statuses contribute to which dashboard KPI card metric.
- **Dynamic Badge Customization:** Customize display labels, HEX colors, and board priority rankings.

### 5. Smarter Setup Wizard & Header Detection
- **Auto-Detection:** Automatically scans the top rows of Google Sheets for cells matching `"issue title"`, pre-populating configuration inputs with the detected header index and start row offsets.
- **Dynamic Sheet Scanning:** Asynchronously queries sheet tab configurations on the client, preventing blocking server renders.

### 6. Public vs. Private Routing Controls
- **Edge Routing Protection:** Secures setup wizard, projects dashboard, and settings panels behind session authentication, while keeping public Kanban boards and metrics dashboards accessible for outside viewers.

---

## 🏛️ System Architecture

```mermaid
graph TD
  Client[Browser Clients]
  NextJS[Next.js App Server]
  DB[(PostgreSQL Database)]
  GSheets[Google Sheets API]
  
  Client -- GET /p/:slug --> NextJS
  NextJS -- Prisma Cache Lookup --> DB
  NextJS -- Realtime Sync Actions /api/sync --> GSheets
  NextJS -- Write Status Updates /api/issues --> GSheets
  Client -- Client-side Cache --> LocalStorage[(LocalStorage Cache)]
  
  subgraph Auth Protection
    Proxy[Edge Router Proxy]
    Proxy -- Blocks guest setup/settings --> NextJS
  end
```

### Core Architecture Components:
1. **Next.js 16 (App Router):** Renders views, handles edge route redirects, and processes server actions.
2. **Prisma & PostgreSQL:** Caches spreadsheet issues, maps columns, stores status configs, and records project members roles.
3. **Google Sheets Integration (`google-auth-library`):** Reads and writes spreadsheet values using service account credentials.
4. **Client-side Caching (LocalStorage):** Holds local issue queries instantly. Clears only during manual syncs, keeping page loads under **20 milliseconds**.
5. **Asynchronous API endpoints (`/api/project/tabs`, `/api/issues`):** Shifts blocking sheets operations to client-side loaders, preventing Next.js Link pre-fetching overhead.

---

## 🛠️ Local Development

### 1. Setup Environment
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
NEXTAUTH_SECRET="your-nextauth-secret"
GOOGLE_CLIENT_EMAIL="service-account@gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 2. Install & Start
```bash
# Install dependencies
npm install

# Push database schema & generate client
npx prisma db push
npx prisma generate

# Start dev server
npm run dev
```
