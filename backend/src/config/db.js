import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import crypto from "crypto";
import Database from "better-sqlite3";
import fs from "fs";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbType = (process.env.DB_TYPE || "").toLowerCase();
const dbUrl = process.env.DATABASE_URL || "";

let dbClient = null;
let currentDbType = "sqlite";

// Password hashing & verification
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, originalHash] = storedHash.split(":");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

// Database Connection Manager
export async function getDb() {
  if (dbClient) return { client: dbClient, type: currentDbType };

  // 1. PostgreSQL connection
  if (dbType === "postgres" || dbType === "postgresql" || dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    try {
      const pg = await import("pg");
      const { Pool } = pg.default || pg;
      const pool = new Pool(
        dbUrl
          ? { connectionString: dbUrl, ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false }
          : {
              host: process.env.PGHOST || "localhost",
              port: Number(process.env.PGPORT) || 5432,
              user: process.env.PGUSER || "postgres",
              password: process.env.PGPASSWORD || "",
              database: process.env.PGDATABASE || "seo_tracker",
              ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
            }
      );

      await pool.query("SELECT NOW()");
      console.log("⚡ Connected successfully to PostgreSQL database.");
      dbClient = pool;
      currentDbType = "postgres";
      await initPostgresSchema(pool);
      return { client: dbClient, type: currentDbType };
    } catch (err) {
      console.error("❌ Failed to connect to PostgreSQL:", err.message);
      console.log("⚠️ Falling back to local SQLite database...");
    }
  }

  // 2. MySQL connection
  if (dbType === "mysql" || dbUrl.startsWith("mysql://")) {
    try {
      const mysql = await import("mysql2/promise");
      const host = process.env.MYSQL_HOST || "localhost";
      const port = Number(process.env.MYSQL_PORT) || 3306;
      const user = process.env.MYSQL_USER || "root";
      const password = process.env.MYSQL_PASSWORD || "";
      const database = process.env.MYSQL_DATABASE || "seo_tracker";

      try {
        const rootConn = await mysql.createConnection(
          dbUrl ? dbUrl.replace(/\/[^/?]+(\?.*)?$/, "$1") : { host, port, user, password }
        );
        await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await rootConn.end();
      } catch (dbCreateErr) {
        console.warn("Notice during DB check/creation:", dbCreateErr.message);
      }

      const pool = dbUrl
        ? mysql.createPool(dbUrl)
        : mysql.createPool({
            host,
            port,
            user,
            password,
            database,
            waitForConnections: true,
            connectionLimit: 10,
          });

      await pool.query("SELECT 1");
      console.log(`⚡ Connected successfully to MySQL database "${database}".`);
      dbClient = pool;
      currentDbType = "mysql";
      await initMysqlSchema(pool);
      return { client: dbClient, type: currentDbType };
    } catch (err) {
      console.error("❌ Failed to connect to MySQL:", err.message);
      console.log("⚠️ Falling back to local SQLite database...");
    }
  }

  // 3. SQLite Fallback (default)
  const dataDir = join(__dirname, "../../data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlitePath = join(dataDir, "seo_tracker.sqlite");
  const sqliteDb = new Database(sqlitePath);
  sqliteDb.pragma("journal_mode = WAL");
  console.log(`📦 Using SQLite database at: ${sqlitePath}`);

  dbClient = sqliteDb;
  currentDbType = "sqlite";
  initSqliteSchema(sqliteDb);

  return { client: dbClient, type: currentDbType };
}

// -------------------------------------------------------------
// SCHEMA INITIALIZERS
// -------------------------------------------------------------

function initSqliteSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS websites (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT,
      deleted_at DATETIME,
      deleted_with TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT,
      deleted_at DATETIME,
      deleted_with TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      keyword TEXT NOT NULL,
      group_name TEXT DEFAULT 'General',
      url TEXT,
      target_url TEXT,
      position INTEGER,
      previous_position INTEGER,
      change_val INTEGER DEFAULT 0,
      volume INTEGER DEFAULT 0,
      difficulty INTEGER DEFAULT 0,
      cpc REAL DEFAULT 2.50,
      device TEXT DEFAULT 'desktop',
      location TEXT DEFAULT 'United States',
      search_engine TEXT DEFAULT 'Google',
      best_position INTEGER,
      worst_position INTEGER,
      serp_features TEXT,
      history TEXT,
      monthly TEXT,
      tracking_start_date TEXT,
      last_updated TEXT,
      deleted_at DATETIME,
      deleted_with TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS backlinks (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      website_name TEXT,
      website_url TEXT NOT NULL,
      submitted_url TEXT,
      type TEXT DEFAULT 'Directory',
      status TEXT DEFAULT 'Undone',
      anchor_text TEXT,
      link_attribute TEXT DEFAULT 'Dofollow',
      domain_rating INTEGER DEFAULT 0,
      spam_score INTEGER DEFAULT 0,
      traffic_estimate TEXT DEFAULT '1.2M',
      verification_status TEXT DEFAULT 'Pending',
      notes TEXT,
      date_submitted TEXT,
      date_verified TEXT,
      last_checked TEXT,
      da INTEGER DEFAULT 0,
      deleted_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pagespeed_cache (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      strategy TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe alter migrations for SQLite if table previously existed
  const alterKeywordCols = [
    "position INTEGER",
    "previous_position INTEGER",
    "change_val INTEGER DEFAULT 0",
    "cpc REAL DEFAULT 2.50",
    "target_url TEXT",
    "device TEXT DEFAULT 'desktop'",
    "location TEXT DEFAULT 'United States'",
    "search_engine TEXT DEFAULT 'Google'",
    "best_position INTEGER",
    "worst_position INTEGER",
    "serp_features TEXT",
    "tracking_start_date TEXT",
    "last_updated TEXT"
  ];
  for (const col of alterKeywordCols) {
    try {
      db.exec(`ALTER TABLE keywords ADD COLUMN ${col};`);
    } catch {}
  }

  const alterCols = [
    "link_attribute TEXT DEFAULT 'Dofollow'",
    "domain_rating INTEGER DEFAULT 0",
    "spam_score INTEGER DEFAULT 0",
    "traffic_estimate TEXT DEFAULT '1.2M'",
    "verification_status TEXT DEFAULT 'Pending'",
    "notes TEXT",
    "date_submitted TEXT",
    "date_verified TEXT",
    "last_checked TEXT"
  ];
  for (const col of alterCols) {
    try {
      db.exec(`ALTER TABLE backlinks ADD COLUMN ${col};`);
    } catch {}
  }
}

async function initPostgresSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS websites (
      id TEXT PRIMARY KEY,
      domain TEXT NOT NULL,
      name TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT,
      deleted_at TIMESTAMP WITH TIME ZONE,
      deleted_with TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT,
      deleted_at TIMESTAMP WITH TIME ZONE,
      deleted_with TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS keywords (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      keyword TEXT NOT NULL,
      group_name TEXT DEFAULT 'General',
      url TEXT,
      target_url TEXT,
      position INT,
      previous_position INT,
      change_val INT DEFAULT 0,
      volume INTEGER DEFAULT 0,
      difficulty INTEGER DEFAULT 0,
      cpc NUMERIC(10,2) DEFAULT 2.50,
      device TEXT DEFAULT 'desktop',
      location TEXT DEFAULT 'United States',
      search_engine TEXT DEFAULT 'Google',
      best_position INT,
      worst_position INT,
      serp_features JSONB,
      history JSONB,
      monthly JSONB,
      tracking_start_date DATE,
      last_updated DATE,
      deleted_at TIMESTAMP WITH TIME ZONE,
      deleted_with TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS backlinks (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      website_name TEXT,
      website_url TEXT NOT NULL,
      submitted_url TEXT,
      type TEXT DEFAULT 'Directory',
      status TEXT DEFAULT 'Undone',
      anchor_text TEXT,
      link_attribute TEXT DEFAULT 'Dofollow',
      domain_rating INTEGER DEFAULT 0,
      spam_score INTEGER DEFAULT 0,
      traffic_estimate TEXT DEFAULT '1.2M',
      verification_status TEXT DEFAULT 'Pending',
      notes TEXT,
      date_submitted DATE,
      date_verified DATE,
      last_checked DATE,
      da INTEGER DEFAULT 0,
      deleted_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS pagespeed_cache (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      strategy TEXT NOT NULL,
      result_json JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  const pgKeywordCols = [
    "position INT",
    "previous_position INT",
    "change_val INT DEFAULT 0",
    "cpc NUMERIC(10,2) DEFAULT 2.50",
    "target_url TEXT",
    "device TEXT DEFAULT 'desktop'",
    "location TEXT DEFAULT 'United States'",
    "search_engine TEXT DEFAULT 'Google'",
    "best_position INT",
    "worst_position INT",
    "serp_features JSONB",
    "tracking_start_date DATE",
    "last_updated DATE"
  ];
  for (const col of pgKeywordCols) {
    try {
      await pool.query(`ALTER TABLE keywords ADD COLUMN IF NOT EXISTS ${col};`);
    } catch {}
  }

  const pgCols = [
    "link_attribute TEXT DEFAULT 'Dofollow'",
    "domain_rating INTEGER DEFAULT 0",
    "spam_score INTEGER DEFAULT 0",
    "traffic_estimate TEXT DEFAULT '1.2M'",
    "verification_status TEXT DEFAULT 'Pending'",
    "notes TEXT",
    "date_submitted DATE",
    "date_verified DATE",
    "last_checked DATE"
  ];
  for (const col of pgCols) {
    try {
      await pool.query(`ALTER TABLE backlinks ADD COLUMN IF NOT EXISTS ${col};`);
    } catch {}
  }
}

async function initMysqlSchema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      avatar TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS websites (
      id VARCHAR(64) PRIMARY KEY,
      domain VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      domain VARCHAR(255),
      deleted_at TIMESTAMP NULL,
      deleted_with VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      project_id VARCHAR(64),
      deleted_at TIMESTAMP NULL,
      deleted_with VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS keywords (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64),
      keyword VARCHAR(255) NOT NULL,
      group_name VARCHAR(255) DEFAULT 'General',
      url TEXT,
      target_url TEXT,
      position INT NULL,
      previous_position INT NULL,
      change_val INT DEFAULT 0,
      volume INT DEFAULT 0,
      difficulty INT DEFAULT 0,
      cpc DECIMAL(10,2) DEFAULT 2.50,
      device VARCHAR(32) DEFAULT 'desktop',
      location VARCHAR(128) DEFAULT 'United States',
      search_engine VARCHAR(64) DEFAULT 'Google',
      best_position INT NULL,
      worst_position INT NULL,
      serp_features JSON,
      history JSON,
      monthly JSON,
      tracking_start_date DATE NULL,
      last_updated DATE NULL,
      deleted_at TIMESTAMP NULL,
      deleted_with VARCHAR(64) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const mysqlKeywordCols = [
    { name: 'target_url', def: 'TEXT' },
    { name: 'position', def: 'INT NULL' },
    { name: 'previous_position', def: 'INT NULL' },
    { name: 'change_val', def: 'INT DEFAULT 0' },
    { name: 'cpc', def: 'DECIMAL(10,2) DEFAULT 2.50' },
    { name: 'device', def: "VARCHAR(32) DEFAULT 'desktop'" },
    { name: 'location', def: "VARCHAR(128) DEFAULT 'United States'" },
    { name: 'search_engine', def: "VARCHAR(64) DEFAULT 'Google'" },
    { name: 'best_position', def: 'INT NULL' },
    { name: 'worst_position', def: 'INT NULL' },
    { name: 'serp_features', def: 'JSON' },
    { name: 'tracking_start_date', def: 'DATE NULL' },
    { name: 'last_updated', def: 'DATE NULL' }
  ];

  for (const c of mysqlKeywordCols) {
    try {
      const [colCheck] = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'keywords' AND column_name = ?`,
        [c.name]
      );
      if (!colCheck.length) {
        await pool.query(`ALTER TABLE keywords ADD COLUMN ${c.name} ${c.def}`);
      }
    } catch {}
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS backlinks (
      id VARCHAR(64) PRIMARY KEY,
      project_id VARCHAR(64),
      website_name VARCHAR(255),
      website_url TEXT NOT NULL,
      submitted_url TEXT,
      type VARCHAR(64) DEFAULT 'Directory',
      status VARCHAR(32) DEFAULT 'Undone',
      anchor_text VARCHAR(255),
      link_attribute VARCHAR(32) DEFAULT 'Dofollow',
      domain_rating INT DEFAULT 0,
      spam_score INT DEFAULT 0,
      traffic_estimate VARCHAR(64) DEFAULT '1.2M',
      verification_status VARCHAR(32) DEFAULT 'Pending',
      notes TEXT,
      date_submitted DATE NULL,
      date_verified DATE NULL,
      last_checked DATE NULL,
      da INT DEFAULT 0,
      deleted_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  const mysqlCols = [
    { name: 'link_attribute', def: "VARCHAR(32) DEFAULT 'Dofollow'" },
    { name: 'domain_rating', def: "INT DEFAULT 0" },
    { name: 'spam_score', def: "INT DEFAULT 0" },
    { name: 'traffic_estimate', def: "VARCHAR(64) DEFAULT '1.2M'" },
    { name: 'verification_status', def: "VARCHAR(32) DEFAULT 'Pending'" },
    { name: 'notes', def: "TEXT" },
    { name: 'date_submitted', def: "DATE NULL" },
    { name: 'date_verified', def: "DATE NULL" },
    { name: 'last_checked', def: "DATE NULL" }
  ];

  for (const c of mysqlCols) {
    try {
      const [colCheck] = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'backlinks' AND column_name = ?`,
        [c.name]
      );
      if (!colCheck.length) {
        await pool.query(`ALTER TABLE backlinks ADD COLUMN ${c.name} ${c.def}`);
      }
    } catch {}
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pagespeed_cache (
      id VARCHAR(64) PRIMARY KEY,
      url TEXT NOT NULL,
      strategy VARCHAR(32) NOT NULL,
      result_json JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
}
