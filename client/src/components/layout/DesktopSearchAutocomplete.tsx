import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  X,
  CheckSquare,
  FileText,
  BookOpen,
  BookMarked,
  Clock,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { TabKey, NavigationTarget } from "../../types";
import { loadNotesFromStorage } from "../../utils/noteStorage";
import { getTaskEffectiveDate, getTaskEffectiveTime } from "../../utils/taskSemantics";

interface DesktopSearchAutocompleteProps {
  onNavigateTab: (tab: TabKey, target?: NavigationTarget) => void;
}

export const DesktopSearchAutocomplete: React.FC<DesktopSearchAutocompleteProps> = ({
  onNavigateTab,
}) => {
  const { tasks, notebooks, journalEntries } = useAppStore();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load notes
  const notes = useMemo(() => {
    return loadNotesFromStorage();
  }, [isOpen]);

  // Live filter results
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Khi ô tìm kiếm rỗng: hiển thị các mục gần đây / gợi ý nhanh
      const recentTasks = tasks.filter((t) => !t.completed).slice(0, 4);
      const recentNotes = notes.slice(0, 3);
      const recentJournals = journalEntries.slice(0, 2);
      return {
        isSuggestion: true,
        tasks: recentTasks,
        notes: recentNotes,
        journal: recentJournals,
        notebooks: notebooks.slice(0, 2),
      };
    }

    const matchingTasks = tasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.tag && t.tag.toLowerCase().includes(q))
      )
      .slice(0, 6);

    const matchingNotes = notes
      .filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchingJournal = journalEntries
      .filter(
        (j) =>
          j.content.toLowerCase().includes(q) ||
          j.date.toLowerCase().includes(q) ||
          j.time.toLowerCase().includes(q)
      )
      .slice(0, 3);

    const matchingNotebooks = notebooks
      .filter((nb) => nb.name.toLowerCase().includes(q))
      .slice(0, 3);

    return {
      isSuggestion: false,
      tasks: matchingTasks,
      notes: matchingNotes,
      journal: matchingJournal,
      notebooks: matchingNotebooks,
    };
  }, [query, tasks, notes, journalEntries, notebooks]);

  const totalResults =
    searchResults.tasks.length +
    searchResults.notes.length +
    searchResults.journal.length +
    searchResults.notebooks.length;

  const handleSelectTask = (taskId: string, date?: string) => {
    onNavigateTab("today", { taskId, date });
    setIsOpen(false);
  };

  const handleSelectNote = () => {
    onNavigateTab("notes");
    setIsOpen(false);
  };

  const handleSelectJournal = () => {
    onNavigateTab("journal");
    setIsOpen(false);
  };

  const handleSelectNotebook = () => {
    onNavigateTab("notebooks");
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md lg:max-w-lg mx-3 select-none">
      {/* Search Input Box */}
      <div
        className={`flex items-center justify-between px-3 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] transition-all ${
          isOpen ? "ring-2 ring-[#1C1917] bg-[#FFFDF8]" : "hover:bg-[#FFFDF8]"
        }`}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <Search size={15} strokeWidth={2.4} className="shrink-0 text-[#1C1917]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Tìm kiếm việc, ghi chú, nhật ký... (Ctrl + K)"
            className="w-full bg-transparent text-xs font-semibold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none"
          />
        </div>

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-1 text-[#78716C] hover:text-[#1C1917] cursor-pointer shrink-0"
            title="Xóa"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        ) : (
          <kbd className="font-mono text-[10px] font-bold text-[#78716C] bg-[#FAF8F3] px-1.5 py-0.5 rounded border border-[#D4CEBF] shrink-0 ml-1">
            Ctrl + K
          </kbd>
        )}
      </div>

      {/* DROPDOWN MENU SỔ XUỐNG DƯỚI THANH TÌM KIẾM (Chuẩn ảnh YouTube) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] shadow-[4px_4px_0px_#262626] py-2 z-50 max-h-[380px] overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-top-1 duration-150 divide-y divide-[#E7E5E4]">
          {/* Header gợi ý */}
          <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C]">
            <span>{searchResults.isSuggestion ? "Gợi ý gần đây" : `Kết quả (${totalResults})`}</span>
            <span className="text-[#A8A29E]">ESC để đóng</span>
          </div>

          {totalResults === 0 ? (
            <div className="py-6 text-center text-xs text-[#78716C] font-mono">
              Không tìm thấy kết quả nào cho &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-1 space-y-0.5">
              {/* 1. Công việc (Tasks) */}
              {searchResults.tasks.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-[10px] font-bold font-mono text-[#78716C] uppercase flex items-center gap-1">
                    <CheckSquare size={11} className="text-[#1C1917]" />
                    <span>Việc cần làm</span>
                  </div>
                  {searchResults.tasks.map((task) => {
                    const effectiveDate = getTaskEffectiveDate(task);
                    const effectiveTime = getTaskEffectiveTime(task);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => handleSelectTask(task.id, effectiveDate)}
                        className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#FAF8F3] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {searchResults.isSuggestion ? (
                            <Clock size={13} className="text-[#A8A29E] shrink-0" />
                          ) : (
                            <CheckSquare size={13} className="text-[#1C1917] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">
                              {task.title}
                            </p>
                            {(effectiveDate || effectiveTime) && (
                              <p className="text-[10px] text-[#78716C] font-mono truncate flex items-center gap-1 mt-0.5">
                                {effectiveDate && (
                                  <span className="flex items-center gap-0.5">
                                    <Calendar size={9} /> {effectiveDate}
                                  </span>
                                )}
                                {effectiveTime && <span>• {effectiveTime}</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        <ArrowRight size={12} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. Ghi chú (Notes) */}
              {searchResults.notes.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold font-mono text-[#78716C] uppercase flex items-center gap-1">
                    <FileText size={11} className="text-[#1C1917]" />
                    <span>Ghi chú</span>
                  </div>
                  {searchResults.notes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={handleSelectNote}
                      className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#FAF8F3] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText size={13} className="text-[#1C1917] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">
                            {note.title || "Ghi chú không tên"}
                          </p>
                          <p className="text-[10px] text-[#78716C] truncate mt-0.5">
                            {note.content}
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={12} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* 3. Nhật ký (Journal) */}
              {searchResults.journal.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold font-mono text-[#78716C] uppercase flex items-center gap-1">
                    <BookOpen size={11} className="text-[#1C1917]" />
                    <span>Nhật ký</span>
                  </div>
                  {searchResults.journal.map((journal) => (
                    <button
                      key={journal.id}
                      type="button"
                      onClick={handleSelectJournal}
                      className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#FAF8F3] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookOpen size={13} className="text-[#1C1917] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">
                            Nhật ký ngày {journal.date}
                          </p>
                          <p className="text-[10px] text-[#78716C] truncate mt-0.5">
                            {journal.content}
                          </p>
                        </div>
                      </div>

                      <ArrowRight size={12} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* 4. Sổ tay (Notebooks) */}
              {searchResults.notebooks.length > 0 && (
                <div className="pt-1">
                  <div className="px-3 py-1 text-[10px] font-bold font-mono text-[#78716C] uppercase flex items-center gap-1">
                    <BookMarked size={11} className="text-[#1C1917]" />
                    <span>Sổ tay</span>
                  </div>
                  {searchResults.notebooks.map((nb) => (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={handleSelectNotebook}
                      className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-[#FAF8F3] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <BookMarked size={13} className="text-[#1C1917] shrink-0" />
                        <span className="text-xs font-bold text-[#1C1917] truncate">
                          {nb.name}
                        </span>
                      </div>

                      <ArrowRight size={12} className="text-[#A8A29E] group-hover:text-[#1C1917] shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
