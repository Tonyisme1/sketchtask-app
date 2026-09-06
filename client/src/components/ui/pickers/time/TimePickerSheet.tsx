import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { registerBackHandler } from "../../../../utils/backNavigation";
import { useScrollLock } from "../../../../hooks/useScrollLock";

// ==========================================
// SUB-COMPONENT: TimePickerSheet (Responsive Modal & Mobile Bottom Sheet Gesture)
// Mobile: Bottom Sheet trượt từ đáy màn hình, Grab Handle chạm đóng & kéo vuốt xuống để đóng
// Desktop: Modal căn giữa màn hình, giữ nút X
// ==========================================

export interface TimePickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const DRAG_DISMISS_THRESHOLD = 90; // Ngưỡng kéo (px) để kích hoạt đóng sheet

export const TimePickerSheet: React.FC<TimePickerSheetProps> = ({
  isOpen,
  onClose,
  onApply,
  onClear,
  title = "Thiết lập thời gian",
  subtitle,
  icon,
  children,
}) => {
  // Quản lý khóa cuộn trang nền an toàn
  useScrollLock(isOpen);

  // Quản lý gesture kéo vuốt trên Mobile Grab Handle
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const currentDragYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Đăng ký phím Back Android / Escape
  useEffect(() => {
    if (isOpen) {
      setDragY(0);
      setIsDragging(false);
      const unregister = registerBackHandler(() => {
        onClose();
        return true;
      });
      return () => unregister();
    }
  }, [isOpen, onClose]);

  // Touch Handlers riêng biệt CHỈ trên Grab Handle (không khóa scroll nội dung picker)
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    currentDragYRef.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    if (deltaY > 0) {
      currentDragYRef.current = deltaY;
      setDragY(deltaY);
    } else {
      currentDragYRef.current = 0;
      setDragY(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (currentDragYRef.current >= DRAG_DISMISS_THRESHOLD) {
      onClose();
    } else {
      setDragY(0);
    }
    currentDragYRef.current = 0;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none mobile-scrim-enter"
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? "none" : "transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="relative w-full max-w-xs sm:max-w-sm bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[18px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[4px_4px_0px_#262626] p-3 sm:p-3.5 flex flex-col justify-between overflow-hidden mobile-bottom-sheet-enter max-h-[82dvh] sm:max-h-[82vh]"
      >
        {/* Grab Handle cho Mobile: Vùng chạm tối thiểu 36px, chạm đóng & kéo vuốt đóng */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng bảng chọn thời gian"
          onClick={() => {
            if (dragY < 5) onClose();
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onClose();
            }
          }}
          className="w-full pt-0.5 pb-1.5 flex items-center justify-center cursor-pointer sm:hidden min-h-[32px] active:opacity-70 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[#262626] rounded-t-[18px] touch-none"
        >
          <div className="w-10 h-1 bg-[#D4CEBF] rounded-full hover:bg-[#A8A29E] transition-colors pointer-events-none" />
        </div>

        {/* Header Modal Ngắn Gọn */}
        <div className="flex items-center justify-between pb-1.5 border-b border-[#262626] shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            {icon && (
              <span className="p-1 bg-[#FEF08A] border border-[#262626] rounded-[3px] shadow-[1px_1px_0px_#262626] shrink-0">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-xs sm:text-sm text-[#1C1917] leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[10px] text-[#78716C] leading-tight truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Nút X trên Desktop & Tablet */}
          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex w-6 h-6 rounded bg-white hover:bg-rose-50 border border-[#262626] items-center justify-center text-[#78716C] hover:text-rose-600 active:translate-y-[0.5px] transition-all shrink-0"
            aria-label="Đóng bảng chọn thời gian"
          >
            <X size={13} strokeWidth={2.4} />
          </button>
        </div>

        {/* Nội dung bên trong cuộn mượt */}
        <div className="overflow-y-auto no-scrollbar flex-1 py-1">
          {children}
        </div>

        {/* Footer Modal Tối Giản */}
        <div className="flex items-center justify-between pt-2.5 border-t border-[#262626] shrink-0 gap-2">
          <button
            type="button"
            onClick={onClear}
            className="px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-[#262626] rounded-[4px] text-xs font-bold text-[#78716C] hover:text-rose-700 active:translate-y-[0.5px] transition-all"
          >
            Xóa thời gian
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-[#262626] rounded-[4px] text-xs font-bold text-[#1C1917] active:translate-y-[0.5px] transition-all"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={onApply}
              className="px-3 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] text-xs font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1"
            >
              <Check size={13} strokeWidth={2.4} />
              <span>Áp dụng</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
