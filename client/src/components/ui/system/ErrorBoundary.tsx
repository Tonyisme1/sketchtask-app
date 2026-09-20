import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F2F2F7] dark:bg-[#18181A] p-6 flex flex-col items-center justify-center text-[#1C1917] dark:text-[#F2F2F7] font-sans">
          <div className="max-w-md w-full p-6 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-xl mx-auto shadow-xs">
              <AlertTriangle size={24} strokeWidth={2.4} className="text-rose-600 dark:text-rose-400" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#1C1917] dark:text-white">
                Đã có chút trục trặc khi tải trang
              </h2>
              <p className="text-xs text-[#78716C] dark:text-[#8E8E93] leading-relaxed">
                {this.state.error?.message || "Lỗi khởi tạo giao diện."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2.5 bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] rounded-2xl shadow-xs text-xs font-bold active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center"
            >
              Làm mới lại dữ liệu
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
