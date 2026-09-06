import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ArrowLeft, X, CheckSquare, FileText, BookOpen, Clock, Calendar, ArrowRight, BookMarked } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { NavigationTarget, TaskDto, TabKey } from "../../../types";
import { loadNotesFromStorage } from "../../../utils/noteStorage";
import { getTaskEffectiveDate, getTaskEffectiveTime } from "../../../utils/taskSemantics";
import { useScrollLock } from "../../../hooks/useScrollLock";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: TabKey, target?: NavigationTarget) => void;
  onSelectTask?: (task: TaskDto) => void;
}

type SearchFilterType = "all" | "tasks" | "notes" | "journal";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectTask,
}) => {
  const { tasks, notebooks, journalEntries, toggleTask } = useAppStore();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<SearchFilterType>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);

  useScrollLock(isVisible);

  // Keep the panel mounted long enough to play the reverse transition.
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
      return;
    }

    if (!isVisible) return;

    setIsClosing(true);
    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setQuery("");
    }, 220);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, isVisible]);

  // Load regular notes
  const notes = useMemo(() => {
    if (!isOpen) return [];
    return loadNotesFromStorage();
  }, [isOpen]);

  // Search Results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { tasks: [], notes: [], journal: [] };

    const matchingTasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tag && t.tag.toLowerCase().includes(q))
    );

    const matchingNotes = notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );

    const matchingJournal = journalEntries.filter(
      (j) =>
        j.content.toLowerCase().includes(q) ||
        j.date.toLowerCase().includes(q) ||
        j.time.toLowerCase().includes(q)
    );

    return {
      tasks: matchingTasks,
      notes: matchingNotes,
      journal: matchingJournal,
    };
  }, [query, tasks, notes, journalEntries]);

  const totalMatches =
    (filterType === "all" || filterType === "tasks" ? searchResults.tasks.length : 0) +
    (filterType === "all" || filterType === "notes" ? searchResults.notes.length : 0) +
    (filterType === "all" || filterType === "journal" ? searchResults.journal.length : 0);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-start justify-center p-0 sm:p-6 bg-black/50 backdrop-blur-[2px] mobile-scrim-enter select-none"
      onClick={onClose}
    >
      <div
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-w-xl bg-[#FBF9F4] border-none sm:border-[2px] sm:border-[#262626] rounded-none sm:rounded-[8px] shadow-none sm:shadow-[4px_4px_0px_#262626] p-3.5 sm:p-5 pt-[max(env(safe-area-inset-top),16px)] sm:pt-5 pb-[max(env(safe-area-inset-bottom),16px)] sm:pb-5 space-y-3.5 sm:my-auto max-h-[100dvh] sm:max-h-[85vh] flex flex-col ${isClosing ? "mobile-panel-exit" : "mobile-panel-enter"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input with Back Arrow */}
        <div className="flex items-center gap-2 pb-2.5 border-b border-[#262626]/20">
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
            title="Quay lại"
          >
            <ArrowLeft size={17} strokeWidth={2.4} />
          </button>
          <div className="relative flex-1">
            <Search
              size={18}
              strokeWidth={2.4}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C]"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm mọi thứ..."
              className="w-full pl-9 pr-9 py-2 bg-white border-[1.5px] border-[#262626] rounded-[6px] text-sm font-medium text-[#1C1917] placeholder:text-[#A8A29E] shadow-[1.5px_1.5px_0px_#262626] focus:outline-none focus:bg-[#FFFDF8]"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] p-1 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={14} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {(
            [
              { key: "all", label: "Tất cả" },
              { key: "tasks", label: `Việc (${searchResults.tasks.length})` },
              { key: "notes", label: `Ghi chú (${searchResults.notes.length})` },
              { key: "journal", label: `Nhật ký (${searchResults.journal.length})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterType(item.key)}
              className={`px-2.5 py-1 rounded-[4px] border text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterType === item.key
                  ? "bg-[#FEF08A] text-[#1C1917] border-[#262626] shadow-[1px_1px_0px_#262626]"
                  : "bg-white text-[#78716C] border-[#D4CEBF] hover:bg-[#FAF8F3]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 sm:max-h-[50vh]">
          {!query.trim() ? (
            <div className="text-center py-8 text-[#78716C] space-y-1">
              <Search size={28} className="mx-auto opacity-40 text-[#78716C]" />
              <p className="text-xs font-mono font-medium">Nhập từ khóa để tra cứu toàn bộ ứng dụng</p>
            </div>
          ) : totalMatches === 0 ? (
            <div className="text-center py-8 text-[#78716C] space-y-1">
              <p className="text-sm font-bold text-[#1C1917]">Không tìm thấy kết quả</p>
              <p className="text-xs font-mono">Thử tìm bằng từ khóa hoặc tên thẻ khác xem sao</p>
            </div>
          ) : (
            <>
              {/* 1. Tasks Results */}
              {(filterType === "all" || filterType === "tasks") && searchResults.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#78716C] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-sky-700" />
                    <span>Công việc ({searchResults.tasks.length})</span>
                  </div>
                  {searchResults.tasks.map((task) => {
                    const notebook = notebooks.find((n) => n.id === task.notebookId);
                    const effectiveDate = getTaskEffectiveDate(task);
                    const effectiveTime = getTaskEffectiveTime(task);
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (onSelectTask) onSelectTask(task);
                          if (onNavigateTab) {
                            onNavigateTab("today", { taskId: task.id, date: effectiveDate });
                          }
                          onClose();
                        }}
                        className="bg-white border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#FFFDF8] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id);
                            }}
                            className="w-4 h-4 rounded border-[#262626] text-amber-500 cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold truncate leading-tight ${
                                task.completed ? "line-through text-[#78716C]" : "text-[#1C1917]"
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#78716C] font-mono truncate">
                              {notebook && (
                                <span className="flex items-center gap-0.5 text-amber-800 font-bold">
                                  <BookMarked size={10} /> {notebook.name}
                                </span>
                              )}
                              {effectiveDate && (
                                <span className="flex items-center gap-0.5">
                                  <Calendar size={10} /> {effectiveDate}
                                </span>
                              )}
                              {effectiveTime && (
                                <span className="flex items-center gap-0.5">
                                  <Clock size={10} /> {effectiveTime}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Notes Results */}
              {(filterType === "all" || filterType === "notes") && searchResults.notes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[#78716C] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-emerald-700" />
                    <span>Ghi chú ({searchResults.notes.length})</span>
                  </div>
                  {searchResults.notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab("notes");
                        onClose();
                      }}
                      className="bg-white border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#FFFDF8] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] truncate">{note.title || "Ghi chú không tên"}</p>
                        <p className="text-[11px] text-[#78716C] truncate mt-0.5 line-clamp-1">{note.content}</p>
                      </div>
                      <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Journal Results */}
              {(filterType === "all" || filterType === "journal") && searchResults.journal.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[#78716C] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={13} className="text-purple-700" />
                    <span>Nhật ký ({searchResults.journal.length})</span>
                  </div>
                  {searchResults.journal.map((journal) => (
                    <div
                      key={journal.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab("journal");
                        onClose();
                      }}
                      className="bg-white border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#FFFDF8] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] truncate">
                          {`Nhật ký ${journal.date}`}
                        </p>
                        <p className="text-[11px] text-[#78716C] truncate mt-0.5 line-clamp-1">{journal.content}</p>
                      </div>
                      <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
