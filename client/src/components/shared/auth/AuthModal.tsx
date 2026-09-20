import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useAppStore } from "../../../stores/appStore";
import { DynamicIcon } from "../../ui";
import {
  X,
  Sparkles,
  Cloud,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Laptop,
  Radio,
  BookOpen,
  ShieldCheck,
  Check,
  CheckSquare,
  AlertCircle,
  Settings,
  Zap,
} from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { useModalBackClose } from "../../../hooks/useModalBackClose";

// ==========================================
// COMPONENT: AuthModal (Đăng Nhập Google & Quản Lý Tài Khoản)
// ==========================================

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
    loginWithGoogle,
    logout,
    syncNow,
    syncStatus,
    lastSyncedAt,
    tasks,
    stickyNotes,
    journalEntries,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const initialSignedInRef = useRef(user.isSignedIn);

  useScrollLock(isVisible);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      initialSignedInRef.current = user.isSignedIn;
      setIsVisible(true);
      setIsClosing(false);
      setErrorMessage("");
      return;
    }

    if (!isVisible) return;

    setIsClosing(true);
    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 220);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, isVisible, user.isSignedIn]);

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
      setErrorMessage("Không thể mở cửa sổ Google. Vui lòng kiểm tra quyền pop-up của trình duyệt.");
    },
  });

  const handleGoogleClick = () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      triggerGoogleOAuth();
      setTimeout(() => {
        setIsSubmitting(false);
      }, 2500);
    } catch (err: any) {
      console.warn("Google OAuth trigger failed:", err);
      setIsSubmitting(false);
      setErrorMessage("Không thể kích hoạt đăng nhập Google. Vui lòng thử lại.");
    }
  };

  if (!isVisible || !mounted) return null;

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
      aria-label="Đăng nhập và quản lý tài khoản Google"
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
      className="flex items-stretch sm:items-center justify-center p-0 sm:p-4 select-none pointer-events-auto"
    >
      {/* Modal Box */}
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-w-md bg-white dark:bg-[#1C1C1E] border-none rounded-none sm:rounded-3xl shadow-none sm:shadow-2xl p-4 sm:p-6 pt-[max(env(safe-area-inset-top),24px)] sm:pt-6 pb-[max(env(safe-area-inset-bottom),24px)] sm:pb-6 z-[1000000] overflow-y-auto no-scrollbar flex flex-col justify-start text-[#1C1917] dark:text-[#F2F2F7] ${
          isClosing ? "mobile-panel-exit" : "mobile-panel-enter"
        }`}
      >
        {/* ========================================== */}
        {/* TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP GOOGLE */}
        {/* ========================================== */}
        {user.isSignedIn && initialSignedInRef.current ? (
          <div className="flex-1 flex flex-col justify-start w-full max-w-sm mx-auto min-h-0 space-y-4 pt-1">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onBackToSettings ? onBackToSettings : onClose}
                  title="Quay lại"
                  aria-label="Quay lại"
                  className="mobile-back-button p-2 bg-black/[0.04] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/10 rounded-2xl text-[#1C1917] dark:text-[#F2F2F7] flex items-center justify-center active:scale-95 cursor-pointer shrink-0 transition-all shadow-xs"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-2xl bg-[var(--accent-blue)] flex items-center justify-center text-white shadow-xs">
                    <DynamicIcon name="lucide:UserCheck" size={16} strokeWidth={2.4} />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-[#1C1917] dark:text-[#F2F2F7] tracking-tight leading-tight">
                      Tài Khoản Google
                    </h2>
                    <p className="text-[10px] text-[#78716C] dark:text-[#8E8E93] font-mono leading-none">
                      Đồng bộ đám mây tự động
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-2xl bg-black/[0.04] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/10 flex items-center justify-center text-[#1C1917] dark:text-[#F2F2F7] active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
                title="Đóng"
                aria-label="Đóng"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            {/* Profile Info Card (Google photo & info) */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-0.5 no-scrollbar">
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  {/* Google Avatar Display */}
                  <div
                    className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-[#1C1917] shrink-0 shadow-xs overflow-hidden"
                    style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
                  >
                    <DynamicIcon
                      name={user.avatar || "lucide:UserCheck"}
                      size={28}
                      strokeWidth={2.2}
                    />
                  </div>

                  {/* Name & Email Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-sm sm:text-base text-[#1C1917] dark:text-[#F2F2F7] truncate">
                      {user.name || "Người Dùng SketchTask"}
                    </h3>

                    <p className="text-[11px] text-[#78716C] dark:text-[#8E8E93] font-mono truncate mt-0.5">
                      {user.email}
                    </p>

                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Đã liên kết Google
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Summary */}
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#1C1917] dark:text-[#F2F2F7] font-mono flex items-center gap-1.5">
                    <Cloud size={13} strokeWidth={2.4} />
                    <span>Dữ Liệu Đồng Bộ</span>
                  </span>

                  <span className="font-mono text-[9px] text-[#1C1917] dark:text-[#F2F2F7] bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded-full font-bold">
                    {syncStatus === "syncing"
                      ? "Đang đồng bộ..."
                      : lastSyncedAt
                      ? `Đã lưu (${lastSyncedAt})`
                      : "Realtime Sẵn Sàng"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-0.5">
                  <div className="p-2.5 bg-white dark:bg-[#2C2C2E] rounded-2xl text-center shadow-xs">
                    <span className="block font-mono text-xs font-black text-[#1C1917] dark:text-[#F2F2F7]">
                      {tasks.length}
                    </span>
                    <span className="text-[9px] text-[#78716C] dark:text-[#8E8E93] font-semibold flex items-center justify-center gap-0.5">
                      <CheckSquare size={10} className="shrink-0" />
                      <span>Việc</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#2C2C2E] rounded-2xl text-center shadow-xs">
                    <span className="block font-mono text-xs font-black text-[#1C1917] dark:text-[#F2F2F7]">
                      {stickyNotes.length}
                    </span>
                    <span className="text-[9px] text-[#78716C] dark:text-[#8E8E93] font-semibold flex items-center justify-center gap-0.5">
                      <Sparkles size={10} className="shrink-0" />
                      <span>Ý tưởng</span>
                    </span>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-[#2C2C2E] rounded-2xl text-center shadow-xs">
                    <span className="block font-mono text-xs font-black text-[#1C1917] dark:text-[#F2F2F7]">
                      {journalEntries.length}
                    </span>
                    <span className="text-[9px] text-[#78716C] dark:text-[#8E8E93] font-semibold flex items-center justify-center gap-0.5">
                      <BookOpen size={10} className="shrink-0" />
                      <span>Nhật ký</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Devices & Protection */}
              <div className="bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl p-4 shadow-xs space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#1C1917] dark:text-[#F2F2F7] font-mono flex items-center gap-1.5">
                  <ShieldCheck size={13} strokeWidth={2.4} />
                  <span>Trạng Thái Kết Nối</span>
                </span>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between bg-white dark:bg-[#2C2C2E] p-3 rounded-2xl shadow-xs">
                    <span className="flex items-center gap-2 text-[#1C1917] dark:text-[#F2F2F7] font-bold text-xs">
                      <Laptop size={14} strokeWidth={2} />
                      <span>Thiết bị hiện tại</span>
                    </span>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-[#1C1917] dark:text-[#F2F2F7] font-bold">
                      <Radio size={10} className="animate-pulse text-emerald-500" />
                      Realtime Online
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 space-y-2 shrink-0 border-t border-black/10 dark:border-white/10">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-full py-2.5 bg-[#FEF08A] hover:bg-[#FDE047] rounded-2xl shadow-xs text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
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
                  className="w-full py-2.5 bg-black/[0.04] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/10 text-[#1C1917] dark:text-[#F2F2F7] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
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
                className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <LogOut size={14} strokeWidth={2.2} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (GOOGLE SIGN IN ONLY) */
          /* ========================================== */
          <div className="flex-1 flex flex-col justify-between w-full max-w-sm mx-auto min-h-0 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToSettings ? onBackToSettings : onClose}
                  title="Quay lại"
                  aria-label="Quay lại"
                  className="mobile-back-button p-2 bg-black/[0.04] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/10 rounded-2xl text-[#1C1917] dark:text-[#F2F2F7] flex items-center justify-center active:scale-95 cursor-pointer shrink-0 transition-all shadow-xs"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <div>
                  <h3 className="font-black text-base text-[#1C1917] dark:text-[#F2F2F7]">
                    Đăng Nhập SketchTask
                  </h3>
                  <p className="text-[10px] text-[#78716C] dark:text-[#8E8E93] font-mono">
                    Đồng bộ & Lưu trữ đám mây
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-2xl bg-black/[0.04] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-white/10 flex items-center justify-center text-[#1C1917] dark:text-[#F2F2F7] active:scale-95 transition-all cursor-pointer shrink-0 shadow-xs"
                title="Đóng"
                aria-label="Đóng"
              >
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            {/* Feature highlights */}
            <div className="my-auto py-2 space-y-3 w-full">
              <div className="bg-black/[0.03] dark:bg-white/[0.04] p-4 rounded-2xl shadow-xs space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <h4 className="font-bold text-xs text-[#1C1917] dark:text-[#F2F2F7]">
                    Tự động đồng bộ đa thiết bị
                  </h4>
                </div>
                <p className="text-[11px] text-[#57534E] dark:text-[#A8A29E] leading-relaxed">
                  Đăng nhập một chạm bằng tài khoản Google để giữ cho các công việc, ghi chú và nhật ký luôn được đồng bộ tức thời giữa điện thoại, máy tính bảng và máy tính.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#1C1917] dark:text-[#F2F2F7] mb-1">
                    <Cloud size={14} className="text-sky-600 dark:text-sky-400" />
                    <span>Lưu Trữ Tức Thì</span>
                  </div>
                  <p className="text-[10px] text-[#78716C] dark:text-[#8E8E93] leading-snug">
                    Không lo mất dữ liệu khi đổi thiết bị hoặc duyệt web ẩn danh.
                  </p>
                </div>

                <div className="p-3 bg-black/[0.03] dark:bg-white/[0.04] rounded-2xl shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-[#1C1917] dark:text-[#F2F2F7] mb-1">
                    <Zap size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Nhanh & Bảo Mật</span>
                  </div>
                  <p className="text-[10px] text-[#78716C] dark:text-[#8E8E93] leading-snug">
                    Xác thực trực tiếp từ Google, không cần ghi nhớ mật khẩu.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs text-red-600 font-medium bg-red-50 dark:bg-red-950/40 p-3 rounded-2xl flex items-center gap-1.5">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{errorMessage}</span>
                </p>
              )}
            </div>

            {/* Google Login Action Button */}
            <div className="pt-2 shrink-0 border-t border-black/10 dark:border-white/10 space-y-2">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isSubmitting}
                className="w-full py-3 bg-black/[0.04] dark:bg-[#2C2C2E] hover:bg-black/[0.08] dark:hover:bg-[#3A3A3C] rounded-2xl shadow-xs text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
              >
                {/* Google Official SVG Icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="shrink-0"
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
                <span>
                  {isSubmitting ? "Đang kết nối Google..." : "Tiếp tục với Google"}
                </span>
              </button>

              <p className="text-[10px] text-center text-[#78716C] dark:text-[#8E8E93] font-mono">
                Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng của SketchTask.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};
