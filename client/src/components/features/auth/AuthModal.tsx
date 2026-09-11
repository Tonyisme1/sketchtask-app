import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import { useAppStore } from "../../../stores/appStore";
import { TextInput, Button, DynamicIcon } from "../../ui";
import {
  X,
  Sparkles,
  Cloud,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Smartphone,
  Laptop,
  Radio,
  Lightbulb,
  Pencil,
  BookOpen,
  ShieldCheck,
  Check,
  CheckSquare,
  AlertCircle,
  ArrowRight,
  Settings,
} from "lucide-react";

import { useScrollLock } from "../../../hooks/useScrollLock";
import { useModalBackClose } from "../../../hooks/useModalBackClose";

// ==========================================
// COMPONENT: AuthModal (Xác Thực & Quản Lý Tài Khoản Cá Nhân)
// ==========================================

const AVATAR_COLORS = [
  { name: "Vàng Nắng", hex: "#FEF08A" },
  { name: "Xanh Bạc Hà", hex: "#BBF7D0" },
  { name: "Xanh Da Trời", hex: "#BAE6FD" },
  { name: "Tím Oải Hương", hex: "#DDD6FE" },
  { name: "Hồng San Hô", hex: "#FECDD3" },
  { name: "Cam Đào", hex: "#FED7AA" },
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

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToSettings?: () => void;
  onOpenSettings?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onBackToSettings,
  onOpenSettings,
}) => {
  useModalBackClose(isOpen, onClose);
  const {
    user,
    updateUserProfile,
    loginWithCredentials,
    registerWithCredentials,
    loginWithGoogle,
    logout,
    syncNow,
    syncStatus,
    lastSyncedAt,
    tasks,
    stickyNotes,
    journalEntries,
  } = useAppStore();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Edit Name & Avatar States
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useScrollLock(isVisible);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the auth sheet mounted while it returns to the previous screen.
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setEditNameValue(user.name);
      return;
    }

    if (!isVisible) return;

    setIsClosing(true);
    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 220);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, isVisible, user.name]);

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isVisible]);

  // Google OAuth Popup Hook chính thức từ Google Identity Services
  const triggerGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setErrorMessage("");
      try {
        const result = await loginWithGoogle({
          accessToken: tokenResponse.access_token,
        });

        if (result.success) {
          onClose();
        } else {
          setErrorMessage(result.message || "Đăng nhập Google thất bại.");
        }
      } catch (err: any) {
        setErrorMessage(
          err.message || "Lỗi xử lý tài khoản Google. Vui lòng thử lại.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      console.warn("Google OAuth Error:", error);
      setIsSubmitting(false);
      setErrorMessage(
        "Cửa sổ Google bị hạn chế trên môi trường hiện tại. Bạn vui lòng nhập Email & Mật khẩu bên trên để đăng nhập trong 2 giây!",
      );
    },
  });
  const handleGoogleClick = () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      triggerGoogleOAuth();
      // Nếu sau 2.5s không thấy phản hồi (do WebView chặn ngầm)
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2500);
    } catch (err: any) {
      console.warn("Google OAuth trigger failed:", err);
      setIsSubmitting(false);
      setErrorMessage(
        "Vui lòng nhập Email & Mật khẩu bên trên để đăng nhập nhanh chóng!",
      );
    }
  };

  if (!isVisible || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (authMode === "signup") {
        const userName =
          name.trim() || email.split("@")[0] || "Người Dùng Sketch";
        const result = await registerWithCredentials(
          userName,
          email.trim(),
          password || undefined,
        );
        if (result.success) {
          onClose();
        } else {
          setErrorMessage(result.message || "Đăng ký không thành công.");
        }
      } else {
        const result = await loginWithCredentials(
          email.trim(),
          password || undefined,
        );
        if (result.success) {
          onClose();
        } else {
          setErrorMessage(
            result.message || "Email hoặc mật khẩu không chính xác.",
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      updateUserProfile({ name: editNameValue.trim() });
    }
    setIsEditingName(false);
  };

  const handleSelectColor = (colorHex: string) => {
    updateUserProfile({ avatarBg: colorHex });
  };

  const handleSelectIcon = (iconName: string) => {
    updateUserProfile({ avatar: iconName });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const success = await syncNow();
    setIsSyncing(false);
    if (success) {
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Đăng nhập và quản lý tài khoản"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100dvh",
        minHeight: "100vh",
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
      }}
      className="flex items-stretch sm:items-center justify-center p-0 sm:p-4 select-none mobile-scrim-enter pointer-events-auto"
    >
      {/* Modal Box: Fullscreen on mobile, Centered dialog on Desktop */}
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-w-md bg-[#FBF9F4] border-none sm:border-[2px] sm:border-[#262626] rounded-none sm:rounded-[8px] shadow-none sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 pt-[max(env(safe-area-inset-top),24px)] sm:pt-5 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-5 z-[1000000] overflow-y-auto no-scrollbar flex flex-col justify-start ${isClosing ? "mobile-panel-exit" : "mobile-panel-enter"}`}
      >
        {/* Paper Tape Effect on Desktop */}
        <div className="hidden sm:block absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#FEF08A]/90 border-x border-[#262626]/40 rotate-1 shadow-[1px_1px_0px_#262626] pointer-events-none" />

        {/* ========================================== */}
        {/* TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP (QUẢN LÝ TÀI KHOẢN CÁ NHÂN) */}
        {/* ========================================== */}
        {user.isSignedIn ? (
          <div className="flex-1 flex flex-col justify-start w-full max-w-sm mx-auto min-h-0 space-y-3.5 pt-1">
            {/* 1. Header with Back button & Title */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]/20 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onBackToSettings ? onBackToSettings : onClose}
                  title="Quay lại"
                  className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0 transition-all"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-[4px] bg-[#FEF08A] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917]">
                    <DynamicIcon name="lucide:UserCheck" size={15} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-[#1C1917] tracking-tight leading-tight">
                      Tài Khoản Cá Nhân
                    </h2>
                    <p className="text-[10px] text-[#78716C] font-mono leading-none">
                      Hồ sơ & Đồng bộ đám mây
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-[4px] bg-white hover:bg-[#FEF08A] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
                title="Đóng"
                aria-label="Đóng"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>

            {/* 2. Main Scrollable Content */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-0.5 no-scrollbar">
              {/* Profile Card & Avatar Customizer */}
              <div className="bg-white border-[1.5px] border-[#262626] rounded-[8px] p-3.5 shadow-[2.5px_2.5px_0px_#262626] space-y-3">
                <div className="flex items-start gap-3">
                  {/* Interactive Avatar */}
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="relative w-13 h-13 rounded-[8px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shrink-0 shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer group transition-all"
                    style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
                    title="Nhấn để đổi màu & icon đại diện"
                  >
                    <DynamicIcon
                      name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                      size={26}
                      strokeWidth={2.2}
                    />
                    <span className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-[3px] bg-white border border-[#262626] shadow-[0.5px_0.5px_0px_#262626] flex items-center justify-center text-[9px] text-[#1C1917]">
                      <Pencil size={9} strokeWidth={2.4} />
                    </span>
                  </button>

                  {/* Name & Email Info */}
                  <div className="flex-1 min-w-0">
                    {isEditingName ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editNameValue}
                          onChange={(e) => setEditNameValue(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                          className="flex-1 px-2 py-0.5 bg-[#FAF8F3] border border-[#262626] rounded text-xs font-bold text-[#1C1917] focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveName}
                          className="px-2 py-0.5 bg-[#BBF7D0] border border-[#262626] rounded text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
                        >
                          Lưu
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-black text-sm text-[#1C1917] truncate">
                          {user.name || "Người Dùng Sketch"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => setIsEditingName(true)}
                          className="p-0.5 text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                          title="Đổi tên hiển thị"
                        >
                          <Pencil size={11} strokeWidth={2} />
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-[#78716C] font-mono truncate mt-0.5 flex items-center gap-1">
                      <span>{user.email || "Khách cục bộ"}</span>
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border border-[#262626] bg-[#FAF8F3] text-[#1C1917]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] animate-pulse" />
                        Đang kết nối Realtime
                      </span>

                      <span className="text-[9px] font-mono text-[#78716C] bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#D4CEBF]">
                        ID: #{user.email ? user.email.split("@")[0] : "user"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Avatar Picker */}
                {showAvatarPicker && (
                  <div className="pt-2.5 border-t border-[#262626]/15 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div>
                      <span className="text-[10px] font-bold text-[#1C1917] font-mono">
                        Màu nền giấy:
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {AVATAR_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => handleSelectColor(c.hex)}
                            className={`w-6.5 h-6.5 rounded-[4px] border-[1.5px] border-[#262626] flex items-center justify-center transition-all cursor-pointer ${
                              user.avatarBg === c.hex
                                ? "shadow-[1.5px_1.5px_0px_#262626] scale-105"
                                : "opacity-80 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          >
                            {user.avatarBg === c.hex && (
                              <Check size={11} strokeWidth={3} className="text-[#1C1917]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#1C1917] font-mono">
                        Biểu tượng đại diện:
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {AVATAR_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => handleSelectIcon(icon)}
                            className={`w-6.5 h-6.5 bg-white rounded-[4px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] transition-all cursor-pointer ${
                              user.avatar === icon
                                ? "bg-[#1C1917] text-white shadow-[1.5px_1.5px_0px_#262626] font-bold"
                                : "hover:bg-[#FAF8F3]"
                            }`}
                          >
                            <DynamicIcon name={icon} size={12} strokeWidth={2.2} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Realtime sync and cloud data summary */}
              <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 shadow-[2px_2px_0px_#262626] space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#1C1917] font-mono flex items-center gap-1.5">
                    <Cloud size={13} strokeWidth={2.4} className="text-[#1C1917]" />
                    <span>Dữ Liệu Đồng Bộ</span>
                  </span>

                  <span className="font-mono text-[9px] text-[#1C1917] bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#262626] font-bold">
                    {syncStatus === "syncing"
                      ? "Đang đồng bộ..."
                      : lastSyncedAt
                      ? `Đã lưu (${lastSyncedAt})`
                      : "Realtime Sẵn Sàng"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
                  <div className="p-1.5 bg-white border border-[#262626]/20 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                    <span className="block font-mono text-xs font-black text-[#1C1917]">
                      {tasks.length}
                    </span>
                    <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5">
                      <CheckSquare size={10} className="text-amber-700 shrink-0" />
                      <span>Việc</span>
                    </span>
                  </div>

                  <div className="p-1.5 bg-white border border-[#262626]/20 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                    <span className="block font-mono text-xs font-black text-[#1C1917]">
                      {stickyNotes.length}
                    </span>
                    <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5">
                      <Lightbulb size={10} className="text-amber-500 shrink-0" />
                      <span>Ý tưởng</span>
                    </span>
                  </div>

                  <div className="p-1.5 bg-white border border-[#262626]/20 rounded-[4px] text-center shadow-[0.5px_0.5px_0px_#262626]">
                    <span className="block font-mono text-xs font-black text-[#1C1917]">
                      {journalEntries.length}
                    </span>
                    <span className="text-[9px] text-[#78716C] font-semibold flex items-center justify-center gap-0.5">
                      <BookOpen size={10} className="text-sky-700 shrink-0" />
                      <span>Nhật ký</span>
                    </span>
                  </div>

                </div>
              </div>

              {/* Devices & Protection */}
              <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 shadow-[2px_2px_0px_#262626] space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1C1917] font-mono flex items-center gap-1.5">
                  <ShieldCheck size={13} strokeWidth={2.4} className="text-emerald-700" />
                  <span>Thiết Bị & Kết Nối</span>
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-[#262626]/10 shadow-[0.5px_0.5px_0px_#262626]">
                    <span className="flex items-center gap-2 text-[#1C1917] font-bold text-xs">
                      <Laptop size={13} strokeWidth={2} className="text-stone-700" />
                      <span>Thiết bị hiện tại</span>
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-700 font-bold">
                      <Radio size={10} className="animate-pulse text-emerald-600" />
                      Realtime Online
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-white p-2 rounded border border-[#262626]/10 shadow-[0.5px_0.5px_0px_#262626]">
                    <span className="flex items-center gap-2 text-[#1C1917] font-bold text-xs">
                      <Smartphone size={13} strokeWidth={2} className="text-stone-700" />
                      <span>Điện thoại di động</span>
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 font-semibold">
                      Tự động đồng bộ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Bottom Actions */}
            <div className="pt-2 space-y-2 shrink-0 border-t border-[#262626]/15">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[2px_2px_0px_#262626] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
              >
                <RefreshCw
                  size={14}
                  className={isSyncing ? "animate-spin text-emerald-800" : ""}
                />
                <span>
                  {syncDone ? (
                    <span className="text-emerald-950 font-black flex items-center gap-1">
                      <Check size={14} className="text-emerald-700 stroke-[3]" />
                      Đồng bộ thành công!
                    </span>
                  ) : isSyncing ? (
                    "Đang gửi dữ liệu lên máy chủ..."
                  ) : (
                    "Đồng bộ ngay"
                  )}
                </span>
              </button>

              {onOpenSettings && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  className="w-full py-2 bg-white hover:bg-[#BAE6FD] text-[#1C1917] border-[1.5px] border-[#262626] rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <Settings size={14} strokeWidth={2.2} />
                  <span>Cài đặt</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onBackToSettings) onBackToSettings();
                  else onClose();
                }}
                className="w-full py-2 bg-white hover:bg-rose-50 text-rose-700 border-[1.5px] border-rose-300 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 shadow-[1.5px_1.5px_0px_#FDA4AF] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              >
                <LogOut size={14} strokeWidth={2.2} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (FORM LOGIN/SIGNUP) */
          /* ========================================== */
          <div className="flex-1 flex flex-col justify-between w-full max-w-sm mx-auto min-h-0">
            {/* Form Header with Back Arrow pinned to top */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]/20 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToSettings ? onBackToSettings : onClose}
                  title="Quay lại"
                  className="p-1.5 bg-white hover:bg-[#FEF08A] border border-[#262626] rounded-[4px] text-[#1C1917] shadow-[1px_1px_0px_#262626] flex items-center justify-center active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
                >
                  <ArrowLeft size={17} strokeWidth={2.4} />
                </button>
                <div>
                  <h3 className="font-bold text-base sm:text-base text-[#1C1917]">
                    {authMode === "signin"
                      ? "Đăng nhập"
                      : "Đăng ký"}
                  </h3>
                  <p className="text-[10px] text-[#78716C] font-mono">
                    {authMode === "signin"
                      ? "Đồng bộ đám mây"
                      : "Lưu trữ đám mây"}
                  </p>
                </div>
              </div>
            </div>

            {/* Vertically centered form container */}
            <div className="my-auto py-4 space-y-3.5 w-full">
              {/* Subtitle / Intro */}
              <div className="bg-[#FEF08A]/40 border border-[#262626] p-2.5 rounded-[4px] shadow-[1px_1px_0px_#262626]">
                <p className="text-sm sm:text-xs text-[#1C1917] leading-relaxed flex items-center gap-1.5">
                  {authMode === "signin" ? (
                    <>
                      <Sparkles size={14} className="text-amber-600 shrink-0" />
                      <span>
                        Đăng nhập để đồng bộ real-time giữa điện thoại & máy tính.
                      </span>
                    </>
                  ) : (
                    <>
                      <Cloud size={14} className="text-sky-600 shrink-0" />
                      <span>
                        Đăng ký tài khoản để lưu trữ đám mây an toàn.
                      </span>
                    </>
                  )}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {authMode === "signup" && (
                  <div>
                    <label className="block text-sm sm:text-xs font-bold text-[#1C1917] mb-1">
                      Tên:
                    </label>
                    <TextInput
                      placeholder="Ví dụ: Minh Khang"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errorMessage) setErrorMessage("");
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm sm:text-xs font-bold text-[#1C1917] mb-1">
                    Email:
                  </label>
                  <TextInput
                    type="email"
                    placeholder="tenban@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm sm:text-xs font-bold text-[#1C1917] mb-1">
                    Mật khẩu:
                  </label>
                  <TextInput
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                  />
                </div>

                {errorMessage && (
                  <p className="text-sm sm:text-[11px] text-red-600 font-medium bg-red-50 p-2 border border-red-200 rounded flex items-center gap-1.5">
                    <AlertCircle size={13} className="shrink-0" />
                    <span>{errorMessage}</span>
                  </p>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isSubmitting}
                    className="w-full justify-center gap-1.5 text-base sm:text-sm"
                  >
                    <span>
                      {isSubmitting
                        ? "Đang xử lý..."
                        : authMode === "signin"
                          ? "Đăng nhập"
                          : "Đăng ký"}
                    </span>
                    {!isSubmitting && <ArrowRight size={14} />}
                  </Button>

                  {/* NÚT GOOGLE OAUTH POPUP (Chỉ hiển thị trên Web / PWA) */}
                  {!Capacitor.isNativePlatform() && (
                    <>
                      {/* Divider */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-[#D4CEBF]" />
                        <span className="text-[10px] text-[#78716C] font-mono">
                          hoặc
                        </span>
                        <div className="flex-1 h-px bg-[#D4CEBF]" />
                      </div>

                      <button
                        type="button"
                        onClick={handleGoogleClick}
                        disabled={isSubmitting}
                        className="w-full py-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-sm sm:text-xs font-bold text-[#1C1917] hover:bg-[#F3EFE6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2.5"
                      >
                        {/* Google Official SVG Icon */}
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                          />
                        </svg>
                        <span>Tiếp tục với Google</span>
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>

            {/* Chuyển Đổi Qua Lại: Đăng Nhập <-> Đăng Ký */}
            <div className="mt-4 pt-3 border-t border-[#D4CEBF] text-center text-sm sm:text-xs">
              {authMode === "signin" ? (
                <p className="text-[#78716C]">
                  Chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage("");
                    }}
                    className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2 hover:text-black ml-1"
                  >
                    <span className="inline-flex items-center gap-1">
                      Đăng ký
                      <ArrowRight size={13} strokeWidth={2.4} />
                    </span>
                  </button>
                </p>
              ) : (
                <p className="text-[#78716C]">
                  Đã có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setErrorMessage("");
                    }}
                    className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2 hover:text-black ml-1"
                  >
                    <span className="inline-flex items-center gap-1">
                      Đăng nhập
                      <ArrowRight size={13} strokeWidth={2.4} />
                    </span>
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
