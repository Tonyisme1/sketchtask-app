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
import { SeoHead } from "../marketing/SeoHead";

export type AuthPageMode = "signin" | "signup";

interface AuthPageProps {
  mode: AuthPageMode;
  onNavigate: (path: string, replace?: boolean) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ mode, onNavigate }) => {
  const {
    user,
    loginWithCredentials,
    registerWithCredentials,
    loginWithGoogle,
  } = useAppStore();
  const [authMode, setAuthMode] = useState<AuthPageMode>(mode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getPostAuthPath = () => {
    const returnTo = new URLSearchParams(window.location.search).get("returnTo");
    if (returnTo === "/admin" || window.history.state?.from === "/admin") {
      return "/admin";
    }
    return "/app";
  };

  const isForcedAuth = () =>
    new URLSearchParams(window.location.search).get("force") === "1";

  useEffect(() => {
    setAuthMode(mode);
    setErrorMessage("");
  }, [mode]);

  useEffect(() => {
    if (user.isSignedIn && !isForcedAuth()) onNavigate(getPostAuthPath(), true);
  }, [onNavigate, user.isSignedIn]);

  const handleSuccess = () => onNavigate(getPostAuthPath(), true);

  const triggerGoogleOAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSubmitting(true);
      setErrorMessage("");
      try {
        const response = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          },
        );
        if (!response.ok) {
          throw new Error("Không thể lấy thông tin tài khoản Google.");
        }
        const profile = await response.json();
        const result = await loginWithGoogle({
          email: profile.email,
          name: profile.name || profile.email.split("@")[0],
          avatar: "lucide:Sparkles",
          avatarBg: "#FEF08A",
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
    if (authMode === "signup" && !name.trim()) {
      setErrorMessage("Vui lòng nhập tên hiển thị.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result =
        authMode === "signup"
          ? await registerWithCredentials(
              name.trim(),
              cleanEmail,
              password || undefined,
            )
          : await loginWithCredentials(cleanEmail, password || undefined);
      if (result.success) handleSuccess();
      else setErrorMessage(result.message || "Thông tin đăng nhập chưa đúng.");
    } catch (error: any) {
      setErrorMessage(error.message || "Không thể kết nối tới máy chủ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (nextMode: AuthPageMode) => {
    setAuthMode(nextMode);
    setErrorMessage("");
    onNavigate(nextMode === "signin" ? "/login" : "/register");
  };

  const isSignIn = authMode === "signin";
  const title = isSignIn ? "Chào mừng bạn quay lại" : "Tạo workspace của bạn";
  const description = isSignIn
    ? "Đăng nhập để tiếp tục với những task, note và nhật ký đang chờ bạn."
    : "Tạo tài khoản để giữ mọi thứ đồng bộ giữa các thiết bị.";

  return (
    <div className="min-h-screen bg-[#FBF9F4] font-sans text-[#1C1917] selection:bg-[#FEF08A] selection:text-[#1C1917]">
      <SeoHead
        title={`${isSignIn ? "Đăng nhập" : "Đăng ký"} | SketchTask`}
        description={description}
        path={isSignIn ? "/login" : "/register"}
      />
      <header className="border-b-[1.5px] border-[#262626] bg-[#FBF9F4]">
        <div className="mx-auto flex min-h-[72px] max-w-[1280px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/");
            }}
            aria-label="Về trang chủ SketchTask"
          >
            <BrandLogo size="lg" />
          </a>
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("/");
            }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#57534E] hover:text-[#1C1917]"
          >
            <ArrowLeft size={15} /> Về trang chủ
          </a>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-72px)] max-w-[1280px] items-center gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.78fr] lg:gap-20 lg:px-10">
        <section className="hidden lg:block">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#78716C]">
            SketchTask / private workspace
          </p>
          <h1 className="mt-5 max-w-2xl text-6xl font-black leading-[1.02] tracking-[-0.05em]">
            Một nơi để làm, ghi và nhìn lại.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#57534E]">
            Bạn có thể bắt đầu thật nhanh, rồi sắp xếp dần theo cách phù hợp với mình. Không cần biến việc quản lý công việc thành một công việc khác.
          </p>
          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            {["Task và lịch hẹn rõ ràng", "Note và nhật ký liền mạch", "Dữ liệu đồng bộ an toàn", "Dùng được trên mọi màn hình"].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-5 w-5 items-center justify-center border-[1.5px] border-[#262626] bg-[#BBF7D0]">
                  <Check size={13} strokeWidth={3} />
                </span>
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[500px] border-[1.5px] border-[#262626] bg-white p-5 shadow-[4px_4px_0px_#262626] sm:p-8">
          <div className="mb-7 border-b-[1.5px] border-[#262626] pb-5">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center border-[1.5px] border-[#262626] bg-[#FEF08A]">
                <LockKeyhole size={17} />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#78716C]">
                private access
              </span>
            </div>
            <h2 className="mt-5 text-3xl font-black tracking-[-0.035em]">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#57534E]">{description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isSignIn && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-xs font-bold">
                  Tên hiển thị
                </label>
                <TextInput
                  id="auth-name"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Minh Khang"
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-bold">
                Địa chỉ email
              </label>
              <TextInput
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tenban@email.com"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-bold">
                Mật khẩu
              </label>
              <div className="relative">
                <TextInput
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignIn ? "current-password" : "new-password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="pr-11"
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
              <div role="alert" className="flex items-start gap-2 border-[1.5px] border-[#BE123C] bg-[#FFE4E6] p-3 text-xs leading-5 text-[#881337]">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full justify-center gap-2">
              {isSubmitting ? "Đang xử lý..." : isSignIn ? "Đăng nhập vào SketchTask" : "Tạo tài khoản"}
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

          <div className="mt-6 border-t border-[#D4CEBF] pt-5 text-center text-sm text-[#57534E]">
            {isSignIn ? (
              <>
                Chưa có tài khoản?{" "}
                <button type="button" onClick={() => switchMode("signup")} className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2 underline-offset-4">
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button type="button" onClick={() => switchMode("signin")} className="font-bold text-[#1C1917] underline decoration-[#FEF08A] decoration-2 underline-offset-4">
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
