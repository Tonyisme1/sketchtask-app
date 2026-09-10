import React, { useEffect, useRef } from "react";
import { CheckSquare, FileText, BookOpen, BookMarked } from "lucide-react";
import { TabKey } from "../../types";

interface DesktopCreateDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  onNavigateTab: (tab: TabKey) => void;
}

export const DesktopCreateDropdown: React.FC<DesktopCreateDropdownProps> = ({
  isOpen,
  onClose,
  onCreateTask,
  onNavigateTab,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-56 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] shadow-[4px_4px_0px_#262626] py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 select-none divide-y divide-[#E7E5E4]"
    >
      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onCreateTask();
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF8F3] transition-colors cursor-pointer text-xs font-bold text-[#1C1917]"
        >
          <div className="w-6 h-6 rounded-[4px] bg-[#1C1917] text-white border border-[#262626] flex items-center justify-center shadow-[0.5px_0.5px_0px_#262626]">
            <CheckSquare size={13} strokeWidth={2.4} className="text-white" />
          </div>
          <span>Tạo việc cần làm</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigateTab("notes");
            window.dispatchEvent(new CustomEvent("sketchtask:create", { detail: { type: "note" } }));
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF8F3] transition-colors cursor-pointer text-xs font-bold text-[#1C1917]"
        >
          <div className="w-6 h-6 rounded-[4px] bg-[#1C1917] text-white border border-[#262626] flex items-center justify-center shadow-[0.5px_0.5px_0px_#262626]">
            <FileText size={13} strokeWidth={2.4} className="text-white" />
          </div>
          <span>Tạo ghi chú mới</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigateTab("journal");
            window.dispatchEvent(new CustomEvent("sketchtask:create", { detail: { type: "journal" } }));
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF8F3] transition-colors cursor-pointer text-xs font-bold text-[#1C1917]"
        >
          <div className="w-6 h-6 rounded-[4px] bg-[#1C1917] text-white border border-[#262626] flex items-center justify-center shadow-[0.5px_0.5px_0px_#262626]">
            <BookOpen size={13} strokeWidth={2.4} className="text-white" />
          </div>
          <span>Viết nhật ký hôm nay</span>
        </button>
      </div>

      <div className="py-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigateTab("notebooks");
            window.dispatchEvent(new CustomEvent("sketchtask:create", { detail: { type: "notebook" } }));
          }}
          className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#FAF8F3] transition-colors cursor-pointer text-xs font-bold text-[#1C1917]"
        >
          <div className="w-6 h-6 rounded-[4px] bg-[#1C1917] text-white border border-[#262626] flex items-center justify-center shadow-[0.5px_0.5px_0px_#262626]">
            <BookMarked size={13} strokeWidth={2.4} className="text-white" />
          </div>
          <span>Tạo cuốn sổ tay mới</span>
        </button>
      </div>
    </div>
  );
};
