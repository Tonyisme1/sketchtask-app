import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { TaskDto, NotebookDto, HabitDto, TaskStatus } from "../types";
import { api, authStorage } from "../services/api";
import { syncSocket } from "../services/syncSocket";
import { smartMergeAppData } from "../utils/syncMerge";
import { notificationService } from "../services/notificationService";

// ==========================================
// STORE: AppStore (Offline-First + Realtime WebSocket Sync Engine)
// ==========================================

export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
  avatarBg: string;
  isSignedIn: boolean;
}

export type ColorTheme = "warm" | "sketch" | "sepia";

export interface StickyNoteItem {
  id: string;
  content: string;
  color:
    | "yellow"
    | "coral"
    | "mint"
    | "sky"
    | "lavender"
    | "peach"
    | "lime"
    | "pink"
    | "cyan"
    | "stone";
  tilt: "left" | "right" | "none";
  isPinned: boolean;
  createdAt: string;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "offline" | "error";

export interface AppContextType {
  // User Profile & Auth
  user: UserProfile;
  login: (
    name: string,
    email: string,
    avatar?: string,
    avatarBg?: string,
  ) => void;
  loginWithCredentials: (
    email: string,
    password?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  registerWithCredentials: (
    name: string,
    email: string,
    password?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: (data: {
    email: string;
    name: string;
    avatar?: string;
    avatarBg?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;

  // Cloud Sync & Realtime
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isOnline: boolean;
  syncNow: () => Promise<boolean>;

  // Onboarding
  isFirstVisit: boolean;
  dismissOnboarding: () => void;

  // Settings
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  isTiltEnabled: boolean;
  setIsTiltEnabled: (enabled: boolean) => void;
  hideCompletedTasks: boolean;
  setHideCompletedTasks: (hide: boolean) => void;
  isNotificationsEnabled: boolean;
  setIsNotificationsEnabled: (enabled: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (enabled: boolean) => void;
  triggerHaptic: () => void;
  loadSampleData: () => void;

  // Tasks
  tasks: TaskDto[];
  addTask: (task: {
    title: string;
    dueDate?: string;
    tag?: string;
    notebookId?: string;
    priority?: TaskPriority;
  }) => TaskDto;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveTaskToTomorrow: (id: string) => void;
  moveTaskToToday: (id: string) => void;

  // Custom Tags
  tags: string[];
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => void;

  // Notebooks
  notebooks: NotebookDto[];
  addNotebook: (data: {
    name: string;
    description?: string;
    color: string;
    icon?: string;
  }) => NotebookDto;
  updateNotebook: (id: string, updates: Partial<NotebookDto>) => void;
  deleteNotebook: (id: string) => void;

  // Sticky Notes (Brain Dump)
  stickyNotes: StickyNoteItem[];
  addStickyNote: (content: string, color?: StickyNoteItem["color"]) => void;
  togglePinStickyNote: (id: string) => void;
  deleteStickyNote: (id: string) => void;
  convertNoteToTask: (id: string) => void;
  convertNoteToNotebookTask: (noteId: string, notebookId: string) => void;

  // Habits (Review)
  habits: HabitDto[];
  addHabit: (name: string) => void;
  toggleHabitDay: (habitId: string, dateStr: string) => void;
  deleteHabit: (id: string) => void;

  // Moods (Review)
  dailyMoods: Record<string, string>;
  setDailyMood: (dateStr: string, moodEmoji: string) => void;

  // Weekly Reflection
  weeklyReflection: string;
  setWeeklyReflection: (text: string) => void;
}

const STORAGE_KEY = "sketchtask_local_storage_v2";

const INITIAL_TAGS: string[] = [
  "Công việc",
  "Cá nhân",
  "Ý tưởng",
  "Học tập",
  "Dự án Web",
  "Tài chính",
];

const INITIAL_USER: UserProfile = {
  name: "Khách (Chưa đăng nhập)",
  email: "",
  avatar: "lucide:User",
  avatarBg: "#BBF7D0",
  isSignedIn: false,
};

// Dữ liệu mẫu phong phú khi người dùng chủ động bấm nạp
const now = new Date();
const todayStr = now.toISOString().split("T")[0];
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split("T")[0];
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];

const INITIAL_NOTEBOOKS: NotebookDto[] = [
  {
    id: "nb-1",
    name: "Dự Án Web Task App",
    description:
      "Sổ tay thiết kế UI/UX và phát triển kiến trúc Digital Sketchbook với bộ icon Lucide đồng bộ",
    color: "#FEF08A" as any,
    icon: "lucide:Rocket",
    taskCount: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nb-2",
    name: "Học Tập & Kiến Trúc Hệ Thống",
    description:
      "Ghi chép chuyên sâu về Frontend Architecture, IndexedDB Engine, Service Worker và Delta Sync",
    color: "#DDD6FE" as any,
    icon: "lucide:Brain",
    taskCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nb-3",
    name: "Sức Khỏe & Thể Thao",
    description:
      "Kế hoạch dinh dưỡng, chạy bộ hàng ngày, bài tập thể lực và theo dõi giấc ngủ",
    color: "#BBF7D0" as any,
    icon: "lucide:Heart",
    taskCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nb-4",
    name: "Tài Chính & Đầu Tư",
    description:
      "Theo dõi dòng tiền, phân bổ danh mục tích lũy và quản trị ngân sách cá nhân",
    color: "#BAE6FD" as any,
    icon: "lucide:TrendingUp",
    taskCount: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "nb-5",
    name: "Đọc Sách & Phát Triển Bản Thân",
    description:
      "Đúc kết những trang sách hay, rèn luyện tư duy phản biện và thói quen tích cực",
    color: "#FECDD3" as any,
    icon: "lucide:BookOpen",
    taskCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_TASKS: TaskDto[] = [
  {
    id: "task-1",
    title:
      "Nghiên cứu tài liệu Design System và chuẩn bị quy chuẩn viền mực 1.5px chống nhòe",
    dueDate: `${todayStr} 08:30`,
    tag: "Học tập" as any,
    completed: true,
    status: "completed",
    priority: "high",
    notebookId: "nb-2",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title:
      "Rà soát và tối ưu hóa hiệu năng render danh sách công việc khi dữ liệu phình to",
    dueDate: `${todayStr} 10:15`,
    tag: "Dự án Web" as any,
    completed: false,
    status: "in_progress",
    priority: "high",
    notebookId: "nb-1",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title:
      "Uống đủ 2.5 lít nước khoáng và thực hiện bài tập giãn cơ cổ vai gáy",
    dueDate: `${todayStr} 11:30`,
    tag: "Cá nhân" as any,
    completed: false,
    status: "todo",
    priority: "medium",
    notebookId: "nb-3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_STICKY_NOTES: StickyNoteItem[] = [
  {
    id: "sn-1",
    content:
      "Ý tưởng: Thêm hiệu ứng âm thanh lật trang giấy nhẹ nhàng khi chuyển tab",
    color: "yellow",
    tilt: "left",
    isPinned: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "sn-2",
    content:
      "Ghi chú nhanh: Tìm hiểu thêm về IndexedDB Dexie.js để lưu dữ liệu offline lâu dài",
    color: "mint",
    tilt: "right",
    isPinned: false,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_HABITS: HabitDto[] = [
  {
    id: "h-1",
    name: "Uống 2L nước mỗi ngày",
    frequency: "daily",
    completedDates: [yesterdayStr, todayStr],
    streak: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "h-2",
    name: "Đọc 20 trang sách chuyên ngành",
    frequency: "daily",
    completedDates: [todayStr],
    streak: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const INITIAL_MOODS: Record<string, string> = {
  [todayStr]: "lucide:SmilePlus",
  [yesterdayStr]: "lucide:Smile",
};

const INITIAL_REFLECTION =
  "Một tuần làm việc năng suất và trọn vẹn! Đã hoàn thiện toàn bộ hệ thống SVG Icons sắc nét và đồng bộ hóa đám mây Realtime.";

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --- Profile state ---
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedToken = authStorage.getToken();
      const saved = localStorage.getItem(`${STORAGE_KEY}_user`);
      if (saved && savedToken) {
        return JSON.parse(saved);
      }
      return INITIAL_USER;
    } catch {
      return INITIAL_USER;
    }
  });

  // --- Sync state ---
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_last_synced`);
  });
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  // --- First visit onboarding ---
  const [isFirstVisit, setIsFirstVisit] = useState<boolean>(() => {
    return !localStorage.getItem(`${STORAGE_KEY}_visited`);
  });

  const dismissOnboarding = () => {
    localStorage.setItem(`${STORAGE_KEY}_visited`, "1");
    setIsFirstVisit(false);
  };

  // --- Settings state ---
  const [isTiltEnabled, setIsTiltEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tilt`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [hideCompletedTasks, setHideCompletedTasks] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_hide_completed`);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isNotificationsEnabled, setIsNotificationsEnabledState] =
    useState<boolean>(() => {
      try {
        const saved = localStorage.getItem(
          `${STORAGE_KEY}_notifications_enabled`,
        );
        return saved !== null ? JSON.parse(saved) : true;
      } catch {
        return true;
      }
    });

  const setIsNotificationsEnabled = (enabled: boolean) => {
    setIsNotificationsEnabledState(enabled);
    localStorage.setItem(
      `${STORAGE_KEY}_notifications_enabled`,
      JSON.stringify(enabled),
    );
    if (!enabled) {
      // Hủy toàn bộ thông báo khi người dùng tắt
      if (typeof window !== "undefined" && "LocalNotifications" in window) {
        notificationService.cancelAll?.();
      }
    } else {
      // Đồng bộ lại thông báo khi bật
      notificationService.syncAllTasks(tasks);
    }
  };

  // --- Dark Mode State ---
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_darkmode`);
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const setIsDarkMode = (enabled: boolean) => {
    setIsDarkModeState(enabled);
    localStorage.setItem(`${STORAGE_KEY}_darkmode`, JSON.stringify(enabled));
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDarkMode);
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute(
          "content",
          isDarkMode ? "#1C1917" : "#FBF9F4",
        );
      }
    }
  }, [isDarkMode]);

  const triggerHaptic = () => {};

  // --- Main Data States (bắt đầu trống nếu chưa có data) ---
  const [tasks, setTasks] = useState<TaskDto[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tasks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tags`);
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  });

  const [notebooks, setNotebooks] = useState<NotebookDto[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notebooks`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [stickyNotes, setStickyNotes] = useState<StickyNoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_notes`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [habits, setHabits] = useState<HabitDto[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_habits`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dailyMoods, setDailyMoods] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_moods`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [weeklyReflection, setWeeklyReflection] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_reflection`);
      return saved !== null ? saved : "";
    } catch {
      return "";
    }
  });

  const [theme, setTheme] = useState<ColorTheme>("warm");

  // Flag ngăn loop sync khi nhận update từ socket
  const isApplyingRemoteSync = useRef(false);
  const syncDebounceTimer = useRef<any>(null);

  // Safe Storage Writer chống lỗi QuotaExceededError khi dữ liệu phình to
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (err: any) {
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        console.warn(`⚠️ LocalStorage đầy bộ nhớ khi lưu ${key}. Đang kích hoạt cơ chế bảo vệ an toàn.`);
      }
    }
  };

  // Sync to LocalStorage
  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_user`, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_tilt`, JSON.stringify(isTiltEnabled));
  }, [isTiltEnabled]);

  useEffect(() => {
    safeSetItem(
      `${STORAGE_KEY}_hide_completed`,
      JSON.stringify(hideCompletedTasks),
    );
  }, [hideCompletedTasks]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_tasks`, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_tags`, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_notebooks`, JSON.stringify(notebooks));
  }, [notebooks]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_notes`, JSON.stringify(stickyNotes));
  }, [stickyNotes]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_habits`, JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_moods`, JSON.stringify(dailyMoods));
  }, [dailyMoods]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_reflection`, weeklyReflection);
  }, [weeklyReflection]);

  // Ref lưu dữ liệu mới nhất để push/pull an toàn mà không làm re-trigger hooks
  const appDataRef = useRef({
    tasks,
    notebooks,
    stickyNotes,
    habits,
    dailyMoods,
    weeklyReflection,
    tags,
    isSignedIn: user.isSignedIn,
  });

  useEffect(() => {
    appDataRef.current = {
      tasks,
      notebooks,
      stickyNotes,
      habits,
      dailyMoods,
      weeklyReflection,
      tags,
      isSignedIn: user.isSignedIn,
    };
  }, [
    tasks,
    notebooks,
    stickyNotes,
    habits,
    dailyMoods,
    weeklyReflection,
    tags,
    user.isSignedIn,
  ]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // --- HÀM ĐỒNG BỘ ĐẨY DỮ LIỆU LÊN SERVER ---
  const pushDataToServer = useCallback(async (overrideData?: any) => {
    const token = authStorage.getToken();
    if (!appDataRef.current.isSignedIn || !token) return;

    const current = appDataRef.current;
    const payload = overrideData || {
      tasks: current.tasks,
      notebooks: current.notebooks,
      stickyNotes: current.stickyNotes,
      habits: current.habits,
      dailyMoods: current.dailyMoods,
      weeklyReflection: current.weeklyReflection,
      tags: current.tags,
    };

    setSyncStatus("syncing");
    try {
      const res = await api.sync.push(payload);
      if (res.success) {
        const nowStr = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSyncStatus("synced");
        setLastSyncedAt(nowStr);
        localStorage.setItem(`${STORAGE_KEY}_last_synced`, nowStr);
      } else {
        setSyncStatus("error");
      }
    } catch {
      setSyncStatus("error");
    }
  }, []);

  // Kích hoạt Debounced Sync chỉ khi người dùng có thao tác cục bộ
  const triggerDebouncedPush = useCallback(
    (partialData?: any) => {
      const token = authStorage.getToken();
      if (!appDataRef.current.isSignedIn || !token) return;

      if (syncDebounceTimer.current) {
        clearTimeout(syncDebounceTimer.current);
      }

      syncDebounceTimer.current = setTimeout(() => {
        const current = appDataRef.current;
        const fullPayload = {
          tasks: partialData?.tasks ?? current.tasks,
          notebooks: partialData?.notebooks ?? current.notebooks,
          stickyNotes: partialData?.stickyNotes ?? current.stickyNotes,
          habits: partialData?.habits ?? current.habits,
          dailyMoods: partialData?.dailyMoods ?? current.dailyMoods,
          weeklyReflection:
            partialData?.weeklyReflection ?? current.weeklyReflection,
          tags: partialData?.tags ?? current.tags,
        };
        pushDataToServer(fullPayload);
      }, 500);
    },
    [pushDataToServer],
  );

  // --- HÀM KÉO VÀ HỢP NHẤT DỮ LIỆU TỪ SERVER VỀ CLIENT (SMART MERGE) ---
  const pullDataFromServer = useCallback(async (): Promise<boolean> => {
    if (!authStorage.getToken()) return false;

    setSyncStatus("syncing");
    try {
      const res = await api.sync.pull();
      if (res.success && res.data) {
        const serverData = res.data;
        isApplyingRemoteSync.current = true;

        // Hợp nhất thông minh dữ liệu Local đang có với dữ liệu trên Server
        const currentLocal = appDataRef.current;
        const merged = smartMergeAppData(
          {
            tasks: currentLocal.tasks,
            notebooks: currentLocal.notebooks,
            stickyNotes: currentLocal.stickyNotes,
            habits: currentLocal.habits,
            dailyMoods: currentLocal.dailyMoods,
            weeklyReflection: currentLocal.weeklyReflection,
            tags: currentLocal.tags,
          },
          serverData,
        );

        setTasks(merged.tasks);
        setNotebooks(merged.notebooks);
        setStickyNotes(merged.stickyNotes);
        setHabits(merged.habits);
        setDailyMoods(merged.dailyMoods);
        setWeeklyReflection(merged.weeklyReflection);
        setTags(merged.tags);

        // Đẩy bản hợp nhất lên server để hoàn thiện đồng bộ 2 chiều
        await pushDataToServer(merged);

        setTimeout(() => {
          isApplyingRemoteSync.current = false;
        }, 500);

        const nowStr = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        setSyncStatus("synced");
        setLastSyncedAt(nowStr);
        localStorage.setItem(`${STORAGE_KEY}_last_synced`, nowStr);
        return true;
      } else {
        setSyncStatus("error");
        return false;
      }
    } catch {
      setSyncStatus("error");
      return false;
    }
  }, [pushDataToServer]);

  // Đồng bộ thủ công khi user bấm nút "Đồng bộ ngay"
  const syncNow = async (): Promise<boolean> => {
    if (!user.isSignedIn) return false;
    await pushDataToServer();
    const result = await pullDataFromServer();
    return Boolean(result);
  };

  // --- XỬ LÝ KHỞI TẠO VÀ WEBSOCKET REALTIME (CHỈ CHẠY 1 LẦN KHI MOUNT) ---
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      // Khôi phục user profile từ server
      api.auth
        .getMe()
        .then((res) => {
          if (res.success && res.data) {
            setUser({
              name: res.data.name,
              email: res.data.email,
              avatar: res.data.avatar || "lucide:User",
              avatarBg: res.data.avatarBg || "#BBF7D0",
              isSignedIn: true,
            });
            // Mở kết nối WebSocket
            syncSocket.connect();
            // Kéo dữ liệu
            pullDataFromServer();
          } else {
            // Token hết hạn
            authStorage.removeToken();
            setUser(INITIAL_USER);
          }
        })
        .catch(() => {
          // Lỗi mạng, vẫn giữ state local
        });
    }

    // Lắng nghe sự kiện sync Realtime từ các thiết bị / tab khác
    const unsubscribeSync = syncSocket.onSync((remoteData) => {
      isApplyingRemoteSync.current = true;
      if (remoteData.tasks) setTasks(remoteData.tasks);
      if (remoteData.notebooks) setNotebooks(remoteData.notebooks);
      if (remoteData.stickyNotes) setStickyNotes(remoteData.stickyNotes);
      if (remoteData.habits) setHabits(remoteData.habits);
      if (remoteData.dailyMoods) setDailyMoods(remoteData.dailyMoods);
      if (remoteData.weeklyReflection !== undefined)
        setWeeklyReflection(remoteData.weeklyReflection);
      if (remoteData.tags) setTags(remoteData.tags);

      const nowStr = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setSyncStatus("synced");
      setLastSyncedAt(nowStr);

      setTimeout(() => {
        isApplyingRemoteSync.current = false;
      }, 500);
    });

    return () => {
      unsubscribeSync();
      syncSocket.disconnect();
    };
  }, []);

  // --- AUTH METHODS THỰC TẾ ---
  const registerWithCredentials = async (
    name: string,
    email: string,
    password?: string,
  ) => {
    setSyncStatus("syncing");
    const res = await api.auth.register(name, email, password);
    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      setUser({
        name: res.data.user.name,
        email: res.data.user.email,
        avatar: res.data.user.avatar || "lucide:User",
        avatarBg: res.data.user.avatarBg || "#BBF7D0",
        isSignedIn: true,
      });
      syncSocket.connect();
      // Đẩy dữ liệu hiện có lên tài khoản mới
      await pushDataToServer();
      return { success: true };
    }
    setSyncStatus("error");
    return { success: false, message: res.message || "Đăng ký thất bại" };
  };

  const loginWithCredentials = async (email: string, password?: string) => {
    setSyncStatus("syncing");
    const res = await api.auth.login(email, password);
    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      setUser({
        name: res.data.user.name,
        email: res.data.user.email,
        avatar: res.data.user.avatar || "lucide:User",
        avatarBg: res.data.user.avatarBg || "#BBF7D0",
        isSignedIn: true,
      });
      syncSocket.connect();
      await pullDataFromServer();
      return { success: true };
    }
    setSyncStatus("error");
    return { success: false, message: res.message || "Đăng nhập thất bại" };
  };

  const loginWithGoogle = async (data: {
    email: string;
    name: string;
    avatar?: string;
    avatarBg?: string;
  }) => {
    setSyncStatus("syncing");
    const res = await api.auth.google(data);
    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      setUser({
        name: res.data.user.name,
        email: res.data.user.email,
        avatar: res.data.user.avatar || "lucide:Sparkles",
        avatarBg: res.data.user.avatarBg || "#FEF08A",
        isSignedIn: true,
      });
      syncSocket.connect();
      await pullDataFromServer();
      return { success: true };
    }
    setSyncStatus("error");
    return {
      success: false,
      message: res.message || "Đăng nhập Google thất bại",
    };
  };

  const login = (
    name: string,
    email: string,
    avatar = "lucide:User",
    avatarBg = "#BBF7D0",
  ) => {
    loginWithCredentials(email, "123456").catch(() => {
      // Fallback local
      setUser({
        name,
        email,
        avatar,
        avatarBg,
        isSignedIn: true,
      });
    });
  };

  const logout = () => {
    authStorage.removeToken();
    syncSocket.disconnect();
    setUser(INITIAL_USER);
    setSyncStatus("idle");
    setLastSyncedAt(null);
    localStorage.removeItem(`${STORAGE_KEY}_last_synced`);
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      if (user.isSignedIn) {
        api.auth.updateProfile({
          name: updated.name,
          avatar: updated.avatar,
          avatarBg: updated.avatarBg,
        });
      }
      return updated;
    });
  };

  // Nạp lại toàn bộ dữ liệu mẫu lớn thử tải
  const loadSampleData = () => {
    setTasks(INITIAL_TASKS);
    setNotebooks(INITIAL_NOTEBOOKS);
    setStickyNotes(INITIAL_STICKY_NOTES);
    setHabits(INITIAL_HABITS);
    setDailyMoods(INITIAL_MOODS);
    setWeeklyReflection(INITIAL_REFLECTION);
    setTags(INITIAL_TAGS);

    if (user.isSignedIn) {
      pushDataToServer({
        tasks: INITIAL_TASKS,
        notebooks: INITIAL_NOTEBOOKS,
        stickyNotes: INITIAL_STICKY_NOTES,
        habits: INITIAL_HABITS,
        dailyMoods: INITIAL_MOODS,
        weeklyReflection: INITIAL_REFLECTION,
        tags: INITIAL_TAGS,
      });
    }
  };

  // --- CÁC HÀM CRUD DATA (OFFLINE-FIRST + AUTO SYNC TRỰC TIẾP KHI USER THAO TÁC) ---
  const addTask = (taskData: {
    title: string;
    dueDate?: string;
    tag?: string;
    notebookId?: string;
    priority?: TaskPriority;
  }) => {
    const newTask: TaskDto = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      dueDate: taskData.dueDate,
      tag: taskData.tag as any,
      notebookId: taskData.notebookId,
      completed: false,
      status: "todo",
      priority: taskData.priority || "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => {
      const next = [newTask, ...prev];
      triggerDebouncedPush({ tasks: next });
      return next;
    });

    // Lên lịch thông báo ngoài màn hình nếu task có ngày giờ hẹn
    if (newTask.dueDate) {
      notificationService.scheduleTask(newTask);
    }

    if (taskData.notebookId) {
      setNotebooks((prev) => {
        const next = prev.map((nb) =>
          nb.id === taskData.notebookId
            ? {
                ...nb,
                taskCount: (nb.taskCount || 0) + 1,
                updatedAt: new Date().toISOString(),
              }
            : nb,
        );
        triggerDebouncedPush({ notebooks: next });
        return next;
      });
    }

    return newTask;
  };

  const toggleTask = (id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;
        const newCompleted = !t.completed;
        const newStatus: TaskStatus = newCompleted ? "completed" : "todo";
        const updatedTask = {
          ...t,
          completed: newCompleted,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        };

        if (newCompleted) {
          notificationService.cancelTask(id);
        } else if (updatedTask.dueDate) {
          notificationService.scheduleTask(updatedTask);
        }

        return updatedTask;
      });
      triggerDebouncedPush({ tasks: next });
      return next;
    });
  };

  const deleteTask = (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    notificationService.cancelTask(id);

    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      triggerDebouncedPush({ tasks: next });
      return next;
    });

    if (taskToDelete?.notebookId) {
      setNotebooks((prev) => {
        const next = prev.map((nb) =>
          nb.id === taskToDelete.notebookId
            ? {
                ...nb,
                taskCount: Math.max(0, (nb.taskCount || 1) - 1),
                updatedAt: new Date().toISOString(),
              }
            : nb,
        );
        triggerDebouncedPush({ notebooks: next });
        return next;
      });
    }
  };

  const moveTaskToTomorrow = (id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              dueDate: tomorrowStr,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      triggerDebouncedPush({ tasks: next });
      return next;
    });
  };

  const moveTaskToToday = (id: string) => {
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              dueDate: todayStr,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      triggerDebouncedPush({ tasks: next });
      return next;
    });
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => {
        const next = [...prev, trimmed];
        triggerDebouncedPush({ tags: next });
        return next;
      });
    }
  };

  const deleteTag = (tag: string) => {
    setTags((prev) => {
      const next = prev.filter((t) => t !== tag);
      triggerDebouncedPush({ tags: next });
      return next;
    });
  };

  const addNotebook = (data: {
    name: string;
    description?: string;
    color: string;
    icon?: string;
  }) => {
    const newNb: NotebookDto = {
      id: `nb-${Date.now()}`,
      name: data.name,
      description: data.description,
      color: data.color as any,
      icon: data.icon || "lucide:BookOpen",
      taskCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotebooks((prev) => {
      const next = [...prev, newNb];
      triggerDebouncedPush({ notebooks: next });
      return next;
    });
    return newNb;
  };

  const updateNotebook = (id: string, updates: Partial<NotebookDto>) => {
    setNotebooks((prev) => {
      const next = prev.map((nb) =>
        nb.id === id
          ? { ...nb, ...updates, updatedAt: new Date().toISOString() }
          : nb,
      );
      triggerDebouncedPush({ notebooks: next });
      return next;
    });
  };

  const deleteNotebook = (id: string) => {
    setNotebooks((prev) => {
      const next = prev.filter((nb) => nb.id !== id);
      triggerDebouncedPush({ notebooks: next });
      return next;
    });
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.notebookId === id ? { ...t, notebookId: undefined } : t,
      );
      triggerDebouncedPush({ tasks: next });
      return next;
    });
  };

  const addStickyNote = (
    content: string,
    color: StickyNoteItem["color"] = "yellow",
  ) => {
    const tilts: StickyNoteItem["tilt"][] = ["left", "right", "none"];
    const randomTilt = tilts[Math.floor(Math.random() * tilts.length)];

    const newNote: StickyNoteItem = {
      id: `note-${Date.now()}`,
      content,
      color,
      tilt: randomTilt,
      isPinned: false,
      createdAt: new Date().toISOString(),
    };
    setStickyNotes((prev) => {
      const next = [newNote, ...prev];
      triggerDebouncedPush({ stickyNotes: next });
      return next;
    });
  };

  const togglePinStickyNote = (id: string) => {
    setStickyNotes((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, isPinned: !n.isPinned } : n,
      );
      triggerDebouncedPush({ stickyNotes: next });
      return next;
    });
  };

  const deleteStickyNote = (id: string) => {
    setStickyNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      triggerDebouncedPush({ stickyNotes: next });
      return next;
    });
  };

  const convertNoteToTask = (id: string) => {
    const note = stickyNotes.find((n) => n.id === id);
    if (!note) return;

    addTask({
      title: note.content,
      dueDate: todayStr,
      tag: "Ý tưởng",
    });
    deleteStickyNote(id);
  };

  const convertNoteToNotebookTask = (noteId: string, notebookId: string) => {
    const note = stickyNotes.find((n) => n.id === noteId);
    if (!note) return;

    addTask({
      title: note.content,
      dueDate: todayStr,
      notebookId,
      tag: "Ý tưởng",
    });
    deleteStickyNote(noteId);
  };

  const addHabit = (name: string) => {
    const newHabit: HabitDto = {
      id: `habit-${Date.now()}`,
      name,
      frequency: "daily",
      completedDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setHabits((prev) => {
      const next = [...prev, newHabit];
      triggerDebouncedPush({ habits: next });
      return next;
    });
  };

  const toggleHabitDay = (habitId: string, dateStr: string) => {
    setHabits((prev) => {
      const next = prev.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateStr);
        const newDates = exists
          ? h.completedDates.filter((d) => d !== dateStr)
          : [...h.completedDates, dateStr];

        return {
          ...h,
          completedDates: newDates,
          streak: newDates.length,
          updatedAt: new Date().toISOString(),
        };
      });
      triggerDebouncedPush({ habits: next });
      return next;
    });
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => {
      const next = prev.filter((h) => h.id !== id);
      triggerDebouncedPush({ habits: next });
      return next;
    });
  };
  const setDailyMood = (dateStr: string, moodEmoji: string) => {
    setDailyMoods((prev) => {
      const next = {
        ...prev,
        [dateStr]: moodEmoji,
      };
      triggerDebouncedPush({ dailyMoods: next });
      return next;
    });
  };

  const handleSetWeeklyReflection = (text: string) => {
    setWeeklyReflection(text);
    triggerDebouncedPush({ weeklyReflection: text });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        login,
        loginWithCredentials,
        registerWithCredentials,
        loginWithGoogle,
        logout,
        updateUserProfile,
        syncStatus,
        lastSyncedAt,
        isOnline,
        syncNow,
        isFirstVisit,
        dismissOnboarding,
        theme,
        setTheme,
        isTiltEnabled,
        setIsTiltEnabled,
        hideCompletedTasks,
        setHideCompletedTasks,
        isNotificationsEnabled,
        setIsNotificationsEnabled,
        isDarkMode,
        setIsDarkMode,
        triggerHaptic,
        loadSampleData,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        moveTaskToTomorrow,
        moveTaskToToday,
        tags,
        addTag,
        deleteTag,
        notebooks,
        addNotebook,
        updateNotebook,
        deleteNotebook,
        stickyNotes,
        addStickyNote,
        togglePinStickyNote,
        deleteStickyNote,
        convertNoteToTask,
        convertNoteToNotebookTask,
        habits,
        addHabit,
        toggleHabitDay,
        deleteHabit,
        dailyMoods,
        setDailyMood,
        weeklyReflection,
        setWeeklyReflection: handleSetWeeklyReflection,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppStore = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
};
