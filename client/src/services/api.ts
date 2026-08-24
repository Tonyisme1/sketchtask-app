// ==========================================
// CLIENT API SERVICE (Hỗ trợ Cloud Production & Local Dev)
// ==========================================

const getApiBaseUrl = () => {
  // 1. Ưu tiên biến môi trường khi deploy lên Internet (Vercel / Cloud)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, "");
  }

  // 2. Chế độ Localhost / Wi-Fi Dev
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `http://${hostname}:5000/api/v1`;
  }
  return "http://localhost:5000/api/v1";
};

export const getWsUrl = (token?: string) => {
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : "";

  // 1. Nếu có VITE_WS_URL hoặc từ VITE_API_URL
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

  // 2. Chế độ Localhost / Wi-Fi Dev
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname || "localhost";
    return `ws://${hostname}:5000/ws${tokenQuery}`;
  }
  return `ws://localhost:5000/ws${tokenQuery}`;
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
};
