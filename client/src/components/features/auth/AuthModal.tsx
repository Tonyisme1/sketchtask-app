import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
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
  BookMarked,
  Lightbulb,
  Flame,
  Check,
  AlertCircle,
  ArrowRight,
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
      console.warn("Google OAuth Error:", error);
      setIsSubmitting(false);
      setErrorMessage(
        "Cửa sổ Google bị hạn chế trên môi trường hiện tại. Bạn vui lòng nhập Email & Mật khẩu bên trên để đăng nhập trong 2 giây!"
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
      setErrorMessage("Vui lòng nhập Email & Mật khẩu bên trên để đăng nhập nhanh chóng!");
    }
  };

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

  return createPortal(
    <div
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
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
    >
      {/* Modal Box */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm bg-[#FBF9F4] border-t-[2.5px] sm:border-[2px] border-[#262626] rounded-t-[22px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 z-[1000000] max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        {/* Mobile Grab Handle */}
        <div className="w-12 h-1.5 bg-[#D4CEBF] rounded-full mx-auto -mt-1 mb-2.5 sm:hidden" />

        {/* Paper Tape Effect */}
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

            {/* Sync Stats Summary */}
            <div className="p-2.5 bg-[#FEF08A]/30 border border-[#262626] rounded-[6px] space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-[11px] text-[#1C1917]">
                <span className="flex items-center gap-1.5">
                  <Cloud size={13} strokeWidth={2.2} />
                  <span>Dữ liệu đồng bộ:</span>
                </span>
                <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 border border-emerald-300 rounded">
                  {syncStatus === "syncing"
                    ? "Đang đồng bộ..."
                    : lastSyncedAt
                      ? `Đã lưu (${lastSyncedAt})`
                      : "Sẵn sàng"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] text-[#78716C] pt-1 border-t border-[#262626]/20">
                <span className="flex items-center gap-1">
                  <CheckSquare size={11} className="text-amber-700" />
                  <span>{tasks.length} công việc</span>
                </span>
                <span className="flex items-center gap-1">
                  <BookMarked size={11} className="text-indigo-700" />
                  <span>{notebooks.length} cuốn sổ</span>
                </span>
                <span className="flex items-center gap-1">
                  <Lightbulb size={11} className="text-amber-500" />
                  <span>{stickyNotes.length} ý tưởng</span>
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={11} className="text-orange-600" />
                  <span>{habits.length} thói quen</span>
                </span>
              </div>
            </div>

            {/* Devices list */}
            <div className="space-y-1">
              <span className="font-bold text-[11px] text-[#1C1917] flex items-center gap-1">
                <Smartphone size={13} strokeWidth={2.2} />
                <span>THIẾT BỊ ĐANG KẾT NỐI REALTIME:</span>
              </span>
              <div className="space-y-1 text-[11px] text-[#78716C]">
                <div className="flex items-center justify-between bg-[#FBF9F4] p-1.5 rounded border border-[#262626]/10">
                  <span className="flex items-center gap-1.5 text-[#1C1917] font-medium">
                    <Laptop size={13} strokeWidth={2.2} />
                    <span>Thiết bị hiện tại</span>
                  </span>
                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-700">
                    <Radio
                      size={10}
                      className="animate-pulse text-emerald-600"
                    />
                    Online
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#FBF9F4] p-1.5 rounded border border-[#262626]/10">
                  <span className="flex items-center gap-1.5 text-[#1C1917] font-medium">
                    <Smartphone size={13} strokeWidth={2.2} />
                    <span>Điện thoại di động (PWA/APK)</span>
                  </span>
                  <span className="text-[9px] font-mono text-emerald-700">
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
                className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 active:translate-y-[1px]"
              >
                <RefreshCw
                  size={14}
                  className={isSyncing ? "animate-spin" : ""}
                />
                <span className="flex items-center gap-1.5">
                  {syncDone ? (
                    <>
                      <Check size={14} className="text-emerald-700" />
                      <span>Đồng bộ thành công!</span>
                    </>
                  ) : isSyncing ? (
                    "Đang đồng bộ..."
                  ) : (
                    "Đồng bộ đám mây ngay"
                  )}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  logout();
                  if (onBackToSettings) onBackToSettings();
                  else onClose();
                }}
                className="w-full py-2 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} />
                <span>Đăng xuất tài khoản này</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (FORM LOGIN/SIGNUP) */
          /* ========================================== */
          <div>
            {/* Form Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                {onBackToSettings && (
                  <button
                    type="button"
                    onClick={onBackToSettings}
                    title="Quay lại Cài đặt"
                    className="p-1 hover:bg-[#F3EFE6] border border-[#D4CEBF] rounded text-[#78716C] hover:text-[#1C1917]"
                  >
                    <ArrowLeft size={14} strokeWidth={2.2} />
                  </button>
                )}
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
                    {authMode === "signin"
                      ? "Đăng Nhập SketchTask"
                      : "Tạo Sổ Tay Cá Nhân"}
                  </h3>
                  <p className="text-[10px] text-[#78716C] font-mono">
                    {authMode === "signin"
                      ? "Đồng bộ đám mây"
                      : "Lưu trữ vĩnh viễn"}
                  </p>
                </div>
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
              <p className="text-xs text-[#1C1917] leading-relaxed flex items-center gap-1.5">
                {authMode === "signin" ? (
                  <>
                    <Sparkles size={14} className="text-amber-600 shrink-0" />
                    <span>Đăng nhập để đồng bộ real-time giữa điện thoại & máy tính!</span>
                  </>
                ) : (
                  <>
                    <Cloud size={14} className="text-sky-600 shrink-0" />
                    <span>Đăng ký tài khoản để lưu trữ đám mây & dùng mọi lúc mọi nơi.</span>
                  </>
                )}
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
                <p className="text-[11px] text-red-600 font-medium bg-red-50 p-2 border border-red-200 rounded flex items-center gap-1.5">
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
                  className="w-full justify-center gap-1.5"
                >
                  <span>
                    {isSubmitting
                      ? "Đang xử lý..."
                      : authMode === "signin"
                        ? "Đăng nhập ngay"
                        : "Tạo sổ tay cá nhân"}
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
                  </>
                )}
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
