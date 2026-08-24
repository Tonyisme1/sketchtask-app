import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FBF9F4] p-6 flex flex-col items-center justify-center text-[#1C1917] font-sans">
          <div className="max-w-md w-full p-5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626]">
            <div className="w-10 h-10 bg-[#FECDD3] border border-[#262626] rounded-[4px] flex items-center justify-center text-xl mb-3">
              ⚠️
            </div>
            <h2 className="text-base font-bold text-[#1C1917] mb-1">
              Đã có chút trục trặc khi tải trang
            </h2>
            <p className="text-xs text-[#78716C] mb-4">
              {this.state.error?.message || "Lỗi khởi tạo giao diện."}
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-3 py-1.5 bg-[#FEF08A] text-[#1C1917] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold"
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

