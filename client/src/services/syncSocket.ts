import { getWsUrl, authStorage } from "./api";

export type RealtimeSyncCallback = (data: any) => void;
export type ConnectionStatusCallback = (
  status: "connected" | "disconnected" | "connecting"
) => void;

class SyncSocketManager {
  private static instance: SyncSocketManager;
  private ws: WebSocket | null = null;
  private syncCallbacks: Set<RealtimeSyncCallback> = new Set();
  private statusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;
  private currentToken: string | null = null;

  private constructor() {}

  public static getInstance(): SyncSocketManager {
    if (!SyncSocketManager.instance) {
      SyncSocketManager.instance = new SyncSocketManager();
    }
    return SyncSocketManager.instance;
  }

  public connect() {
    const token = authStorage.getToken();
    if (!token) return;

    // Nếu socket đang mở hoặc đang kết nối với cùng token thì không tạo lại
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING) &&
      this.currentToken === token
    ) {
      return;
    }

    this.isExplicitlyClosed = false;
    this.currentToken = token;
    this.notifyStatus("connecting");

    this.cleanupCurrentSocket();

    try {
      const socket = new WebSocket(getWsUrl(token));
      this.ws = socket;

      socket.onopen = () => {
        if (this.ws !== socket) return;
        this.notifyStatus("connected");
        try {
          socket.send(JSON.stringify({ type: "AUTH", token }));
        } catch {
          // Ignore
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "REALTIME_DATA_UPDATE" && data.payload) {
            this.syncCallbacks.forEach((cb) => cb(data.payload));
          }
        } catch {
          // Ignore
        }
      };

      socket.onclose = () => {
        if (this.ws === socket) {
          this.ws = null;
          this.notifyStatus("disconnected");
          if (!this.isExplicitlyClosed) {
            this.scheduleReconnect();
          }
        }
      };

      socket.onerror = () => {
        if (this.ws === socket) {
          this.notifyStatus("disconnected");
        }
      };
    } catch {
      this.notifyStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.currentToken = null;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.cleanupCurrentSocket();
    this.notifyStatus("disconnected");
  }

  private cleanupCurrentSocket() {
    if (this.ws) {
      const socket = this.ws;
      this.ws = null;

      if (socket.readyState === WebSocket.CONNECTING) {
        // Tránh gọi close() khi đang CONNECTING gây log warning ở browser
        socket.onopen = () => {
          try {
            socket.close();
          } catch {}
        };
        socket.onerror = null;
        socket.onclose = null;
      } else if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.close();
        } catch {}
      }
    }
  }

  public onSync(callback: RealtimeSyncCallback) {
    this.syncCallbacks.add(callback);
    return () => {
      this.syncCallbacks.delete(callback);
    };
  }

  public onStatus(callback: ConnectionStatusCallback) {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  private notifyStatus(status: "connected" | "disconnected" | "connecting") {
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyClosed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const token = authStorage.getToken();
      if (token && !this.isExplicitlyClosed) {
        this.connect();
      }
    }, 5000);
  }
}

export const syncSocket = SyncSocketManager.getInstance();
