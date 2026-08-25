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

// Root & Health Check Endpoint (Cho UptimeRobot & Giữ máy chủ thức 24/7)
app.get("/", (_req, res) => {
  res.status(200).json({
    status: "ok",
    app: "SketchTask Backend Server",
    realtime: "WebSocket Ready",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    app: "SketchTask API",
    realtime: "WebSocket Ready",
    timestamp: new Date().toISOString(),
  });
});

// Error Handler
app.use(errorHandler);

// Initialize Realtime WebSocket Server
wsService.init(server);

// Start server
if (process.env.NODE_ENV !== "test") {
  server.listen(config.port, "0.0.0.0", () => {
    console.log(`🚀 SketchTask Backend Server đang chạy tại http://0.0.0.0:${config.port}`);
    console.log(`⚡ WebSocket Realtime endpoint: ws://0.0.0.0:${config.port}/ws`);
  });
}

export default app;
