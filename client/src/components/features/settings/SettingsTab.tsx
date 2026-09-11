import React, { useState, useEffect, useRef } from "react";
import {
  APP_STORAGE_KEY,
  useAppStore,
  type InterfaceStyle,
  type FontFamilyPreference,
  type FontSizePreference,
  type PaperStyle,
} from "../../../stores/appStore";
import { ConfirmModal, DynamicIcon } from "../../ui";
import { CURRENT_APP_VERSION } from "../../../services/updateService";
import {
  isNativePlatform,
  notificationService,
} from "../../../services/notificationService";
import { sounds } from "../../../utils/soundEffects";
import { PinLockModal } from "../auth/PinLockModal";
import { TabKey } from "../../../types";
import { useResponsiveLayout } from "../../../shared/hooks";
import {
  SETTINGS_MENU_ITEMS,
  SettingsSectionNav,
  type SettingsSectionKey,
} from "./SettingsSectionNav";
import {
  FileText,
  Cloud,
  RefreshCw,
  Zap,
  Pencil,
  Check,
  LogOut,
  LogIn,
  ArrowRight,
  ArrowLeft,
  Sliders,
  ChevronDown,
  ChevronRight,
  Download,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Volume2,
  Sparkles,
  Settings,
  User,
  CheckCircle2,
  ListTodo,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ==========================================
// COMPONENT: SettingsTab Chuẩn Năng Suất Cao Cấp
// ==========================================

interface SettingsTabProps {
  onNavigateTab?: (tab: TabKey) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenAuth?: () => void;
  previousTab?: TabKey;
  embedded?: boolean;
  hideMobileDetailHeader?: boolean;
  platform?: SettingsPlatform;
}

export type SettingsPlatform = "desktop" | "tablet" | "mobile";

// ---------------------------------------------------------------------------
// 1. COMPACT POPUP SELECT (Neo tại chỗ, không làm mờ màn hình)
// ---------------------------------------------------------------------------
interface SelectOptionItem {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface SettingsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOptionItem[];
  disabled?: boolean;
  align?: "left" | "right";
  className?: string;
}

const SettingsSelect: React.FC<SettingsSelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
  align = "right",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Nút bấm hiển thị giá trị hiện tại */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-[6px] border-[1.5px] border-[#262626] bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] dark:text-[#E5E5EA] transition-all cursor-pointer select-none active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
          disabled ? "opacity-40 cursor-not-allowed" : ""
        }`}
      >
        <span className="truncate max-w-[140px] sm:max-w-[200px]">
          {selectedOption?.label || "Chọn..."}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={2.4}
          className={`text-[#78716C] shrink-0 transition-transform duration-150 ${
            isOpen ? "rotate-180 text-[#1C1917] dark:text-[#E5E5EA]" : ""
          }`}
        />
      </button>

      {/* Popup con nhỏ gọn neo ngay tại nút, KHÔNG làm mờ màn hình */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-1.5 w-60 sm:w-64 bg-[#FFFDF8] dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[3px_3px_0px_#262626] py-1 z-50 animate-in fade-in zoom-in-95 flex flex-col overflow-hidden divide-y divide-[#E7E5E4] dark:divide-[#3A3A3C]`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                disabled={opt.disabled}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start justify-between gap-2 px-3 py-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#FEF08A] dark:bg-[#3A3A3C] font-bold text-[#1C1917] dark:text-white"
                    : opt.disabled
                    ? "opacity-40 cursor-not-allowed bg-transparent"
                    : "text-[#1C1917] dark:text-[#E5E5EA] hover:bg-[#F3EFE6] dark:hover:bg-[#2C2C2E]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold leading-tight">{opt.label}</p>
                  {opt.description && (
                    <p
                      className={`text-[10px] leading-snug mt-0.5 ${
                        isSelected ? "text-[#1C1917]/80 dark:text-white/80" : "text-[#78716C]"
                      }`}
                    >
                      {opt.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check
                    size={14}
                    strokeWidth={2.8}
                    className="text-[#1C1917] dark:text-white shrink-0 mt-0.5"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. TOGGLE SWITCH CHUẨN NĂNG SUẤT
// ---------------------------------------------------------------------------
interface SettingsSwitchProps {
  checked: boolean;
  label: string;
  onChange: () => void;
}

const SettingsSwitch: React.FC<SettingsSwitchProps> = ({
  checked,
  label,
  onChange,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-[#262626] p-0.5 shadow-[1px_1px_0px_#262626] transition-colors active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
        checked ? "bg-[#1C1917] dark:bg-[#52525B]" : "bg-[#F3EFE6] dark:bg-[#27272A]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-5 w-5 rounded-full border-[1.5px] border-[#262626] bg-[#FAFAFA] shadow-[1px_1px_0px_#262626] transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

// ---------------------------------------------------------------------------
// 3. ROW & GROUP CONTAINERS
// ---------------------------------------------------------------------------
interface SettingsRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  title,
  description,
  children,
  disabled = false,
}) => (
  <div
    className={`flex items-center justify-between gap-3 sm:gap-4 py-3 first:pt-0 last:pb-0 ${
      disabled ? "opacity-50 pointer-events-none" : ""
    }`}
  >
    <div className="min-w-0 flex-1">
      <p className="font-bold text-xs sm:text-sm text-[#1C1917] dark:text-[#E5E5EA] leading-snug">
        {title}
      </p>
      {description && (
        <p className="text-[11px] text-[#78716C] leading-relaxed mt-0.5">
          {description}
        </p>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

interface SettingsGroupProps {
  title?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, icon: Icon, children }) => (
  <div className="bg-[#FFFDF8] dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] p-4 sm:p-5 shadow-[2px_2px_0px_#262626] space-y-3">
    {title && (
      <div className="flex items-center gap-1.5 pb-2 border-b border-[#262626]/15 dark:border-[#3A3A3C]">
        {Icon && <Icon size={14} strokeWidth={2.4} className="text-[#1C1917] dark:text-[#E5E5EA]" />}
        <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[#1C1917] dark:text-[#E5E5EA]">
          {title}
        </h3>
      </div>
    )}
    <div className="divide-y divide-[#E7E5E4] dark:divide-[#3A3A3C]">{children}</div>
  </div>
);

const AVATAR_COLORS = [
  { name: "Trắng Giấy", hex: "#FFFDF8" },
  { name: "Xanh Bạc Hà", hex: "#BBF7D0" },
  { name: "Xanh Da Trời", hex: "#BAE6FD" },
  { name: "Hồng San Hô", hex: "#FECDD3" },
  { name: "Mực Đen", hex: "#262626" },
];

const AVATAR_ICONS = [
  "lucide:User",
  "lucide:UserCheck",
  "lucide:Sparkles",
  "lucide:Smile",
  "lucide:Star",
  "lucide:Flame",
  "lucide:Zap",
  "lucide:BookOpen",
  "lucide:Heart",
];

const LOCAL_DATA_KEYS = [
  `${APP_STORAGE_KEY}_tasks`,
  `${APP_STORAGE_KEY}_tags`,
  `${APP_STORAGE_KEY}_notes`,
  `${APP_STORAGE_KEY}_habits`,
  `${APP_STORAGE_KEY}_moods`,
  `${APP_STORAGE_KEY}_reflection`,
  `${APP_STORAGE_KEY}_journal`,
  `${APP_STORAGE_KEY}_last_synced`,
  "sketchtask_notes_v1",
] as const;

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onNavigateRoute,
  onOpenAuth,
  hideMobileDetailHeader = false,
  platform = "desktop",
}) => {
  const {
    user,
    updateUserProfile,
    logout,
    syncNow,
    lastSyncedAt,
    interfaceStyle,
    setInterfaceStyle,
    isTiltEnabled,
    setIsTiltEnabled,
    isNotificationsEnabled,
    setIsNotificationsEnabled,
    isDarkMode,
    setIsDarkMode,
    isSoundEnabled,
    setIsSoundEnabled,
    soundVolume,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    paperStyle,
    setPaperStyle,
    pinCode,
    setPinCode,
    loadSampleData,
    tasks,
    stickyNotes,
    journalEntries,
    openAuthModal,
    settingsMobileSubView,
    setSettingsMobileSubView,
  } = useAppStore();
  const { isLandscape } = useResponsiveLayout();

  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("account");

  const [confirmSampleOpen, setConfirmSampleOpen] = useState(false);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<"setup" | "change" | "disable" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [permStatus, setPermStatus] = useState<"granted" | "denied" | "default">("default");

  // Notifications Preferences
  const [dailyDigestTime, setDailyDigestTime] = useState<string>(() => {
    return localStorage.getItem("sketchtask_digest_time") || "08:00";
  });
  const [reminderOffset, setReminderOffset] = useState<string>(() => {
    return localStorage.getItem("sketchtask_reminder_offset") || "15m";
  });

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);

  // Avatar Picker State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMasterDetail =
    platform === "desktop" || (platform === "tablet" && isLandscape);
  const isNativeNotifications = isNativePlatform();
  const visibleSettingsMenuItems =
    platform === "desktop"
      ? SETTINGS_MENU_ITEMS
      : SETTINGS_MENU_ITEMS.filter((item) => item.key !== "shortcuts");
  const settingsSubtitles: Partial<Record<SettingsSectionKey, string>> = {
    account: user.isSignedIn ? user.email || "Đã đăng nhập" : "Lưu cục bộ · Chưa đăng nhập",
    general: `${interfaceStyle === "ios" ? "Hiện đại & Tối giản" : "SketchTask nguyên bản"} · ${isDarkMode ? "Tối" : "Sáng"} · ${fontSize === "normal" ? "Cỡ chữ chuẩn" : fontSize === "large" ? "Cỡ chữ lớn" : "Cỡ chữ rất lớn"}`,
    notifications: isNotificationsEnabled ? "Đang bật" : "Đang tắt",
    data: `${tasks.length} việc · ${journalEntries.length} nhật ký`,
    security: pinCode ? "Đã bật mã PIN" : "Chưa bật mã PIN",
    shortcuts: platform === "desktop" ? "Ctrl + K và thao tác nhanh" : "Chỉ dùng trên desktop",
    about: `SketchTask · v${CURRENT_APP_VERSION}`,
  };
  const activeMobileSection =
    !isMasterDetail &&
    visibleSettingsMenuItems.some((item) => item.key === settingsMobileSubView)
      ? settingsMobileSubView
      : null;
  const previousMobileSectionRef = useRef<SettingsSectionKey | null>(null);
  const [mobileTransitionDirection, setMobileTransitionDirection] = useState<"forward" | "back">("forward");

  useEffect(() => {
    if (isMasterDetail) return;

    const previousSection = previousMobileSectionRef.current;
    if (!previousSection && activeMobileSection) {
      setMobileTransitionDirection("forward");
    } else if (previousSection && !activeMobileSection) {
      setMobileTransitionDirection("back");
    }
    previousMobileSectionRef.current = activeMobileSection;
  }, [activeMobileSection, isMasterDetail]);

  useEffect(() => {
    if (platform !== "desktop" && settingsMobileSubView === "shortcuts") {
      setSettingsMobileSubView(null);
    }
  }, [platform, settingsMobileSubView, setSettingsMobileSubView]);

  useEffect(() => {
    if (!isMasterDetail || !settingsMobileSubView) return;

    setActiveSection(settingsMobileSubView);
    setSettingsMobileSubView(null);
  }, [isMasterDetail, settingsMobileSubView, setSettingsMobileSubView]);

  useEffect(() => {
    notificationService.getPermissionStatus().then(setPermStatus);
  }, []);

  useEffect(() => {
    setEditNameValue(user.name);
  }, [user.name]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      updateUserProfile({ name: editNameValue.trim() });
      showToast("Đã lưu tên hiển thị!");
    }
    setIsEditingName(false);
  };

  const handleManualSync = async () => {
    if (!user.isSignedIn) {
      if (onOpenAuth) onOpenAuth();
      else openAuthModal();
      return;
    }
    setIsSyncing(true);
    const success = await syncNow();
    setIsSyncing(false);
    if (success) {
      setSyncDone(true);
      showToast("Đã đồng bộ thành công!");
      setTimeout(() => setSyncDone(false), 2500);
    } else {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      app: "SketchTask",
      version: CURRENT_APP_VERSION,
      exportedAt: new Date().toISOString(),
      tasks,
      stickyNotes,
      journalEntries,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sketchtask-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Đã xuất file sao lưu JSON thành công!");
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data && Array.isArray(data.tasks)) {
          if (Array.isArray(data.tasks)) {
            localStorage.setItem(`${APP_STORAGE_KEY}_tasks`, JSON.stringify(data.tasks));
          }
          if (Array.isArray(data.stickyNotes)) {
            localStorage.setItem(`${APP_STORAGE_KEY}_notes`, JSON.stringify(data.stickyNotes));
          }
          if (Array.isArray(data.journalEntries)) {
            localStorage.setItem(`${APP_STORAGE_KEY}_journal`, JSON.stringify(data.journalEntries));
          }
          showToast("Khôi phục dữ liệu thành công! Đang làm mới...");
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast("File không đúng cấu trúc sao lưu của SketchTask!");
        }
      } catch {
        showToast("Lỗi khi đọc file JSON!");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadSampleData = () => {
    loadSampleData();
    setConfirmSampleOpen(false);
    showToast("Đã nạp dữ liệu mẫu.");
  };

  const handleDeleteAllData = () => {
    LOCAL_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
    void notificationService.cancelAll();
    setConfirmDeleteAllOpen(false);
    showToast("Đã xóa toàn bộ dữ liệu trên thiết bị.");
    setTimeout(() => window.location.reload(), 600);
  };

  const handleResetData = () => {
    void notificationService.cancelAll();
    localStorage.clear();
    setConfirmResetOpen(false);
    showToast("Đã đặt lại ứng dụng!");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // =========================================================================
  // DETAIL PANE CONTENT RENDERER
  // =========================================================================
  const renderDetailContent = (sectionKey: SettingsSectionKey) => {
    switch (sectionKey) {
      // ---------------------------------------------------------------------
      // 1. TÀI KHOẢN & ĐỒNG BỘ
      // ---------------------------------------------------------------------
      case "account":
        return (
          <div className="space-y-4 sm:space-y-5">
            {/* Profile Info Card */}
            <div className="bg-[#FFFDF8] dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] p-4 sm:p-5 shadow-[2px_2px_0px_#262626] space-y-3.5">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Interactive Avatar */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[10px] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all group ${
                      user.avatarBg === "#262626" ? "text-white" : "text-[#1C1917]"
                    }`}
                    style={{ backgroundColor: user.avatarBg || "#FFFDF8" }}
                    title="Chạm để đổi màu nền & icon đại diện"
                  >
                    <DynamicIcon
                      name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                      size={28}
                      strokeWidth={2.2}
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-[4px] bg-white border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[10px] text-[#1C1917]">
                      <Pencil size={11} strokeWidth={2.4} />
                    </span>
                  </button>

                  {/* User Name & Email */}
                  <div className="min-w-0 flex-1">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5 mb-1">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                          className="px-2.5 py-1 bg-white dark:bg-[#2C2C2E] border border-[#262626] rounded text-xs font-bold w-full max-w-[160px] text-[#1C1917] dark:text-white"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveName}
                          className="px-2.5 py-1 bg-[#1C1917] border border-[#262626] rounded text-xs font-bold text-white shrink-0 cursor-pointer shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-black text-sm sm:text-base text-[#1C1917] dark:text-[#E5E5EA] truncate">
                          {user.name || "Khách (Chưa đăng nhập)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] rounded cursor-pointer shrink-0"
                          title="Chỉnh sửa tên"
                        >
                          <Pencil size={12} strokeWidth={2.2} />
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-[#78716C] font-mono truncate mb-1.5">
                      {user.isSignedIn ? user.email : "Tài khoản cục bộ (Chưa đăng nhập)"}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border border-[#262626] bg-[#FAF8F3] dark:bg-[#2C2C2E] text-[#1C1917] dark:text-[#E5E5EA]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {user.isSignedIn ? "Đang kết nối Realtime" : "Chế độ Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button (Logout or Login) */}
                <div className="shrink-0">
                  {user.isSignedIn ? (
                    <button
                      type="button"
                      onClick={logout}
                      className="px-3 py-1.5 bg-white hover:bg-[#FAF8F3] dark:bg-[#2C2C2E] dark:hover:bg-[#3A3A3C] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <LogOut size={13} strokeWidth={2.4} />
                      <span>Đăng xuất</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAuth) onOpenAuth();
                        else if (onNavigateRoute) onNavigateRoute("/login");
                        else openAuthModal();
                      }}
                      className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-white active:translate-y-[0.5px] cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>Đăng nhập</span>
                      <ArrowRight size={13} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
              </div>

              {/* Avatar picker expanded */}
              {showAvatarPicker && (
                <div className="pt-3.5 border-t border-[#262626]/15 space-y-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div>
                    <p className="text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA] font-mono mb-2">
                      Màu nền:
                    </p>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => updateUserProfile({ avatarBg: c.hex })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] border-[1.5px] border-[#262626] flex items-center justify-center transition-all cursor-pointer active:translate-y-[0.5px] ${
                            user.avatarBg === c.hex
                              ? "shadow-[2px_2px_0px_#262626] ring-2 ring-[#262626]"
                              : "opacity-80 hover:opacity-100 shadow-[1px_1px_0px_#262626]/40"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {user.avatarBg === c.hex && (
                            <Check
                              size={16}
                              strokeWidth={3}
                              className={c.hex === "#262626" ? "text-white" : "text-[#1C1917]"}
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA] font-mono mb-2">
                      Biểu tượng đại diện:
                    </p>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      {AVATAR_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => updateUserProfile({ avatar: icon })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] transition-all cursor-pointer active:translate-y-[0.5px] ${
                            user.avatar === icon
                              ? "bg-[#1C1917] text-white shadow-[2px_2px_0px_#262626] ring-2 ring-[#262626]"
                              : "bg-white hover:bg-[#FAF8F3] shadow-[1px_1px_0px_#262626]/40"
                          }`}
                        >
                          <DynamicIcon name={icon} size={18} strokeWidth={2.2} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cloud Sync Group */}
            <SettingsGroup title="Đồng bộ Đám mây & Thiết bị" icon={Cloud}>
              <SettingsRow
                title="Trạng thái đồng bộ"
                description={
                  lastSyncedAt
                    ? `Lần đồng bộ gần nhất: ${lastSyncedAt}`
                    : user.isSignedIn
                    ? "Tất cả dữ liệu đã được tự động sao lưu"
                    : "Đang lưu trữ ngoại tuyến trên thiết bị này"
                }
              >
                {user.isSignedIn ? (
                  <button
                    type="button"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-white flex items-center gap-1.5 active:translate-y-[0.5px] cursor-pointer"
                  >
                    <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                    <span>{syncDone ? "✓ Đã đồng bộ" : isSyncing ? "Đang gửi..." : "Đồng bộ ngay"}</span>
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-[#78716C]">Lưu cục bộ</span>
                )}
              </SettingsRow>
            </SettingsGroup>
          </div>
        );

      // ---------------------------------------------------------------------
      // 2. GIAO DIỆN & TRẢI NGHIỆM
      // ---------------------------------------------------------------------
      case "general":
        return (
          <div className="space-y-4 sm:space-y-5">
            {/* Nhóm: Phong cách & Chủ đề */}
            <SettingsGroup title="Phong cách & Màu sắc" icon={Sliders}>
              <SettingsRow
                title="Phong cách giao diện"
                description="Chọn phong cách phẳng tối giản hoặc phác thảo viền mực"
              >
                <SettingsSelect
                  value={interfaceStyle}
                  onChange={(val) => {
                    setInterfaceStyle(val as InterfaceStyle);
                    showToast(val === "ios" ? "Đã bật Hiện đại & Tối giản" : "Đã bật SketchTask nguyên bản");
                  }}
                  options={[
                    {
                      value: "sketch",
                      label: "SketchTask nguyên bản",
                      description: "Viền mực đậm, bóng đổ cứng & chất liệu sổ tay",
                    },
                    {
                      value: "ios",
                      label: "Hiện đại & Tối giản",
                      description: "Giao diện phẳng, thẻ bo mềm mại, tối ưu chạm",
                    },
                  ]}
                />
              </SettingsRow>

              <SettingsRow
                title="Chất liệu nền giấy"
                description={
                  interfaceStyle === "ios"
                    ? "Chỉ áp dụng khi chọn phong cách SketchTask nguyên bản"
                    : "Họa tiết kẻ ngang, chấm bi hoặc ô ly trên trang giấy"
                }
                disabled={interfaceStyle === "ios"}
              >
                <SettingsSelect
                  value={paperStyle}
                  disabled={interfaceStyle === "ios"}
                  onChange={(val) => {
                    setPaperStyle(val as PaperStyle);
                    showToast(`Đã chọn nền ${val}`);
                  }}
                  options={[
                    { value: "blank", label: "Giấy trơn" },
                    { value: "lined", label: "Kẻ ngang" },
                    { value: "dots", label: "Chấm bi" },
                    { value: "grid", label: "Ô ly" },
                  ]}
                />
              </SettingsRow>

              <SettingsRow
                title="Chế độ ban đêm (Dark Mode)"
                description="Giao diện tối dịu mắt, tiết kiệm pin cho màn hình OLED"
              >
                <SettingsSwitch
                  checked={isDarkMode}
                  label="Chế độ tối"
                  onChange={() => setIsDarkMode(!isDarkMode)}
                />
              </SettingsRow>
            </SettingsGroup>

            {/* Nhóm: Kiểu chữ & Hiển thị */}
            <SettingsGroup title="Văn bản & Cỡ chữ" icon={FileText}>
              <SettingsRow
                title="Kiểu phông chữ"
                description="Lựa chọn phông chữ tiêu chuẩn sắc nét và dễ đọc"
              >
                <SettingsSelect
                  value={fontFamily}
                  onChange={(val) => setFontFamily(val as FontFamilyPreference)}
                  options={[
                    { value: "inter", label: "Inter / SF Pro", description: "Hiện đại, rõ ràng" },
                    { value: "jakarta", label: "Plus Jakarta Sans", description: "Trang nhã, thoáng" },
                    { value: "system", label: "Phông theo máy", description: "Mặc định hệ điều hành" },
                  ]}
                />
              </SettingsRow>

              <SettingsRow
                title="Kích thước chữ"
                description="Tăng hoặc giảm cỡ chữ để đọc thoải mái nhất"
              >
                <SettingsSelect
                  value={fontSize}
                  onChange={(val) => setFontSize(val as FontSizePreference)}
                  options={[
                    { value: "normal", label: "Tiêu chuẩn", description: "Gọn gàng" },
                    { value: "large", label: "Lớn (Khuyên dùng)", description: "Dễ đọc, rõ ràng" },
                    { value: "xlarge", label: "Rất lớn", description: "Tối ưu cho mắt yếu" },
                  ]}
                />
              </SettingsRow>
            </SettingsGroup>

            {/* Nhóm: Hiệu ứng (Desktop only) */}
            {platform === "desktop" && (
              <SettingsGroup title="Hiệu ứng không gian" icon={Sparkles}>
                <SettingsRow
                  title="Hiệu ứng nghiêng 3D khi rê chuột"
                  description="Tạo góc nghiêng phác thảo nhẹ theo con trỏ chuột"
                >
                  <SettingsSwitch
                    checked={isTiltEnabled}
                    label="Hiệu ứng nghiêng 3D"
                    onChange={() => setIsTiltEnabled(!isTiltEnabled)}
                  />
                </SettingsRow>
              </SettingsGroup>
            )}
          </div>
        );

      // ---------------------------------------------------------------------
      // 3. THÔNG BÁO & ÂM THANH
      // ---------------------------------------------------------------------
      case "notifications":
        return (
          <div className="space-y-4 sm:space-y-5">
            <SettingsGroup title="Hệ thống Thông báo" icon={Bell}>
              <SettingsRow
                title={isNativeNotifications ? "Thông báo trên điện thoại" : "Thông báo trên trình duyệt"}
                description={
                  permStatus === "granted"
                    ? "Nhắc nhở kịp thời khi công việc đến hạn"
                    : permStatus === "denied"
                    ? "Quyền thông báo đang bị chặn trong cài đặt máy"
                    : "Bật để nhận thông báo nhắc việc"
                }
              >
                <SettingsSwitch
                  checked={isNotificationsEnabled && permStatus === "granted"}
                  label="Thông báo nhắc việc"
                  onChange={async () => {
                    if (isNotificationsEnabled && permStatus === "granted") {
                      setIsNotificationsEnabled(false);
                      showToast("Đã tắt thông báo.");
                      return;
                    }

                    const granted = await notificationService.requestPermission();
                    setPermStatus(granted ? "granted" : "denied");
                    setIsNotificationsEnabled(granted);
                    if (granted) {
                      showToast(
                        isNativeNotifications
                          ? "Đã bật thông báo trên điện thoại!"
                          : "Đã bật thông báo trên trình duyệt!"
                      );
                    } else {
                      showToast("Chưa được cấp quyền thông báo.");
                    }
                  }}
                />
              </SettingsRow>

              <SettingsRow
                title="Tóm tắt công việc đầu ngày"
                description="Gửi thông báo danh sách việc cần làm vào mỗi buổi sáng"
              >
                <SettingsSelect
                  value={dailyDigestTime}
                  onChange={(val) => {
                    setDailyDigestTime(val);
                    localStorage.setItem("sketchtask_digest_time", val);
                    showToast(val === "off" ? "Đã tắt nhắc đầu ngày" : `Đã đặt nhắc lúc ${val}`);
                  }}
                  options={[
                    { value: "off", label: "Tắt thông báo này" },
                    { value: "07:00", label: "07:00 sáng" },
                    { value: "08:00", label: "08:00 sáng (Mặc định)" },
                    { value: "09:00", label: "09:00 sáng" },
                  ]}
                />
              </SettingsRow>

              <SettingsRow
                title="Báo trước thời hạn"
                description="Thời điểm nhắc trước khi nhiệm vụ đến giờ kết thúc"
              >
                <SettingsSelect
                  value={reminderOffset}
                  onChange={(val) => {
                    setReminderOffset(val);
                    localStorage.setItem("sketchtask_reminder_offset", val);
                    showToast("Đã cập nhật thời gian báo trước");
                  }}
                  options={[
                    { value: "exact", label: "Đúng giờ đến hạn" },
                    { value: "15m", label: "Trước 15 phút" },
                    { value: "30m", label: "Trước 30 phút" },
                    { value: "1h", label: "Trước 1 giờ" },
                    { value: "1d", label: "Trước 1 ngày" },
                  ]}
                />
              </SettingsRow>
            </SettingsGroup>

            <SettingsGroup title="Âm thanh & Phản hồi" icon={Volume2}>
              <SettingsRow
                title="Âm thanh vẽ tay khi xong việc"
                description="Phát tiếng bút chì sột soạt vui tai khi đánh dấu tick hoàn thành"
              >
                <div className="flex items-center gap-2">
                  {isSoundEnabled && (
                    <button
                      type="button"
                      onClick={() => sounds.playPencilCheck(soundVolume)}
                      className="px-2.5 py-1 bg-white dark:bg-[#2C2C2E] hover:bg-[#FAF8F3] border border-[#262626] rounded text-[11px] font-bold shadow-[1px_1px_0px_#262626] cursor-pointer text-[#1C1917] dark:text-[#E5E5EA]"
                    >
                      Thử nghe
                    </button>
                  )}
                  <SettingsSwitch
                    checked={isSoundEnabled}
                    label="Âm thanh bút chì"
                    onChange={() => {
                      setIsSoundEnabled(!isSoundEnabled);
                      if (!isSoundEnabled) sounds.playPencilCheck(soundVolume);
                    }}
                  />
                </div>
              </SettingsRow>
            </SettingsGroup>
          </div>
        );

      // ---------------------------------------------------------------------
      // 4. DỮ LIỆU & BỘ NHỚ (SAO LƯU CHUYÊN NGHIỆP)
      // ---------------------------------------------------------------------
      case "data":
        return (
          <div className="space-y-4 sm:space-y-5">
            {/* Sao lưu & Khôi phục */}
            <SettingsGroup title="Sao lưu & Phục hồi dữ liệu" icon={Download}>
              <SettingsRow
                title="Xuất file sao lưu (.json)"
                description="Tải toàn bộ công việc, sổ tay, ghi chú và nhật ký về máy để cất giữ an toàn"
              >
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-white flex items-center gap-1.5 active:translate-y-[0.5px] cursor-pointer"
                >
                  <Download size={13} strokeWidth={2.4} />
                  <span>Xuất file JSON</span>
                </button>
              </SettingsRow>

              <SettingsRow
                title="Khôi phục từ file sao lưu"
                description="Nạp lại dữ liệu đã lưu từ file JSON trên máy tính hoặc điện thoại"
              >
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white dark:bg-[#2C2C2E] hover:bg-[#FAF8F3] dark:hover:bg-[#3A3A3C] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA] flex items-center gap-1.5 active:translate-y-[0.5px] cursor-pointer"
                  >
                    <Upload size={13} strokeWidth={2.4} />
                    <span>Chọn file JSON</span>
                  </button>
                </>
              </SettingsRow>
            </SettingsGroup>

            {/* Dữ liệu mẫu (Khối phụ) */}
            <SettingsGroup title="Dữ liệu mẫu để làm quen" icon={Zap}>
              <SettingsRow
                title="Nạp dữ liệu mẫu"
                description="Tạo sẵn các nhiệm vụ, sổ tay và ghi chú mẫu để xem cách thức vận hành của app"
              >
                <button
                  type="button"
                  onClick={() => setConfirmSampleOpen(true)}
                  className="px-3 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-y-[0.5px] cursor-pointer"
                >
                  Nạp mẫu
                </button>
              </SettingsRow>
            </SettingsGroup>

            {/* Vùng nguy hiểm */}
            <div className="bg-[#FFF1F2] dark:bg-[#2C1517] border-[1.5px] border-[#E11D48] rounded-[8px] p-4 sm:p-5 shadow-[2px_2px_0px_#E11D48] space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-[#E11D48]/30">
                <AlertTriangle size={14} strokeWidth={2.4} className="text-[#E11D48]" />
                <h3 className="text-xs font-black uppercase font-mono tracking-wider text-[#9F1239] dark:text-[#FDA4AF]">
                  Vùng Nguy Hiểm (Danger Zone)
                </h3>
              </div>
              <div className="divide-y divide-[#E11D48]/20">
                <SettingsRow
                  title="Xóa dữ liệu trên thiết bị"
                  description="Xóa toàn bộ task, sổ tay và ghi chú trên máy. Cài đặt và tài khoản vẫn giữ nguyên."
                >
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAllOpen(true)}
                    className="px-3 py-1.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FFE4E6] border border-[#E11D48] rounded-[4px] text-xs font-bold text-[#E11D48] shadow-[1px_1px_0px_#E11D48] active:translate-y-[0.5px] cursor-pointer"
                  >
                    Xóa dữ liệu
                  </button>
                </SettingsRow>

                <SettingsRow
                  title="Đặt lại toàn bộ ứng dụng"
                  description="Khôi phục trạng thái ban đầu như khi mới cài đặt, xóa mọi dữ liệu và đăng xuất"
                >
                  <button
                    type="button"
                    onClick={() => setConfirmResetOpen(true)}
                    className="px-3 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] border border-[#9F1239] rounded-[4px] text-xs font-bold text-white shadow-[1px_1px_0px_#9F1239] active:translate-y-[0.5px] cursor-pointer"
                  >
                    Đặt lại gốc
                  </button>
                </SettingsRow>
              </div>
            </div>
          </div>
        );

      // ---------------------------------------------------------------------
      // 5. BẢO MẬT & MÃ PIN
      // ---------------------------------------------------------------------
      case "security":
        return (
          <div className="space-y-4 sm:space-y-5">
            <SettingsGroup title="Khóa ứng dụng" icon={ShieldCheck}>
              <SettingsRow
                title="Khóa bằng mã PIN 4 số"
                description={
                  pinCode
                    ? "Ứng dụng đang được bảo vệ. Yêu cầu nhập PIN khi mở app."
                    : "Đặt mã PIN để ngăn người khác mở xem công việc riêng tư của bạn"
                }
              >
                <button
                  type="button"
                  onClick={() => setPinModalMode(pinCode ? "change" : "setup")}
                  className={`px-3 py-1.5 rounded-[4px] border-[1.5px] border-[#262626] text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] cursor-pointer active:translate-y-[0.5px] ${
                    pinCode
                      ? "bg-[#1C1917] text-white"
                      : "bg-[#FAF8F3] dark:bg-[#2C2C2E] text-[#1C1917] dark:text-[#E5E5EA]"
                  }`}
                >
                  {pinCode ? "Đổi mã PIN" : "Thiết lập PIN"}
                </button>
              </SettingsRow>

              {pinCode && (
                <SettingsRow
                  title="Tắt bảo vệ mã PIN"
                  description="Gỡ bỏ mã khóa PIN khỏi thiết bị này"
                >
                  <button
                    type="button"
                    onClick={() => setPinModalMode("disable")}
                    className="text-xs font-bold text-[#E11D48] hover:underline cursor-pointer"
                  >
                    Tắt mã PIN
                  </button>
                </SettingsRow>
              )}
            </SettingsGroup>
          </div>
        );

      // ---------------------------------------------------------------------
      // 6. PHÍM TẮT BÀN PHÍM (DESKTOP)
      // ---------------------------------------------------------------------
      case "shortcuts":
        return (
          <div className="space-y-4 sm:space-y-5">
            <SettingsGroup title="Phím tắt thao tác nhanh" icon={Sliders}>
              <SettingsRow title="Mở nhanh Tìm kiếm toàn cục">
                <kbd className="px-2.5 py-1 bg-white dark:bg-[#2C2C2E] border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-mono text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA]">
                  Ctrl + K
                </kbd>
              </SettingsRow>
              <SettingsRow title="Đóng / Mở thanh menu bên">
                <kbd className="px-2.5 py-1 bg-white dark:bg-[#2C2C2E] border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-mono text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA]">
                  Ctrl + B
                </kbd>
              </SettingsRow>
              <SettingsRow title="Lật ngày xem Nhật ký">
                <kbd className="px-2.5 py-1 bg-white dark:bg-[#2C2C2E] border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-mono text-xs font-bold text-[#1C1917] dark:text-[#E5E5EA]">
                  ← / →
                </kbd>
              </SettingsRow>
            </SettingsGroup>
          </div>
        );

      // ---------------------------------------------------------------------
      // 7. TRỢ GIÚP & GIỚI THIỆU
      // ---------------------------------------------------------------------
      case "about":
        return (
          <div className="space-y-4 sm:space-y-5">
            <div className="bg-[#FFFDF8] dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] p-6 sm:p-8 shadow-[2px_2px_0px_#262626] text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto bg-[#1C1917] text-white border-[2px] border-[#262626] rounded-[14px] shadow-[2.5px_2.5px_0px_#262626] flex items-center justify-center text-3xl font-black">
                <Pencil size={28} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-black text-2xl text-[#1C1917] dark:text-[#E5E5EA]">
                  SketchTask
                </h3>
                <p className="text-xs text-[#78716C] font-mono mt-1">
                  Phiên bản: <strong className="text-[#1C1917] dark:text-white">v{CURRENT_APP_VERSION}</strong>
                </p>
              </div>

              <p className="text-xs text-[#57534E] dark:text-[#A1A1AA] leading-relaxed max-w-md mx-auto">
                Ứng dụng quản lý công việc và ghi chép cá nhân phong cách nét vẽ thủ công, tối ưu hóa sự tập trung và đồng bộ tức thì trên mọi thiết bị.
              </p>

              <div className="pt-3 border-t border-[#E7E5E4] dark:border-[#3A3A3C] flex items-center justify-center gap-4 text-xs font-bold">
                <span className="text-[#1C1917] dark:text-[#E5E5EA] font-mono">Offline First</span>
                <span className="text-[#D4CEBF]">•</span>
                <span className="text-[#1C1917] dark:text-[#E5E5EA] font-mono">Zero AI Slop</span>
                <span className="text-[#D4CEBF]">•</span>
                <span className="text-[#1C1917] dark:text-[#E5E5EA] font-mono">Realtime Sync</span>
              </div>

              <p className="text-[10px] text-[#A8A29E] font-mono pt-2">
                © 2026 SketchTask App. All rights reserved.
              </p>
            </div>
          </div>
        );
    }
  };

  const renderSettingsOverlays = () => (
    <>
      <ConfirmModal
        isOpen={confirmSampleOpen}
        onCancel={() => setConfirmSampleOpen(false)}
        onConfirm={handleLoadSampleData}
        title="Nạp dữ liệu mẫu?"
        message="Dữ liệu mẫu sẽ thêm danh sách công việc, sổ tay và ghi chú tham khảo vào ứng dụng của bạn."
        confirmText="Nạp dữ liệu"
      />

      <ConfirmModal
        isOpen={confirmDeleteAllOpen}
        onCancel={() => setConfirmDeleteAllOpen(false)}
        onConfirm={handleDeleteAllData}
        title="Xóa toàn bộ dữ liệu?"
        message="Tất cả công việc, sổ tay, ghi chú và nhật ký trên thiết bị này sẽ bị xóa. Cài đặt và tài khoản vẫn được giữ lại."
        confirmText="Xóa toàn bộ"
      />

      <ConfirmModal
        isOpen={confirmResetOpen}
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={handleResetData}
        title="Đặt Lại Ứng Dụng Gốc?"
        message="Xóa toàn bộ dữ liệu và cài đặt trên thiết bị này để đưa ứng dụng về trạng thái ban đầu. Phiên đăng nhập cũng sẽ được đăng xuất."
        confirmText="Đặt lại gốc"
      />

      {pinModalMode && (
        <PinLockModal
          isOpen={true}
          mode={pinModalMode}
          currentPinHash={pinCode || undefined}
          onSuccess={(newPin) => {
            setPinCode(newPin || null);
            setPinModalMode(null);
            showToast(newPin ? "Đã lưu mã PIN mới!" : "Đã tắt mã PIN!");
          }}
          onCancel={() => setPinModalMode(null)}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#262626] text-white text-xs font-bold rounded-[6px] shadow-[2px_2px_0px_#78716C] animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </>
  );

  // =========================================================================
  // 1. MOBILE + TABLET PORTRAIT: SINGLE COLUMN DRILLDOWN
  // =========================================================================
  if (activeMobileSection) {
    const currentSection = SETTINGS_MENU_ITEMS.find((item) => item.key === activeMobileSection);
    return (
      <>
        <div
          className={`w-full mx-auto space-y-3.5 pb-4 select-none ${
            platform === "mobile"
              ? mobileTransitionDirection === "back"
                ? "mobile-panel-back-enter"
                : "mobile-panel-enter"
              : "animate-in fade-in duration-150"
          } ${
            platform === "tablet" ? "max-w-3xl" : "max-w-xl"
          }`}
        >
          {!hideMobileDetailHeader && (
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#262626]">
              <button
                type="button"
                onClick={() => setSettingsMobileSubView(null)}
                className="w-8 h-8 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] dark:text-[#E5E5EA] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0 transition-all"
                title="Quay lại danh sách cài đặt"
              >
                <ArrowLeft size={16} strokeWidth={2.4} />
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {currentSection && (
                  <span className={`w-6 h-6 rounded-[3px] border border-[#262626] flex items-center justify-center shrink-0 ${currentSection.iconTone}`}>
                    <currentSection.icon size={13} strokeWidth={2.2} />
                  </span>
                )}
                <span className="font-black text-base text-[#1C1917] dark:text-[#E5E5EA] tracking-tight truncate">
                  {currentSection?.label || "Cài đặt"}
                </span>
              </div>
            </div>
          )}
          {renderDetailContent(activeMobileSection)}
        </div>
        {renderSettingsOverlays()}
      </>
    );
  }

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const activeTasksCount = tasks.filter((t) => !t.completed).length;

  return (
    <>
      {isMasterDetail ? (
        <div className="flex h-full min-h-[580px] w-full items-start gap-4 lg:gap-6 select-none">
          {/* Master Nav Pane */}
          <div className="w-64 lg:w-72 shrink-0">
            <SettingsSectionNav
              variant="master"
              platform={platform}
              items={visibleSettingsMenuItems}
              subtitles={settingsSubtitles}
              activeSection={activeSection}
              onSelect={(sec) => setActiveSection(sec)}
            />
          </div>

          {/* Detail Content Pane */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            {renderDetailContent(activeSection)}
          </div>
        </div>
      ) : platform === "mobile" ? (
        /* TRANG CÁ NHÂN (PERSONAL PROFILE HUB TRÊN MOBILE) */
        <div className="w-full max-w-xl mx-auto space-y-3.5 pb-12 select-none animate-in fade-in duration-150">
          {/* 1. Thẻ Hồ Sơ Người Dùng */}
          <section className="bg-[#FFFDF8] dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[10px] p-4 shadow-[3px_3px_0px_#262626] space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSettingsMobileSubView("account")}
                className="relative w-13 h-13 rounded-[8px] border-[1.5px] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center shrink-0 cursor-pointer active:translate-y-[0.5px] transition-all"
                style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
                title="Thay đổi ảnh đại diện"
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={24}
                  strokeWidth={2.2}
                />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-black text-base text-[#1C1917] dark:text-white tracking-tight truncate">
                    {user.name || "Người dùng"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSettingsMobileSubView("account")}
                    className="p-1 text-[#78716C] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                    title="Chỉnh sửa thông tin"
                  >
                    <Pencil size={12} strokeWidth={2.4} />
                  </button>
                </div>
                <p className="text-[11px] font-mono text-[#78716C] truncate mt-0.5">
                  {user.isSignedIn ? user.email : "Tài khoản cục bộ (Offline)"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSettingsMobileSubView("account")}
                className="px-2.5 py-1 bg-white hover:bg-[#FAF8F3] dark:bg-[#2C2C2E] border border-[#262626] rounded-[5px] text-[11px] font-bold text-[#1C1917] dark:text-[#E5E5EA] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer shrink-0"
              >
                Hồ sơ
              </button>
            </div>
          </section>

          {/* 2. Tổng Quan Năng Suất Cá Nhân */}
          <section className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] p-2.5 text-center shadow-[2px_2px_0px_#262626]">
              <span className="font-mono text-base font-black text-[#1C1917] dark:text-white block">
                {completedTasksCount}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#78716C] block mt-0.5">
                Việc đã xong
              </span>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] p-2.5 text-center shadow-[2px_2px_0px_#262626]">
              <span className="font-mono text-base font-black text-[#1C1917] dark:text-white block">
                {journalEntries.length}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#78716C] block mt-0.5">
                Nhật ký
              </span>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] border-[1.5px] border-[#262626] rounded-[8px] p-2.5 text-center shadow-[2px_2px_0px_#262626]">
              <span className="font-mono text-base font-black text-[#1C1917] dark:text-white block">
                {activeTasksCount}
              </span>
              <span className="text-[10px] font-mono font-bold text-[#78716C] block mt-0.5">
                Cần làm
              </span>
            </div>
          </section>

          {/* 3. Danh Mục Tính Năng & Cài Đặt */}
          <div className="space-y-2">
            {/* Hồ sơ & Tài khoản */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("account")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#FEF08A] border border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] group-hover:scale-105 transition-transform">
                  <User size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1C1917] dark:text-white">Tài khoản & Hồ sơ cá nhân</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">Đổi tên, màu đại diện & đồng bộ đám mây</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.4} className="text-[#78716C]" />
            </button>

            {/* Cài đặt hệ thống */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("general")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#E0F2FE] border border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] group-hover:scale-105 transition-transform">
                  <Settings size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1C1917] dark:text-white">Cài đặt hệ thống</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">Giao diện, âm thanh, thông báo & font chữ</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.4} className="text-[#78716C]" />
            </button>

            {/* Thông báo */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("notifications")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#BAE6FD] border border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] group-hover:scale-105 transition-transform">
                  <Bell size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1C1917] dark:text-white">Thông báo & Nhắc việc</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">{isNotificationsEnabled ? "Đang bật" : "Đang tắt"}</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.4} className="text-[#78716C]" />
            </button>

            {/* Dữ liệu & Bộ nhớ */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("data")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#BBF7D0] border border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] group-hover:scale-105 transition-transform">
                  <Cloud size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1C1917] dark:text-white">Dữ liệu & Sao lưu</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">Đồng bộ đám mây, xuất nhập JSON</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.4} className="text-[#78716C]" />
            </button>

            {/* Bảo mật PIN */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("security")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#FECDD3] border border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] group-hover:scale-105 transition-transform">
                  <ShieldCheck size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1C1917] dark:text-white">Bảo mật & Mã PIN</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">{pinCode ? "Đã bật mã PIN" : "Chưa đặt mã PIN"}</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.4} className="text-[#78716C]" />
            </button>

            {/* Giới thiệu & Trợ giúp */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("about")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-[#E7E5E4] border border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] group-hover:scale-105 transition-transform">
                  <Sparkles size={18} strokeWidth={2.4} />
                </div>
                <div>
                  <p className="text-xs font-black text-[#1C1917] dark:text-white">Giới thiệu ứng dụng</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">SketchTask App · Phiên bản v{CURRENT_APP_VERSION}</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.4} className="text-[#78716C]" />
            </button>
          </div>

          {/* 4. Đăng nhập / Đăng xuất */}
          <div className="pt-2">
            {user.isSignedIn ? (
              <button
                type="button"
                onClick={logout}
                className="w-full py-2.5 px-4 bg-white hover:bg-rose-50 border-[1.5px] border-rose-600 text-rose-700 text-xs font-bold rounded-[8px] shadow-[2px_2px_0px_#262626] flex items-center justify-center gap-2 active:translate-y-[0.5px] cursor-pointer transition-all"
              >
                <LogOut size={15} strokeWidth={2.4} />
                <span>Đăng xuất tài khoản</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else openAuthModal();
                }}
                className="w-full py-2.5 px-4 bg-[#1C1917] hover:bg-black text-white text-xs font-bold rounded-[8px] border-[1.5px] border-[#1C1917] shadow-[2px_2px_0px_#262626] flex items-center justify-center gap-2 active:translate-y-[0.5px] cursor-pointer transition-all"
              >
                <LogIn size={15} strokeWidth={2.4} />
                <span>Đăng nhập / Đăng ký đồng bộ</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-xl mx-auto space-y-4 pb-12 select-none">
          <SettingsSectionNav
            variant="list"
            platform={platform}
            items={visibleSettingsMenuItems}
            subtitles={settingsSubtitles}
            activeSection={activeSection}
            onSelect={(sec) => setSettingsMobileSubView(sec)}
          />
        </div>
      )}
      {renderSettingsOverlays()}
    </>
  );
};
