import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { TabKey, TaskDto, NotebookDto, StickyNoteDto, HabitDto } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { DynamicIcon } from "./DynamicIcon";
import { getTaskDueInfo } from "../../utils/taskDueStatus";
import { matchesQuery, HighlightText } from "../../utils/search";
import {
  Search,
  CheckSquare,
  BookOpen,
  Lightbulb,
  Flame,
  ArrowRight,
  X,
  Sparkles,
  History,
  Clock,
  Trash2,
} from "lucide-react";

// ==========================================
// COMPONENT: GlobalSearchModal (Tìm Kiếm Toàn Cục Siêu Tốc 2.0)
// ==========================================

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabKey) => void;
}

type SearchCategory = "all" | "tasks" | "notebooks" | "notes" | "habits";

const RECENT_SEARCHES_KEY = "sketchtask_recent_searches";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { tasks, notebooks, stickyNotes, habits } = useAppStore();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultListRef = useRef<HTMLDivElement>(null);

  // Nạp lịch sử tìm kiếm gần đây
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {
      // Bỏ qua nếu lỗi
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    } else {
      setQuery("");
      setActiveCategory("all");
    }
  }, [isOpen]);

  // Lưu từ khóa vào lịch sử
  const saveSearchTerm = (term: string) => {
    const clean = term.trim();
    if (!clean || clean.length < 2) return;
    try {
      const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Bỏ qua nếu đầy bộ nhớ
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  // Lọc kết quả tìm kiếm tiếng Việt không dấu & đa từ khóa
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return null;

    const matchedTasks = tasks.filter(
      (t) => matchesQuery(t.title, q) || (t.tag && matchesQuery(t.tag, q))
    );

    const matchedNotebooks = notebooks.filter(
      (nb) => matchesQuery(nb.name, q) || (nb.description && matchesQuery(nb.description, q))
    );

    const matchedNotes = stickyNotes.filter((sn) => matchesQuery(sn.content, q));

    const matchedHabits = habits.filter((h) => matchesQuery(h.name, q));

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

  // Danh sách phẳng các kết quả để điều hướng bàn phím
  const flatResults = useMemo(() => {
    if (!searchResults) return [];
    const list: Array<{ type: "task" | "notebook" | "note" | "habit"; data: any; tab: TabKey }> = [];

    if (activeCategory === "all" || activeCategory === "tasks") {
      searchResults.tasks.forEach((t) => list.push({ type: "task", data: t, tab: t.dueDate ? "planner" : "today" }));
    }
    if (activeCategory === "all" || activeCategory === "notebooks") {
      searchResults.notebooks.forEach((nb) => list.push({ type: "notebook", data: nb, tab: "notebooks" }));
    }
    if (activeCategory === "all" || activeCategory === "notes") {
      searchResults.notes.forEach((sn) => list.push({ type: "note", data: sn, tab: "braindump" }));
    }
    if (activeCategory === "all" || activeCategory === "habits") {
      searchResults.habits.forEach((h) => list.push({ type: "habit", data: h, tab: "review" }));
    }
    return list;
  }, [searchResults, activeCategory]);

  const handleSelect = (tab: TabKey, termToSave?: string) => {
    if (termToSave || query) {
      saveSearchTerm(termToSave || query);
    }
    onNavigate(tab);
    onClose();
  };

  // Điều hướng bằng bàn phím ↑ / ↓ / Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatResults.length > 0 ? (prev + 1) % flatResults.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (flatResults.length > 0 ? (prev - 1 + flatResults.length) % flatResults.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flatResults.length > 0 && flatResults[selectedIndex]) {
        const item = flatResults[selectedIndex];
        handleSelect(item.tab);
      }
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(38, 38, 38, 0.70)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        touchAction: "none",
      }}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150 pointer-events-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[22px] sm:rounded-[8px] shadow-[0px_-4px_16px_rgba(0,0,0,0.15)] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col space-y-3 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 z-[1000000] max-h-[88vh] sm:max-h-[85vh] overflow-hidden"
      >
        {/* Grab Handle cho Mobile */}
        <div className="w-12 h-1.5 bg-[#D4CEBF] rounded-full mx-auto sm:hidden shrink-0" />

        {/* Search Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-2.5 w-7 h-7 bg-[#FEF08A] border border-[#262626] rounded-[3px] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Search size={14} className="text-[#1C1917]" strokeWidth={2.5} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Tìm việc, sổ tay, ý tưởng, thói quen..."
              className="w-full pl-12 pr-8 py-2.5 sm:py-2 bg-white border-[1.5px] border-[#262626] rounded-[5px] shadow-[1.5px_1.5px_0px_#262626] text-xs sm:text-sm font-sans text-[#1C1917] placeholder:text-[#78716C] outline-none focus:bg-[#FFFDEB]"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedIndex(0);
                }}
                className="absolute right-2.5 text-[#78716C] hover:text-[#1C1917] p-1"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            title="Đóng tìm kiếm"
            className="px-3 py-2.5 sm:py-2 bg-[#F3EFE6] hover:bg-white border-[1.5px] border-[#262626] rounded-[5px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-y-[0.5px] shrink-0"
          >
            Đóng
          </button>
        </div>

        {/* Category Filter Tabs (Khi có kết quả tìm kiếm) */}
        {searchResults && searchResults.totalCount > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 select-none text-xs border-b border-[#D4CEBF]/60 pb-1.5">
            {[
              { key: "all", label: `Tất cả (${searchResults.totalCount})` },
              { key: "tasks", label: `Việc làm (${searchResults.tasks.length})`, count: searchResults.tasks.length },
              { key: "notebooks", label: `Sổ tay (${searchResults.notebooks.length})`, count: searchResults.notebooks.length },
              { key: "notes", label: `Ý tưởng (${searchResults.notes.length})`, count: searchResults.notes.length },
              { key: "habits", label: `Thói quen (${searchResults.habits.length})`, count: searchResults.habits.length },
            ]
              .filter((cat) => cat.key === "all" || (cat.count && cat.count > 0))
              .map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.key as any);
                    setSelectedIndex(0);
                  }}
                  className={`px-2 py-0.5 rounded-[3px] border text-[11px] font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeCategory === cat.key
                      ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                      : "bg-white text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
          </div>
        )}

        {/* Results Container */}
        <div ref={resultListRef} className="flex-1 overflow-y-auto no-scrollbar py-1.5 space-y-3 pr-0.5">
          {!query.trim() ? (
            /* Trạng thái chưa nhập từ khóa: Hiển thị Lịch sử tìm kiếm & Gợi ý */
            <div className="space-y-3 py-2">
              {recentSearches.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#78716C] px-1">
                    <span className="flex items-center gap-1">
                      <History size={12} />
                      <span>TÌM KIẾM GẦN ĐÂY:</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-[10px] text-rose-600 hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 size={10} />
                      <span>Xóa</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setQuery(term);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-[#FEF08A] border border-[#262626] rounded-[3px] text-xs font-medium text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] transition-all flex items-center gap-1"
                      >
                        <Clock size={10} className="text-[#78716C]" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="py-6 text-center space-y-1.5 text-[#78716C] bg-white/60 border border-dashed border-[#D4CEBF] rounded-[6px] p-3">
                <Sparkles size={22} className="mx-auto text-amber-500 opacity-80" />
                <p className="text-xs font-bold text-[#1C1917]">
                  Tìm kiếm thông minh không dấu
                </p>
                <p className="text-[11px] max-w-xs mx-auto leading-relaxed">
                  Gõ từ khóa có hoặc không có dấu (vd: &quot;tap the duc&quot;, &quot;du an web&quot;) để tìm tức thì.
                </p>
              </div>
            </div>
          ) : searchResults && searchResults.totalCount === 0 ? (
            /* Không tìm thấy kết quả */
            <div className="py-8 text-center space-y-1.5 text-[#78716C] bg-white border border-[#D4CEBF] rounded-[6px] p-4">
              <p className="text-xs font-bold text-[#1C1917]">
                Không tìm thấy kết quả nào cho &quot;{query}&quot;
              </p>
              <p className="text-[11px]">
                Hãy thử kiểm tra lại từ khóa hoặc tìm bằng cụm từ ngắn hơn nhé.
              </p>
            </div>
          ) : searchResults ? (
            /* Danh sách kết quả phân nhóm */
            <div className="space-y-3">
              {/* 1. Công Việc (Tasks) */}
              {(activeCategory === "all" || activeCategory === "tasks") && searchResults.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] px-0.5">
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
                          onClick={() => handleSelect(task.dueDate ? "planner" : "today", query)}
                          className="p-2 bg-white hover:bg-[#FEF08A]/40 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
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
                              <HighlightText text={task.title} query={query} />
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
              {(activeCategory === "all" || activeCategory === "notebooks") && searchResults.notebooks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] px-0.5">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={13} className="text-indigo-700" />
                      <span>SỔ TAY ({searchResults.notebooks.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.notebooks.map((nb) => (
                      <div
                        key={nb.id}
                        onClick={() => handleSelect("notebooks", query)}
                        className="p-2 bg-white hover:bg-[#FEF08A]/40 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-5 h-5 rounded border border-[#262626] flex items-center justify-center shrink-0"
                            style={{ backgroundColor: nb.color || "#FEF08A" }}
                          >
                            <DynamicIcon name={nb.icon} size={11} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#1C1917] truncate">
                              <HighlightText text={nb.name} query={query} />
                            </p>
                            {nb.description && (
                              <p className="text-[10px] text-[#78716C] truncate">
                                <HighlightText text={nb.description} query={query} />
                              </p>
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
              {(activeCategory === "all" || activeCategory === "notes") && searchResults.notes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] px-0.5">
                    <span className="flex items-center gap-1.5">
                      <Lightbulb size={13} className="text-amber-600" />
                      <span>Ý TƯỞNG & GHI CHÚ ({searchResults.notes.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.notes.map((sn) => (
                      <div
                        key={sn.id}
                        onClick={() => handleSelect("braindump", query)}
                        className="p-2 bg-white hover:bg-[#FEF08A]/40 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                      >
                        <p className="text-xs text-[#1C1917] truncate flex-1 min-w-0 font-hand leading-tight">
                          <HighlightText text={sn.content} query={query} />
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
              {(activeCategory === "all" || activeCategory === "habits") && searchResults.habits.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] px-0.5">
                    <span className="flex items-center gap-1.5">
                      <Flame size={13} className="text-orange-600" />
                      <span>THÓI QUEN ({searchResults.habits.length})</span>
                    </span>
                  </div>
                  <div className="space-y-1">
                    {searchResults.habits.map((h) => (
                      <div
                        key={h.id}
                        onClick={() => handleSelect("review", query)}
                        className="p-2 bg-white hover:bg-[#FEF08A]/40 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                      >
                        <p className="text-xs font-bold text-[#1C1917] truncate flex-1">
                          <HighlightText text={h.name} query={query} />
                        </p>
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
        <div className="pt-2 border-t-[1.5px] border-[#262626] flex items-center justify-between text-[10px] text-[#78716C] bg-[#FBF9F4] shrink-0 font-sans">
          <span className="hidden sm:inline">Dùng ↑ ↓ để chọn • Nhấn Enter để mở</span>
          <span className="sm:hidden">Chạm kết quả để mở</span>
          <span className="hidden sm:inline">ESC để đóng</span>
          <span className="sm:hidden">Chạm ngoài để thoát</span>
        </div>
      </div>
    </div>,
    document.body
  );
};
