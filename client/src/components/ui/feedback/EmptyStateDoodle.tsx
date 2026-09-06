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
      className={`py-7 px-4 sm:py-8 sm:px-5 text-center border-[1.5px] border-dashed border-[#D4CEBF] rounded-[8px] bg-[#FAF8F3]/60 ${className}`}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 bg-[#FEF08A] border-[1.5px] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] rounded-[6px] -rotate-1 mb-2.5">
        <DynamicIcon name={icon} size={20} strokeWidth={2.2} />
      </div>
      <h3 className="text-xs sm:text-sm font-bold text-[#1C1917] mb-1">{title}</h3>
      <p className="text-[11px] text-[#78716C] max-w-sm mx-auto leading-relaxed mb-3">
        {message}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[5px] text-xs font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
