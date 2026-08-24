import React from "react";
import { DynamicIcon } from "./DynamicIcon";

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
      className={`py-10 px-4 text-center border-[1.5px] border-dashed border-[#D4CEBF] rounded-[6px] bg-[#FBF9F4] ${className}`}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#FEF08A] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] rounded-[6px] -rotate-2 mb-3">
        <DynamicIcon name={icon} size={24} strokeWidth={2} />
      </div>
      <h3 className="text-sm font-bold text-[#1C1917] mb-1">{title}</h3>
      <p className="text-xs text-[#78716C] max-w-sm mx-auto leading-relaxed mb-4">
        {message}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] text-xs font-semibold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
