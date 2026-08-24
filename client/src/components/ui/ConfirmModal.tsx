import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

// ==========================================
// COMPONENT: ConfirmModal (Sử Dụng React Portal Trùm Kín 100% Màn Hình)
// ==========================================

interface ConfirmModalProps {
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Khóa cứng thanh cuộn và chặn toàn bộ tương tác phía sau
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

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
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      className="flex items-center justify-center p-4 select-none touch-none animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {/* Box Xác Nhận */}
      <div
        className="w-full max-w-sm bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-5 animate-in zoom-in-95 duration-150 relative z-[1000000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 bg-[#FECDD3] border-[1.5px] border-[#262626] rounded-[4px] flex items-center justify-center text-base shadow-[1px_1px_0px_#262626]">
            🗑️
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
