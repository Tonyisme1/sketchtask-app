import React, { useState, useEffect, useRef } from "react";
import {
  APP_STORAGE_KEY,
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
import { SettingsScreenModel } from "../../../features/settings/model/types";
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
  Laptop,
  Smartphone,
  Radio,
  CheckSquare,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ==========================================
// COMPONENT: SettingsView Chuẩn Năng Suất Cao Cấp
// ==========================================

interface SettingsViewProps extends SettingsScreenModel {
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
// 1. COMPACT POPUP SELECT (Neo tại chỗ, không viền, bo góc mượt mà)
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
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] transition-all shadow-2xs cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown size={14} className={`text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-[150px] max-w-[260px] p-1.5 rounded-3xl bg-white dark:bg-[#1E1E22] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          }`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={option.disabled}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-2xl text-xs font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#007AFF]/10 text-[#007AFF] font-semibold dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]"
                    : "text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                } ${option.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div>
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-[10px] text-[#8E8E93] dark:text-[#A1A1A6] font-normal">{option.description}</div>
                  )}
                </div>
                {isSelected && <Check size={13} className="shrink-0 text-[#007AFF] dark:text-[#0A84FF]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. MODERN PILL SWITCH
// ---------------------------------------------------------------------------
interface SettingsSwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

const SettingsSwitch: React.FC<SettingsSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
}) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label || "Toggle setting"}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      } ${
        checked
          ? "bg-[#34C759] dark:bg-[#30D158]"
          : "bg-black/[0.12] dark:bg-white/[0.15]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
          checked ? "translate-x-5.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
};

// ---------------------------------------------------------------------------
// 3. SETTINGS ROW & GROUP
// ---------------------------------------------------------------------------
interface SettingsRowProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ title, description, children }) => (
  <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
    <div className="min-w-0 flex-1">
      <div className="text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">{title}</div>
      {description && (
        <div className="text-[11px] sm:text-xs text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5 leading-snug">{description}</div>
      )}
    </div>
    <div className="shrink-0">{children}</div>
  </div>
);

interface SettingsGroupProps {
  title: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

const SettingsGroup: React.FC<SettingsGroupProps> = ({ title, icon: Icon, children }) => (
  <div className="rounded-3xl shadow-xs bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 space-y-3.5">
    <div className="flex items-center gap-2 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
      {Icon && (
        <div className="w-6 h-6 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7]">
          <Icon size={14} strokeWidth={2.2} />
        </div>
      )}
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#A1A1A6] font-mono">
        {title}
      </h3>
    </div>
    <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
      {children}
    </div>
  </div>
);

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

export const SettingsView: React.FC<SettingsViewProps> = ({
  onNavigateRoute,
  onOpenAuth,
  hideMobileDetailHeader = false,
  platform = "desktop",
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
  setSoundVolume,
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
  isLandscape,
}) => {
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

  // File import ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMasterDetail =
    platform === "desktop" || (platform === "tablet" && isLandscape);
  const isDesktopSettings = platform === "desktop";
  const isNativeNotifications = isNativePlatform();
  const visibleSettingsMenuItems =
    platform === "desktop"
      ? SETTINGS_MENU_ITEMS
      : SETTINGS_MENU_ITEMS.filter((item) => item.key !== "shortcuts");
  const settingsSubtitles: Partial<Record<SettingsSectionKey, string>> = {
    account: user.isSignedIn ? user.email || "Đã đăng nhập" : "Lưu cục bộ · Chưa đăng nhập",
    general: `Hiện đại & Tối giản · ${isDarkMode ? "Tối" : "Sáng"} · ${fontSize === "normal" ? "Cỡ chữ chuẩn" : fontSize === "large" ? "Cỡ chữ lớn" : "Cỡ chữ rất lớn"}`,
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
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
            <div className={`rounded-3xl bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 space-y-4 ${isDesktopSettings ? "shadow-none" : "shadow-xs"}`}>
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Google Profile Avatar */}
                  <div
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: user.isSignedIn ? user.avatarBg || "#09090B" : "#09090B" }}
                  >
                    <DynamicIcon
                      name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                      size={28}
                      strokeWidth={2.2}
                    />
                  </div>

                  {/* User Name & Email */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                        {user.isSignedIn ? user.name : "Khách (Chưa đăng nhập)"}
                      </span>
                    </div>

                    <p className="text-xs text-[#8E8E93] dark:text-[#A1A1A6] font-mono truncate mb-1.5">
                      {user.isSignedIn ? user.email : "Tài khoản cục bộ (Chưa đăng nhập)"}
                    </p>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {user.isSignedIn ? "Đã liên kết Google (Realtime)" : "Chế độ Offline"}
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
                      className="px-3.5 py-1.5 bg-black/[0.04] hover:bg-rose-50 dark:bg-white/[0.08] dark:hover:bg-rose-950/40 rounded-2xl shadow-2xs text-xs font-semibold text-rose-600 dark:text-rose-400 cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <LogOut size={13} strokeWidth={2.2} />
                      <span>Đăng xuất</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenAuth) onOpenAuth();
                        else openAuthModal();
                      }}
                      className="px-4 py-2 bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] rounded-2xl shadow-xs text-xs font-semibold text-white cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>Đăng nhập Google</span>
                      <ArrowRight size={13} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dữ Liệu Đồng Bộ Summary */}
            <div className={`rounded-3xl bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 space-y-3.5 ${isDesktopSettings ? "shadow-none" : "shadow-xs"}`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#A1A1A6] font-mono flex items-center gap-1.5">
                  <Cloud size={14} strokeWidth={2.2} />
                  <span>Dữ Liệu Đồng Bộ Đám Mây</span>
                </span>
                <span className="font-mono text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] bg-black/[0.04] dark:bg-white/[0.06] px-2.5 py-0.5 rounded-full font-medium">
                  {lastSyncedAt ? `Đã lưu (${lastSyncedAt})` : user.isSignedIn ? "Realtime Sẵn Sàng" : "Chế độ Cục Bộ"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className={`rounded-2xl p-3 text-center ${isDesktopSettings ? "" : "bg-black/[0.02] dark:bg-white/[0.04]"}`}>
                  <span className="block font-mono text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    {tasks.length}
                  </span>
                  <span className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] font-medium flex items-center justify-center gap-1 mt-0.5">
                    <CheckSquare size={12} className="shrink-0 text-[#007AFF]" />
                    <span>Công việc</span>
                  </span>
                </div>

                <div className={`rounded-2xl p-3 text-center ${isDesktopSettings ? "" : "bg-black/[0.02] dark:bg-white/[0.04]"}`}>
                  <span className="block font-mono text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    {stickyNotes.length}
                  </span>
                  <span className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] font-medium flex items-center justify-center gap-1 mt-0.5">
                    <Lightbulb size={12} className="shrink-0 text-[#FF9500]" />
                    <span>Ghi chú</span>
                  </span>
                </div>

                <div className={`rounded-2xl p-3 text-center ${isDesktopSettings ? "" : "bg-black/[0.02] dark:bg-white/[0.04]"}`}>
                  <span className="block font-mono text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    {journalEntries.length}
                  </span>
                  <span className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] font-medium flex items-center justify-center gap-1 mt-0.5">
                    <BookOpen size={12} className="shrink-0 text-[#AF52DE]" />
                    <span>Nhật ký</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Thiết Bị & Kết Nối (Devices & Protection) */}
            <div className={`rounded-3xl bg-white dark:bg-[#1C1C1E] p-4 sm:p-5 space-y-3.5 ${isDesktopSettings ? "shadow-none" : "shadow-xs"}`}>
              <div className="flex items-center justify-between pb-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#A1A1A6] font-mono flex items-center gap-1.5">
                  <ShieldCheck size={14} strokeWidth={2.2} />
                  <span>Thiết Bị & Kết Nối</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#8E8E93] dark:text-[#A1A1A6] font-medium">
                  <Radio size={12} className="animate-pulse text-emerald-500" />
                  {user.isSignedIn ? "Online Realtime" : "Offline Cục Bộ"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center justify-between rounded-2xl p-3 ${isDesktopSettings ? "" : "bg-black/[0.02] dark:bg-white/[0.04]"}`}>
                  <span className="flex items-center gap-2 text-[#1C1C1E] dark:text-[#F2F2F7] font-medium">
                    <Laptop size={15} strokeWidth={2} className="text-[#007AFF]" />
                    <span>Thiết bị hiện tại</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    Đang hoạt động
                  </span>
                </div>

                <div className={`flex items-center justify-between rounded-2xl p-3 ${isDesktopSettings ? "" : "bg-black/[0.02] dark:bg-white/[0.04]"}`}>
                  <span className="flex items-center gap-2 text-[#1C1C1E] dark:text-[#F2F2F7] font-medium">
                    <Smartphone size={15} strokeWidth={2} className="text-[#8E8E93]" />
                    <span>Điện thoại / Máy tính bảng</span>
                  </span>
                  <span className="text-[11px] font-mono text-[#8E8E93] dark:text-[#A1A1A6]">
                    Tự động đồng bộ PWA
                  </span>
                </div>
              </div>
            </div>

            {/* Cloud Sync Group */}
            <SettingsGroup title="Đồng bộ Đám mây & Thủ công" icon={Cloud}>
              <SettingsRow
                title="Đồng bộ thủ công"
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
                    className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] rounded-2xl shadow-2xs text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                    <span>{syncDone ? "✓ Đã đồng bộ" : isSyncing ? "Đang gửi..." : "Đồng bộ ngay"}</span>
                  </button>
                ) : (
                  <span className="text-xs font-mono text-[#8E8E93]">Lưu cục bộ</span>
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
                title="Âm thanh hoàn thành công việc"
                description="Phát hiệu ứng âm thanh nhẹ nhàng khi đánh dấu tick hoàn thành"
              >
                <div className="flex items-center gap-2.5">
                  {isSoundEnabled && (
                    <button
                      type="button"
                      onClick={() => sounds.playPencilCheck(soundVolume)}
                      className="px-3 py-1 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] rounded-xl text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] cursor-pointer"
                    >
                      Thử nghe
                    </button>
                  )}
                  <SettingsSwitch
                    checked={isSoundEnabled}
                    label="Âm thanh hoàn thành"
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
                  className="px-3.5 py-1.5 bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] rounded-2xl shadow-2xs text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={13} strokeWidth={2.2} />
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
                    className="px-3.5 py-1.5 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] rounded-2xl shadow-2xs text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload size={13} strokeWidth={2.2} />
                    <span>Chọn file JSON</span>
                  </button>
                </>
              </SettingsRow>
            </SettingsGroup>

            {/* Dữ liệu mẫu (Khối phụ) */}
            <SettingsGroup title="Dữ liệu mẫu để làm quen" icon={Zap}>
              <SettingsRow
                title="Nạp dữ liệu mẫu"
                description="Tạo 100 task và sự kiện mẫu để xem cách các workspace vận hành"
              >
                <button
                  type="button"
                  onClick={() => setConfirmSampleOpen(true)}
                  className="px-3.5 py-1.5 bg-[#FF9500]/15 hover:bg-[#FF9500]/25 rounded-2xl text-xs font-semibold text-[#FF9500] cursor-pointer"
                >
                  Nạp mẫu
                </button>
              </SettingsRow>
            </SettingsGroup>

            {/* Vùng nguy hiểm */}
            <div className="rounded-3xl shadow-xs bg-rose-50/50 dark:bg-rose-950/20 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5 border-b border-rose-200/40 dark:border-rose-800/30">
                <AlertTriangle size={14} strokeWidth={2.2} className="text-rose-600 dark:text-rose-400" />
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-rose-700 dark:text-rose-400">
                  Vùng Nguy Hiểm (Danger Zone)
                </h3>
              </div>
              <div className="divide-y divide-rose-200/30 dark:divide-rose-800/20">
                <SettingsRow
                  title="Xóa dữ liệu trên thiết bị"
                  description="Xóa toàn bộ task, sổ tay và ghi chú trên máy. Cài đặt và tài khoản vẫn giữ nguyên."
                >
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAllOpen(true)}
                    className="px-3.5 py-1.5 bg-white dark:bg-[#1C1C1E] hover:bg-rose-100/50 dark:hover:bg-rose-900/30 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 shadow-2xs cursor-pointer"
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
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-2xl text-xs font-semibold text-white shadow-2xs cursor-pointer"
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
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-semibold shadow-2xs cursor-pointer ${
                    pinCode
                      ? "bg-[#007AFF] text-white hover:bg-[#0071E3]"
                      : "bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.08]"
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
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
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
                <kbd className="px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.08] rounded-xl font-mono text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs">
                  Ctrl + K
                </kbd>
              </SettingsRow>
              <SettingsRow title="Đóng / Mở thanh menu bên">
                <kbd className="px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.08] rounded-xl font-mono text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs">
                  Ctrl + B
                </kbd>
              </SettingsRow>
              <SettingsRow title="Lật ngày xem Nhật ký">
                <kbd className="px-2.5 py-1 bg-black/[0.04] dark:bg-white/[0.08] rounded-xl font-mono text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs">
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
            <div className="rounded-3xl shadow-xs bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] rounded-3xl shadow-xs flex items-center justify-center text-3xl font-black">
                <Pencil size={28} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-bold text-2xl text-[#1C1C1E] dark:text-[#F2F2F7]">
                  SketchTask
                </h3>
                <p className="text-xs text-[#8E8E93] dark:text-[#A1A1A6] font-mono mt-1">
                  Phiên bản: <strong className="text-[#1C1C1E] dark:text-[#F2F2F7]">v{CURRENT_APP_VERSION}</strong>
                </p>
              </div>

              <p className="text-xs text-[#8E8E93] dark:text-[#A1A1A6] leading-relaxed max-w-md mx-auto">
                Ứng dụng quản lý công việc và ghi chép cá nhân với thiết kế phẳng hiện đại, tinh gọn và đồng bộ tức thì trên mọi thiết bị.
              </p>

              <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center gap-4 text-xs font-semibold">
                <span className="text-[#1C1C1E] dark:text-[#F2F2F7] font-mono">Offline First</span>
                <span className="text-[#8E8E93]">•</span>
                <span className="text-[#1C1C1E] dark:text-[#F2F2F7] font-mono">Zero AI Slop</span>
                <span className="text-[#8E8E93]">•</span>
                <span className="text-[#1C1C1E] dark:text-[#F2F2F7] font-mono">Realtime Sync</span>
              </div>

              <p className="text-[10px] text-[#8E8E93] dark:text-[#A1A1A6] font-mono pt-2">
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
        message="Dữ liệu hiện có sẽ được thay bằng 100 task và sự kiện mẫu."
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
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-semibold rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-150">
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
            <div className="flex items-center gap-2 pb-2.5 border-b border-black/[0.04] dark:border-white/[0.06]">
              <button
                type="button"
                onClick={() => setSettingsMobileSubView(null)}
                aria-label="Quay lại danh sách cài đặt"
                className="mobile-back-button w-8 h-8 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.08] dark:hover:bg-white/[0.12] rounded-xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] cursor-pointer shrink-0 transition-all"
                title="Quay lại danh sách cài đặt"
              >
                <ArrowLeft size={16} strokeWidth={2.2} />
              </button>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {currentSection && (
                  <span className={`w-6 h-6 rounded-xl flex items-center justify-center shrink-0 ${currentSection.iconTone}`}>
                    <currentSection.icon size={13} strokeWidth={2.2} />
                  </span>
                )}
                <span className="font-bold text-base text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight truncate">
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
        <div className="w-full max-w-xl mx-auto space-y-3.5 pb-32 sm:pb-36 select-none animate-in fade-in duration-150">
          {/* 1. Thẻ Hồ Sơ Người Dùng */}
          <section className="rounded-3xl shadow-xs bg-white dark:bg-[#1C1C1E] p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="relative w-12 h-12 rounded-2xl shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
                style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={24}
                  strokeWidth={2.2}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-sm text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight truncate">
                    {user.name || (user.isSignedIn ? "Người dùng" : "Khách (Offline)")}
                  </h2>
                </div>
                <p className="text-xs text-[#8E8E93] dark:text-[#A1A1A6] font-mono truncate">
                  {user.isSignedIn ? user.email : "Chưa đăng nhập Google"}
                </p>
              </div>

              <div className="shrink-0">
                {user.isSignedIn ? (
                  <button
                    type="button"
                    onClick={logout}
                    className="p-2 bg-black/[0.04] dark:bg-white/[0.08] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl shadow-2xs cursor-pointer transition-colors"
                    title="Đăng xuất"
                  >
                    <LogOut size={14} strokeWidth={2.2} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else openAuthModal();
                    }}
                    className="px-3 py-1.5 bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] text-white text-xs font-semibold rounded-2xl shadow-2xs cursor-pointer transition-colors"
                  >
                    Đăng nhập
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* 2. Tổng Quan Năng Suất Cá Nhân */}
          <section className="grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl shadow-xs bg-white dark:bg-[#1C1C1E] p-3 text-center">
              <span className="font-mono text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] block">
                {completedTasksCount}
              </span>
              <span className="text-[11px] font-medium text-[#8E8E93] dark:text-[#A1A1A6] block mt-0.5">
                Việc đã xong
              </span>
            </div>

            <div className="rounded-2xl shadow-xs bg-white dark:bg-[#1C1C1E] p-3 text-center">
              <span className="font-mono text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] block">
                {journalEntries.length}
              </span>
              <span className="text-[11px] font-medium text-[#8E8E93] dark:text-[#A1A1A6] block mt-0.5">
                Nhật ký
              </span>
            </div>

            <div className="rounded-2xl shadow-xs bg-white dark:bg-[#1C1C1E] p-3 text-center">
              <span className="font-mono text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] block">
                {activeTasksCount}
              </span>
              <span className="text-[11px] font-medium text-[#8E8E93] dark:text-[#A1A1A6] block mt-0.5">
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
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl shadow-xs transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <User size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Tài khoản & Hồ sơ cá nhân</p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5">Đổi tên, màu đại diện & đồng bộ đám mây</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
            </button>

            {/* Cài đặt hệ thống */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("general")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl shadow-xs transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Settings size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Cài đặt hệ thống</p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5">Giao diện, âm thanh, thông báo & font chữ</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
            </button>

            {/* Thông báo */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("notifications")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl shadow-xs transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Bell size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Thông báo & Nhắc việc</p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5">{isNotificationsEnabled ? "Đang bật" : "Đang tắt"}</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
            </button>

            {/* Dữ liệu & Bộ nhớ */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("data")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl shadow-xs transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Cloud size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Dữ liệu & Sao lưu</p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5">Đồng bộ đám mây, xuất nhập JSON</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
            </button>

            {/* Bảo mật PIN */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("security")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl shadow-xs transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Bảo mật & Mã PIN</p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5">{pinCode ? "Đã bật mã PIN" : "Chưa đặt mã PIN"}</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
            </button>

            {/* Giới thiệu & Trợ giúp */}
            <button
              type="button"
              onClick={() => setSettingsMobileSubView("about")}
              className="w-full flex items-center justify-between p-3.5 bg-white dark:bg-[#1C1C1E] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl shadow-xs transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Sparkles size={18} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Giới thiệu ứng dụng</p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5">SketchTask App · Phiên bản v{CURRENT_APP_VERSION}</p>
                </div>
              </div>
              <ChevronRight size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
            </button>
          </div>

          {/* 4. Đăng nhập / Đăng xuất */}
          <div className="pt-2">
            {user.isSignedIn ? (
              <button
                type="button"
                onClick={logout}
                className="w-full py-3 px-4 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogOut size={15} strokeWidth={2.2} />
                <span>Đăng xuất tài khoản</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else openAuthModal();
                }}
                className="w-full py-3 px-4 bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs font-semibold rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogIn size={15} strokeWidth={2.2} />
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
