// ==========================================
// CLIENT API SERVICE (Hỗ trợ Vite Proxy, Localhost & Cloud Deployment)
// ==========================================

const getApiBaseUrl = () => {
  // Dev luôn đi qua Vite Proxy để không vô tình gọi nhầm backend production.
  if (import.meta.env.DEV) return "/api/v1";

  // Production dùng URL backend được cấu hình trong môi trường deploy.
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  // Fallback an toàn khi chưa cấu hình biến môi trường.
  // Giúp điện thoại qua Wi-Fi kết nối mượt mà 100% không bị tường lửa Windows chặn cổng 5000
  return "/api/v1";
};

export const getWsUrl = (token?: string) => {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  // Dev dùng host hiện tại của Vite, tương ứng với proxy WebSocket /ws.
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws${tokenQuery}`;
  }

  // Production dùng URL WebSocket được cấu hình trong môi trường deploy.
  if (import.meta.env.VITE_WS_URL) {
    return `${import.meta.env.VITE_WS_URL.replace(/\/$/, "")}/ws${tokenQuery}`;
  }

  if (import.meta.env.VITE_API_URL) {
    const apiUrl = import.meta.env.VITE_API_URL;
    const wsBase = apiUrl
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:")
      .replace(/\/api\/v1\/?$/, "");
    return `${wsBase}/ws${tokenQuery}`;
  }

  // Fallback theo host hiện tại nếu môi trường chưa cấu hình URL.
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host; // e.g. 192.168.2.7:5173 hoặc localhost:5173
    return `${protocol}//${host}/ws${tokenQuery}`;
  }
  return `ws://localhost:5173/ws${tokenQuery}`;
};

const TOKEN_KEY = "sketchtask_jwt_token";

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  removeToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const token = authStorage.getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${getApiBaseUrl()}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      authStorage.removeToken();
      return {
        success: false,
        message: "Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập.",
      };
    }

    const json = await res.json();
    return json;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || "Không thể kết nối tới máy chủ backend.",
    };
  }
}

export const api = {
  auth: {
    register: (name: string, email: string, password?: string) =>
      request<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      }),

    login: (email: string, password?: string) =>
      request<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),

    google: (data: {
      email: string;
      name: string;
      avatar?: string;
      avatarBg?: string;
      googleId?: string;
    }) =>
      request<{ token: string; user: any }>("/auth/google", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getMe: () => request<any>("/auth/me"),

    updateProfile: (data: {
      name?: string;
      avatar?: string;
      avatarBg?: string;
    }) =>
      request<any>("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  sync: {
    pull: () => request<any>("/sync/pull"),

    push: (payload: any) =>
      request<any>("/sync/push", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },

  admin: {
    getOverview: () => request<AdminOverview>("/admin/overview"),

    listUsers: (search = "", page = 1, pageSize = 20) => {
      const params = new URLSearchParams({
        search,
        page: String(page),
        pageSize: String(pageSize),
      });
      return request<AdminUserList>(`/admin/users?${params.toString()}`);
    },

    getUserData: (userId: string) =>
      request<AdminUserData>(`/admin/users/${encodeURIComponent(userId)}/data`),
  },
};

export interface AdminUserSummary {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  avatarBg?: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    tasks: number;
    notebooks: number;
    stickyNotes: number;
    habits: number;
  };
}

export interface AdminOverview {
  totals: {
    users: number;
    tasks: number;
    notebooks: number;
    stickyNotes: number;
    habits: number;
  };
  latestUsers: AdminUserSummary[];
}

export interface AdminUserList {
  items: AdminUserSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminUserData {
  user: Omit<AdminUserSummary, "_count">;
  tasks: unknown[];
  notebooks: unknown[];
  stickyNotes: unknown[];
  habits: unknown[];
  dailyMoods: Record<string, string>;
  weeklyReflection: string;
  tags: string[];
  dataAvailability: {
    notes: "local-only";
    journalEntries: "local-only";
  };
}
