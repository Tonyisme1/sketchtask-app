import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAppStore } from "../../../stores/appStore";
import { TextInput } from "../../ui/TextInput";
import { Button } from "../../ui/Button";
import { DynamicIcon } from "../../ui/DynamicIcon";
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
  CheckSquare,
  BookOpen,
  Lightbulb,
  Flame,
} from "lucide-react";

// ==========================================
// COMPONENT: AuthModal (Xác Thực & Quản Lý Tài Khoản Cá Nhân)
// ==========================================

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToSettings?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onBackToSettings,
}) => {
  const {
    user,
    loginWithCredentials,
    registerWithCredentials,
    loginWithGoogle,
    logout,
    syncNow,
    syncStatus,
    lastSyncedAt,
    tasks,
    notebooks,
    stickyNotes,
    habits,
  } = useAppStore();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
          window.innerWidth < 640
      );
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Khóa cuộn trang khi modal mở
  useEffect(() => {
    if (isOpen) {
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
  }, [isOpen]);

  // Google OAuth Popup Hook chính thức từ Google Identity Services
  const triggerGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setErrorMessage("");
      try {
        // Lấy thông tin người dùng từ Google UserInfo API
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!userInfoRes.ok) {
          throw new Error("Không thể lấy thông tin từ tài khoản Google");
        }

        const googleProfile = await userInfoRes.json();

        // Gửi lên backend server đồng bộ
        const result = await loginWithGoogle({
          email: googleProfile.email,
          name: googleProfile.name || googleProfile.email.split("@")[0],
          avatar: "lucide:Sparkles",
          avatarBg: "#FEF08A",
        });

        if (result.success) {
          onClose();
        } else {
          setErrorMessage(result.message || "Đăng nhập Google thất bại.");
        }
      } catch (err: any) {
        setErrorMessage(
          err.message || "Lỗi xử lý tài khoản Google. Vui lòng thử lại."
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: (error) => {
      setErrorMessage(
        "Cửa sổ đăng nhập Google bị hủy hoặc chưa cấu hình Client ID hợp lệ."
      );
    },
  });

  if (!isOpen || !mounted) return null;

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
          password || undefined
        );
        if (result.success) {
          onClose();
        } else {
          setErrorMessage(result.message || "Đăng ký không thành công.");
        }
      } else {
        const result = await loginWithCredentials(
          email.trim(),
          password || undefined
        );
        if (result.success) {
          onClose();
        } else {
          setErrorMessage(
            result.message || "Email hoặc mật khẩu không chính xác."
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Lỗi kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      onClick={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
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
        backgroundColor: "rgba(38, 38, 38, 0.65)",
        touchAction: "none",
      }}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150 pointer-events-auto"
    >
      {/* Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[16px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 z-[1000000] max-h-[88vh] overflow-y-auto no-scrollbar pb-6 sm:pb-5"
      >
        {/* Mobile Drag Handle Indicator */}
        <div className="w-10 h-1 bg-[#D4CEBF] rounded-full mx-auto mb-3 sm:hidden" />

        {/* Paper Tape Effect (Desktop) */}
        <div className="hidden sm:block absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#FEF08A]/90 border-x border-[#262626]/40 rotate-1 shadow-sm pointer-events-none" />

        {/* ========================================== */}
        {/* TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP (QUẢN LÝ TÀI KHOẢN CÁ NHÂN) */}
        {/* ========================================== */}
        {user.isSignedIn ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                {onBackToSettings && (
                  <button
                    type="button"
                    onClick={onBackToSettings}
                    title="Quay lại Cài đặt"
                    className="p-1 bg-white hover:bg-[#FEF08A] border border-[#262626] rounded text-[#1C1917] shadow-sm flex items-center justify-center active:translate-y-[0.5px]"
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                  </button>
                )}
                <span className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                  <DynamicIcon name="lucide:UserCheck" size={16} />
                  <span>Tài Khoản Cá Nhân</span>
                </span>
              </div>

              {!onBackToSettings && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-[#78716C] hover:text-[#1C1917] font-bold"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* User Profile Card */}
            <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-[6px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shrink-0 shadow-[1px_1px_0px_#262626]"
                style={{ backgroundColor: user.avatarBg || "#BBF7D0" }}
              >
                <DynamicIcon
                  name={user.avatar || "lucide:User"}
                  size={24}
                  strokeWidth={2}
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-[#1C1917] truncate">
                  {user.name}
                </p>
                <p className="text-[10px] text-[#78716C] font-mono truncate">
                  {user.email}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-700">
                    Đang kết nối Realtime
                  </span>
                </div>
              </div>
            </div>

            {/* Sync Stats Summary (Lucide Icons chuẩn Design System) */}
            <div className="p-2.5 bg-[#FEF08A]/30 border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[11px] text-[#1C1917]">
                <span className="flex items-center gap-1.5">
                  <Cloud size={14} strokeWidth={2.2} className="text-sky-700" />
                  <span>Dữ liệu đồng bộ:</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-800 bg-[#BBF7D0] px-1.5 py-0.5 border border-[#262626] rounded font-bold">
                  {syncStatus === "syncing"
                    ? "Đang đồng bộ..."
                    : lastSyncedAt
                      ? `Đã lưu (${lastSyncedAt})`
                      : "Sẵn sàng"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#1C1917] pt-2 border-t border-[#262626]/20">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckSquare size={13} strokeWidth={2.2} className="text-amber-700 shrink-0" />
                  <span>{tasks.length} công việc</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <BookOpen size={13} strokeWidth={2.2} className="text-indigo-700 shrink-0" />
                  <span>{notebooks.length} cuốn sổ</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Lightbulb size={13} strokeWidth={2.2} className="text-amber-600 shrink-0" />
                  <span>{stickyNotes.length} thẻ ý tưởng</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Flame size={13} strokeWidth={2.2} className="text-orange-600 shrink-0" />
                  <span>{habits.length} thói quen</span>
                </span>
              </div>
            </div>

            {/* Devices list (Tự động nhận diện thiết bị hiện tại) */}
            <div className="space-y-1.5">
              <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1.5">
                <Radio size={13} strokeWidth={2.2} className="text-emerald-700" />
                <span>THIẾT BỊ ĐANG KẾT NỐI REALTIME:</span>
              </span>
              <div className="space-y-1.5 text-[11px]">
                {/* 1. Thiết bị đang cầm trên tay */}
                <div className="flex items-center justify-between bg-white p-2 rounded-[4px] border border-[#262626] shadow-[1px_1px_0px_#262626]">
                  <span className="flex items-center gap-2 text-[#1C1917] font-bold">
                    {isMobileDevice ? (
                      <Smartphone size={14} strokeWidth={2.2} className="text-emerald-700" />
                    ) : (
                      <Laptop size={14} strokeWidth={2.2} className="text-emerald-700" />
                    )}
                    <span>{isMobileDevice ? "Điện thoại này (Hiện tại)" : "Máy tính này (Hiện tại)"}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[9.5px] font-mono font-bold text-emerald-800 bg-[#BBF7D0] px-1.5 py-0.5 rounded border border-[#262626]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Online
                  </span>
                </div>

                {/* 2. Thiết bị còn lại kết nối qua Cloud */}
                <div className="flex items-center justify-between bg-[#FBF9F4] p-2 rounded-[4px] border border-[#D4CEBF]">
                  <span className="flex items-center gap-2 text-[#78716C] font-medium">
                    {!isMobileDevice ? (
                      <Smartphone size={14} strokeWidth={2.2} className="text-[#78716C]" />
                    ) : (
                      <Laptop size={14} strokeWidth={2.2} className="text-[#78716C]" />
                    )}
                    <span>{!isMobileDevice ? "Điện thoại di động" : "Máy tính / Desktop"}</span>
                  </span>
                  <span className="text-[9.5px] font-mono text-emerald-700 font-bold">
                    Tự động đồng bộ
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <RefreshCw
                  size={14}
                  className={isSyncing ? "animate-spin" : ""}
                />
                <span>
                  {syncDone
                    ? "✓ Đồng bộ thành công!"
                    : isSyncing
                      ? "Đang đồng bộ..."
                      : "Đồng bộ đám mây ngay"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onBackToSettings) onBackToSettings();
                  else onClose();
                }}
                className="w-full py-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 active:translate-x-[1px] active:translate-y-[1px] transition-all"
              >
                <LogOut size={13} />
                <span>Đăng xuất khỏi thiết bị này</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (FORM LOGIN/SIGNUP) */
          /* ========================================== */
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262626] mb-4">
              <div className="flex items-center gap-2">
                {onBackToSettings && (
                  <button
                    type="button"
                    onClick={onBackToSettings}
                    title="Quay lại Cài đặt"
                    className="p-1 bg-white hover:bg-[#FEF08A] border border-[#262626] rounded text-[#1C1917] shadow-sm flex items-center justify-center active:translate-y-[0.5px]"
                  >
                    <ArrowLeft size={14} strokeWidth={2.5} />
                  </button>
                )}
                <Sparkles
                  size={18}
                  strokeWidth={2.2}
                  className="text-amber-600"
                />
                <h3 className="font-bold text-sm text-[#1C1917]">
                  {authMode === "signin"
                    ? "Đăng Nhập SketchTask"
                    : "Tạo Sổ Tay Cá Nhân"}
                </h3>
              </div>

              {!onBackToSettings && (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[#78716C] hover:text-[#1C1917] font-bold"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Subtitle / Intro */}
            <div className="mb-4 bg-[#FEF08A]/40 border border-[#262626] p-2.5 rounded-[4px] shadow-[1px_1px_0px_#262626]">
              <p className="text-xs text-[#1C1917] leading-relaxed">
                {authMode === "signin"
                  ? "✨ Đăng nhập để đồng bộ real-time giữa điện thoại & máy tính!"
                  : "🚀 Đăng ký tài khoản để lưu trữ đám mây & dùng mọi lúc mọi nơi."}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold text-[#1C1917] mb-1">
                    Tên hiển thị:
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
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
                  Địa chỉ Email:
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
                <label className="block text-xs font-bold text-[#1C1917] mb-1">
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
                <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2 border border-red-200 rounded">
                  ⚠️ {errorMessage}
                </p>
              )}

              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="w-full justify-center"
                >
                  {isSubmitting
                    ? "Đang xử lý..."
                    : authMode === "signin"
                      ? "Đăng nhập ngay ➔"
                      : "Tạo sổ tay cá nhân ➔"}
                </Button>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-[#D4CEBF]" />
                  <span className="text-[10px] text-[#78716C] font-mono">
                    hoặc
                  </span>
                  <div className="flex-1 h-px bg-[#D4CEBF]" />
                </div>

                {/* NÚT GOOGLE OAUTH POPUP CHÍNH THỨC */}
                <button
                  type="button"
                  onClick={() => triggerGoogleOAuth()}
                  disabled={isSubmitting}
                  className="w-full py-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] hover:bg-[#F3EFE6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center gap-2.5"
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
              </div>
            </form>

            {/* Chuyển Đổi Qua Lại: Đăng Nhập <-> Đăng Ký */}
            <div className="mt-4 pt-3 border-t border-[#D4CEBF] text-center text-xs">
              {authMode === "signin" ? (
                <p className="text-[#78716C]">
                  Bạn chưa có tài khoản?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage("");
                    }}
                    className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2 hover:text-black ml-1"
                  >
                    Đăng ký ngay ➔
                  </button>
                </p>
              ) : (
                <p className="text-[#78716C]">
                  Đã có tài khoản rồi?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signin");
                      setErrorMessage("");
                    }}
                    className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2 hover:text-black ml-1"
                  >
                    Đăng nhập tại đây ➔
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
