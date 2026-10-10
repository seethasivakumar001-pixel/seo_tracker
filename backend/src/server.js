import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getDb } from "./config/db.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import keywordRoutes from "./routes/keywords.routes.js";
import projectRoutes from "./routes/projects.routes.js";
import categoryRoutes from "./routes/categories.routes.js";
import backlinkRoutes from "./routes/backlinks.routes.js";
import pagespeedRoutes from "./routes/pagespeed.routes.js";
import dataRoutes from "./routes/data.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Request Logger (Development)
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const { type } = await getDb();
    res.json({
      status: "ok",
      database: type,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/backlinks", backlinkRoutes);
app.use("/api/pagespeed", pagespeedRoutes);
app.use("/api/data", dataRoutes);

// Root Welcome Endpoint
app.get("/", (req, res) => {
  res.json({
    message: "SEO Tracker Backend API is live",
    version: "1.0.0",
    docs: "/api/health",
    endpoints: [
      "/api/health",
      "/api/auth/register",
      "/api/auth/login",
      "/api/auth/profile",
      "/api/keywords",
      "/api/projects",
      "/api/categories",
      "/api/pagespeed/run",
      "/api/data",
      "/api/data/sync"
    ]
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message || "An unexpected error occurred."
  });
});

// Start Server & Initialize Database
async function startServer() {
  try {
    const { type } = await getDb();
    const host = "0.0.0.0";
    app.listen(PORT, host, () => {
      console.log(`🚀 SEO Tracker Backend running at: http://${host}:${PORT}`);
      console.log(`📊 Connected Database: ${type.toUpperCase()}`);
      console.log(`🔍 Health Check: http://${host}:${PORT}/api/health`);
    });
  } catch (err) {
    console.error("Failed to start backend server:", err);
    process.exit(1);
  }
}

startServer();

export default app;
