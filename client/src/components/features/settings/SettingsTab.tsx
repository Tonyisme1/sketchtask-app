import React, { useState, useEffect, useRef } from "react";
import {
  APP_STORAGE_KEY,
  useAppStore,
  type InterfaceStyle,
  type FontFamilyPreference,
  type FontSizePreference,
} from "../../../stores/appStore";
import { ConfirmModal, CustomSelect, DynamicIcon } from "../../ui";
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
  BookMarked,
  Lightbulb,
  CheckSquare,
  BookOpen,
  LogOut,
  ArrowRight,
  ArrowLeft,
  Sliders,
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
  `${APP_STORAGE_KEY}_notebooks`,
  `${APP_STORAGE_KEY}_notes`,
  `${APP_STORAGE_KEY}_habits`,
  `${APP_STORAGE_KEY}_moods`,
  `${APP_STORAGE_KEY}_reflection`,
  `${APP_STORAGE_KEY}_journal`,
  `${APP_STORAGE_KEY}_last_synced`,
  // Legacy note storage is kept here so the delete action is complete.
  "sketchtask_notes_v1",
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
    interfaceStyle,
    setInterfaceStyle,
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

  const [confirmSampleOpen, setConfirmSampleOpen] = useState(false);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
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
  const isNativeNotifications = isNativePlatform();
  const visibleSettingsMenuItems =
    platform === "desktop"
      ? SETTINGS_MENU_ITEMS
      : SETTINGS_MENU_ITEMS.filter((item) => item.key !== "shortcuts");
  const settingsSubtitles: Partial<Record<SettingsSectionKey, string>> = {
    account: user.isSignedIn ? user.email || "Đã đăng nhập" : "Lưu cục bộ · Chưa đăng nhập",
    general: `${interfaceStyle === "ios" ? "iOS tối giản" : "SketchTask nguyên bản"} · ${isDarkMode ? "Tối" : "Sáng"} · ${fontSize === "normal" ? "Cỡ chữ chuẩn" : fontSize === "large" ? "Cỡ chữ lớn" : "Cỡ chữ rất lớn"}`,
    notifications: isNotificationsEnabled ? "Đang bật" : "Đang tắt",
    data: `${tasks.length} việc · ${notebooks.length} sổ tay`,
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
            {/* Interface style keeps the original SketchTask visual language as the default. */}
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-3">
              <div>
                <p className="text-xs font-bold text-[#1C1917] uppercase font-mono flex items-center gap-1.5">
                  <Sliders size={15} strokeWidth={2.4} />
                  <span>Phong cách giao diện</span>
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[#78716C]">
                  Chọn kiểu hiển thị cho toàn bộ app. Dữ liệu và chức năng không thay đổi.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  {
                    key: "sketch",
                    label: "SketchTask nguyên bản",
                    description: "Viền mực, bóng cứng và chất liệu sổ tay",
                  },
                  {
                    key: "ios",
                    label: "iOS tối giản",
                    description: "Nền thoáng, card bo lớn và ít chi tiết",
                  },
                ].map((style) => {
                  const selected = interfaceStyle === style.key;
                  return (
                    <button
                      key={style.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setInterfaceStyle(style.key as InterfaceStyle);
                        showToast(`Đã chọn ${style.label}`);
                      }}
                      className={`flex min-h-[76px] flex-col items-start justify-center gap-1 rounded-[6px] border-[1.5px] px-3 py-2 text-left transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                        selected
                          ? "border-[#262626] bg-[#1C1917] text-white shadow-[2px_2px_0px_#262626]"
                          : "border-[#D4CEBF] bg-[#FAF8F3] text-[#1C1917] shadow-[1px_1px_0px_#262626] hover:border-[#262626] hover:bg-white"
                      }`}
                    >
                      <span className="text-sm font-bold">{style.label}</span>
                      <span className={`text-[11px] leading-snug ${selected ? "text-white/75" : "text-[#78716C]"}`}>
                        {style.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

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
                      { value: "inter", label: "Inter / SF Pro - hiện đại" },
                      { value: "jakarta", label: "Plus Jakarta Sans - dễ đọc" },
                      { value: "system", label: "Theo thiết bị" },
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
                  <SettingsSwitch
                    checked={isTiltEnabled}
                    label="Hiệu ứng nghiêng giấy"
                    onChange={() => setIsTiltEnabled(!isTiltEnabled)}
                  />
                </div>
              )}

              <div className={`flex items-center justify-between ${platform === "desktop" ? "pt-3" : ""}`}>
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Ẩn các việc đã hoàn thành</p>
                  <p className="text-[11px] text-[#78716C]">Chỉ tập trung vào những đầu việc còn đang mở</p>
                </div>
                <SettingsSwitch
                  checked={hideCompletedTasks}
                  label="Ẩn việc đã hoàn thành"
                  onChange={() => setHideCompletedTasks(!hideCompletedTasks)}
                />
              </div>

              <div className="flex items-center justify-between pt-3">
                <div>
                  <p className="font-bold text-xs text-[#1C1917]">Chế độ tối (Dark Mode)</p>
                  <p className="text-[11px] text-[#78716C]">Bảo vệ mắt khi làm việc ban đêm</p>
                </div>
                <SettingsSwitch
                  checked={isDarkMode}
                  label="Chế độ tối"
                  onChange={() => setIsDarkMode(!isDarkMode)}
                />
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4 divide-y divide-[#E7E5E4]">
              {/* Notification channel is different for the APK and the web app. */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-[#1C1917]">
                    {isNativeNotifications
                      ? "Thông báo trên điện thoại"
                      : "Thông báo trên trình duyệt"}
                  </p>
                  <p className="text-[11px] text-[#78716C]">
                    {permStatus === "granted"
                      ? "Nhắc khi công việc đến hạn hoặc đến giờ hẹn"
                      : permStatus === "denied"
                      ? isNativeNotifications
                        ? "Quyền đang bị chặn trong cài đặt điện thoại"
                        : "Quyền đang bị chặn trong cài đặt trình duyệt"
                      : isNativeNotifications
                        ? "Bật để app nhắc việc ngay cả khi bạn không mở app"
                        : "Bật quyền trình duyệt để nhận nhắc khi app đang mở"}
                  </p>
                </div>
                <SettingsSwitch
                  checked={isNotificationsEnabled && permStatus === "granted"}
                  label={isNativeNotifications ? "Thông báo điện thoại" : "Thông báo trình duyệt"}
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
                          : "Đã bật thông báo trên trình duyệt!",
                      );
                    }
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
            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-3">
              <div>
                <h3 className="text-base font-black text-[#1C1917]">Dữ liệu mẫu</h3>
                <p className="mt-1 text-sm text-[#78716C] leading-relaxed">
                  Nạp sẵn task, sổ tay và ghi chú để xem thử cách ứng dụng hoạt động.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmSampleOpen(true)}
                className="w-full py-3 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[6px] font-black text-sm flex items-center justify-center gap-2 shadow-[2px_2px_0px_#262626] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
              >
                <Zap size={17} strokeWidth={2.3} />
                <span>Nạp dữ liệu mẫu</span>
              </button>
            </div>

            <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-5 shadow-[2px_2px_0px_#262626] space-y-4">
              <div>
                <h3 className="text-base font-black text-[#1C1917]">Quản lý dữ liệu</h3>
                <p className="mt-1 text-sm text-[#78716C] leading-relaxed">
                  Các nút dưới đây chỉ tác động đến dữ liệu đang lưu trên thiết bị này.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteAllOpen(true)}
                  className="py-3 bg-[#FECDD3] hover:bg-[#FDA4AF] border-[1.5px] border-[#262626] rounded-[6px] font-black text-sm text-[#881337] shadow-[2px_2px_0px_#262626] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                >
                  Xóa toàn bộ dữ liệu
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(true)}
                  className="py-3 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[6px] font-black text-sm text-white shadow-[2px_2px_0px_#262626] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                >
                  Đặt lại ứng dụng
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
        isOpen={confirmSampleOpen}
        onCancel={() => setConfirmSampleOpen(false)}
        onConfirm={handleLoadSampleData}
        title="Nạp dữ liệu mẫu?"
        message="Dữ liệu mẫu sẽ thay thế task, sổ tay, ghi chú và nhật ký hiện tại trên thiết bị này."
        confirmText="Nạp dữ liệu mẫu"
      />

      <ConfirmModal
        isOpen={confirmDeleteAllOpen}
        onCancel={() => setConfirmDeleteAllOpen(false)}
        onConfirm={handleDeleteAllData}
        title="Xóa toàn bộ dữ liệu?"
        message="Tất cả task, sổ tay, ghi chú và nhật ký trên thiết bị này sẽ bị xóa. Cài đặt ứng dụng và tài khoản vẫn được giữ lại."
        confirmText="Xóa toàn bộ"
      />

      <ConfirmModal
        isOpen={confirmResetOpen}
        onCancel={() => setConfirmResetOpen(false)}
        onConfirm={handleResetData}
        title="Đặt Lại Ứng Dụng?"
        message="Xóa toàn bộ dữ liệu và cài đặt trên thiết bị này để đưa ứng dụng về trạng thái ban đầu. Phiên đăng nhập cũng sẽ được đăng xuất."
        confirmText="Đặt lại ứng dụng"
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
              subtitles={settingsSubtitles}
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
          subtitles={settingsSubtitles}
          platform={platform}
          onSelect={setSettingsMobileSubView}
        />
      </div>

      {renderSettingsOverlays()}
    </div>
  );
};
