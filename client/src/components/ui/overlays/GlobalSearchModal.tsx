import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ArrowLeft, X, CheckSquare, FileText, BookOpen, Clock, Calendar, ArrowRight } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { NavigationTarget, TaskDto, TabKey } from "../../../types";
import { loadNotesFromStorage } from "../../../utils/noteStorage";
import { getTaskEffectiveDate, getTaskEffectiveTime, getTaskItemType } from "../../../utils/taskSemantics";
import { matchesQuery, stripHtmlText } from "../../../utils/search";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { registerBackHandler } from "../../../utils/backNavigation";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: TabKey, target?: NavigationTarget) => void;
  onSelectTask?: (task: TaskDto) => void;
}

type SearchFilterType = "all" | "tasks" | "events" | "notes" | "journal";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectTask,
}) => {
  const { tasks, journalEntries, toggleTask } = useAppStore();
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<SearchFilterType>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useScrollLock(isVisible, { mobileStrategy: "overflow" });

  // Search is an overlay, so Back closes it before changing the current tab.
  useEffect(() => {
    if (!isVisible) return;
    return registerBackHandler(() => {
      onCloseRef.current();
      return true;
    });
  }, [isVisible]);

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
  }, [isOpen, query]);

  // Search Results
  const searchResults = useMemo(() => {
    const q = query.trim();
    if (!q) return { tasks: [], events: [], notes: [], journal: [] };

    const matchingItems = tasks.filter(
      (t) =>
        matchesQuery(
          [t.title, t.description, t.tag]
            .filter(Boolean)
            .join(" "),
          q,
        )
    );
    const matchingEvents = matchingItems.filter((task) => getTaskItemType(task) === "event");
    const matchingTasks = matchingItems.filter((task) => getTaskItemType(task) !== "event");

    const matchingNotes = notes.filter(
      (n) =>
        matchesQuery(`${n.title} ${stripHtmlText(n.content)}`, q)
    );

    const matchingJournal = journalEntries.filter(
      (j) =>
        matchesQuery(`${j.content} ${j.date} ${j.time}`, q)
    );

    return {
      tasks: matchingTasks,
      events: matchingEvents,
      notes: matchingNotes,
      journal: matchingJournal,
    };
  }, [query, tasks, notes, journalEntries]);

  const totalMatches =
    (filterType === "all" || filterType === "tasks" ? searchResults.tasks.length : 0) +
    (filterType === "all" || filterType === "events" ? searchResults.events.length : 0) +
    (filterType === "all" || filterType === "notes" ? searchResults.notes.length : 0) +
    (filterType === "all" || filterType === "journal" ? searchResults.journal.length : 0);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center sm:p-6 bg-[var(--bg-surface)] sm:bg-black/50 select-none"
      onClick={onClose}
    >
      <div
        className={`relative w-full h-full sm:h-auto sm:max-w-xl bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] sm:rounded-3xl shadow-none sm:shadow-2xl px-3 sm:px-6 pt-[max(env(safe-area-inset-top),12px)] sm:pt-6 pb-4 sm:pb-6 space-y-3 sm:space-y-4 flex flex-col ${isClosing ? "mobile-panel-exit" : "mobile-panel-enter"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Search Input with Back Arrow */}
        <div className="flex items-center gap-2 pb-2.5 pt-2 sm:pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl text-[var(--text-main)] hover:bg-black/10 dark:hover:bg-white/10 active:scale-95 cursor-pointer shrink-0 transition-all"
            title="Quay lại"
          >
            <ArrowLeft size={17} strokeWidth={2.4} />
          </button>
          <div className="relative flex-1">
            <Search
              size={18}
              strokeWidth={2.4}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C] dark:text-[#8E8E93]"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm mọi thứ..."
              className="w-full pl-10 pr-9 h-10 bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl text-sm font-medium text-[var(--text-main)] placeholder:text-[#A8A29E] dark:placeholder:text-[#71717A] shadow-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]/30 transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917] dark:hover:text-white p-1 cursor-pointer"
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
              { key: "events", label: `Sự kiện (${searchResults.events.length})` },
              { key: "notes", label: `Ghi chú (${searchResults.notes.length})` },
              { key: "journal", label: `Nhật ký (${searchResults.journal.length})` },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilterType(item.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                filterType === item.key
                  ? "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] shadow-xs"
                  : "bg-white dark:bg-[#2C2C2E] text-[#78716C] dark:text-[#A1A1AA] hover:bg-black/5 dark:hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-0 sm:max-h-[50vh]">
          {!query.trim() ? (
            <div className="text-center py-8 text-[#78716C] dark:text-[#8E8E93] space-y-1">
              <Search size={28} className="mx-auto opacity-40" />
              <p className="text-xs font-mono font-medium">Nhập từ khóa để tra cứu toàn bộ ứng dụng</p>
            </div>
          ) : totalMatches === 0 ? (
            <div className="text-center py-8 text-[#78716C] dark:text-[#8E8E93] space-y-1">
              <p className="text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7]">Không tìm thấy kết quả</p>
              <p className="text-xs font-mono">Thử tìm bằng từ khóa hoặc tên thẻ khác xem sao</p>
            </div>
          ) : (
            <>
              {/* 1. Tasks Results */}
              {(filterType === "all" || filterType === "tasks") && searchResults.tasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-[#1C1917] dark:text-[#F2F2F7] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={13} className="text-[#1C1917] dark:text-white" />
                    <span>Công việc ({searchResults.tasks.length})</span>
                  </div>
                  {searchResults.tasks.map((task) => {
                    const effectiveDate = getTaskEffectiveDate(task);
                    const effectiveTime = getTaskEffectiveTime(task);
                    return (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (onSelectTask) onSelectTask(task);
                          if (onNavigateTab) {
                            onNavigateTab("tasks", { taskId: task.id, date: effectiveDate });
                          }
                          onClose();
                        }}
                        className="bg-[#F5F7FA] dark:bg-[#12161B] rounded-2xl p-3 shadow-xs hover:bg-[#EEF2F6] dark:hover:bg-[#181C22] border border-black/[0.04] dark:border-white/[0.04] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={task.completed}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id);
                            }}
                            className="w-4 h-4 rounded-full border-none accent-[#1C1917] cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-bold truncate leading-tight ${
                                task.completed ? "line-through text-[#78716C] dark:text-[#8E8E93]" : "text-[#1C1917] dark:text-[#F2F2F7]"
                              }`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#78716C] dark:text-[#8E8E93] font-mono truncate">
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
                        <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] dark:group-hover:text-white shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 2. Events Results */}
              {(filterType === "all" || filterType === "events") && searchResults.events.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[#1C1917] dark:text-[#F2F2F7] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={13} className="text-[var(--accent-blue)]" />
                    <span>Sự kiện ({searchResults.events.length})</span>
                  </div>
                  {searchResults.events.map((event) => {
                    const effectiveDate = getTaskEffectiveDate(event);
                    const effectiveTime = getTaskEffectiveTime(event);
                    return (
                      <div
                        key={event.id}
                        onClick={() => {
                          if (onSelectTask) onSelectTask(event);
                          if (onNavigateTab) {
                            onNavigateTab("events", { taskId: event.id, date: effectiveDate });
                          }
                          onClose();
                        }}
                        className="bg-[#F5F7FA] dark:bg-[#12161B] rounded-2xl p-3 shadow-xs hover:bg-[#EEF2F6] dark:hover:bg-[#181C22] border border-black/[0.04] dark:border-white/[0.04] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--accent-blue)]"
                            aria-label="Sự kiện"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold truncate leading-tight text-[#1C1917] dark:text-[#F2F2F7]">
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#78716C] dark:text-[#8E8E93] font-mono truncate">
                              {effectiveDate && <span className="flex items-center gap-0.5"><Calendar size={10} /> {effectiveDate}</span>}
                              {effectiveTime && <span className="flex items-center gap-0.5"><Clock size={10} /> {effectiveTime}</span>}
                            </div>
                          </div>
                        </div>
                        <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] dark:group-hover:text-white shrink-0" />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. Notes Results */}
              {(filterType === "all" || filterType === "notes") && searchResults.notes.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[#1C1917] dark:text-[#F2F2F7] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={13} className="text-[#1C1917] dark:text-white" />
                    <span>Ghi chú ({searchResults.notes.length})</span>
                  </div>
                  {searchResults.notes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab("notes", { noteId: note.id });
                        onClose();
                      }}
                      className="bg-[#F5F7FA] dark:bg-[#12161B] rounded-2xl p-3 shadow-xs hover:bg-[#EEF2F6] dark:hover:bg-[#181C22] border border-black/[0.04] dark:border-white/[0.04] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7] truncate">{note.title || "Ghi chú không tên"}</p>
                        <p className="text-[11px] text-[#78716C] dark:text-[#8E8E93] truncate mt-0.5 line-clamp-1">{stripHtmlText(note.content)}</p>
                      </div>
                      <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] dark:group-hover:text-white shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* 4. Journal Results */}
              {(filterType === "all" || filterType === "journal") && searchResults.journal.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-[#1C1917] dark:text-[#F2F2F7] font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#1C1917] dark:text-white" />
                    <span>Nhật ký ({searchResults.journal.length})</span>
                  </div>
                  {searchResults.journal.map((journal) => (
                    <div
                      key={journal.id}
                      onClick={() => {
                        if (onNavigateTab) onNavigateTab("journal", { journalEntryId: journal.id });
                        onClose();
                      }}
                      className="bg-[#F5F7FA] dark:bg-[#12161B] rounded-2xl p-3 shadow-xs hover:bg-[#EEF2F6] dark:hover:bg-[#181C22] border border-black/[0.04] dark:border-white/[0.04] cursor-pointer flex items-center justify-between gap-2 group transition-all"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7] truncate">
                          {`Nhật ký ${journal.date}`}
                        </p>
                        <p className="text-[11px] text-[#78716C] dark:text-[#8E8E93] truncate mt-0.5 line-clamp-1">{journal.content}</p>
                      </div>
                      <ArrowRight size={13} className="text-[#A8A29E] group-hover:text-[#1C1917] dark:group-hover:text-white shrink-0" />
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
