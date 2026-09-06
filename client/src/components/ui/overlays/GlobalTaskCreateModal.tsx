import React from "react";
import { CheckSquare, X } from "lucide-react";
import { QuickAddTaskComposer } from "../../features/shared/QuickAddTaskComposer";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { useModalBackClose } from "../../../hooks/useModalBackClose";

interface GlobalTaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

/** Full task entry point that is independent from Today, Planner, or a notebook. */
export const GlobalTaskCreateModal: React.FC<GlobalTaskCreateModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  useScrollLock(isOpen);
  useModalBackClose(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 md:items-center md:p-6 mobile-scrim-enter"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="global-task-create-title"
        className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto bg-[#FBF9F4] border-t-[2px] md:border-[1.5px] border-[#262626] rounded-t-[22px] md:rounded-[8px] shadow-[0px_-4px_0px_#262626] md:shadow-[3px_3px_0px_#262626] p-4 sm:p-5 mobile-bottom-sheet-enter touch-pan-y overscroll-contain"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Mobile Grab Handle Bar */}
        <div
          role="button"
          tabIndex={0}
          onClick={onClose}
          className="w-full pt-0 pb-2.5 flex items-center justify-center cursor-pointer md:hidden min-h-[20px] active:opacity-60"
        >
          <div className="w-12 h-1.5 bg-[#D4CEBF] rounded-full pointer-events-none" />
        </div>

        <header className="flex items-center justify-between gap-3 pb-2.5 mb-3 border-b-[1.5px] border-[#262626]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="hidden md:flex w-8 h-8 shrink-0 bg-[#BAE6FD] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] items-center justify-center">
              <CheckSquare size={17} strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h2 id="global-task-create-title" className="text-base sm:text-lg font-bold text-[#1C1917]">
                Thêm công việc mới
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="hidden md:flex w-8 h-8 shrink-0 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] items-center justify-center text-[#57534E] hover:bg-[#FECDD3] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            aria-label="Đóng tạo công việc"
            title="Đóng"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </header>

        <QuickAddTaskComposer
          context={initialDate ? "planner" : "global"}
          selectedDate={initialDate}
          hideExpandToggle
          onTaskCreated={onClose}
          placeholder="Nhập tên công việc mới..."
        />
      </section>
    </div>
  );
};
