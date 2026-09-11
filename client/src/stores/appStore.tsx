import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { TaskDto, HabitDto, TaskStatus, TaskPriority, TaskTimeType, JournalEntryDto, SettingsSectionKey, DeletedEntityIds, TaskEditorInitialData } from "../types";
import { api, authStorage } from "../services/api";
import { syncSocket } from "../services/syncSocket";
import { smartMergeAppData } from "../utils/syncMerge";
import { notificationService } from "../services/notificationService";
import { sounds } from "../utils/soundEffects";
import { generateSample50Tasks } from "../data/sample50Tasks";
import { getLocalTodayStr, getNextDayStr } from "../utils/date";
import { dispatchToast } from "../utils/toast";
import {
  constrainTaskToParent,
  getInheritedParentSchedule,
  getTaskEffectiveDate,
  moveTaskToDate,
  wouldCreateTaskCycle,
} from "../utils/taskSemantics";
import { calculateConsecutiveStreak } from "../utils/habitSemantics";

export type { TaskDto, TaskPriority, HabitDto, TaskStatus, TaskTimeType, JournalEntryDto, SettingsSectionKey, DeletedEntityIds, TaskEditorInitialData };

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
export type InterfaceStyle = "sketch" | "ios";
export type FontSizePreference = "normal" | "large" | "xlarge";
export type FontFamilyPreference = "inter" | "jakarta" | "system";
export type PaperStyle = "blank" | "lined" | "dots" | "grid";

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
  updatedAt?: string;
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
    accessToken: string;
  }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateUserProfile: (data: Partial<UserProfile>) => void;

  // Cloud Sync & Realtime
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isOnline: boolean;
  syncNow: () => Promise<boolean>;

  // Auth In-App Modal
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

  // Settings
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
  interfaceStyle: InterfaceStyle;
  setInterfaceStyle: (style: InterfaceStyle) => void;
  fontSize: FontSizePreference;
  setFontSize: (size: FontSizePreference) => void;
  fontFamily: FontFamilyPreference;
  setFontFamily: (family: FontFamilyPreference) => void;
  isTiltEnabled: boolean;
  setIsTiltEnabled: (enabled: boolean) => void;
  hideCompletedTasks: boolean;
  setHideCompletedTasks: (hide: boolean) => void;
  isNotificationsEnabled: boolean;
  setIsNotificationsEnabled: (enabled: boolean) => void;
  isNotificationPanelOpen: boolean;
  notificationActiveTab: "all" | "unread" | "overdue" | "pastScheduled";
  openNotificationPanel: (tab?: "all" | "unread" | "overdue" | "pastScheduled") => void;
  closeNotificationPanel: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (enabled: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  soundVolume: number;
  setSoundVolume: (vol: number) => void;
  paperStyle: PaperStyle;
  setPaperStyle: (style: PaperStyle) => void;
  pinCode: string | null;
  setPinCode: (pin: string | null) => void;
  isPinLocked: boolean;
  unlockWithPin: (newPin?: string) => void;
  lockApp: () => void;
  triggerHaptic: () => void;
  loadSampleData: () => void;
  loadSample50Tasks: () => void;
  archiveOldTasks: (days?: number) => number;

  // Tasks
  tasks: TaskDto[];
  addTask: (task: {
    title: string;
    description?: string;
    dueDate?: string;
    startDate?: string;
    endDate?: string;
    timeType?: TaskTimeType;
    startTime?: string;
    endTime?: string;
    deadlineDate?: string;
    deadlineTime?: string;
    tag?: string;
    tags?: string[];
    parentTaskId?: string;
    priority?: TaskPriority;
  }) => TaskDto;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  moveTaskToTomorrow: (id: string) => void;
  moveTaskToNextDay: (id: string, baseDateStr?: string) => void;
  moveTaskToToday: (id: string) => void;
  updateTask: (id: string, updates: Partial<TaskDto>) => void;

  // Custom Tags
  tags: string[];
  addTag: (tag: string) => void;
  deleteTag: (tag: string) => void;

  // Sticky Notes (Brain Dump)
  stickyNotes: StickyNoteItem[];
  addStickyNote: (content: string, color?: StickyNoteItem["color"]) => void;
  togglePinStickyNote: (id: string) => void;
  deleteStickyNote: (id: string) => void;
  convertNoteToTask: (id: string) => void;

  // Habits (Review)
  habits: HabitDto[];
  addHabit: (name: string, frequency?: HabitDto["frequency"]) => void;
  updateHabit: (id: string, updates: Partial<Pick<HabitDto, "name" | "frequency" | "targetDaysPerWeek">>) => void;
  toggleHabitDay: (habitId: string, dateStr: string) => void;
  deleteHabit: (id: string) => void;

  // Moods (Review)
  dailyMoods: Record<string, string>;
  setDailyMood: (dateStr: string, moodEmoji: string) => void;

  // Weekly Reflection
  weeklyReflection: string;
  setWeeklyReflection: (text: string) => void;

  // Journal (Nhật ký theo ngày & giờ)
  journalEntries: JournalEntryDto[];
  addJournalEntry: (data: {
    date: string;
    time: string;
    content: string;
    linkedTaskId?: string;
  }) => JournalEntryDto;
  updateJournalEntry: (id: string, updates: Partial<JournalEntryDto>) => void;
  deleteJournalEntry: (id: string) => void;
  journalPromptTask: TaskDto | null;
  setJournalPromptTask: (task: TaskDto | null) => void;
  openJournalWithTask: (task: TaskDto) => void;
  completedTaskPrompt: TaskDto | null;
  dismissCompletedTaskPrompt: () => void;

  // Active Task SubTab (Hôm nay | Kế hoạch | Hạn định)
  activeTaskSubTab: "today" | "planner" | "deadlines";
  setActiveTaskSubTab: (subTab: "today" | "planner" | "deadlines") => void;
  selectedPlannerDate: string;
  setSelectedPlannerDate: (date: string) => void;

  // Active Detail Task (Full page Document Canvas)
  activeDetailTaskId: string | null;
  activeTaskDetailInitialData: TaskEditorInitialData | null;
  openTaskDetail: (taskId?: string, initialData?: TaskEditorInitialData) => void;
  closeTaskDetail: () => void;

  // Quick Task Creation Modal
  isQuickTaskModalOpen: boolean;
  quickTaskInitialData: {
    dueDate?: string;
    tag?: string;
    timeType?: TaskTimeType;
    startTime?: string;
    endTime?: string;
  } | null;
  openQuickTaskModal: (initialData?: {
    dueDate?: string;
    tag?: string;
    timeType?: TaskTimeType;
    startTime?: string;
    endTime?: string;
  }) => void;
  closeQuickTaskModal: () => void;

  // Active Note SubTab (Ghi chú | Nhật ký)
  activeNoteSubTab: "notes" | "journal";
  setActiveNoteSubTab: (subTab: "notes" | "journal") => void;

  // Settings Mobile SubView
  settingsMobileSubView: SettingsSectionKey | null;
  setSettingsMobileSubView: (view: SettingsSectionKey | null) => void;

  // Note Detail State (Trình soạn thảo ghi chú chiếm toàn không gian)
  isMobileNoteDetailOpen: boolean;
  setIsMobileNoteDetailOpen: (open: boolean) => void;

  // Journal Book Detail State (Trang nhật ký bên trong một cuốn sổ)
  isJournalBookOpen: boolean;
  setIsJournalBookOpen: (open: boolean) => void;
}

export const APP_STORAGE_KEY = "sketchtask_local_storage_v2";
const STORAGE_KEY = APP_STORAGE_KEY;

const EMPTY_DELETED_ENTITY_IDS: DeletedEntityIds = {
  tasks: [],
  stickyNotes: [],
  habits: [],
  journalEntries: [],
  tags: [],
};

const readDeletedEntityIds = (): DeletedEntityIds => {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY}_deleted`);
    if (!saved) return EMPTY_DELETED_ENTITY_IDS;
    const parsed = JSON.parse(saved) as Partial<DeletedEntityIds>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      stickyNotes: Array.isArray(parsed.stickyNotes) ? parsed.stickyNotes : [],
      habits: Array.isArray(parsed.habits) ? parsed.habits : [],
      journalEntries: Array.isArray(parsed.journalEntries) ? parsed.journalEntries : [],
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    };
  } catch {
    return EMPTY_DELETED_ENTITY_IDS;
  }
};

// Keep an explicit null in sync payloads so clearing a parent is persisted on the server.
const serializeTasksForSync = (taskList: TaskDto[]) =>
  taskList.map((task) => ({
    ...task,
    parentTaskId: task.parentTaskId || null,
  }));

const INITIAL_TAGS: string[] = [
  "Công việc",
  "Cá nhân",
  "Ý tưởng",
  "Học tập",
  "Dự án Web",
  "Tài chính",
];

const INITIAL_USER: UserProfile = {
  name: "Khách",
  email: "",
  avatar: "lucide:User",
  avatarBg: "#FEF08A",
  isSignedIn: false,
};

// Dữ liệu mẫu phong phú khi người dùng chủ động bấm nạp
const now = new Date();
const todayStr = now.toISOString().split("T")[0];
const yesterday = new Date(now);
yesterday.setDate(now.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split("T")[0];

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

const INITIAL_JOURNAL: JournalEntryDto[] = [
  {
    id: "jn-1",
    date: todayStr,
    time: "08:35",
    content: "Bắt đầu ngày mới với việc hoàn thiện quy chuẩn viền mực 1.5px và hard offset shadow cho hệ thống.",
    linkedTaskId: "task-1",
    createdAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "jn-2",
    date: todayStr,
    time: "10:20",
    content: "Review lại hiệu năng tải component Sổ tay & Nhật ký, mọi thao tác cuộn và lật trang đều mượt mà 60fps.",
    linkedTaskId: "task-2",
    createdAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "jn-3",
    date: todayStr,
    time: "14:15",
    content: "Đã uống đủ nước và thư giãn 15 phút giữa giờ. Cảm thấy tràn đầy năng lượng để tiếp tục công việc buổi chiều!",
    linkedTaskId: "task-3",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "jn-4",
    date: todayStr,
    time: "17:00",
    content: "Ý tưởng: Đã thử nghiệm thành công bộ chọn Sổ tay trực tiếp trên từng dòng nhật ký.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "jn-5",
    date: yesterdayStr,
    time: "09:00",
    content: "Khởi động tuần mới: Lập danh mục các mục tiêu quan trọng cần hoàn thành trong tháng.",
    createdAt: new Date(yesterday.getTime() - 3 * 3600 * 1000).toISOString(),
    updatedAt: new Date(yesterday.getTime() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "jn-6",
    date: yesterdayStr,
    time: "16:45",
    content: "Đọc xong chương 3 về Tư duy thiết kế tương tác người dùng. Rút ra nhiều bài học giá trị về Visual Hierarchy.",
    createdAt: new Date(yesterday.getTime() + 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(yesterday.getTime() + 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "jn-7",
    date: yesterdayStr,
    time: "21:30",
    content: "Tổng kết chi tiêu trong tuần và cân đối ngân sách cho các dự án sắp tới.",
    createdAt: new Date(yesterday.getTime() + 9 * 3600 * 1000).toISOString(),
    updatedAt: new Date(yesterday.getTime() + 9 * 3600 * 1000).toISOString(),
  },
];

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
        const parsed = JSON.parse(saved);
        if (
          !parsed.avatarBg ||
          parsed.avatarBg === "#BBF7D0" ||
          parsed.avatarBg === "#BAE6FD" ||
          parsed.avatarBg === "#FECDD3" ||
          parsed.avatarBg === "#DDD6FE" ||
          parsed.avatarBg === "#FED7AA"
        ) {
          parsed.avatarBg = "#FEF08A";
        }
        return parsed;
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

  // --- Auth Modal In-App ---
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), []);
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), []);

  // --- Settings state ---
  const [settingsMobileSubView, setSettingsMobileSubViewState] = useState<SettingsSectionKey | null>(null);
  const setSettingsMobileSubView = useCallback((view: SettingsSectionKey | null) => {
    setSettingsMobileSubViewState(view);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // --- Mobile Note Detail State ---
  const [isMobileNoteDetailOpen, setIsMobileNoteDetailOpenState] = useState<boolean>(false);
  const setIsMobileNoteDetailOpen = useCallback((open: boolean) => {
    setIsMobileNoteDetailOpenState(open);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // --- Journal Book Detail State ---
  const [isJournalBookOpen, setIsJournalBookOpenState] = useState<boolean>(false);
  const setIsJournalBookOpen = useCallback((open: boolean) => {
    setIsJournalBookOpenState(open);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);
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

  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notificationActiveTab, setNotificationActiveTab] = useState<
    "all" | "unread" | "overdue" | "pastScheduled"
  >("all");

  const openNotificationPanel = (
    tab: "all" | "unread" | "overdue" | "pastScheduled" = "all"
  ) => {
    setNotificationActiveTab(tab);
    setIsNotificationPanelOpen(true);
  };

  const closeNotificationPanel = () => {
    setIsNotificationPanelOpen(false);
  };

  const setIsNotificationsEnabled = (enabled: boolean) => {
    setIsNotificationsEnabledState(enabled);
    notificationService.setEnabled(enabled);
    localStorage.setItem(
      `${STORAGE_KEY}_notifications_enabled`,
      JSON.stringify(enabled),
    );
    if (!enabled) {
      // Hủy toàn bộ thông báo trên cả native và web khi người dùng tắt.
      void notificationService.cancelAll();
    } else {
      // Đồng bộ lại thông báo khi bật
      void notificationService.syncAllTasks(tasks);
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
          isDarkMode ? "#18181B" : "#FBF9F4",
        );
      }
    }
  }, [isDarkMode]);

  // --- Sidebar Collapse / Expand State ---
  const [isSidebarOpen, setIsSidebarOpenState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sidebar_open`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpenState((prev) => {
      const next = !prev;
      localStorage.setItem(`${STORAGE_KEY}_sidebar_open`, JSON.stringify(next));
      return next;
    });
  };

  const setSidebarOpen = (open: boolean) => {
    setIsSidebarOpenState(open);
    localStorage.setItem(`${STORAGE_KEY}_sidebar_open`, JSON.stringify(open));
  };

  // --- Active Task SubTab (Hôm nay | Kế hoạch | Hạn định) ---
  const [activeTaskSubTab, setActiveTaskSubTabState] = useState<"today" | "planner" | "deadlines">("today");
  const setActiveTaskSubTab = useCallback((subTab: "today" | "planner" | "deadlines") => {
    setActiveTaskSubTabState(subTab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);
  const [selectedPlannerDate, setSelectedPlannerDate] = useState<string>(() => getLocalTodayStr());

  // --- Active Note SubTab (Ghi chú | Nhật ký) ---
  const [activeNoteSubTab, setActiveNoteSubTabState] = useState<"notes" | "journal">("notes");
  const setActiveNoteSubTab = useCallback((subTab: "notes" | "journal") => {
    setActiveNoteSubTabState(subTab);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // --- Sound Effects & Paper Style Settings ---
  const [isSoundEnabled, setIsSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sound_enabled`);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setIsSoundEnabled = (enabled: boolean) => {
    setIsSoundEnabledState(enabled);
    localStorage.setItem(`${STORAGE_KEY}_sound_enabled`, JSON.stringify(enabled));
  };

  const [soundVolume, setSoundVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_sound_volume`);
      return saved !== null ? JSON.parse(saved) : 0.5;
    } catch {
      return 0.5;
    }
  });

  const setSoundVolume = (vol: number) => {
    setSoundVolumeState(vol);
    localStorage.setItem(`${STORAGE_KEY}_sound_volume`, JSON.stringify(vol));
  };

  const [paperStyle, setPaperStyleState] = useState<"blank" | "lined" | "dots" | "grid">(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_paper_style`);
      return (saved as any) || "blank";
    } catch {
      return "blank";
    }
  });

  const setPaperStyle = (style: "blank" | "lined" | "dots" | "grid") => {
    setPaperStyleState(style);
    localStorage.setItem(`${STORAGE_KEY}_paper_style`, style);
    if (typeof document !== "undefined") {
      document.body.classList.remove("paper-lined", "paper-dots", "paper-grid");
      if (style !== "blank") {
        document.body.classList.add(`paper-${style}`);
      }
    }
  };

  // Áp dụng paperStyle khi mount
  useEffect(() => {
    if (typeof document !== "undefined" && paperStyle !== "blank") {
      document.body.classList.add(`paper-${paperStyle}`);
    }
  }, [paperStyle]);

  // --- PIN Lock Security ---
  const [pinCode, setPinCodeState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_pin_code`);
    } catch {
      return null;
    }
  });

  const [isPinLocked, setIsPinLocked] = useState<boolean>(() => {
    try {
      const savedPin = localStorage.getItem(`${STORAGE_KEY}_pin_code`);
      return Boolean(savedPin);
    } catch {
      return false;
    }
  });

  const setPinCode = (newPin: string | null) => {
    setPinCodeState(newPin);
    if (newPin) {
      localStorage.setItem(`${STORAGE_KEY}_pin_code`, newPin);
    } else {
      localStorage.removeItem(`${STORAGE_KEY}_pin_code`);
      setIsPinLocked(false);
    }
  };

  const unlockWithPin = () => {
    setIsPinLocked(false);
  };

  const lockApp = () => {
    if (pinCode) {
      setIsPinLocked(true);
    }
  };

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

  const [deletedEntityIds, setDeletedEntityIds] = useState<DeletedEntityIds>(readDeletedEntityIds);

  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_tags`);
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
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

  const [journalEntries, setJournalEntries] = useState<JournalEntryDto[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_journal`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_JOURNAL;
    } catch {
      return INITIAL_JOURNAL;
    }
  });

  const [journalPromptTask, setJournalPromptTask] = useState<TaskDto | null>(null);
  const [completedTaskPrompt, setCompletedTaskPrompt] = useState<TaskDto | null>(null);

  const [theme, setTheme] = useState<ColorTheme>("warm");

  const [interfaceStyle, setInterfaceStyleState] = useState<InterfaceStyle>(() => {
    try {
      return localStorage.getItem(`${STORAGE_KEY}_interface_style`) === "ios"
        ? "ios"
        : "sketch";
    } catch {
      return "sketch";
    }
  });

  const setInterfaceStyle = useCallback((style: InterfaceStyle) => {
    setInterfaceStyleState(style);
    localStorage.setItem(`${STORAGE_KEY}_interface_style`, style);
  }, []);

  // Typography preferences are local to this device and applied at the root
  // so every responsive shell keeps the same readable scale and font.
  const [fontSize, setFontSizeState] = useState<FontSizePreference>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_font_size`);
      return saved === "large" || saved === "xlarge" ? saved : "large";
    } catch {
      return "large";
    }
  });
  const [fontFamily, setFontFamilyState] = useState<FontFamilyPreference>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_font_family`);
      return saved === "jakarta" || saved === "system" ? saved : "inter";
    } catch {
      return "inter";
    }
  });

  const setFontSize = useCallback((size: FontSizePreference) => {
    setFontSizeState(size);
    localStorage.setItem(`${STORAGE_KEY}_font_size`, size);
  }, []);

  const setFontFamily = useCallback((family: FontFamilyPreference) => {
    setFontFamilyState(family);
    localStorage.setItem(`${STORAGE_KEY}_font_family`, family);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.interfaceStyle = interfaceStyle;
    document.documentElement.dataset.fontSize = fontSize;
    document.documentElement.dataset.fontFamily = fontFamily;
  }, [fontFamily, fontSize, interfaceStyle]);

  // Khôi phục lịch nhắc sau khi reload. Preference của app và quyền của OS
  // là hai lớp độc lập; notificationService sẽ tự kiểm tra quyền trước khi gửi.
  useEffect(() => {
    notificationService.setEnabled(isNotificationsEnabled);
    void notificationService.syncAllTasks(tasks);
    // Chỉ khởi tạo lịch một lần; các thao tác CRUD tự cập nhật từng task.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flag ngăn loop sync khi nhận update từ socket
  const isApplyingRemoteSync = useRef(false);
  const syncDebounceTimer = useRef<any>(null);

  // Safe Storage Writer chống lỗi QuotaExceededError khi dữ liệu phình to
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch (err: any) {
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        console.warn(`LocalStorage đầy bộ nhớ khi lưu ${key}. Đang kích hoạt cơ chế bảo vệ an toàn.`);
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
    safeSetItem(`${STORAGE_KEY}_deleted`, JSON.stringify(deletedEntityIds));
  }, [deletedEntityIds]);

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_tags`, JSON.stringify(tags));
  }, [tags]);

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

  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_journal`, JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Ref lưu dữ liệu mới nhất để push/pull an toàn mà không làm re-trigger hooks
  const appDataRef = useRef({
    tasks,
    stickyNotes,
    habits,
    journalEntries,
    dailyMoods,
    weeklyReflection,
    tags,
    deletedEntityIds,
    isSignedIn: user.isSignedIn,
  });
  const signedInRef = useRef(user.isSignedIn);

  useEffect(() => {
    signedInRef.current = user.isSignedIn;
    appDataRef.current = {
      tasks,
      stickyNotes,
      habits,
      journalEntries,
    dailyMoods,
    weeklyReflection,
    tags,
    deletedEntityIds,
    isSignedIn: user.isSignedIn,
    };
  }, [
    tasks,
    stickyNotes,
    habits,
    journalEntries,
    dailyMoods,
    weeklyReflection,
    tags,
    deletedEntityIds,
    user.isSignedIn,
  ]);

  // Online / Offline Detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (authStorage.getToken()) {
        syncSocket.connect();
      }
    };
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
  const pushDataToServer = useCallback(async (overrideData?: any): Promise<boolean> => {
    const token = authStorage.getToken();
    if (!signedInRef.current || !token) return false;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return false;
    }

    const current = appDataRef.current;
    const payload = overrideData
      ? {
          ...overrideData,
          ...(Array.isArray(overrideData.tasks)
            ? { tasks: serializeTasksForSync(overrideData.tasks) }
            : {}),
          deleted: overrideData.deleted ?? current.deletedEntityIds,
          updatedAt: overrideData.updatedAt ?? new Date().toISOString(),
        }
      : {
          tasks: serializeTasksForSync(current.tasks),
          stickyNotes: current.stickyNotes,
          habits: current.habits,
          journalEntries: current.journalEntries,
          dailyMoods: current.dailyMoods,
          weeklyReflection: current.weeklyReflection,
          tags: current.tags,
          deleted: current.deletedEntityIds,
          updatedAt: new Date().toISOString(),
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
        return true;
      } else {
        setSyncStatus(
          typeof navigator !== "undefined" && !navigator.onLine
            ? "offline"
            : "error",
        );
        return false;
      }
    } catch {
      setSyncStatus(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "offline"
          : "error",
      );
      return false;
    }
  }, []);

  // Kích hoạt Debounced Sync chỉ khi người dùng có thao tác cục bộ
  const triggerDebouncedPush = useCallback(
    (partialData?: any) => {
      const token = authStorage.getToken();
      if (!signedInRef.current || !token) return;

      if (syncDebounceTimer.current) {
        clearTimeout(syncDebounceTimer.current);
      }

      syncDebounceTimer.current = setTimeout(() => {
        const current = appDataRef.current;
        const fullPayload = {
          tasks: serializeTasksForSync(partialData?.tasks ?? current.tasks),
          stickyNotes: partialData?.stickyNotes ?? current.stickyNotes,
          habits: partialData?.habits ?? current.habits,
          journalEntries: partialData?.journalEntries ?? current.journalEntries,
          dailyMoods: partialData?.dailyMoods ?? current.dailyMoods,
          weeklyReflection:
            partialData?.weeklyReflection ?? current.weeklyReflection,
          tags: partialData?.tags ?? current.tags,
          deleted: partialData?.deleted ?? current.deletedEntityIds,
          updatedAt: new Date().toISOString(),
        };
        pushDataToServer(fullPayload);
      }, 500);
    },
    [pushDataToServer],
  );

  const rememberDeletion = (entityType: keyof DeletedEntityIds, entityId: string) => {
    setDeletedEntityIds((previous) => {
      if (previous[entityType].includes(entityId)) return previous;
      return {
        ...previous,
        [entityType]: [...previous[entityType], entityId],
      };
    });
  };

  const forgetDeletion = (entityType: keyof DeletedEntityIds, entityId: string) => {
    setDeletedEntityIds((previous) => {
      if (!previous[entityType].includes(entityId)) return previous;
      return {
        ...previous,
        [entityType]: previous[entityType].filter((id) => id !== entityId),
      };
    });
  };

  // --- HÀM KÉO VÀ HỢP NHẤT DỮ LIỆU TỪ SERVER VỀ CLIENT (SMART MERGE) ---
  const pullDataFromServer = useCallback(async (): Promise<boolean> => {
    if (!authStorage.getToken()) return false;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return false;
    }

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
            stickyNotes: currentLocal.stickyNotes,
            habits: currentLocal.habits,
            journalEntries: currentLocal.journalEntries,
            dailyMoods: currentLocal.dailyMoods,
            weeklyReflection: currentLocal.weeklyReflection,
            tags: currentLocal.tags,
            deleted: currentLocal.deletedEntityIds,
          },
          serverData,
        );

        setTasks(merged.tasks);
        setStickyNotes(merged.stickyNotes);
        setHabits(merged.habits);
        setJournalEntries(merged.journalEntries || []);
        setDailyMoods(merged.dailyMoods);
        setWeeklyReflection(merged.weeklyReflection);
        setTags(merged.tags);
        setDeletedEntityIds({
          tasks: merged.deleted?.tasks || [],
          stickyNotes: merged.deleted?.stickyNotes || [],
          habits: merged.deleted?.habits || [],
          journalEntries: merged.deleted?.journalEntries || [],
          tags: merged.deleted?.tags || [],
        });

        // Rebuild reminders from the merged server snapshot so a login does
        // not leave the device with the previous account's notification schedule.
        void notificationService.syncAllTasks(merged.tasks);

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
        setSyncStatus(
          typeof navigator !== "undefined" && !navigator.onLine
            ? "offline"
            : "error",
        );
        return false;
      }
    } catch {
      setSyncStatus(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "offline"
          : "error",
      );
      return false;
    }
  }, [pushDataToServer]);

  // Đồng bộ thủ công khi user bấm nút "Đồng bộ ngay"
  const syncNow = useCallback(async (): Promise<boolean> => {
    if (!user.isSignedIn) return false;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("offline");
      return false;
    }

    await pushDataToServer();
    return pullDataFromServer();
  }, [pullDataFromServer, pushDataToServer, user.isSignedIn]);

  // Retry local changes after the device comes back online. Local state is
  // already usable while offline; this only restores cloud synchronization.
  useEffect(() => {
    if (!isOnline || !user.isSignedIn) return;

    const retryTimer = window.setTimeout(() => {
      void syncNow();
    }, 250);

    return () => window.clearTimeout(retryTimer);
  }, [isOnline, syncNow, user.isSignedIn]);

  // --- XỬ LÝ KHỞI TẠO VÀ WEBSOCKET REALTIME (CHỈ CHẠY 1 LẦN KHI MOUNT) ---
  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      // Khôi phục user profile từ server
      api.auth
        .getMe()
        .then((res) => {
          if (res.success && res.data) {
            signedInRef.current = true;
            setUser({
              name: res.data.name,
              email: res.data.email,
              avatar: res.data.avatar || "lucide:User",
              avatarBg: res.data.avatarBg || "#FEF08A",
              isSignedIn: true,
            });
            // Mở kết nối WebSocket
            syncSocket.connect();
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
      const currentLocal = appDataRef.current;
      const merged = smartMergeAppData(
        {
          tasks: currentLocal.tasks,
          stickyNotes: currentLocal.stickyNotes,
          habits: currentLocal.habits,
          journalEntries: currentLocal.journalEntries,
          dailyMoods: currentLocal.dailyMoods,
          weeklyReflection: currentLocal.weeklyReflection,
          tags: currentLocal.tags,
          deleted: currentLocal.deletedEntityIds,
        },
        {
          tasks: remoteData.tasks || [],
          stickyNotes: remoteData.stickyNotes || [],
          habits: remoteData.habits || [],
          journalEntries: remoteData.journalEntries || [],
          dailyMoods: remoteData.dailyMoods || {},
          weeklyReflection: remoteData.weeklyReflection || "",
          tags: remoteData.tags || [],
          deleted: remoteData.deleted,
        },
      );

      setTasks(merged.tasks);
      setStickyNotes(merged.stickyNotes);
      setHabits(merged.habits);
      setJournalEntries(merged.journalEntries || []);
      setDailyMoods(merged.dailyMoods);
      setWeeklyReflection(merged.weeklyReflection);
      setTags(merged.tags);
      setDeletedEntityIds({
        tasks: merged.deleted?.tasks || [],
        stickyNotes: merged.deleted?.stickyNotes || [],
        habits: merged.deleted?.habits || [],
        journalEntries: merged.deleted?.journalEntries || [],
        tags: merged.deleted?.tags || [],
      });
      void notificationService.syncAllTasks(merged.tasks);

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
      signedInRef.current = true;
      appDataRef.current.isSignedIn = true;
      setUser({
        name: res.data.user.name,
        email: res.data.user.email,
        avatar: res.data.user.avatar || "lucide:User",
        avatarBg: res.data.user.avatarBg || "#FEF08A",
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
      signedInRef.current = true;
      appDataRef.current.isSignedIn = true;
      setUser({
        name: res.data.user.name,
        email: res.data.user.email,
        avatar: res.data.user.avatar || "lucide:User",
        avatarBg: res.data.user.avatarBg || "#FEF08A",
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
    accessToken: string;
  }) => {
    setSyncStatus("syncing");
    const res = await api.auth.google(data);
    if (res.success && res.data) {
      authStorage.setToken(res.data.token);
      signedInRef.current = true;
      appDataRef.current.isSignedIn = true;
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
    avatarBg = "#FEF08A",
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
    signedInRef.current = false;
    appDataRef.current.isSignedIn = false;
    syncSocket.disconnect();
    setUser(INITIAL_USER);
    setSyncStatus("idle");
    setLastSyncedAt(null);
    localStorage.removeItem(`${STORAGE_KEY}_last_synced`);
  };

  const updateUserProfile = (data: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...data };
      if (updated.isSignedIn) {
        api.auth.updateProfile({
          name: updated.name,
          avatar: updated.avatar,
          avatarBg: updated.avatarBg,
        });
      }
      return updated;
    });
  };

  // Nạp lại toàn bộ dữ liệu mẫu lớn thử tải với 50 task phong phú
  const loadSampleData = () => {
    const sampleTasks = generateSample50Tasks();

    setTasks(sampleTasks);
    setStickyNotes(INITIAL_STICKY_NOTES);
    setHabits(INITIAL_HABITS);
    setDailyMoods(INITIAL_MOODS);
    setWeeklyReflection(INITIAL_REFLECTION);
    setTags(INITIAL_TAGS);
    setJournalEntries(INITIAL_JOURNAL);
    setDeletedEntityIds(EMPTY_DELETED_ENTITY_IDS);

    if (user.isSignedIn) {
      pushDataToServer({
        tasks: sampleTasks,
        stickyNotes: INITIAL_STICKY_NOTES,
        habits: INITIAL_HABITS,
        dailyMoods: INITIAL_MOODS,
        weeklyReflection: INITIAL_REFLECTION,
        tags: INITIAL_TAGS,
        journalEntries: INITIAL_JOURNAL,
        deleted: EMPTY_DELETED_ENTITY_IDS,
      });
    }
  };

  const loadSample50Tasks = loadSampleData;

  // --- CÁC HÀM CRUD DATA (OFFLINE-FIRST + AUTO SYNC TRỰC TIẾP KHI USER THAO TÁC) ---
  const addTask = (taskData: {
    title: string;
    description?: string;
    dueDate?: string;
    timeType?: TaskTimeType;
    startTime?: string;
    endTime?: string;
    deadlineDate?: string;
    deadlineTime?: string;
    tag?: string;
    tags?: string[];
    startDate?: string;
    endDate?: string;
    parentTaskId?: string;
    priority?: TaskPriority;
  }) => {
    // Thu thập tags đầy đủ
    const taskTagsList: string[] = [];
    if (Array.isArray(taskData.tags)) {
      taskData.tags.forEach((t) => {
        const clean = t.replace(/^#+/, "").trim();
        if (clean && !taskTagsList.includes(clean)) taskTagsList.push(clean);
      });
    }
    if (taskData.tag) {
      const clean = taskData.tag.replace(/^#+/, "").trim();
      if (clean && !taskTagsList.includes(clean)) taskTagsList.push(clean);
    }

    const newTask: TaskDto = {
      id: `task-${Date.now()}`,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      startDate: taskData.startDate,
      endDate: taskData.endDate,
      timeType: taskData.timeType,
      startTime: taskData.startTime,
      endTime: taskData.endTime,
      deadlineDate: taskData.deadlineDate,
      deadlineTime: taskData.deadlineTime,
      tag: taskTagsList[0] || undefined,
      tags: taskTagsList.length > 0 ? taskTagsList : undefined,
      parentTaskId: taskData.parentTaskId,
      completed: false,
      status: "todo",
      priority: taskData.priority || "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    forgetDeletion("tasks", newTask.id);

    // Tự động thêm tag mới vào hệ thống nếu chưa có
    taskTagsList.forEach((t) => {
      if (t && !tags.includes(t)) {
        addTag(t);
      }
    });

    const parentTask = taskData.parentTaskId
      ? tasks.find((candidate) => candidate.id === taskData.parentTaskId)
      : undefined;
    if (
      !parentTask ||
      wouldCreateTaskCycle(newTask.id, taskData.parentTaskId, tasks)
    ) {
      newTask.parentTaskId = undefined;
    } else {
      Object.assign(newTask, getInheritedParentSchedule(parentTask));
      Object.assign(newTask, constrainTaskToParent(newTask, {}, parentTask));
    }

    setTasks((prev) => {
      const next = [newTask, ...prev];
      triggerDebouncedPush({ tasks: next });
      return next;
    });

    // Lên lịch thông báo ngoài màn hình nếu task có ngày giờ hẹn
    if (getTaskEffectiveDate(newTask)) {
      notificationService.scheduleTask(newTask);
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
          if (isSoundEnabled) {
            sounds.playPencilCheck(soundVolume);
          }
        } else if (getTaskEffectiveDate(updatedTask)) {
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
    if (!taskToDelete) return;

    notificationService.cancelTask(id);
    rememberDeletion("tasks", id);

    setTasks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      triggerDebouncedPush({ tasks: next });
      return next;
    });

    dispatchToast({ message: `Đã xóa "${taskToDelete.title}".` });
  };

  const moveTaskToNextDay = (id: string, baseDateStr?: string) => {
    const currentTodayStr = getLocalTodayStr();
    const taskToMove = tasks.find((task) => task.id === id);
    if (!taskToMove) return;

    setTasks((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t;

        // Use the normalized date so scheduled tasks never read deadlineDate.
        const currentTaskDate =
          baseDateStr || getTaskEffectiveDate(t) || currentTodayStr;

        // Nếu ngày gốc ở quá khứ (< today), luôn đưa về ngày mai của hiện tại để không bị kẹt trong quá khứ!
        const targetNextDate =
          currentTaskDate < currentTodayStr
            ? getNextDayStr(currentTodayStr)
            : getNextDayStr(currentTaskDate);

        return {
          ...t,
          ...moveTaskToDate(t, targetNextDate),
          updatedAt: new Date().toISOString(),
        };
      });
      triggerDebouncedPush({ tasks: next });
      return next;
    });

    dispatchToast({ message: `Đã dời "${taskToMove.title}" sang ngày mai.` });
  };

  const moveTaskToTomorrow = (id: string) => {
    moveTaskToNextDay(id, getLocalTodayStr());
  };

  const moveTaskToToday = (id: string) => {
    const currentTodayStr = getLocalTodayStr();
    setTasks((prev) => {
      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...moveTaskToDate(t, currentTodayStr),
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      triggerDebouncedPush({ tasks: next });
      return next;
    });
  };

  const updateTask = (id: string, updates: Partial<TaskDto>) => {
    setTasks((prev) => {
      const oldTask = prev.find((t) => t.id === id);
      if (!oldTask) return prev;

      const hasParentUpdate = Object.prototype.hasOwnProperty.call(
        updates,
        "parentTaskId",
      );
      const requestedParentId = hasParentUpdate
        ? updates.parentTaskId
        : oldTask.parentTaskId;
      let safeUpdates = updates;

      if (
        requestedParentId &&
        wouldCreateTaskCycle(id, requestedParentId, prev)
      ) {
        safeUpdates = { ...safeUpdates, parentTaskId: undefined };
      } else {
        const parentTask = requestedParentId
          ? prev.find((candidate) => candidate.id === requestedParentId)
          : undefined;
        if (hasParentUpdate && parentTask) {
          safeUpdates = {
            ...safeUpdates,
            ...getInheritedParentSchedule(parentTask),
          };
        }
        safeUpdates = constrainTaskToParent(oldTask, safeUpdates, parentTask);
      }

      const next = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...safeUpdates,
              updatedAt: new Date().toISOString(),
            }
          : t,
      );
      triggerDebouncedPush({ tasks: next });

      // Nếu có cập nhật dueDate, cập nhật lại lịch thông báo
      const updated = next.find((t) => t.id === id);
      if (updated) {
        if (getTaskEffectiveDate(updated) && !updated.completed) {
          notificationService.scheduleTask(updated);
        } else {
          notificationService.cancelTask(id);
        }
      }

      return next;
    });
  };

  const addTag = (tag: string): string => {
    const clean = tag.replace(/^#+/, "").trim();
    if (!clean) return "";
    forgetDeletion("tags", clean);
    setTags((prev) => {
      if (prev.includes(clean)) return prev;
      const next = [...prev, clean];
      try {
        localStorage.setItem(`${STORAGE_KEY}_tags`, JSON.stringify(next));
      } catch {}
      triggerDebouncedPush({ tags: next });
      return next;
    });
    return clean;
  };

  const deleteTag = (tag: string) => {
    const clean = tag.replace(/^#+/, "").trim();
    if (!clean) return;
    rememberDeletion("tags", clean);
    setTags((prev) => {
      const next = prev.filter((t) => t !== clean);
      try {
        localStorage.setItem(`${STORAGE_KEY}_tags`, JSON.stringify(next));
      } catch {}
      triggerDebouncedPush({ tags: next });
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
      updatedAt: new Date().toISOString(),
    };
    forgetDeletion("stickyNotes", newNote.id);
    setStickyNotes((prev) => {
      const next = [newNote, ...prev];
      triggerDebouncedPush({ stickyNotes: next });
      return next;
    });

    if (isSoundEnabled) {
      sounds.playStickyNote(soundVolume);
    }
  };

  const togglePinStickyNote = (id: string) => {
    setStickyNotes((prev) => {
      const next = prev.map((n) =>
        n.id === id
          ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() }
          : n,
      );
      triggerDebouncedPush({ stickyNotes: next });
      return next;
    });
  };

  const deleteStickyNote = (id: string) => {
    rememberDeletion("stickyNotes", id);
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

  const addHabit = (name: string, frequency: HabitDto["frequency"] = "daily") => {
    const newHabit: HabitDto = {
      id: `habit-${Date.now()}`,
      name,
      frequency,
      completedDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    forgetDeletion("habits", newHabit.id);
    setHabits((prev) => {
      const next = [...prev, newHabit];
      triggerDebouncedPush({ habits: next });
      return next;
    });
  };

  const updateHabit = (
    id: string,
    updates: Partial<Pick<HabitDto, "name" | "frequency" | "targetDaysPerWeek">>,
  ) => {
    setHabits((prev) => {
      const next = prev.map((habit) =>
        habit.id === id
          ? { ...habit, ...updates, updatedAt: new Date().toISOString() }
          : habit,
      );
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
          streak: calculateConsecutiveStreak(newDates),
          updatedAt: new Date().toISOString(),
        };
      });
      triggerDebouncedPush({ habits: next });
      return next;
    });
  };

  const deleteHabit = (id: string) => {
    rememberDeletion("habits", id);
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

  // ----------------------------------------------------
  // JOURNAL (Nhật ký theo ngày & giờ)
  // ----------------------------------------------------
  const addJournalEntry = (data: {
    date: string;
    time: string;
    content: string;
    linkedTaskId?: string;
  }): JournalEntryDto => {
    const newEntry: JournalEntryDto = {
      id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      date: data.date,
      time: data.time,
      content: data.content,
      linkedTaskId: data.linkedTaskId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    forgetDeletion("journalEntries", newEntry.id);
    setJournalEntries((prev) => {
      const next = [...prev, newEntry];
      triggerDebouncedPush({ journalEntries: next });
      return next;
    });
    return newEntry;
  };

  const updateJournalEntry = (id: string, updates: Partial<JournalEntryDto>) => {
    setJournalEntries((prev) => {
      const next = prev.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );
      triggerDebouncedPush({ journalEntries: next });
      return next;
    });
  };

  const deleteJournalEntry = (id: string) => {
    rememberDeletion("journalEntries", id);
    setJournalEntries((prev) => {
      const next = prev.filter((item) => item.id !== id);
      triggerDebouncedPush({ journalEntries: next });
      return next;
    });
  };

  const openJournalWithTask = (task: TaskDto) => {
    setJournalPromptTask(task);
    setCompletedTaskPrompt(null);
  };

  const dismissCompletedTaskPrompt = () => {
    setCompletedTaskPrompt(null);
  };

  const archiveOldTasks = (days = 60): number => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    let removedCount = 0;
    setTasks((prev) => {
      const next = prev.filter((t) => {
        const isOldCompleted = t.completed && t.dueDate && t.dueDate.split(" ")[0] < cutoffStr;
        if (isOldCompleted) {
          removedCount++;
          return false;
        }
        return true;
      });
      if (removedCount > 0) {
        triggerDebouncedPush({ tasks: next });
      }
      return next;
    });
    return removedCount;
  };

  // --- Active Detail Task (Full page Document Canvas) ---
  const [activeDetailTaskId, setActiveDetailTaskId] = useState<string | null>(null);
  const [activeTaskDetailInitialData, setActiveTaskDetailInitialData] = useState<TaskEditorInitialData | null>(null);
  const openTaskDetail = useCallback((taskId?: string, initialData?: TaskEditorInitialData) => {
    setActiveTaskDetailInitialData(taskId === "new" || !taskId ? initialData || null : null);
    setActiveDetailTaskId(taskId || "new");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);
  const closeTaskDetail = useCallback(() => {
    setActiveDetailTaskId(null);
    setActiveTaskDetailInitialData(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, []);

  // --- Quick Task Creation Modal ---
  const [isQuickTaskModalOpen, setIsQuickTaskModalOpen] = useState(false);
  const [quickTaskInitialData, setQuickTaskInitialData] = useState<{
    dueDate?: string;
    tag?: string;
    timeType?: TaskTimeType;
    startTime?: string;
    endTime?: string;
  } | null>(null);

  const openQuickTaskModal = useCallback(
    (initialData?: {
      dueDate?: string;
      tag?: string;
      timeType?: TaskTimeType;
      startTime?: string;
      endTime?: string;
    }) => {
      setQuickTaskInitialData(initialData || null);
      setIsQuickTaskModalOpen(true);
    },
    []
  );

  const closeQuickTaskModal = useCallback(() => {
    setIsQuickTaskModalOpen(false);
    setQuickTaskInitialData(null);
  }, []);

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
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        theme,
        setTheme,
        interfaceStyle,
        setInterfaceStyle,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        isTiltEnabled,
        setIsTiltEnabled,
        hideCompletedTasks,
        setHideCompletedTasks,
        isNotificationsEnabled,
        setIsNotificationsEnabled,
        isNotificationPanelOpen,
        notificationActiveTab,
        openNotificationPanel,
        closeNotificationPanel,
        isDarkMode,
        setIsDarkMode,
        isSidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        isSoundEnabled,
        setIsSoundEnabled,
        soundVolume,
        setSoundVolume,
        paperStyle,
        setPaperStyle,
        pinCode,
        isPinLocked,
        setPinCode,
        unlockWithPin,
        lockApp,
        triggerHaptic,
        loadSampleData,
        loadSample50Tasks,
        archiveOldTasks,
        tasks,
        addTask,
        toggleTask,
        deleteTask,
        moveTaskToTomorrow,
        moveTaskToNextDay,
        moveTaskToToday,
        updateTask,
        tags,
        addTag,
        deleteTag,
        stickyNotes,
        addStickyNote,
        togglePinStickyNote,
        deleteStickyNote,
        convertNoteToTask,
        habits,
        addHabit,
        updateHabit,
        toggleHabitDay,
        deleteHabit,
        dailyMoods,
        setDailyMood,
        weeklyReflection,
        setWeeklyReflection: handleSetWeeklyReflection,
        journalEntries,
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        journalPromptTask,
        setJournalPromptTask,
        openJournalWithTask,
        completedTaskPrompt,
        dismissCompletedTaskPrompt,
        activeTaskSubTab,
        setActiveTaskSubTab,
        selectedPlannerDate,
        setSelectedPlannerDate,
        activeDetailTaskId,
        activeTaskDetailInitialData,
        openTaskDetail,
        closeTaskDetail,
        isQuickTaskModalOpen,
        quickTaskInitialData,
        openQuickTaskModal,
        closeQuickTaskModal,
        activeNoteSubTab,
        setActiveNoteSubTab,
        settingsMobileSubView,
        setSettingsMobileSubView,
        isMobileNoteDetailOpen,
        setIsMobileNoteDetailOpen,
        isJournalBookOpen,
        setIsJournalBookOpen,
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
