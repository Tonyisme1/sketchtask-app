import express from "express";
import cors from "cors";
import http from "http";
import { config } from "./config/index.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { wsService } from "./services/websocket.service.js";

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// API Endpoints
app.use("/api/v1", apiRouter);

// Health Check & Uptime Monitor
app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    app: "SketchTask API",
    version: "1.6.0",
    uptime: "24/7",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "SketchTask API",
    version: "1.6.0",
    realtime: "WebSocket Ready",
    timestamp: new Date().toISOString(),
  });
});

// App Version Check for Auto-Update
app.get("/api/version", (_req, res) => {
  res.json({
    version: "1.6.0",
    releaseDate: "2026-08-25",
    changelog: "Bottom Sheet Settings, Optimized Search, Productivity Sketch Chart, Priority & Tag Filters, Google Auth Enhancement",
    downloadUrl: "https://sketchtask-app.vercel.app",
    apkUrl: "https://sketchtask-app.vercel.app",
    isForceUpdate: false,
  });
});

// Error Handler
app.use(errorHandler);

// Initialize Realtime WebSocket Server
wsService.init(server);

// Start server
if (process.env.NODE_ENV !== "test") {
  server.listen(config.port, "0.0.0.0", () => {
    console.log(
      `🚀 SketchTask Backend Server đang chạy tại http://0.0.0.0:${config.port}`,
    );
    console.log(
      `⚡ WebSocket Realtime endpoint: ws://0.0.0.0:${config.port}/ws`,
    );
  });
}

export { app, server };
export default app;
