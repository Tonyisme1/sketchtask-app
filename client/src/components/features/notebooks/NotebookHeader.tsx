import React from "react";
import { Button } from "../../ui";
import { BookMarked, BookOpen, NotebookPen, Search, X } from "lucide-react";
import { TabKey } from "../../../types";

export interface NotebookHeaderProps {
  isCreatingInline: boolean;
  onStartCreate: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  notebookCount?: number;
  onNavigateTab?: (tab: TabKey) => void;
  showWorkspaceTabs?: boolean;
}

export const NotebookHeader: React.FC<NotebookHeaderProps> = ({
  isCreatingInline,
  onStartCreate,
  searchQuery = "",
  onSearchChange,
  notebookCount,
  onNavigateTab,
  showWorkspaceTabs = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#262626] select-none">
      {/* Ô Tìm Kiếm Nhanh Bên Trái */}
      {onSearchChange && (
        <div className="relative flex-1 max-w-sm w-full">
          <Search
            size={14}
            strokeWidth={2.4}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm sổ tay..."
            className="w-full pl-9 pr-8 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] text-xs font-medium text-[#1C1917] placeholder:text-[#A8A29E] shadow-[1.5px_1.5px_0px_#262626] focus:outline-none focus:bg-[#FFFDF8] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] cursor-pointer"
            >
              <X size={13} strokeWidth={2.4} />
            </button>
          )}
        </div>
      )}

      {/* Cụm Phải: Segmented Tabs [ Ghi chú | Nhật ký | Sổ tay ] + Nút Tạo Sổ */}
      {showWorkspaceTabs ? (
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 self-start sm:self-auto shrink-0">
        {/* 1. Ghi chú */}
        <button
          type="button"
          onClick={() => onNavigateTab?.("notes")}
          className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-white text-[#78716C] hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
        >
          <NotebookPen size={14} strokeWidth={2.4} className="text-emerald-700" />
          <span>Ghi chú</span>
        </button>

        {/* 2. Nhật ký */}
        <button
          type="button"
          onClick={() => onNavigateTab?.("journal")}
          className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-white text-[#78716C] hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
        >
          <BookOpen size={14} strokeWidth={2.4} className="text-purple-700" />
          <span>Nhật ký</span>
        </button>

        {/* 3. Sổ tay (Active) */}
        <button
          type="button"
          className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-[#FED7AA] text-[#1C1917] shrink-0"
        >
          <BookMarked size={14} strokeWidth={2.4} className="text-amber-800" />
          <span>Sổ tay</span>
          {notebookCount !== undefined && (
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[3px] border border-[#262626] bg-white text-[#1C1917] leading-none font-bold">
              {notebookCount}
            </span>
          )}
        </button>

        {!isCreatingInline && (
          <Button
            onClick={onStartCreate}
            variant="primary"
            size="sm"
            className="shrink-0"
          >
            + Tạo sổ
          </Button>
        )}
      </div>
      ) : (
        <div className="flex items-center gap-2 shrink-0">
          <BookMarked size={16} strokeWidth={2.4} className="text-amber-800" />
          <span className="text-sm font-bold text-[#1C1917]">Sổ tay</span>
          {notebookCount !== undefined && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-[3px] border border-[#262626] bg-white text-[#1C1917] leading-none font-bold">
              {notebookCount}
            </span>
          )}
          {!isCreatingInline && (
            <Button
              onClick={onStartCreate}
              variant="primary"
              size="sm"
              className="shrink-0"
            >
              + Tạo sổ
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
