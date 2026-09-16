import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { Button } from "../core/Button";

// ==========================================
// COMPONENT: ConfirmModal (Sử Dụng React Portal Trùm Kín 100% Màn Hình)
// ==========================================

import { useScrollLock } from "../../../hooks/useScrollLock";

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Xác nhận hành động",
  message,
  confirmText = "Đồng ý xóa",
  cancelText = "Giữ lại",
  onConfirm,
  onCancel,
}) => {
  const [mounted, setMounted] = useState(false);
  useScrollLock(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  // Render trực tiếp vào document.body bằng React Portal để không bao giờ bị giới hạn bởi component cha
  return createPortal(
    <div
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
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 sm:p-6 select-none touch-none animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Box Xác Nhận */}
      <div
        className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-t-[24px] sm:rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 relative z-[1000000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center shrink-0">
            <Trash2 size={18} strokeWidth={2.4} />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-[#1C1C1E] dark:text-[#F2F2F7]">
              {title}
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#8E8E93] dark:text-[#aeaeb2] leading-relaxed">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] rounded-xl transition-all active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
