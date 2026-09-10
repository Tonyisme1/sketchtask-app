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
        backgroundColor: "rgba(0, 0, 0, 0.82)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="flex items-center justify-center p-4 select-none touch-none mobile-scrim-enter"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Box Xác Nhận */}
      <div
        className="w-full max-w-sm bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-5 mobile-bottom-sheet-enter relative z-[1000000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 bg-[#1C1917] border-[1.5px] border-[#262626] rounded-[4px] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
            <Trash2 size={16} strokeWidth={2.4} className="text-white" />
          </div>
          <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
            {title}
          </h3>
        </div>

        <p className="text-xs sm:text-sm text-[#78716C] leading-relaxed mb-5">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#D4CEBF]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs text-[#1C1917] hover:bg-[#F3EFE6] border border-[#D4CEBF] rounded-[4px] font-bold transition-all"
          >
            {cancelText}
          </button>
          <Button onClick={onConfirm} variant="danger" size="md">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
