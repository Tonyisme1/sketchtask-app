import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Search, X, BookMarked, Check, FolderX } from "lucide-react";
import { DynamicIcon } from "../../ui/core/DynamicIcon";

// ==========================================
// COMPONENT: JournalNotebookPopover
// Menu xổ xuống nhỏ gọn (Inline Dropdown Popover) chọn Sổ tay cho dòng Nhật ký
// Hoàn toàn không dùng modal popup che màn hình
// ==========================================

export interface JournalNotebookPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNotebook: (notebookId: string | undefined) => void;
  selectedNotebookId?: string;
  align?: "left" | "right";
}

export const JournalNotebookPopover: React.FC<JournalNotebookPopoverProps> = ({
  isOpen,
  onClose,
  onSelectNotebook,
  selectedNotebookId,
  align = "left",
}) => {
  const { notebooks, journalEntries } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  // Đóng khi click ra ngoài
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Đóng khi nhấn Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) return notebooks;
    const q = searchQuery.toLowerCase().trim();
    return notebooks.filter(
      (nb) =>
        nb.name.toLowerCase().includes(q) ||
        (nb.description && nb.description.toLowerCase().includes(q))
    );
  }, [notebooks, searchQuery]);

  // Đếm số lượng entry nhật ký chưa gán sổ
  const unassignedCount = useMemo(() => {
    return journalEntries.filter((j) => !j.notebookId).length;
  }, [journalEntries]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full mt-1.5 z-40 w-64 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] p-2 space-y-2 select-none animate-in fade-in zoom-in-95 duration-150 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {/* 1. Header & Tìm Kiếm */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-[#D4CEBF]">
        <div className="flex items-center gap-1.5 min-w-0">
          <BookMarked size={12} strokeWidth={2.4} className="text-[#1C1917] shrink-0" />
          <span className="text-[11px] font-black text-[#1C1917] uppercase tracking-wide truncate">
            Gắn Sổ Tay
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-5 h-5 rounded hover:bg-rose-50 border border-transparent hover:border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 transition-colors cursor-pointer shrink-0"
          title="Đóng"
        >
          <X size={12} strokeWidth={2.6} />
        </button>
      </div>

      {/* Ô tìm kiếm nhanh */}
      <div className="relative">
        <Search
          size={12}
          strokeWidth={2.2}
          className="absolute left-2 top-1/2 -translate-y-1/2 text-[#78716C]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm nhanh sổ tay..."
          autoFocus
          className="w-full h-7 pl-6 pr-2 bg-white border border-[#262626] rounded-[4px] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:bg-[#FEF08A]/30 font-medium"
        />
      </div>

      {/* 2. Danh sách Sổ tay */}
      <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
        {/* Tùy chọn Bỏ Gán Sổ */}
        <button
          type="button"
          onClick={() => {
            onSelectNotebook(undefined);
            onClose();
          }}
          className={`w-full text-left px-2 py-1.5 rounded-[4px] border text-xs flex items-center justify-between transition-colors cursor-pointer ${
            !selectedNotebookId
              ? "bg-[#FAF8F3] border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
              : "bg-white border-dashed border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917] hover:border-[#262626]"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <FolderX size={13} className="text-[#78716C] shrink-0" />
            <span className="truncate text-xs">Không gán sổ (Chung)</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-mono text-[#78716C]">
              {unassignedCount}
            </span>
            {!selectedNotebookId && (
              <Check size={12} strokeWidth={2.8} className="text-emerald-800" />
            )}
          </div>
        </button>

        {/* Danh sách các cuốn sổ */}
        {filteredNotebooks.length === 0 ? (
          <div className="text-center py-3 text-[11px] text-[#78716C]">
            Không tìm thấy sổ tay nào
          </div>
        ) : (
          filteredNotebooks.map((nb) => {
            const isSelected = selectedNotebookId === nb.id;
            const entryCount = journalEntries.filter((j) => j.notebookId === nb.id).length;

            return (
              <button
                key={nb.id}
                type="button"
                onClick={() => {
                  onSelectNotebook(nb.id);
                  onClose();
                }}
                className={`w-full text-left px-2 py-1.5 rounded-[4px] border text-xs flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? "border-[#262626] font-bold shadow-[1px_1px_0px_#262626] -translate-y-[0.5px]"
                    : "border-transparent hover:border-[#262626] bg-white text-[#1C1917] hover:bg-[#FAF8F3]"
                }`}
                style={{
                  backgroundColor: isSelected ? nb.color || "#DDD6FE" : undefined,
                }}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-5 h-5 rounded-[3px] border border-[#262626] flex items-center justify-center shrink-0 shadow-[0.5px_0.5px_0px_#262626]"
                    style={{ backgroundColor: nb.color || "#DDD6FE" }}
                  >
                    <DynamicIcon
                      name={nb.icon || "lucide:BookOpen"}
                      size={11}
                      className="text-[#1C1917]"
                    />
                  </div>
                  <span className="truncate text-xs">{nb.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono text-[#78716C]">
                    {entryCount}
                  </span>
                  {isSelected && (
                    <Check size={12} strokeWidth={2.8} className="text-emerald-950" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
