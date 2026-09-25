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
        className={`inline-flex items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-[var(--bg-surface-muted)] dark:bg-[#12161B] hover:bg-[var(--bg-interactive)] dark:hover:bg-[#161B22] border border-black/[0.04] dark:border-white/[0.08] text-xs font-semibold text-[var(--text-main)] transition-all shadow-2xs cursor-pointer ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <span>{selectedOption?.label || value}</span>
        <ChevronDown size={14} className={`text-[#8E8E93] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-[150px] max-w-[260px] p-1.5 rounded-2xl border border-[var(--border-ink-muted)] bg-white dark:bg-[#1E222A] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
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
                    ? "bg-[var(--accent-sky)] text-[var(--text-on-soft-accent)] font-semibold"
                    : "text-[var(--text-main)] hover:bg-[var(--bg-interactive)]"
                } ${option.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <div>
                  <div>{option.label}</div>
                  {option.description && (
                    <div className="text-[10px] text-[#8E8E93] dark:text-[#A1A1A6] font-normal">{option.description}</div>
                  )}
                </div>
                {isSelected && <Check size={13} className="shrink-0 text-[var(--accent-blue)]" />}
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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-xl transition-colors duration-200 ease-in-out focus:outline-none ${
        disabled ? "opacity-40 cursor-not-allowed" : ""
      } ${
        checked
          ? "bg-[var(--accent-blue)] shadow-inner"
          : "bg-black/[0.08] dark:bg-white/[0.12]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[18px] w-[18px] transform rounded-lg shadow-sm transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          checked ? "translate-x-[23px] bg-white" : "translate-x-[3px] bg-white dark:bg-[#E5E5EA]"
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
      <div className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">{title}</div>
      {description && (
        <div className="hidden sm:block text-[11px] sm:text-xs text-[#8E8E93] dark:text-[#A1A1A6] mt-0.5 leading-snug">{description}</div>
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
  <div className="space-y-3.5 pb-4 sm:pb-5 last:pb-0">
    <div className="flex items-center gap-2 pb-2.5">
      {Icon && (
        <div className="w-6 h-6 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7]">
          <Icon size={14} strokeWidth={2.2} />
        </div>
      )}
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#A1A1A6] font-mono">
        {title}
      </h3>
    </div>
    <div>
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
  tasks,
  stickyNotes,
  journalEntries,
  openAuthModal,
  settingsMobileSubView,
  setSettingsMobileSubView,
  isLandscape,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("account");

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
  const isMobileLongForm = platform === "mobile";
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
            <div className="space-y-4 pb-5 sm:last:pb-0">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Google Profile Avatar */}
                  <div
                    className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white shadow-xs flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: "#09090B" }}
                  >
                    <DynamicIcon
                      name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                      size={28}
                      strokeWidth={2.2}
                      className="text-white"
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

                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[var(--accent-sky)] text-[var(--text-on-soft-accent)] whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-pulse shrink-0" />
                        {user.isSignedIn ? "Đã liên kết Google (Realtime)" : "Chế độ Offline"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Button (Logout or Login) - Hidden on mobile because it's at the bottom */}
                <div className="hidden sm:block shrink-0">
                  {user.isSignedIn ? (
                    <button
                      type="button"
                      onClick={logout}
                      className="px-3.5 py-1.5 bg-[var(--danger-surface)] hover:bg-[var(--accent-coral-soft)] rounded-2xl shadow-2xs text-xs font-semibold text-[var(--danger-text)] cursor-pointer flex items-center gap-1.5 transition-all"
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
                      className="px-4 py-2 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] rounded-2xl shadow-xs text-xs font-semibold text-[var(--text-on-accent)] cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <span>Đăng nhập Google</span>
                      <ArrowRight size={13} strokeWidth={2.2} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Dữ Liệu Đồng Bộ Summary - Hidden on mobile for cleaner UI */}
            <div className="hidden sm:block space-y-3.5 pb-5 last:pb-0">
              <div className="flex items-center justify-between pb-2.5">
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
                    <CheckSquare size={12} className="shrink-0 text-[var(--accent-blue)]" />
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
            <div className="hidden sm:block space-y-3.5 pb-5 last:pb-0">
              <div className="flex items-center justify-between pb-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#A1A1A6] font-mono flex items-center gap-1.5">
                  <ShieldCheck size={14} strokeWidth={2.2} />
                  <span>Thiết Bị & Kết Nối</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-mono text-[#8E8E93] dark:text-[#A1A1A6] font-medium">
                  <Radio size={12} className="animate-pulse text-[var(--accent-blue)]" />
                  {user.isSignedIn ? "Online Realtime" : "Offline Cục Bộ"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className={`flex items-center justify-between rounded-2xl p-3 ${isDesktopSettings ? "" : "bg-black/[0.02] dark:bg-white/[0.04]"}`}>
                  <span className="flex items-center gap-2 text-[#1C1C1E] dark:text-[#F2F2F7] font-medium">
                    <Laptop size={15} strokeWidth={2} className="text-[var(--accent-blue)]" />
                    <span>Thiết bị hiện tại</span>
                  </span>
                  <span className="text-[11px] font-mono text-[var(--accent-blue)] font-semibold">
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
            <div className="hidden sm:block">
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
                      className="px-3.5 py-1.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] rounded-2xl shadow-2xs text-xs font-semibold text-[var(--text-on-accent)] flex items-center gap-1.5 cursor-pointer"
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
                title="Tóm tắt đầu ngày"
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
            {/* Sao lưu & khôi phục chỉ hiển thị trên PC. */}
            <div className="hidden sm:block space-y-4 sm:space-y-5">
              <SettingsGroup title="Sao lưu & Phục hồi dữ liệu" icon={Download}>
                <SettingsRow
                  title="Xuất file sao lưu (.json)"
                  description="Tải toàn bộ công việc, sổ tay, ghi chú và nhật ký về máy để cất giữ an toàn"
                >
                  <button
                    type="button"
                    onClick={handleExportBackup}
                      className="px-3.5 py-1.5 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] rounded-2xl shadow-2xs text-xs font-semibold text-[var(--text-on-accent)] flex items-center gap-1.5 cursor-pointer"
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

            </div>

            {/* Vùng nguy hiểm */}
            <div className="pb-4 space-y-3.5">
              <div className="flex items-center gap-2 pb-2.5">
                <AlertTriangle size={14} strokeWidth={2.2} className="text-[var(--danger-text)]" />
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-[var(--danger-text)]">
                  Vùng Nguy Hiểm (Danger Zone)
                </h3>
              </div>
              <div>
                <SettingsRow
                  title="Xóa dữ liệu trên thiết bị"
                  description="Xóa toàn bộ task, sổ tay và ghi chú trên máy. Cài đặt và tài khoản vẫn giữ nguyên."
                >
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAllOpen(true)}
                      className="px-3.5 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--danger-surface)] rounded-2xl text-xs font-semibold text-[var(--danger-text)] shadow-2xs cursor-pointer"
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
                      className="px-3.5 py-1.5 bg-[var(--accent-coral)] hover:bg-[var(--danger-text)] rounded-2xl text-xs font-semibold text-[var(--text-on-accent)] shadow-2xs cursor-pointer"
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
                      ? "bg-[var(--accent-blue)] text-[var(--text-on-accent)] hover:bg-[var(--accent-blue-hover)]"
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
                    className="text-xs font-semibold text-[var(--danger-text)] hover:underline cursor-pointer"
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

    }
  };

  const renderSettingsOverlays = () => (
    <>
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
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-[var(--text-strong)] text-[var(--bg-surface)] text-xs font-semibold rounded-xl shadow-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          {toastMessage}
        </div>
      )}
    </>
  );

  // =========================================================================
  // MOBILE + TABLET PORTRAIT: FLATTENED SINGLE COLUMN VIEW
  // =========================================================================
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
            <div className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-[#1E222A] border border-black/[0.04] dark:border-white/[0.04] shadow-xs">
              {renderDetailContent(activeSection)}
            </div>
          </div>
        </div>
      ) : (
        <div
          className={
            isMobileLongForm
              ? "w-full max-w-xl mx-auto pb-8 select-none animate-in fade-in duration-150"
              : "w-full max-w-xl mx-auto space-y-4 pb-28 sm:pb-36 select-none animate-in fade-in duration-150"
          }
        >
          <div
            className={
              isMobileLongForm
              ? ""
                : "space-y-4"
            }
          >
            {visibleSettingsMenuItems.map((item) => (
              <section
                key={item.key}
                className={
                  isMobileLongForm
                    ? "py-7 first:pt-1 last:pb-0"
                    : "rounded-3xl p-4 sm:p-5 bg-white dark:bg-[#1E222A] border border-black/[0.04] dark:border-white/[0.04] shadow-xs"
                }
              >
                {renderDetailContent(item.key)}
              </section>
            ))}
          </div>

          <div className={isMobileLongForm ? "pt-7" : "pt-2"}>
            {user.isSignedIn ? (
              <button
                type="button"
                onClick={logout}
                className="w-full min-h-12 py-3.5 px-4 bg-[var(--danger-surface)] text-[var(--danger-text)] text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors hover:brightness-95"
              >
                <LogOut size={16} strokeWidth={2.2} />
                <span>Đăng xuất tài khoản</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onOpenAuth) onOpenAuth();
                  else openAuthModal();
                }}
                className="w-full min-h-12 py-3.5 px-4 bg-[var(--accent-blue)] hover:bg-[var(--accent-blue-hover)] text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <LogIn size={16} strokeWidth={2.2} />
                <span>Đăng nhập / Đăng ký đồng bộ</span>
              </button>
            )}
          </div>
        </div>
      )}
      {renderSettingsOverlays()}
    </>
  );
};
