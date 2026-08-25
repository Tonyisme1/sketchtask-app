import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { TabKey, TaskDto, NotebookDto, StickyNoteDto, HabitDto } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { DynamicIcon } from "./DynamicIcon";
import { getTaskDueInfo } from "../../utils/taskDueStatus";
import {
  Search,
  CheckSquare,
  BookOpen,
  Lightbulb,
  Flame,
  ArrowRight,
  X,
  Sparkles,
  Command,
} from "lucide-react";

// ==========================================
// COMPONENT: GlobalSearchModal (Tìm Kiếm Toàn Cục Siêu Tốc Ctrl + K)
// ==========================================

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabKey) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { tasks, notebooks, stickyNotes, habits } = useAppStore();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  // Lọc kết quả tìm kiếm theo thời gian thực
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;

    const matchedTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.tag && t.tag.toLowerCase().includes(q))
    );

    const matchedNotebooks = notebooks.filter(
      (nb) =>
        nb.name.toLowerCase().includes(q) ||
        (nb.description && nb.description.toLowerCase().includes(q))
    );

    const matchedNotes = stickyNotes.filter((sn) =>
      sn.content.toLowerCase().includes(q)
    );

    const matchedHabits = habits.filter((h) =>
      h.name.toLowerCase().includes(q)
    );

    const totalCount =
      matchedTasks.length +
      matchedNotebooks.length +
      matchedNotes.length +
      matchedHabits.length;

    return {
      tasks: matchedTasks,
      notebooks: matchedNotebooks,
      notes: matchedNotes,
      habits: matchedHabits,
      totalCount,
    };
  }, [query, tasks, notebooks, stickyNotes, habits]);

  if (!isOpen) return null;

  const handleSelect = (tab: TabKey) => {
    onNavigate(tab);
    onClose();
  };

  return createPortal(
    <div
      onClick={onClose}
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
        backgroundColor: "rgba(38, 38, 38, 0.65)",
        touchAction: "none",
      }}
      className="flex items-start sm:items-center justify-center p-3 sm:p-4 pt-16 sm:pt-4 select-none animate-in fade-in duration-150 pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Paper Tape Effect */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#FEF08A]/90 border-x border-[#262626]/40 rotate-1 shadow-sm pointer-events-none" />

        {/* Search Input Bar */}
        <div className="flex items-center gap-2 pb-3 border-b-[1.5px] border-[#262626]">
          <div className="w-8 h-8 bg-[#FEF08A] border border-[#262626] rounded-[4px] flex items-center justify-center shadow-[1px_1px_0px_#262626] shrink-0">
            <Search size={16} strokeWidth={2.5} className="text-[#1C1917]" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm công việc, sổ tay, ý tưởng, thói quen..."
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base font-bold text-[#1C1917] placeholder:text-[#78716C] placeholder:font-normal"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-[#78716C] hover:text-[#1C1917] font-bold"
            >
              <X size={14} strokeWidth={2.5} />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-[#78716C] bg-white px-1.5 py-0.5 rounded border border-[#D4CEBF]">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-3 space-y-3 pr-0.5">
          {!query.trim() ? (
            /* Trạng thái chưa nhập từ khóa */
            <div className="py-8 text-center space-y-2 text-[#78716C]">
              <Sparkles size={24} className="mx-auto text-amber-500 opacity-60" />
              <p className="text-xs font-bold text-[#1C1917]">
                Nhập từ khóa để tìm kiếm nhanh
              </p>
              <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
                Tìm kiếm tức thì theo tên công việc, thẻ tag, tiêu đề sổ tay hoặc nội dung ghi chú ý tưởng.
              </p>
            </div>
          ) : searchResults && searchResults.totalCount === 0 ? (
            /* Không tìm thấy */
            <div className="py-8 text-center space-y-1.5 text-[#78716C]">
              <p className="text-xs font-bold text-[#1C1917]">
                Không tìm thấy kết quả nào cho &quot;{query}&quot;
              </p>
              <p className="text-[11px]">
                Hãy thử kiểm tra lại chính tả hoặc tìm bằng từ khóa ngắn hơn nhé.
              </p>
            </div>
          ) : searchResults ? (
            /* Danh sách kết quả phân nhóm */
            <div className="space-y-3">
              {/* 1. Công Việc (Tasks) */}
              {searchResults.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare size={13} className="text-amber-700" />
                      <span>CÔNG VIỆC ({searchResults.tasks.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.tasks.map((task) => {
                      const dueInfo = getTaskDueInfo(task.dueDate);
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleSelect(task.dueDate ? "planner" : "today")}
                          className="p-2 bg-white hover:bg-[#FEF08A]/30 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                task.completed ? "bg-[#78716C]" : "bg-emerald-500"
                              }`}
                            />
                            <p
                              className={`text-xs font-semibold truncate ${
                                task.completed ? "line-through text-[#78716C]" : "text-[#1C1917]"
                              }`}
                            >
                              {task.title}
                            </p>
                          </div>
                          {dueInfo && !task.completed && (
                            <span className={`text-[9.5px] px-1.5 py-0.2 rounded border font-mono shrink-0 ${dueInfo.badgeClass}`}>
                              {dueInfo.label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Sổ Tay (Notebooks) */}
              {searchResults.notebooks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-indigo-700" />
                      <span>SỔ TAY ({searchResults.notebooks.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.notebooks.map((nb) => (
                      <div
                        key={nb.id}
                        onClick={() => handleSelect("notebooks")}
                        className="p-2 bg-white hover:bg-[#FEF08A]/30 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-5 h-5 rounded border border-[#262626] flex items-center justify-center shrink-0"
                            style={{ backgroundColor: nb.color || "#FEF08A" }}
                          >
                            <DynamicIcon name={nb.icon} size={11} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#1C1917] truncate">{nb.name}</p>
                            {nb.description && (
                              <p className="text-[10px] text-[#78716C] truncate">{nb.description}</p>
                            )}
                          </div>
                        </div>
                        <ArrowRight size={12} className="text-[#78716C] shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Thẻ Ý Tưởng (Sticky Notes) */}
              {searchResults.notes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-amber-600" />
                      <span>Ý TƯỞNG & GHI CHÚ ({searchResults.notes.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.notes.map((sn) => (
                      <div
                        key={sn.id}
                        onClick={() => handleSelect("braindump")}
                        className="p-2 bg-white hover:bg-[#FEF08A]/30 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                      >
                        <p className="text-xs text-[#1C1917] truncate flex-1 min-w-0 font-hand leading-tight">
                          {sn.content}
                        </p>
                        <span
                          className="w-3 h-3 rounded-full border border-[#262626] shrink-0"
                          style={{ backgroundColor: sn.color }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Thói Quen (Habits) */}
              {searchResults.habits.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
                    <span className="flex items-center gap-1.5">
                      <Flame size={13} className="text-orange-600" />
                      <span>THÓI QUEN ({searchResults.habits.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.habits.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleSelect("review")}
                        className="p-2 bg-white hover:bg-[#FEF08A]/30 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                      >
                        <p className="text-xs font-bold text-[#1C1917] truncate flex-1">{h.name}</p>
                        <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-1.5 py-0.2 rounded border border-orange-300">
                          Streak: {h.streak || 0} ngày
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Hint */}
        <div className="pt-2 border-t-[1.5px] border-[#262626] flex items-center justify-between text-[10px] text-[#78716C] bg-[#FBF9F4] shrink-0">
          <span>Nhấn ESC để đóng</span>
          <span>Click vào mục để mở nhanh ➔</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
