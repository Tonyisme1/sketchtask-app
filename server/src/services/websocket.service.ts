import { WebSocketServer, WebSocket } from "ws";
import { Server as HttpServer } from "http";
import { verifyToken } from "../utils/jwt.js";

interface AuthenticatedSocket extends WebSocket {
  userId?: string;
  isAlive?: boolean;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer | null = null;
  private userSockets: Map<string, Set<AuthenticatedSocket>> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: AuthenticatedSocket, req) => {
      ws.isAlive = true;

      // Extract token from URL query string if provided: ws://.../ws?token=...
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const token = url.searchParams.get("token");

      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          this.registerUserSocket(payload.userId, ws);
        }
      }

      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("message", (rawMessage) => {
        try {
          const data = JSON.parse(rawMessage.toString());
          if (data.type === "AUTH" && data.token) {
            const payload = verifyToken(data.token);
            if (payload) {
              this.registerUserSocket(payload.userId, ws);
              ws.send(JSON.stringify({ type: "AUTH_SUCCESS", userId: payload.userId }));
            } else {
              ws.send(JSON.stringify({ type: "AUTH_ERROR", message: "Token không hợp lệ" }));
            }
          } else if (data.type === "PING") {
            ws.send(JSON.stringify({ type: "PONG" }));
          }
        } catch {
          // Ignore invalid JSON
        }
      });

      ws.on("close", () => {
        if (ws.userId) {
          const sockets = this.userSockets.get(ws.userId);
          if (sockets) {
            sockets.delete(ws);
            if (sockets.size === 0) {
              this.userSockets.delete(ws.userId);
            }
          }
        }
      });
    });

    // Heartbeat check every 30s
    setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((client: WebSocket) => {
        const authClient = client as AuthenticatedSocket;
        if (authClient.isAlive === false) {
          return client.terminate();
        }
        authClient.isAlive = false;
        client.ping();
      });
    }, 30000);

    console.log("⚡ WebSocket Server Realtime đã sẵn sàng trên path /ws");
  }

  private registerUserSocket(userId: string, ws: AuthenticatedSocket) {
    ws.userId = userId;
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(ws);
  }

  /**
   * Broadcast sự kiện đồng bộ cho tất cả các client đang mở của cùng 1 User
   * @param senderSocket Socket của client vừa gửi request (nếu có, để bỏ qua không gửi lại)
   */
  public broadcastToUser(userId: string, event: { type: string; payload?: any }, senderSocket?: WebSocket) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;

    const message = JSON.stringify(event);
    sockets.forEach((socket) => {
      if (socket !== senderSocket && socket.readyState === WebSocket.OPEN) {
        socket.send(message);
      }
    });
  }
}

export const wsService = WebSocketService.getInstance();

