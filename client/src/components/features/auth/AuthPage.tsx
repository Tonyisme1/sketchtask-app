import React, { useEffect, useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { Capacitor } from "@capacitor/core";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { BrandLogo, Button, TextInput } from "../../ui";

interface AuthPageProps {
  onNavigate: (path: string, replace?: boolean) => void;
}

// The public surface intentionally contains one responsive sign-in page.
export const AuthPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const {
    user,
    loginWithCredentials,
    registerWithCredentials,
    loginWithGoogle,
  } = useAppStore();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isForcedAuth = () =>
    new URLSearchParams(window.location.search).get("force") === "1";

  useEffect(() => {
    if (user.isSignedIn && !isForcedAuth()) onNavigate("/app", true);
  }, [onNavigate, user.isSignedIn]);

  useEffect(() => {
    document.title = `${authMode === "signin" ? "Đăng nhập" : "Đăng ký"} | SketchTask`;
  }, [authMode]);

  const handleSuccess = () => onNavigate("/app", true);

  const triggerGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setErrorMessage("");
      try {
        const result = await loginWithGoogle({
          accessToken: tokenResponse.access_token,
        });
        if (result.success) handleSuccess();
        else setErrorMessage(result.message || "Đăng nhập Google thất bại.");
      } catch (error: any) {
        setErrorMessage(error.message || "Không thể kết nối tới Google.");
      } finally {
        setIsSubmitting(false);
      }
    },
    onError: () => {
      setIsSubmitting(false);
      setErrorMessage(
        "Cửa sổ Google bị hạn chế. Bạn có thể dùng email và mật khẩu.",
      );
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (authMode === "signup") {
      if (!name.trim()) {
        setErrorMessage("Vui lòng nhập tên của bạn.");
        return;
      }
      if (password.length < 6) {
        setErrorMessage("Mật khẩu đăng ký cần có ít nhất 6 ký tự.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = authMode === "signup"
        ? await registerWithCredentials(name.trim(), cleanEmail, password)
        : await loginWithCredentials(cleanEmail, password || undefined);
      if (result.success) handleSuccess();
      else {
        setErrorMessage(
          result.message ||
            (authMode === "signup"
              ? "Không thể tạo tài khoản."
              : "Thông tin đăng nhập chưa đúng."),
        );
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Không thể kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F4] font-sans text-[#1C1917] selection:bg-[#FEF08A] selection:text-[#1C1917]">
      <header className="border-b-[1.5px] border-[#262626] bg-[#FBF9F4] pt-[max(env(safe-area-inset-top),8px)]">
        <div className="mx-auto flex min-h-[56px] max-w-[1280px] items-center justify-between px-4 sm:min-h-[68px] sm:px-6 lg:min-h-[72px] lg:px-10">
          <a
            href="/app"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/app");
            }}
            aria-label="Mở ứng dụng SketchTask"
          >
            <BrandLogo size="lg" />
          </a>
          <button
            type="button"
            onClick={() => onNavigate("/app")}
            className="inline-flex items-center gap-1.5 rounded-[4px] border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#FEF08A] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none sm:px-3"
          >
            <ArrowLeft size={14} strokeWidth={2.4} />
            <span className="hidden sm:inline">Mở ứng dụng</span>
            <span className="sm:hidden">Ứng dụng</span>
          </button>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1280px] items-start gap-8 px-4 py-6 sm:min-h-[calc(100vh-68px)] sm:items-center sm:px-6 sm:py-10 md:max-lg:max-w-[640px] md:max-lg:py-12 lg:min-h-[calc(100vh-72px)] lg:grid-cols-[1fr_0.78fr] lg:gap-20 lg:px-10 lg:py-16">
        <section className="hidden lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#78716C]">
            SketchTask / private workspace
          </p>
          <h1 className="mt-5 max-w-2xl text-6xl font-black leading-[1.02] tracking-[-0.05em]">
            Một nơi để làm, ghi và nhìn lại.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#57534E]">
            Bắt đầu thật nhanh, rồi sắp xếp task, ghi chú và nhật ký theo cách
            phù hợp với mình.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            {["Task và lịch hẹn rõ ràng", "Note và nhật ký liền mạch", "Dữ liệu đồng bộ an toàn", "Dùng được trên mọi màn hình"].map(
              (item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-5 w-5 items-center justify-center border-[1.5px] border-[#262626] bg-[#BBF7D0]">
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {item}
                </div>
              ),
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[500px] border-[1.5px] border-[#262626] bg-white p-5 shadow-[3px_3px_0px_#262626] sm:p-7 md:max-lg:max-w-[560px] md:max-lg:p-8 lg:p-8 lg:shadow-[4px_4px_0px_#262626]">
          <div className="mb-6 border-b-[1.5px] border-[#262626] pb-5 sm:mb-7">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center border-[1.5px] border-[#262626] bg-[#FEF08A]">
                <LockKeyhole size={17} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#78716C]">
                private access
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
              {authMode === "signin" ? "Chào mừng bạn quay lại" : "Tạo tài khoản mới"}
            </h2>
            <p className="mt-2 text-base leading-6 text-[#57534E] sm:text-sm">
              {authMode === "signin"
                ? "Đăng nhập để tiếp tục với những task, note và nhật ký đang chờ bạn."
                : "Tạo tài khoản để lưu và đồng bộ dữ liệu cá nhân trên các thiết bị."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === "signup" && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-sm font-bold">
                  Tên hiển thị
                </label>
                <TextInput
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Tên của bạn"
                  className="text-base sm:text-sm"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-bold">
                Địa chỉ email
              </label>
              <TextInput
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tenban@email.com"
                className="text-base sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-bold">
                Mật khẩu
              </label>
              <div className="relative">
                <TextInput
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="pr-11 text-base sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#78716C] hover:text-[#1C1917]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div role="alert" className="flex items-start gap-2 border-[1.5px] border-[#BE123C] bg-[#FFE4E6] p-3 text-sm leading-5 text-[#881337]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full justify-center gap-2 text-base sm:text-sm">
              {isSubmitting
                ? "Đang xử lý..."
                : authMode === "signin"
                  ? "Đăng nhập vào SketchTask"
                  : "Tạo tài khoản SketchTask"}
              {!isSubmitting && <ArrowRight size={15} />}
            </Button>

            {!Capacitor.isNativePlatform() && (
              <>
                <div className="flex items-center gap-3 py-1">
                  <span className="h-px flex-1 bg-[#D4CEBF]" />
                  <span className="font-mono text-[10px] text-[#78716C]">hoặc</span>
                  <span className="h-px flex-1 bg-[#D4CEBF]" />
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsSubmitting(true);
                    setErrorMessage("");
                    triggerGoogleOAuth();
                  }}
                  className="flex w-full items-center justify-center gap-2 border-[1.5px] border-[#262626] bg-white px-4 py-2.5 text-sm font-bold shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#F3EFE6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                >
                  <span className="text-base font-black">G</span> Tiếp tục với Google
                </button>
              </>
            )}
          </form>

          <div className="mt-6 border-t border-[#D4CEBF] pt-5 text-center">
            <p className="text-sm leading-5 text-[#78716C]">
            Dữ liệu cục bộ vẫn dùng được khi offline. Đăng nhập để đồng bộ giữa các thiết bị.
            </p>
            <p className="mt-3 text-sm text-[#78716C]">
              {authMode === "signin" ? "Chưa có tài khoản?" : "Đã có tài khoản?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode((mode) => (mode === "signin" ? "signup" : "signin"));
                  setErrorMessage("");
                }}
                className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2"
              >
                {authMode === "signin" ? "Đăng ký ngay" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};
