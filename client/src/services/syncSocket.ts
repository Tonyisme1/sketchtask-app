import { getWsUrl, authStorage } from "./api";

export type RealtimeSyncCallback = (data: any) => void;
export type ConnectionStatusCallback = (status: "connected" | "disconnected" | "connecting") => void;

class SyncSocketManager {
  private static instance: SyncSocketManager;
  private ws: WebSocket | null = null;
  private syncCallbacks: Set<RealtimeSyncCallback> = new Set();
  private statusCallbacks: Set<ConnectionStatusCallback> = new Set();
  private reconnectTimer: any = null;
  private isExplicitlyClosed = false;

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

    this.isExplicitlyClosed = false;
    this.notifyStatus("connecting");

    try {
      if (this.ws) {
        this.ws.close();
      }

      this.ws = new WebSocket(getWsUrl(token));

      this.ws.onopen = () => {
        this.notifyStatus("connected");
        // Gửi xác thực bổ sung nếu cần
        this.ws?.send(JSON.stringify({ type: "AUTH", token }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "REALTIME_DATA_UPDATE" && data.payload) {
            this.syncCallbacks.forEach((cb) => cb(data.payload));
          }
        } catch {
          // Ignore
        }
      };

      this.ws.onclose = () => {
        this.notifyStatus("disconnected");
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.notifyStatus("disconnected");
      };
    } catch {
      this.notifyStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.notifyStatus("disconnected");
  }

  public onSync(callback: RealtimeSyncCallback) {
    this.syncCallbacks.add(callback);
    return () => this.syncCallbacks.delete(callback);
  }

  public onStatus(callback: ConnectionStatusCallback) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  private notifyStatus(status: "connected" | "disconnected" | "connecting") {
    this.statusCallbacks.forEach((cb) => cb(status));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isExplicitlyClosed) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      const token = authStorage.getToken();
      if (token) {
        this.connect();
      }
    }, 5000);
  }
}

export const syncSocket = SyncSocketManager.getInstance();

