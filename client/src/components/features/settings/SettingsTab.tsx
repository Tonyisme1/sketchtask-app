import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  APP_STORAGE_KEY,
  useAppStore,
  type FontFamilyPreference,
  type FontSizePreference,
} from "../../../stores/appStore";
import { ConfirmModal, CustomSelect, DynamicIcon } from "../../ui";
import { CURRENT_APP_VERSION } from "../../../services/updateService";
import { notificationService } from "../../../services/notificationService";
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
  Download,
  Upload,
  Zap,
  Pencil,
  Check,
  BookMarked,
  Lightbulb,
  CheckSquare,
  BookOpen,
  LogOut,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// ==========================================
// COMPONENT: SettingsTab Chuẩn YouTube Desktop 2 Cột Master-Detail
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

interface SettingsSwitchProps {
  checked: boolean;
  label: string;
  onChange: () => void;
}

const SettingsSwitch: React.FC<SettingsSwitchProps> = ({ checked, label, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onChange}
    className={`relative flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] border-[#262626] p-0.5 shadow-[1px_1px_0px_#262626] transition-colors active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
      checked ? "bg-[#1C1917]" : "bg-[#F3EFE6]"
    }`}
  >
    <span
      aria-hidden="true"
      className={`h-5 w-5 rounded-full border-[1.5px] border-[#262626] bg-white shadow-[1px_1px_0px_#262626] transition-transform ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
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

const BACKUP_DATA_SUFFIXES = [
  "_tasks",
  "_tags",
  "_notebooks",
  "_notes",
  "_habits",
  "_moods",
  "_journal",
] as const;

const BACKUP_METADATA_SUFFIXES = [
  "_user",
  "_last_synced",
  "_visited",
  "_pin_code",
] as const;

export const SettingsTab: React.FC<SettingsTabProps> = ({
  onNavigateTab,
  onNavigateRoute,
  onOpenAuth,
  previousTab,
  embedded = false,
  hideMobileDetailHeader = false,
  platform = "desktop",
}) => {
  const {
    user,
    updateUserProfile,
    logout,
    syncNow,
    syncStatus,
    lastSyncedAt,
    isTiltEnabled,
    setIsTiltEnabled,
    hideCompletedTasks,
    setHideCompletedTasks,
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
    archiveOldTasks,
    tasks,
    notebooks,
    stickyNotes,
    journalEntries,
    openAuthModal,
    settingsMobileSubView,
    setSettingsMobileSubView,
  } = useAppStore();
  const { isLandscape } = useResponsiveLayout();

  const [activeSection, setActiveSection] = useState<SettingsSectionKey>("account");

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [pinModalMode, setPinModalMode] = useState<"setup" | "change" | "disable" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [permStatus, setPermStatus] = useState<"granted" | "denied" | "default">("default");

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);

  // Avatar Picker State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const isMasterDetail =
    platform === "desktop" || (platform === "tablet" && isLandscape);
  const visibleSettingsMenuItems =
    platform === "desktop"
      ? SETTINGS_MENU_ITEMS
      : SETTINGS_MENU_ITEMS.filter((item) => item.key !== "shortcuts");
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    notificationService.getPermissionStatus().then(setPermStatus);
  }, []);

  useEffect(() => {
    setEditNameValue(user.name);
  }, [user.name]);

  const storageHealth = useMemo(() => {
    let totalBytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sketchtask")) {
          const val = localStorage.getItem(key) || "";
          totalBytes += key.length + val.length * 2;
        }
      }
    } catch {
      totalBytes = 10240;
    }
    const kb = (totalBytes / 1024).toFixed(1);
    const maxKb = 5120;
    const percent = Math.min(100, Math.round((totalBytes / (maxKb * 1024)) * 100));
    return { kb, percent };
  }, [tasks]);

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

  const handleExportData = () => {
    try {
      const dump: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const suffix = key ? key.slice(APP_STORAGE_KEY.length) : "";
        if (
          key &&
          key.startsWith(`${APP_STORAGE_KEY}_`) &&
          !(BACKUP_METADATA_SUFFIXES as readonly string[]).includes(suffix)
        ) {
          dump[key] = localStorage.getItem(key);
        }
      }
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sketchtask_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Đã tải về file sao lưu JSON!");
    } catch {
      showToast("Lỗi khi xuất file sao lưu.");
    }
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = "";
    if (!file) return;

    setPendingImportFile(file);
    setConfirmImportOpen(true);
  };

  const handlePerformImport = () => {
    const file = pendingImportFile;
    setConfirmImportOpen(false);
    setPendingImportFile(null);
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("invalid backup root");
        }

        const validEntries = Object.entries(parsed).filter(([key]) =>
          key.startsWith(`${APP_STORAGE_KEY}_`),
        );

        if (validEntries.length === 0) {
          throw new Error("empty backup");
        }

        const entriesToRestore: Array<[string, string]> = [];
        for (const [key, value] of validEntries) {
          const suffix = key.slice(APP_STORAGE_KEY.length);

          // Auth/profile metadata is intentionally not restored. A backup must
          // never mark another browser as signed in or overwrite its session.
          if ((BACKUP_METADATA_SUFFIXES as readonly string[]).includes(suffix)) {
            continue;
          }

          if (typeof value !== "string") {
            throw new Error("non-string value");
          }

          if ((BACKUP_DATA_SUFFIXES as readonly string[]).includes(suffix)) {
            const decoded = JSON.parse(value);
            if (!Array.isArray(decoded)) {
              throw new Error("invalid data collection");
            }
          }

          entriesToRestore.push([key, value]);
        }

        if (entriesToRestore.length === 0) {
          throw new Error("backup contains metadata only");
        }

        // Chỉ ghi sau khi toàn bộ file đã qua kiểm tra để tránh restore dở dang.
        for (const [key, value] of entriesToRestore) {
          localStorage.setItem(key, value);
        }

        showToast("Phục hồi thành công! Đang làm mới...");
        setTimeout(() => window.location.reload(), 800);
      } catch {
        showToast("File sao lưu không hợp lệ hoặc đã bị hỏng.");
      }
    };
    reader.onerror = () => showToast("Không thể đọc file sao lưu.");
    reader.readAsText(file);
  };

  const handlePerformArchive = () => {
    const count = archiveOldTasks(60);
    setConfirmArchiveOpen(false);
    if (count > 0) {
      showToast(`Đã dọn ${count} việc hoàn thành.`);
    } else {
      showToast("Không có việc hoàn thành quá 60 ngày.");
    }
  };

  const handleResetData = () => {
    localStorage.clear();
    showToast("Đã đặt lại ứng dụng!");
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // =========================================================================
  // DETAIL PANE CONTENT RENDERER (Dùng chung cho Desktop và Mobile Detail)
  // =========================================================================
  const renderDetailContent = (sectionKey: SettingsSectionKey) => {
    switch (sectionKey) {
      case "account":
        return (
          <div className="space-y-4 sm:space-y-5">
            {/* 1. Profile Info Card */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 sm:p-5 shadow-[2px_2px_0px_#262626] space-y-3.5">
              {/* Top Profile Info Row */}
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Interactive Avatar with Pencil Badge */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[10px] border-[1.5px] border-[#262626] shadow-[2.5px_2.5px_0px_#262626] flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all group ${user.avatarBg === "#262626" ? "text-white" : "text-[#1C1917]"}`}
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
                          className="px-2.5 py-1 bg-white border border-[#262626] rounded text-xs font-bold w-full max-w-[160px]"
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
                        <span className="font-black text-sm sm:text-base text-[#1C1917] truncate">
                          {user.name || "Khách (Chưa đăng nhập)"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="p-1 text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF8F3] rounded cursor-pointer shrink-0"
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
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-[3px] border border-[#262626] bg-[#FAF8F3] text-[#1C1917]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] animate-pulse" />
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
                      className="px-3 py-1.5 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center gap-1.5 transition-all"
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
                    <p className="text-xs font-bold text-[#1C1917] font-mono mb-2">
                      Màu nền giấy:
                    </p>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => updateUserProfile({ avatarBg: c.hex })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] border-[1.5px] border-[#262626] flex items-center justify-center transition-all cursor-pointer ${
                            user.avatarBg === c.hex
                              ? "shadow-[2px_2px_0px_#262626] scale-105"
                              : "opacity-80 hover:opacity-100 shadow-[1px_1px_0px_#262626]/40"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {user.avatarBg === c.hex && (
                            <Check size={16} strokeWidth={3} className={c.hex === "#262626" ? "text-white" : "text-[#1C1917]"} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#1C1917] font-mono mb-2">
                      Biểu tượng đại diện:
                    </p>
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      {AVATAR_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => updateUserProfile({ avatar: icon })}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-[6px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] transition-all cursor-pointer ${
                            user.avatar === icon
                              ? "bg-[#1C1917] text-white shadow-[2px_2px_0px_#262626] scale-105"
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

            {/* 2. Realtime & Cloud Sync Card */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 sm:p-5 shadow-[2px_2px_0px_#262626] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-[#1C1917] uppercase tracking-wide font-mono flex items-center gap-1.5">
                    <Cloud size={14} strokeWidth={2.4} className="text-[#1C1917]" />
                    <span>Đồng bộ & Dữ liệu</span>
                  </h3>
                </div>

                <span className="font-mono text-[10px] text-[#1C1917] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#262626] font-bold shrink-0">
                  {syncStatus === "syncing"
                    ? "Đang đồng bộ..."
                    : lastSyncedAt
                    ? `Đã lưu (${lastSyncedAt})`
                    : user.isSignedIn
                    ? "Realtime Sẵn Sàng"
                    : "Lưu cục bộ"}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                <div className="p-2 bg-white border border-[#262626]/30 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                  <span className="block font-mono text-sm sm:text-base font-black text-[#1C1917]">
                    {tasks.length}
                  </span>
                  <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                    <CheckSquare size={10} className="text-[#1C1917] shrink-0" />
                    <span className="truncate">Việc</span>
                  </span>
                </div>

                <div className="p-2 bg-white border border-[#262626]/30 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                  <span className="block font-mono text-sm sm:text-base font-black text-[#1C1917]">
                    {notebooks.length}
                  </span>
                  <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                    <BookMarked size={10} className="text-[#1C1917] shrink-0" />
                    <span className="truncate">Sổ tay</span>
                  </span>
                </div>

                <div className="p-2 bg-white border border-[#262626]/30 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                  <span className="block font-mono text-sm sm:text-base font-black text-[#1C1917]">
                    {stickyNotes.length}
                  </span>
                  <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                    <Lightbulb size={10} className="text-[#1C1917] shrink-0" />
                    <span className="truncate">Ý tưởng</span>
                  </span>
                </div>

                <div className="p-2 bg-white border border-[#262626]/30 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                  <span className="block font-mono text-sm sm:text-base font-black text-[#1C1917]">
                    {journalEntries.length}
                  </span>
                  <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5 mt-0.5">
                    <BookOpen size={10} className="text-[#1C1917] shrink-0" />
                    <span className="truncate">Nhật ký</span>
                  </span>
                </div>

              </div>

              {/* Sync Button / CTA */}
              {user.isSignedIn ? (
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full py-2.5 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[4px] shadow-[2px_2px_0px_#262626] text-xs font-black text-white flex items-center justify-center gap-2 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
                >
                  <RefreshCw size={13} className={isSyncing ? "animate-spin text-white" : ""} />
                  <span>
                    {syncDone ? (
                      <span className="text-white">✓ Đã đồng bộ thành công!</span>
                    ) : isSyncing ? (
                      "Đang gửi dữ liệu lên máy chủ..."
                    ) : (
                      "Đồng bộ dữ liệu ngay"
                    )}
                  </span>
                </button>
              ) : (
                <div className="p-3 bg-[#F3EFE6] border border-[#262626]/30 rounded-[6px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    Đăng nhập để tự động sao lưu dữ liệu lên đám mây và đồng bộ giữa máy tính và điện thoại.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAuth) onOpenAuth();
                      else if (onNavigateRoute) onNavigateRoute("/login");
                      else openAuthModal();
                    }}
                    className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-white shrink-0 active:translate-y-[0.5px] cursor-pointer"
                  >
                    Đăng nhập ngay ➔
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "general":
        return (
          <div className="space-y-6">
            {/* Nền giấy Selector */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-3">
              <p className="text-xs font-bold text-[#1C1917] uppercase font-mono flex items-center gap-1.5">
                <FileText size={15} strokeWidth={2.4} />
                <span>Chất liệu nền sổ tay</span>
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {[
                  { key: "blank", label: "Giấy Trơn" },
                  { key: "lined", label: "Kẻ Ngang" },
                  { key: "dots", label: "Chấm Bi" },
                  { key: "grid", label: "Ô Ly" },
                ].map((style) => (
                  <button
                    key={style.key}
                    type="button"
                    onClick={() => {
                      setPaperStyle(style.key as any);
                      showToast(`Đã chọn ${style.label}`);
                    }}
                    className={`p-4 rounded-[6px] border text-center font-bold cursor-pointer transition-all ${
                      paperStyle === style.key
                        ? "bg-[#1C1917] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] text-white"
                        : "bg-[#FAF8F3] border-[#D4CEBF] text-[#78716C] hover:border-[#262626]"
                    }`}
                  >
                    <p className="text-xs font-black">{style.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Typography controls apply consistently across desktop, tablet, and mobile. */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4">
              <div>
                <p className="text-xs font-bold uppercase font-mono text-[#1C1917]">Chữ hiển thị</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#78716C]">
                  Chọn kiểu chữ dễ đọc và cỡ chữ phù hợp với mắt của bạn.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-bold text-[#1C1917]">
                  <span>Kiểu chữ</span>
                  <CustomSelect
                    value={fontFamily}
                    onChange={(value) => setFontFamily(value as FontFamilyPreference)}
                    options={[
                      { value: "inter", label: "Inter - rõ nét" },
                      { value: "jakarta", label: "Plus Jakarta Sans - mềm" },
                      { value: "system", label: "Mặc định thiết bị" },
                    ]}
                  />
                </label>
                <label className="space-y-1.5 text-xs font-bold text-[#1C1917]">
                  <span>Cỡ chữ</span>
                  <CustomSelect
                    value={fontSize}
                    onChange={(value) => setFontSize(value as FontSizePreference)}
                    options={[
                      { value: "normal", label: "Tiêu chuẩn" },
                      { value: "large", label: "Lớn - khuyến nghị" },
                      { value: "xlarge", label: "Rất lớn" },
                    ]}
                  />
                </label>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4 divide-y divide-[#E7E5E4]">
              {platform === "desktop" && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-xs text-[#1C1917]">Hiệu ứng nghiêng giấy 3D (Tilt)</p>
                    <p className="text-[11px] text-[#78716C]">Tạo chiều sâu vật lý nhẹ khi rê chuột trên máy tính</p>
                  </div>
                  <SettingsSwitch checked={isTiltEnabled} label="Hiệu ứng nghiêng giấy" onChange={() => setIsTiltEnabled(!isTiltEnabled)} />
                </div>
              )}

              <div className={`flex items-center justify-between ${platform === "desktop" ? "pt-3" : ""}`}>
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Ẩn các việc đã hoàn thành</p>
                  <p className="text-[11px] text-[#78716C]">Chỉ tập trung vào những đầu việc còn đang mở</p>
                </div>
                <SettingsSwitch checked={hideCompletedTasks} label="Ẩn việc đã hoàn thành" onChange={() => setHideCompletedTasks(!hideCompletedTasks)} />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Chế độ tối (Dark Mode)</p>
                  <p className="text-[11px] text-[#78716C]">Bảo vệ mắt khi làm việc ban đêm</p>
                </div>
                <SettingsSwitch checked={isDarkMode} label="Chế độ tối" onChange={() => setIsDarkMode(!isDarkMode)} />
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4 divide-y divide-[#E7E5E4]">
              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Thông báo đẩy trên trình duyệt</p>
                  <p className="text-[11px] text-[#78716C]">
                    {permStatus === "granted"
                      ? "Nhắc nhở khi công việc đến hạn hoặc quá hạn"
                      : permStatus === "denied"
                      ? "Quyền thông báo đang bị chặn trong cài đặt trình duyệt"
                      : "Cần cấp quyền trình duyệt để nhận nhắc nhở"}
                  </p>
                </div>
                <SettingsSwitch
                  checked={isNotificationsEnabled && permStatus === "granted"}
                  label="Thông báo đẩy"
                  onChange={async () => {
                    if (isNotificationsEnabled && permStatus === "granted") {
                      setIsNotificationsEnabled(false);
                      showToast("Đã tắt thông báo.");
                      return;
                    }

                    const granted = await notificationService.requestPermission();
                    setPermStatus(granted ? "granted" : "denied");
                    setIsNotificationsEnabled(granted);
                    if (granted) showToast("Đã bật thông báo!");
                    else showToast("Chưa được cấp quyền.");
                  }}
                />
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Âm thanh phác thảo vẽ tay</p>
                  <p className="text-[11px] text-[#78716C]">Tiếng bút chì sột soạt khi hoàn thành công việc</p>
                </div>
                <div className="flex items-center gap-2">
                  {isSoundEnabled && (
                    <button
                      type="button"
                      onClick={() => sounds.playPencilCheck(soundVolume)}
                      className="px-2.5 py-1 bg-white hover:bg-[#F3EFE6] border border-[#262626] rounded text-[10px] font-bold shadow-[1px_1px_0px_#262626] cursor-pointer"
                    >
                      Thử âm thanh
                    </button>
                  )}
                  <SettingsSwitch
                    checked={isSoundEnabled}
                    label="Âm thanh phản hồi"
                    onChange={() => {
                      setIsSoundEnabled(!isSoundEnabled);
                      if (!isSoundEnabled) sounds.playPencilCheck(soundVolume);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-6">
            {/* Dung lượng lưu trữ */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-3">
              <div className="flex items-center justify-between text-xs font-mono font-bold">
                <span className="text-[#1C1917] uppercase">Dung lượng sử dụng cục bộ:</span>
                <span className="bg-[#FAF8F3] px-2.5 py-1 rounded border border-[#262626]">
                  {storageHealth.kb} KB / 5 MB
                </span>
              </div>

              <div className="w-full h-3 bg-[#F3EFE6] border border-[#262626] rounded-[4px] overflow-hidden">
                <div
                  className="h-full bg-[#262626] border-r border-[#262626]"
                  style={{ width: `${Math.max(2, storageHealth.percent)}%` }}
                />
              </div>
            </div>

            {/* Thao tác sao lưu */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#1C1917] font-mono">
                Sao lưu & Nhập file
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="py-3 bg-[#FAF8F3] hover:bg-[#E7E5E4] border-[1.5px] border-[#262626] rounded-[6px] font-black text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
                >
                  <Download size={16} strokeWidth={2.2} />
                  <span>Xuất file JSON sao lưu</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 bg-[#FAF8F3] hover:bg-[#E7E5E4] border-[1.5px] border-[#262626] rounded-[6px] font-black text-xs flex items-center justify-center gap-2 shadow-[2px_2px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
                >
                  <Upload size={16} strokeWidth={2.2} />
                  <span>Nạp file JSON phục hồi</span>
                </button>
              </div>

              <div className="pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Dọn dẹp việc hoàn thành cũ</p>
                  <p className="text-[11px] text-[#78716C]">Xóa các việc đã xong cách đây hơn 60 ngày</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmArchiveOpen(true)}
                  className="px-3 py-1.5 bg-white hover:bg-[#FAF8F3] border border-[#262626] rounded-[4px] text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] cursor-pointer"
                >
                  Tiến hành dọn
                </button>
              </div>

              <div className="pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Đặt lại toàn bộ ứng dụng</p>
                  <p className="text-[11px] text-[#78716C]">Xóa sạch dữ liệu cục bộ trên trình duyệt này</p>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="px-3 py-1.5 bg-[#1C1917] hover:bg-[#262626] border border-[#262626] rounded-[4px] text-xs font-bold text-white shadow-[1px_1px_0px_#262626] cursor-pointer"
                >
                  Xóa sạch
                </button>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Khóa ứng dụng bằng mã PIN 4 số</p>
                  <p className="text-[11px] text-[#78716C]">Yêu cầu nhập mã PIN khi mở lại ứng dụng</p>
                </div>

                <button
                  type="button"
                  onClick={() => setPinModalMode(pinCode ? "change" : "setup")}
                  className={`px-3 py-1.5 rounded-[4px] border-[1.5px] border-[#262626] text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] cursor-pointer ${
                    pinCode ? "bg-[#1C1917] text-white" : "bg-[#FAF8F3] text-[#1C1917]"
                  }`}
                >
                  {pinCode ? "Đổi mã PIN" : "Thiết lập PIN"}
                </button>
              </div>

              {pinCode && (
                <div className="pt-3 border-t border-[#E7E5E4] flex items-center justify-between">
                  <span className="text-xs text-[#78716C]">Tắt chế độ bảo vệ bằng PIN</span>
                  <button
                    type="button"
                    onClick={() => setPinModalMode("disable")}
                    className="text-xs font-bold text-[#1C1917] hover:underline cursor-pointer"
                  >
                    Tắt mã PIN
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case "shortcuts":
        return (
          <div className="space-y-6">
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between p-3 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
                <span className="text-[#57534E]">Mở nhanh Tìm kiếm toàn cục:</span>
                <kbd className="px-2.5 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">Ctrl + K</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
                <span className="text-[#57534E]">Đóng / Mở thanh menu bên:</span>
                <kbd className="px-2.5 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">Ctrl + B</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-[#FAF8F3] border border-[#E7E5E4] rounded-[6px]">
                <span className="text-[#57534E]">Lật ngày Nhật ký:</span>
                <kbd className="px-2.5 py-1 bg-white border border-[#262626] rounded shadow-[1px_1px_0px_#262626] font-bold">← / →</kbd>
              </div>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-6">
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-8 shadow-[2px_2px_0px_#262626] text-center space-y-4 max-w-xl mx-auto">
              <div className="w-18 h-18 mx-auto bg-[#1C1917] text-white border-[2px] border-[#262626] rounded-[16px] shadow-[3px_3px_0px_#262626] flex items-center justify-center text-3xl font-black -rotate-1">
                <Pencil size={32} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="font-black text-2xl text-[#1C1917]">
                  SketchTask
                </h3>
                <p className="text-xs text-[#78716C] font-mono mt-1">
                  Phiên bản: <strong className="text-[#1C1917]">v{CURRENT_APP_VERSION}</strong>
                </p>
              </div>

              <p className="text-xs text-[#57534E] leading-relaxed">
                Ứng dụng quản lý công việc và ghi chép cá nhân phong cách nét vẽ thủ công, tối ưu hóa sự tập trung và liền mạch trên mọi thiết bị.
              </p>

              <p className="text-[10px] text-[#A8A29E] font-mono pt-3 border-t border-[#E7E5E4]">
                © 2026 SketchTask App. All rights reserved.
              </p>
            </div>
          </div>
        );
    }
  };

  // Render overlays outside the responsive layout so mobile/tablet detail
  // screens do not lose confirmations, PIN setup, or feedback to an early return.
  const renderSettingsOverlays = () => (
    <>
      <ConfirmModal
        isOpen={confirmResetOpen}
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={handleResetData}
        title="Đặt Lại Ứng Dụng?"
        message="Toàn bộ dữ liệu công việc, sổ tay và cài đặt trên thiết bị sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác!"
        confirmText="Xóa sạch dữ liệu"
      />

      <ConfirmModal
        isOpen={confirmArchiveOpen}
        onCancel={() => setConfirmArchiveOpen(false)}
        onConfirm={handlePerformArchive}
        title="Dọn Dẹp Việc Cũ?"
        message="Các công việc đã hoàn thành cách đây hơn 60 ngày sẽ được xóa để tối ưu bộ nhớ."
        confirmText="Tiến hành dọn"
      />

      <ConfirmModal
        isOpen={confirmImportOpen}
        onCancel={() => {
          setConfirmImportOpen(false);
          setPendingImportFile(null);
        }}
        onConfirm={handlePerformImport}
        title="Phục Hồi Dữ Liệu?"
        message="Dữ liệu cục bộ hiện tại sẽ được thay thế bằng nội dung trong file sao lưu. Phiên đăng nhập hiện tại không bị thay đổi."
        confirmText="Phục hồi dữ liệu"
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
            /* Mobile Subview Header với Nút Quay Lại */
            <div className="flex items-center gap-2 pb-2.5 border-b border-[#262626]">
              <button
                type="button"
                onClick={() => setSettingsMobileSubView(null)}
                className="w-8 h-8 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0 transition-all"
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
                <span className="font-black text-base text-[#1C1917] tracking-tight truncate">
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

  // =========================================================================
  // 2. DESKTOP + TABLET LANDSCAPE: MASTER-DETAIL
  // =========================================================================
  return (
    <div className="w-full pb-20 select-none">
      {/* MASTER-DETAIL LAYOUT: desktop and tablet landscape only */}
      {isMasterDetail && (
        <div
          className={`mx-auto flex items-start ${
            platform === "tablet"
              ? "max-w-5xl gap-5"
              : "max-w-7xl gap-8 lg:gap-12"
          }`}
        >
          {/* LEFT COLUMN: Settings navigation */}
          <div className={`${platform === "tablet" ? "w-[215px]" : "w-60"} sticky top-2 shrink-0 space-y-2`}>
            {!embedded && (
              <h2 className="border-b border-[#262626]/15 px-3 pb-2 text-xl font-black tracking-tight text-[#1C1917]">
                Cài đặt
              </h2>
            )}
            <SettingsSectionNav
              variant="master"
              activeSection={activeSection}
              platform={platform}
              onSelect={setActiveSection}
            />
          </div>

          {/* RIGHT COLUMN: Detail pane */}
          <div className="min-w-0 flex-1 bg-[#FBF9F4] p-1">
            {renderDetailContent(activeSection)}
          </div>
        </div>
      )}

      {/* MOBILE + TABLET PORTRAIT LIST VIEW */}
      <div
        className={
          !isMasterDetail
            ? `w-full mx-auto space-y-4 pb-4 ${
                platform === "tablet" ? "max-w-3xl" : "max-w-xl"
              } ${
                platform === "mobile"
                  ? mobileTransitionDirection === "back"
                    ? "mobile-panel-back-enter"
                    : "mobile-tab-enter"
                  : ""
              }`
            : "hidden"
        }
      >
        <SettingsSectionNav
          variant="list"
          items={visibleSettingsMenuItems}
          platform={platform}
          onSelect={setSettingsMobileSubView}
        />
      </div>

      {renderSettingsOverlays()}
    </div>
  );
};
