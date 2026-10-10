# 🚀 RankPulse — Enterprise SEO Tracker & SERP Intelligence Platform

RankPulse is a production-grade, full-featured enterprise SEO tracking and search intelligence dashboard built with **React 18 + Vite, Tailwind CSS, TanStack Table & Query, Recharts, and Zustand**.

Designed in the spirit of industry leaders like **Ahrefs and Semrush**, RankPulse provides real-time rank tracking, historical variance matrix analysis, automated site auditing with fix recommendations, on-page SERP simulation, competitor intelligence, Core Web Vitals monitoring, and 1-click executive PDF/Excel exports.

---

## 📸 Core Features & Screens

### 1. 📊 SEO Intelligence Dashboard (`/dashboard`)
- **Key Metric StatCards**: Real-time SEO Health Score, Estimated Organic Traffic, Tracked Keyword Count, and Inbound Backlinks with % change and positive/negative indicators.
- **Organic Traffic & Impressions Area Chart**: Multi-layer gradient area chart visualizing daily click trajectories and impressions.
- **Keyword Ranking Positions Line Chart**: Multi-series timeline tracking Top 3, Top 10, and Top 20 bracket movements.
- **Technical Audit Issues Donut**: Health breakdown into Critical, Warnings, and Passed checks with central score ring.
- **Top Performers & Ranking Drops**: Real-time widgets displaying winners and keywords needing attention.
- **Competitor Benchmark Card & Activity Feed**.

### 2. 🔑 Flagship Keyword Explorer & Monthly Variance Matrix (`/keywords`)
- **Interactive Daily Rank Tracker**:
  - Columns: Keyword query, current position, previous position, delta change (with colored badges), monthly search volume, keyword difficulty (Easy/Medium/Hard/Very Hard), target URL, 30-day SVG sparklines, and action buttons.
  - Quick filter chips: *All, Top 3, Top 10, Top 20, Improved, Declined, New, Lost*.
  - URL Query Parameter synchronization (`?tab=...&filter=...&search=...`) for instant shareable views.
  - Modals for **Single Keyword Addition** and **Bulk Line-by-Line Import**.
  - **Keyword SERP Drawer / Side Panel**: Detailed 30-day ranking curve, best/worst historical ranks, search intent, and live Google SERP competitor breakdown.
- **6-Month History & Variance Matrix Tab**:
  - Editable ranking cells for May, Jun, Jul, Aug, Sep, and Oct 2026.
  - **"Compare Month A with Month B"** selector with dynamic computed delta column.
  - Summary metrics: *Improved, Declined, Unchanged*.
  - **1-Click Export to Excel (`.xlsx`)** and **Styled PDF Report**.

### 3. 📈 Rankings Distribution (`/rankings`)
- Visual bracket breakdown (Positions 1-3, 4-10, 11-20, 21-50, 51-100) via bar chart.
- 6-month **Visibility Index** and **SERP Share of Voice** progression.
- SERP Features penetration overview (Featured Snippets, People Also Ask, SiteLinks, Video).

### 4. 🛠️ Technical Site Audit & Crawler (`/site-audit`)
- **Health Score Ring** (82/100) with category breakdowns for SEO, Performance, Security, and Accessibility.
- Interactive issue cards (Missing titles, Broken 404 links, Duplicate titles, Slow TTFB, Missing H1, Image ALT attributes, Small mobile touch targets).
- **Affected URLs Modal**: Lists affected URLs with HTTP status codes and exact **"Recommended Fix"** instructions.
- **"Re-run Full Audit"** button with animated crawler simulation.

### 5. 🔍 On-Page SEO Analyzer & SERP Preview Simulator (`/on-page-seo`)
- URL and target focus keyword auditor with score rating.
- **Live Google Search SERP Simulator**: Updates title, URL, and snippet description in real time with character counters and recommended threshold warnings (50-60 chars for title, 120-160 for description).
- Comprehensive 8-point optimization checklist with status badges.

### 6. 🔗 Backlink Profile & Authority Tracker (`/backlinks`)
- Total backlinks, referring domains, domain rating (DR), and 30-day new vs. lost links cards.
- 6-month link velocity growth chart.
- Full backlink data table with anchor text, source URL, target URL, DoFollow/NoFollow badges, and Excel export.

### 7. ⚡ Core Web Vitals & Page Speed (`/performance`)
- Real user experience gauges for **LCP (Largest Contentful Paint)**, **INP (Interaction to Next Paint)**, **CLS (Cumulative Layout Shift)**, **FCP**, and **TTFB**.
- **Desktop vs. Mobile** tab toggling.
- 6-month speed pass-rate trends and audited page speed breakdowns.

### 9. 📑 Executive Reports Builder (`/reports`)
- Customizable report generator with toggleable modules.
- Multi-section preview document.
- Export options: **Styled Executive PDF**, **Excel (`.xlsx`)**, and **CSV**.

### 10. 🔔 System Alerts & Notifications (`/notifications`)
- Categorized alert list (Ranking volatility, High-authority links, Crawl errors).
- Read/Unread tracking and "Mark All as Read" action.
- **"Simulate Live Alert"** button that creates real-time toast alerts and updates the global notification store.

### 11. ⚙️ Project Settings (`/settings`)
- 6 dedicated tabs: *Project Details, Search Engine & Location, Tracking Cadence, Notifications, Appearance (Dark/Light Mode), and Danger Zone (Delete Website Project)*.

### 12. 👤 User Profile & Security (`/profile`)
- User details and organization role management.
- Password change form with validation.
- Two-Factor Authentication (2FA) active security status.

### 13. 🌐 Global Website Switcher & Project Manager (`/add-website`)
- Multi-website switcher dropdown in the topbar.
- Add Website project creation with country options, search engine locales, and seed keyword imports.

### 14. 🔐 Authentication (`/login`)
- Clean email & password login with validation, remember me, and 1-click **"Auto-fill demo credentials"** button.

---

## 🛠️ Tech Stack & Architecture

- **Core**: React 18 + Vite (JavaScript, ES6+)
- **Routing**: React Router v6 with `React.lazy` and `Suspense` code splitting
- **Styling**: Tailwind CSS with CSS Variables supporting persistent Light and Dark themes
- **Charts**: Recharts (Line, Area, Bar, Pie/Donut) with custom tooltips
- **Data Tables**: `@tanstack/react-table` (v8) with sorting, filtering, and pagination
- **Async & Caching**: `@tanstack/react-query` for API state management and loading skeletons
- **State Management**: Zustand (persisting websites, keywords, competitors, and theme to `localStorage`)
- **Forms & Validation**: React Hook Form + Zod (`@hookform/resolvers`)
- **Icons**: `lucide-react`
- **File Exports**: `xlsx` (Excel), `jspdf` + `jspdf-autotable` (PDF)
- **Toasts**: `react-hot-toast`

---

## 📁 Directory Structure

```
seo-tracker/
├── public/
│   └── logo.svg                 # Brand SVG logo
├── src/
│   ├── api/
│   │   └── seoApi.js            # Mock API layer with simulated latency and error toggles
│   ├── components/
│   │   ├── Badge.jsx            # Multi-variant badge component
│   │   ├── Card.jsx             # Surface container cards
│   │   ├── DataTable.jsx        # TanStack Table wrapper with search & pagination
│   │   ├── DateRangePicker.jsx  # Presets dropdown & date range store sync
│   │   ├── Dropdown.jsx         # Accessible dropdown menu
│   │   ├── EmptyState.jsx       # Zero-data fallback component
│   │   ├── ErrorState.jsx       # Error banner with retry trigger
│   │   ├── Modal.jsx            # Focus-trapped modal dialog
│   │   ├── Pagination.jsx       # Pagination controls with per-page selector
│   │   ├── ScoreRing.jsx        # Circular SVG health score gauge
│   │   ├── Skeleton.jsx         # Loading placeholders
│   │   ├── Sparkline.jsx        # 30-day SVG ranking trend sparkline
│   │   ├── StatCard.jsx         # Analytics stat card with up/down delta indicators
│   │   ├── Tabs.jsx             # Pill-based tab selector
│   │   └── Tooltip.jsx          # Accessible hover tooltip
│   ├── data/
│   │   ├── mockAudit.js         # 35+ technical issues across 20+ URLs
│   │   ├── mockBacklinks.js     # 50+ detailed backlinks & 6m trend
│   │   ├── mockKeywords.js      # 45+ keywords with 30d trajectories & 6m history
│   │   ├── mockNotifications.js # 18+ system alerts
│   │   ├── mockPerformance.js   # Core Web Vitals (LCP, INP, CLS, etc.)
│   │   └── mockWebsites.js      # Multi-tenant website projects & locations
│   ├── layouts/
│   │   ├── AppLayout.jsx        # Collapsible sidebar, website switcher & topbar
│   │   └── AuthLayout.jsx       # Authentication container
│   ├── pages/
│   │   ├── AddWebsite.jsx       # Create new tracking project
│   │   ├── Backlinks.jsx        # Backlink analytics & table
│   │   ├── Dashboard.jsx        # Master SEO dashboard
│   │   ├── Keywords.jsx         # Flagship tracker & monthly variance matrix
│   │   ├── Login.jsx            # Authentication
│   │   ├── Notifications.jsx    # Alert feed & live simulator
│   │   ├── OnPageSEO.jsx        # On-page auditor & Google SERP preview
│   │   ├── Performance.jsx      # Core Web Vitals monitoring
│   │   ├── Profile.jsx          # User settings & security
│   │   ├── Rankings.jsx         # Bracket distribution & share of voice
│   │   ├── Reports.jsx          # Executive report generator
│   │   ├── Settings.jsx         # Project configuration & cadence
│   │   └── SiteAudit.jsx        # Technical audit & fix recommendations
│   ├── store/
│   │   ├── authStore.js         # Auth state & user session
│   │   ├── notificationStore.js # Notifications & unread badge
│   │   ├── seoStore.js          # Websites, keywords, competitors & date range
│   │   └── themeStore.js        # Light/Dark mode state
│   ├── utils/
│   │   ├── cn.js                # Tailwind classnames merger
│   │   ├── exportHelpers.js     # PDF, Excel, and CSV export generators
│   │   └── formatters.js        # Number, currency, and date formatters
│   ├── App.jsx                  # Router & QueryClient setup
│   ├── index.css                # CSS tokens & themes
│   └── main.jsx                 # React entrypoint
├── index.html
├── package.json
└── vite.config.js
```

---

## ⚡ Quick Start & Setup

### Project Architecture

```
seo-tracker/
├── frontend/             # Dedicated React 18 + Vite Frontend
│   ├── src/              # UI components, pages, stores, api services
│   ├── public/           # Static assets & icons
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.js    # Vite configuration & proxy
│   └── .env              # VITE_API_URL configuration
│
├── backend/              # Dedicated Node.js + Express Backend API
│   ├── src/              # Express server, routes, controllers, DB models
│   ├── data/             # SQLite local database (`seo_tracker.sqlite`)
│   ├── package.json      # Backend dependencies (Express, CORS, SQLite, etc.)
│   └── .env              # Backend PORT & DB configuration
│
└── package.json          # Root orchestration scripts
```

### 1. Quick Start (Run Both Frontend & Backend Together)
```bash
# Install dependencies in both folders
npm run install:all

# Start both backend (port 3001) and frontend (port 5173) concurrently
npm run dev
```

### 2. Running Individually
- **Frontend only**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Backend only**:
  ```bash
  cd backend
  npm install
  npm run dev
  ```

### 3. Build & Deploy
- **Build Frontend**:
  ```bash
  cd frontend
  npm run build
  ```
- Set `VITE_API_URL=https://your-backend-api.com/api` in your frontend environment variables when deploying to Vercel/Netlify.

---

## 🔌 Replacing Mock Data with Real APIs

The codebase is built with standard async functions in `src/api/seoApi.js` returning Promises. You can swap out the mock implementations with live APIs:

### 1. Google Search Console API (Organic Traffic & Impressions)
- **Endpoint**: `https://searchconsole.googleapis.com/v1/sites/{siteUrl}/searchAnalytics/query`
- **Replace in**: `seoApi.getDashboardOverview`
- **Payload example**:
```javascript
const response = await fetch(`https://searchconsole.googleapis.com/v1/sites/${encodeURIComponent(website.domain)}/searchAnalytics/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${userAccessToken}` },
  body: JSON.stringify({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    dimensions: ['date'],
    rowLimit: 500
  })
});
```

### 2. Rank Tracking & SERP Positions (DataForSEO / SerpApi)
- **Service**: [DataForSEO SERP API](https://dataforseo.com/) or [SerpApi](https://serpapi.com/)
- **Replace in**: `seoApi.getKeywords` and `seoApi.analyzeOnPageUrl`
- **Integration**: Send live keyword queries per location code (`US`, `GB`, etc.) and map the returned organic `items` to the keyword position, SERP snippet, and competitor ranking URLs.

### 3. Core Web Vitals (Google PageSpeed Insights & CrUX API)
- **Endpoint**: `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy={mobile|desktop}&key={API_KEY}`
- **Replace in**: `seoApi.getPerformance`
- **Mapping**:
  - `data.loadingExperience.metrics.LARGEST_CONTENTFUL_PAINT_MS` -> LCP
  - `data.loadingExperience.metrics.INTERACTION_TO_NEXT_PAINT` -> INP
  - `data.loadingExperience.metrics.CUMULATIVE_LAYOUT_SHIFT_SCORE` -> CLS

### 4. Technical Site Audit Crawler
- Replace `seoApi.reRunAudit` with a webhook trigger pointing to an automated crawler worker (e.g. Playwright / Puppeteer worker or a cloud auditing API).

---

## 🎨 Design System & Theme Customization

The color tokens are centralized in `src/index.css`:
- **Light Theme**: Crisp white background (`#f8fafc`), clean surface borders (`#e2e8f0`), deep slate typography.
- **Dark Theme**: Deep obsidian background (`#0b0f19`), elevated card surfaces (`#111827`), subtle borders (`#1f293d`).
- **Brand Accent**: Indigo (`#4f46e5` / `#6366f1`) with emerald green for ranking improvements and rose red for ranking drops.
