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
  const { tasks } = useAppStore();
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
      className={`absolute top-full mt-2 z-40 w-72 sm:w-80 bg-white dark:bg-[#1E1E22] rounded-3xl shadow-2xl p-3.5 space-y-2.5 select-none animate-in fade-in zoom-in-95 duration-150 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {/* 1. Header & Nút Đóng */}
      <div className="flex items-center justify-between gap-1.5 pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <LinkIcon size={13} strokeWidth={2.2} className="text-[#007AFF] dark:text-[#0A84FF] shrink-0" />
          <span className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight truncate">
            Gắn Công Việc Liên Kết
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-xl hover:bg-black/[0.04] dark:hover:bg-white/[0.08] flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] transition-colors cursor-pointer shrink-0"
          title="Đóng"
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>

      {/* 2. Ô Tìm kiếm */}
      <div className="relative">
        <Search
          size={13}
          strokeWidth={2.2}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] dark:text-[#A1A1A6]"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm task theo tên hoặc #tag..."
          autoFocus
          className="w-full h-8 pl-8 pr-3 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl text-xs text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] dark:placeholder:text-[#A1A1A6] focus:outline-none focus:ring-1 focus:ring-[#007AFF] font-medium transition-all"
        />
      </div>

      {/* 3. Bộ lọc nhanh: Tất cả | Đã xong | Cần làm */}
      <div className="flex items-center gap-1 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-2xl">
        {[
          { key: "all", label: "Tất cả" },
          { key: "active", label: "⏳ Cần làm" },
          { key: "completed", label: "✓ Đã xong" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterType(tab.key as any)}
            className={`flex-1 py-1 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
              filterType === tab.key
                ? "bg-white dark:bg-[#2C2C2E] shadow-2xs text-[#007AFF] dark:text-[#0A84FF]"
                : "text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
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
            className="w-full text-left px-3 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
          >
            <span className="flex items-center gap-1.5">
              <X size={12} strokeWidth={2.4} />
              <span>Gỡ bỏ liên kết công việc này</span>
            </span>
          </button>
        )}

        {filteredTasks.length === 0 ? (
          <div className="text-center py-4 text-xs text-[#8E8E93] dark:text-[#A1A1A6]">
            Không tìm thấy công việc phù hợp
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const isSelected = selectedTaskId === task.id;
            return (
              <button
                key={`link-task-${task.id}-${index}`}
                type="button"
                onClick={() => {
                  onSelectTask(task);
                  onClose();
                }}
                className={`w-full text-left p-2.5 rounded-2xl text-xs flex items-start justify-between gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF] font-semibold shadow-2xs"
                    : "hover:bg-black/[0.03] dark:hover:bg-white/[0.05] text-[#1C1C1E] dark:text-[#F2F2F7]"
                }`}
              >
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <span className="pt-0.5 shrink-0">
                    {task.completed ? (
                      <CheckSquare size={13} className="text-emerald-600 dark:text-emerald-400" strokeWidth={2.2} />
                    ) : (
                      <Square size={13} className="text-[#8E8E93]" strokeWidth={2} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs leading-snug truncate ${
                        task.completed ? "line-through opacity-70" : "font-semibold"
                      }`}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {task.dueDate && (
                        <span className="text-[10px] font-mono text-[#8E8E93] dark:text-[#A1A1A6] flex items-center gap-0.5">
                          <Calendar size={9} strokeWidth={2.3} /> {task.dueDate}
                        </span>
                      )}
                      {task.tag && (
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                          #{task.tag}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <span className="p-1 bg-[#007AFF] text-white rounded-full shrink-0 mt-0.5">
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
