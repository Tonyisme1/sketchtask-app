import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto } from "../../../types";
import { Search, X, CheckSquare, Square, Link as LinkIcon, Check, Calendar } from "lucide-react";

// ==========================================
// COMPONENT: JournalTaskLinkPopover
// Dropdown inline nhỏ gọn (Popover) chọn task để liên kết vào entry nhật ký
// Hoàn toàn không dùng modal popup che màn hình
// ==========================================

export interface JournalTaskLinkPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTask: (task: TaskDto | null) => void;
  selectedTaskId?: string;
  align?: "left" | "right";
}

export const JournalTaskLinkPopover: React.FC<JournalTaskLinkPopoverProps> = ({
  isOpen,
  onClose,
  onSelectTask,
  selectedTaskId,
  align = "left",
}) => {
  const { tasks, notebooks } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "completed" | "active">("all");
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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterType === "completed" && !t.completed) return false;
      if (filterType === "active" && t.completed) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchTag = t.tag?.toLowerCase().includes(q);
        return matchTitle || matchTag;
      }
      return true;
    });
  }, [tasks, filterType, searchQuery]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      className={`absolute top-full mt-1.5 z-40 w-72 sm:w-80 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] p-2.5 space-y-2 select-none animate-in fade-in zoom-in-95 duration-150 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {/* 1. Header & Nút Đóng */}
      <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-[#D4CEBF]">
        <div className="flex items-center gap-1.5 min-w-0">
          <LinkIcon size={12} strokeWidth={2.4} className="text-[#1C1917] shrink-0" />
          <span className="text-[11px] font-black text-[#1C1917] uppercase tracking-wide truncate">
            Gắn Công Việc Liên Kết
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

      {/* 2. Ô Tìm kiếm */}
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
          placeholder="Tìm task theo tên hoặc #tag..."
          autoFocus
          className="w-full h-7 pl-6 pr-2 bg-white border border-[#262626] rounded-[4px] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:bg-[#FEF08A]/30 font-medium"
        />
      </div>

      {/* 3. Bộ lọc nhanh: Tất cả | Đã xong | Cần làm */}
      <div className="flex items-center gap-1">
        {[
          { key: "all", label: "Tất cả" },
          { key: "active", label: "⏳ Cần làm" },
          { key: "completed", label: "Đã xong" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key as any)}
            className={`flex-1 py-1 rounded-[3px] text-[10px] font-bold border transition-all cursor-pointer ${
              filterType === tab.key
                ? "bg-[#FEF08A] border-[#262626] shadow-[0.5px_0.5px_0px_#262626] text-[#1C1917]"
                : "bg-white border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4. Danh Sách Task */}
      <div className="max-h-52 overflow-y-auto space-y-1 pr-0.5 no-scrollbar">
        {/* Tùy chọn Bỏ Gắn Task */}
        {selectedTaskId && (
          <button
            type="button"
            onClick={() => {
              onSelectTask(null);
              onClose();
            }}
            className="w-full text-left px-2 py-1.5 rounded-[4px] bg-rose-50 border border-rose-200 hover:border-[#262626] text-rose-700 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <X size={12} strokeWidth={2.4} />
              <span>Gỡ bỏ liên kết công việc này</span>
            </span>
          </button>
        )}

        {filteredTasks.length === 0 ? (
          <div className="text-center py-4 text-[11px] text-[#78716C]">
            Không tìm thấy công việc phù hợp
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const notebook = task.notebookId
              ? notebooks.find((n) => n.id === task.notebookId)
              : null;

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => {
                  onSelectTask(task);
                  onClose();
                }}
                className={`w-full text-left p-2 rounded-[4px] border text-xs flex items-start justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#FEF08A] border-[#262626] font-bold shadow-[1px_1px_0px_#262626] -translate-y-[0.5px]"
                    : "bg-white border-[#D4CEBF] hover:border-[#262626] text-[#1C1917] hover:bg-[#FAF8F3]"
                }`}
              >
                <div className="flex items-start gap-1.5 min-w-0 flex-1">
                  <span className="pt-0.5 shrink-0">
                    {task.completed ? (
                      <CheckSquare size={13} className="text-emerald-800" strokeWidth={2.2} />
                    ) : (
                      <Square size={13} className="text-[#78716C]" strokeWidth={2} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug truncate ${
                        task.completed ? "line-through text-[#78716C]" : "font-bold text-[#1C1917]"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {task.dueDate && (
                        <span className="text-[9px] font-mono text-[#78716C]">
                          <Calendar size={9} strokeWidth={2.3} /> {task.dueDate}
                        </span>
                      )}
                      {notebook && (
                        <span
                          className="text-[9px] font-bold px-1 rounded border border-[#262626]/40 truncate max-w-[80px]"
                          style={{ backgroundColor: notebook.color || "#FAF8F3" }}
                        >
                          {notebook.name}
                        </span>
                      )}
                      {task.tag && (
                        <span className="text-[9px] font-mono text-purple-700 bg-purple-50 px-1 rounded border border-purple-200">
                          #{task.tag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="p-0.5 bg-[#BBF7D0] border border-[#262626] rounded text-[#1C1917] shrink-0 mt-0.5">
                    <Check size={10} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
