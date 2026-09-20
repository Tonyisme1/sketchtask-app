import React from "react";
import { DynamicIcon } from "../core/DynamicIcon";

// ==========================================
// COMPONENT: EmptyStateDoodle (Trạng Thái Trống với DynamicIcon)
// ==========================================

export interface EmptyStateDoodleProps {
  icon?: string;
  title?: string;
  message?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyStateDoodle: React.FC<EmptyStateDoodleProps> = ({
  icon = "lucide:Coffee",
  title = "Trang giấy còn trống",
  message = "Bạn muốn bắt đầu việc gì trước?",
  actionText,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`py-8 px-5 sm:py-10 sm:px-6 text-center border-none rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] shadow-xs ${className}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FEF08A] dark:bg-[#3A3A3C] shadow-xs rounded-2xl mb-3">
        <DynamicIcon name={icon} size={22} strokeWidth={2.2} className="text-[#1C1917] dark:text-[#F2F2F7]" />
      </div>
      <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7] mb-1">{title}</h3>
      <p className="text-xs text-[#78716C] dark:text-[#8E8E93] max-w-sm mx-auto leading-relaxed mb-4">
        {message}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1C1917] dark:bg-white hover:bg-black dark:hover:bg-[#F2F2F7] border-none rounded-2xl text-xs font-bold text-white dark:text-[#1C1917] shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
