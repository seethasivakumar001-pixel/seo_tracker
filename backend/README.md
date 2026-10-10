# 🚀 SEO Tracker Backend

Modular Node.js and Express REST API for the SEO Tracker application with multi-database support (**SQLite**, **MySQL**, and **PostgreSQL**) and Google PageSpeed Insights integration.

---

## 📁 Architecture

```
backend/
├── package.json          # Backend dependencies and scripts
├── .env                  # Environment configuration
├── .env.example          # Sample environment variables
├── README.md             # Backend documentation
├── data/
│   └── seo_tracker.sqlite# SQLite database file (auto-created)
└── src/
    ├── server.js         # Main Express application entrypoint
    ├── config/
    │   └── db.js         # Database connector & auto-migration engine
    └── routes/
        ├── auth.routes.js       # Register, Login, User Profile
        ├── keywords.routes.js   # Keyword tracking CRUD & bulk ops
        ├── projects.routes.js   # Websites & Projects management
        ├── categories.routes.js # Keyword groupings & tags
        ├── pagespeed.routes.js  # Server-side proxy for Google PageSpeed Insights
        └── data.routes.js       # Bulk data fetch and sync
```

---

## ⚙️ Configuration (`.env`)

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3001` | Express server port |
| `DB_TYPE` | `sqlite` | Database engine (`sqlite`, `mysql`, `postgres`) |
| `MYSQL_HOST` | `localhost` | MySQL host (if `DB_TYPE=mysql`) |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `root` | MySQL user |
| `MYSQL_PASSWORD` | `your_password` | MySQL password |
| `MYSQL_DATABASE` | `seo_tracker` | MySQL database name |
| `PGHOST` | `localhost` | PostgreSQL host (if `DB_TYPE=postgres`) |
| `PGPORT` | `5432` | PostgreSQL port |
| `PGUSER` | `postgres` | PostgreSQL user |
| `PGPASSWORD` | `your_password` | PostgreSQL password |
| `PGDATABASE` | `seo_tracker` | PostgreSQL database name |
| `PAGESPEED_API_KEY` | - | Google PageSpeed Insights API key |

---

## 🚀 Quick Start

### 1. Run Backend Standalone
```bash
cd backend
npm install
npm start
```
*Or in development watch mode:*
```bash
npm run dev
```

### 2. Run From Project Root
```bash
# Run server only:
npm run server

# Run both Frontend (Vite) and Backend (Express) concurrently:
npm run dev:all
```

---

## 📡 API Endpoints

### 🩺 System & Health
- `GET /api/health` — Checks database connection status, type, and uptime.

### 🔐 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user (`name`, `email`, `password`).
- `POST /api/auth/login` — Authenticate and return user info.
- `PUT /api/auth/profile` — Update user profile details or password.

### 🔑 Keywords (`/api/keywords`)
- `GET /api/keywords?projectId={id}` — List all keywords for a project.
- `POST /api/keywords` — Create a new tracked keyword.
- `PUT /api/keywords/:id` — Update keyword metrics, ranks, or tags.
- `DELETE /api/keywords/:id` — Move keyword to trash or delete permanently.

### 🌐 Projects & Websites (`/api/projects`)
- `GET /api/projects` — List active projects and domains.
- `POST /api/projects` — Create a new project.
- `PUT /api/projects/:id` — Update project domain or name.
- `DELETE /api/projects/:id` — Delete a project and associated keywords.

### 🏷️ Categories (`/api/categories`)
- `GET /api/categories?projectId={id}` — List categories.
- `POST /api/categories` — Create category.
- `PUT /api/categories/:id` — Update category.
- `DELETE /api/categories/:id` — Delete category.

### ⚡ PageSpeed Insights Proxy (`/api/pagespeed`)
- `GET /api/pagespeed/run?url={url}&strategy={desktop|mobile}`
  - Returns all 4 Lighthouse categories (**Performance**, **Accessibility**, **Best Practices**, **SEO**) and Core Web Vitals (**LCP**, **INP**, **CLS**, **FCP**, **TTFB**, **Speed Index**, **TBT**).
  - Automatically caches results to avoid API quota consumption.

### 🔄 Sync (`/api/data`)
- `GET /api/data` — Bulk fetch all keywords, projects, categories.
- `POST /api/data/sync` — Bulk upsert from client store.
