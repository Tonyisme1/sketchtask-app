import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { JournalEntryDto, NotebookDto } from "../../../types";
import { JournalEntryCard } from "./JournalEntryCard";
import { getLocalTodayStr, parseDateString, formatDateString } from "../../../utils/date";
import { getTaskEffectiveDate } from "../../../utils/taskSemantics";
import { DatePickerPopover } from "../../ui/pickers/time/DatePickerPopover";
import { DynamicIcon } from "../../ui/core/DynamicIcon";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Sparkles,
  Filter,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { TabKey } from "../../../types";

export interface JournalBookProps {
  initialDate?: string;
  initialEntryId?: string;
  notebookId?: string;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

// Helper định dạng ngày tiếng Việt: "Thứ Sáu, 04/09/2026"
const formatVietnameseDate = (dateStr: string) => {
  const dateObj = parseDateString(dateStr);
  const weekdays = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = weekdays[dateObj.getDay()];
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return {
    dayName,
    shortDateStr: `${dd}/${mm}`,
    fullDateStr: `${dd}/${mm}/${yyyy}`,
    titleStr: `${dayName}, ${dd}/${mm}/${yyyy}`,
  };
};

// Helper tính ngày trước/sau
const getOffsetDateStr = (baseDateStr: string, offsetDays: number): string => {
  const dateObj = parseDateString(baseDateStr);
  dateObj.setDate(dateObj.getDate() + offsetDays);
  return formatDateString(dateObj);
};

// Helper lấy giờ hiện tại HH:mm
const getNowTimeStr = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const JournalBook: React.FC<JournalBookProps> = ({
  initialDate,
  initialEntryId,
  notebookId: propNotebookId,
  onClearNavigationTarget,
  onNavigateTab,
}) => {
  const {
    journalEntries,
    tasks,
    notebooks,
    addJournalEntry,
    deleteJournalEntry,
    journalPromptTask,
    setJournalPromptTask,
    isJournalBookOpen,
    setIsJournalBookOpen,
  } = useAppStore();

  const todayStr = getLocalTodayStr();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const isBookOpen =
    isJournalBookOpen || Boolean(initialDate || initialEntryId || propNotebookId);
  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState<string>(
    propNotebookId || "all"
  );
  const [isNotebookPopoverOpen, setIsNotebookPopoverOpen] = useState(false);
  const [notebookPopoverSearch, setNotebookPopoverSearch] = useState("");
  const notebookPopoverRef = useRef<HTMLDivElement>(null);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);

  // Đồng bộ propNotebookId nếu truyền từ ngoài (ví dụ từ NotebookDetail)
  useEffect(() => {
    if (propNotebookId) {
      setSelectedNotebookFilter(propNotebookId);
      setIsJournalBookOpen(true);
      onClearNavigationTarget?.();
    }
  }, [onClearNavigationTarget, propNotebookId, setIsJournalBookOpen]);

  // Xử lý navigation target: nếu có initialEntryId thì tìm date của entry đó
  useEffect(() => {
    if (initialEntryId) {
      const entry = journalEntries.find((e) => e.id === initialEntryId);
      if (entry) {
        setSelectedDate(entry.date);
        setSelectedNotebookFilter(entry.notebookId || "all");
        setFocusedEntryId(entry.id);
        setIsJournalBookOpen(true);
        onClearNavigationTarget?.();
      }
    } else if (initialDate) {
      setSelectedDate(initialDate);
      setIsJournalBookOpen(true);
      onClearNavigationTarget?.();
    }
  }, [initialDate, initialEntryId, journalEntries, onClearNavigationTarget, setIsJournalBookOpen]);

  // Lắng nghe gợi ý viết nhật ký từ promptTask
  useEffect(() => {
    if (journalPromptTask) {
      setSelectedDate(todayStr);
      setIsJournalBookOpen(true);
      const time = getNowTimeStr();
      const created = addJournalEntry({
        date: todayStr,
        time,
        content: `Đã hoàn thành: ${journalPromptTask.title}`,
        linkedTaskId: journalPromptTask.id,
        notebookId:
          selectedNotebookFilter !== "all" && selectedNotebookFilter !== "unassigned"
            ? selectedNotebookFilter
            : undefined,
      });
      setFocusedEntryId(created.id);
      setJournalPromptTask(null);
    }
  }, [journalPromptTask, todayStr, addJournalEntry, selectedNotebookFilter, setIsJournalBookOpen, setJournalPromptTask]);

  // Đóng notebook popover khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        notebookPopoverRef.current &&
        !notebookPopoverRef.current.contains(e.target as Node)
      ) {
        setIsNotebookPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Lọc journal entries theo sổ tay đã chọn
  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (selectedNotebookFilter === "unassigned") {
        if (entry.notebookId) return false;
      } else if (selectedNotebookFilter !== "all") {
        if (entry.notebookId !== selectedNotebookFilter) return false;
      }
      return true;
    });
  }, [journalEntries, selectedNotebookFilter]);

  // Entries của ngày đang chọn
  const currentDayEntries = useMemo(() => {
    return filteredEntries
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredEntries, selectedDate]);

  // Số task đã hoàn thành trong ngày đang chọn
  const dayCompletedTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.completed && getTaskEffectiveDate(t) === selectedDate
    );
  }, [tasks, selectedDate]);

  const dateInfo = formatVietnameseDate(selectedDate);
  const isToday = selectedDate === todayStr;

  // Handler chuyển ngày
  const handleGoToDate = (targetDate: string) => {
    if (targetDate === selectedDate) return;
    setSelectedDate(targetDate);
  };

  const handlePrevDay = useCallback(() => {
    setSelectedDate((prev) => getOffsetDateStr(prev, -1));
  }, []);

  const handleNextDay = useCallback(() => {
    setSelectedDate((prev) => getOffsetDateStr(prev, 1));
  }, []);

  const handleGoToToday = useCallback(() => {
    if (selectedDate !== todayStr) {
      setSelectedDate(todayStr);
    }
  }, [selectedDate, todayStr]);

  // Hỗ trợ phím tắt mũi tên trái / phải khi đang mở sổ
  useEffect(() => {
    if (!isBookOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (
        activeTag === "input" ||
        activeTag === "textarea" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevDay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextDay();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBookOpen, handlePrevDay, handleNextDay]);

  // Thêm nhanh dòng nhật ký
  const handleAddNewEntry = (initialContent: string = "", linkedTaskId?: string) => {
    setIsJournalBookOpen(true);
    const time = getNowTimeStr();
    const targetNbId =
      selectedNotebookFilter !== "all" && selectedNotebookFilter !== "unassigned"
        ? selectedNotebookFilter
        : undefined;

    const created = addJournalEntry({
      date: selectedDate,
      time,
      content: initialContent,
      linkedTaskId,
      notebookId: targetNbId,
    });
    setFocusedEntryId(created.id);
  };

  useEffect(() => {
    const handleCreateRequest = (event: Event) => {
      const type = (event as CustomEvent<{ type?: string }>).detail?.type;
      if (type === "journal") handleAddNewEntry();
    };

    window.addEventListener("sketchtask:create", handleCreateRequest);
    return () => window.removeEventListener("sketchtask:create", handleCreateRequest);
  }, [selectedDate, selectedNotebookFilter]);

  // Lọc sổ tay trong Popover
  const filteredNotebooksForPopover = useMemo(() => {
    if (!notebookPopoverSearch.trim()) return notebooks;
    const q = notebookPopoverSearch.toLowerCase();
    return notebooks.filter((nb) => nb.name.toLowerCase().includes(q));
  }, [notebooks, notebookPopoverSearch]);

  const activeNotebookObj = notebooks.find((nb) => nb.id === selectedNotebookFilter);

  // Tạo dữ liệu bìa cho từng sổ thay vì dồn tất cả nhật ký vào một cuốn chung.
  const journalBookSummaries = useMemo(() => {
    const notebookBooks: Array<{
      filterId: string;
      notebook: NotebookDto | null;
      entries: JournalEntryDto[];
      dates: string[];
    }> = notebooks.map((notebook) => {
      const entries = journalEntries.filter((entry) => entry.notebookId === notebook.id);
      const dates = Array.from(new Set(entries.map((entry) => entry.date))).sort((a, b) =>
        b.localeCompare(a)
      );

      return {
        filterId: notebook.id,
        notebook,
        entries,
        dates,
      };
    });

    const unassignedEntries = journalEntries.filter((entry) => !entry.notebookId);
    if (unassignedEntries.length > 0 || selectedNotebookFilter === "unassigned") {
      notebookBooks.push({
        filterId: "unassigned",
        notebook: null,
        entries: unassignedEntries,
        dates: Array.from(new Set(unassignedEntries.map((entry) => entry.date))).sort((a, b) =>
          b.localeCompare(a)
        ),
      });
    }

    if (selectedNotebookFilter === "all") return notebookBooks;
    return notebookBooks.filter((book) => book.filterId === selectedNotebookFilter);
  }, [journalEntries, notebooks, selectedNotebookFilter]);

  const openJournalBook = useCallback((filterId: string, date?: string) => {
    setSelectedNotebookFilter(filterId);
    if (date) setSelectedDate(date);
    setIsJournalBookOpen(true);
  }, [setIsJournalBookOpen]);

  // =========================================================================
  // VIEW 1: TRƯỚC KHI MỞ SỔ (BÌA SỔ NHẬT KÝ Ở NGOÀI)
  // =========================================================================
  if (!isBookOpen) {
    return (
      <div className="space-y-4 pb-12 w-full min-w-0 animate-in fade-in duration-150 select-none">
        {/* Top Header: Thanh công cụ tiêu đề & Bộ lọc sổ */}
        <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-[#1C1917] text-white border-[1.5px] border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <BookOpen size={14} strokeWidth={2.4} />
            </div>
            <span className="font-bold text-sm sm:text-base text-[#1C1917]">
              Sổ Nhật Ký
            </span>
          </div>

          {!propNotebookId && (
            <div ref={notebookPopoverRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsNotebookPopoverOpen(!isNotebookPopoverOpen)}
                className={`h-[30px] px-2.5 rounded-[5px] border-[1.5px] border-[#262626] flex items-center gap-1.5 text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer ${
                  selectedNotebookFilter !== "all"
                    ? "bg-[#1C1917] text-white"
                    : "bg-white text-[#57534E] hover:bg-[#FAF8F3]"
                }`}
              >
                <Filter size={12} strokeWidth={2.4} />
                <span className="max-w-[120px] sm:max-w-[180px] truncate">
                  {selectedNotebookFilter === "all"
                    ? `Tất cả sổ (${journalEntries.length})`
                    : selectedNotebookFilter === "unassigned"
                    ? `Không sổ (${journalEntries.filter((e) => !e.notebookId).length})`
                    : `${activeNotebookObj?.name || "Sổ"} (${filteredEntries.length})`}
                </span>
                <ChevronDown size={11} strokeWidth={2.4} className="text-[#78716C]" />
              </button>

              {isNotebookPopoverOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[3px_3px_0px_#262626] z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-1 border-b border-[#E7E5E4]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] font-mono">
                      Lọc nhật ký theo sổ
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNotebookPopoverOpen(false)}
                      className="text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                    >
                      <X size={12} strokeWidth={2.4} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={notebookPopoverSearch}
                    onChange={(e) => setNotebookPopoverSearch(e.target.value)}
                    placeholder="Tìm sổ tay..."
                    className="w-full h-7 px-2 bg-white border border-[#262626] rounded-[4px] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none"
                  />

                  <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNotebookFilter("all");
                        setIsNotebookPopoverOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedNotebookFilter === "all"
                          ? "bg-[#FEF08A] font-bold border border-[#262626]"
                          : "hover:bg-[#FAF8F3] text-[#1C1917]"
                      }`}
                    >
                      <span>Tất cả</span>
                      <span className="font-mono text-[10px] text-[#78716C]">
                        ({journalEntries.length})
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedNotebookFilter("unassigned");
                        setIsNotebookPopoverOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        selectedNotebookFilter === "unassigned"
                          ? "bg-[#E7E5E4] font-bold border border-[#262626]"
                          : "hover:bg-[#FAF8F3] text-[#1C1917]"
                      }`}
                    >
                      <span>Không sổ</span>
                      <span className="font-mono text-[10px] text-[#78716C]">
                        ({journalEntries.filter((e) => !e.notebookId).length})
                      </span>
                    </button>

                    {filteredNotebooksForPopover.map((nb) => {
                      const count = journalEntries.filter((e) => e.notebookId === nb.id).length;
                      const isSelected = selectedNotebookFilter === nb.id;
                      return (
                        <button
                          key={nb.id}
                          type="button"
                          onClick={() => {
                            setSelectedNotebookFilter(nb.id);
                            setIsNotebookPopoverOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? "font-bold border border-[#262626]"
                              : "hover:bg-[#FAF8F3] text-[#1C1917]"
                          }`}
                          style={{
                            backgroundColor: isSelected ? nb.color || "#DDD6FE" : undefined,
                          }}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-[2px] border border-[#262626] shrink-0"
                              style={{ backgroundColor: nb.color || "#DDD6FE" }}
                            />
                            <span className="truncate">{nb.name}</span>
                          </div>
                          <span className="font-mono text-[10px] text-[#78716C]">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Danh sách bìa: mỗi sổ tay có một khu vực nhật ký riêng */}
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 xl:grid-cols-3">
          {journalBookSummaries.map((book) => {
            const accent = book.notebook?.color || "#1C1917";
            const latestDate = book.dates[0];
            const title = book.notebook?.name || "Nhật ký chung";
            const description =
              book.notebook?.description ||
              (book.entries.length > 0
                ? "Các ghi chép chưa gán vào sổ tay cụ thể."
                : "Nơi lưu các ghi chép chưa phân loại.");

            const openBook = () => openJournalBook(book.filterId, latestDate || todayStr);

            return (
              <article
                key={book.filterId}
                role="button"
                tabIndex={0}
                onClick={openBook}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openBook();
                  }
                }}
                className={`group relative cursor-pointer bg-[#FFFDF8] border-[1.5px] border-[#262626] border-l-[8px] rounded-[8px] p-4 shadow-[3px_3px_0px_#262626] hover:shadow-[5px_5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 ${
                  selectedNotebookFilter === book.filterId ? "ring-2 ring-[#262626]/20" : ""
                }`}
                style={{ borderLeftColor: accent }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-2">
                    <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#78716C]">
                      <BookOpen size={12} strokeWidth={2.4} />
                      <span>{book.notebook ? "Sổ tay" : "Sổ chung"}</span>
                    </div>
                    <h2 className="truncate text-lg font-black tracking-tight text-[#1C1917]">
                      {title}
                    </h2>
                    <p className="line-clamp-2 min-h-[2.25rem] text-xs leading-relaxed text-[#78716C]">
                      {description}
                    </p>
                  </div>

                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-[#262626] text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]"
                    style={{ backgroundColor: book.notebook?.color || "#FAF8F3" }}
                  >
                    <DynamicIcon
                      name={book.notebook?.icon || "lucide:BookOpen"}
                      size={19}
                      strokeWidth={2.2}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 border-t border-[#262626]/20 pt-3 text-[11px] font-mono font-bold text-[#1C1917]">
                  <span className="border border-[#262626] bg-white px-2 py-0.5 shadow-[1px_1px_0px_#262626]">
                    {book.entries.length} ghi chép
                  </span>
                  <span className="text-[#78716C]">{book.dates.length} ngày đã viết</span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap gap-1">
                    {book.dates.slice(0, 3).map((date) => {
                      const dateInfo = formatVietnameseDate(date);
                      const dayCount = book.entries.filter((entry) => entry.date === date).length;
                      return (
                        <button
                          key={date}
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openJournalBook(book.filterId, date);
                          }}
                          className="border border-[#262626] bg-white px-1.5 py-1 text-left text-[10px] font-bold text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] hover:bg-[#FEF08A] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                          title={`Mở ngày ${dateInfo.fullDateStr}`}
                        >
                          {dateInfo.shortDateStr} · {dayCount}
                        </button>
                      );
                    })}
                    {book.dates.length === 0 && (
                      <span className="py-1 text-[10px] text-[#A8A29E]">Chưa có ngày ghi</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openBook();
                    }}
                    className="shrink-0 border-[1.5px] border-[#262626] bg-[#1C1917] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-[1.5px_1.5px_0px_#262626] transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                  >
                    Mở sổ <ChevronRight size={12} className="ml-0.5 inline" strokeWidth={2.4} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        {journalBookSummaries.length === 0 && (
          <div className="border-[1.5px] border-dashed border-[#262626] bg-white p-8 text-center text-sm text-[#78716C]">
            Không tìm thấy sổ nhật ký phù hợp.
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: TRONG SỔ (KHÔNG KHUNG HỘP GÒ BÓ, CÓ MŨI TÊN QUAY LẠI BÌA NGOÀI)
  // =========================================================================
  return (
    <div className="space-y-3.5 sm:space-y-4 pb-12 w-full min-w-0 animate-in fade-in duration-150 select-none">
      {/* 1. Thanh Công Cụ Trên Đầu: Mũi tên quay ra ngoài + Bộ điều hướng ngày */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#262626] flex-wrap select-none">
        {/* Nút mũi tên đóng sổ / ra ngoài */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsJournalBookOpen(false)}
            className="h-8 px-2.5 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[5px] text-xs font-bold text-[#1C1917] flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            title="Quay lại bìa sổ"
          >
            <ArrowLeft size={14} strokeWidth={2.4} />
            <span className="hidden sm:inline">Đóng sổ</span>
          </button>

          {/* Điều hướng lùi/tiến ngày */}
          <div className="flex items-center gap-1 bg-white border-[1.5px] border-[#262626] rounded-[5px] p-0.5 shadow-[1.5px_1.5px_0px_#262626]">
            <button
              type="button"
              onClick={handlePrevDay}
              className="h-7 w-7 rounded-[3px] bg-[#FCFBF9] hover:bg-[#F3EFE6] flex items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
              title="Hôm trước (Phím ←)"
            >
              <ChevronLeft size={14} strokeWidth={2.4} />
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="h-7 px-2 rounded-[3px] bg-[#1C1917] hover:bg-[#262626] text-xs font-bold text-white shadow-[0.5px_0.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer flex items-center gap-1"
                title="Quay về ngày hôm nay"
              >
                <RotateCcw size={11} strokeWidth={2.4} />
                <span className="hidden sm:inline">Hôm nay</span>
              </button>
            )}

            <DatePickerPopover
              value={selectedDate}
              onChange={(dateStr) => {
                if (dateStr) handleGoToDate(dateStr);
              }}
              placeholder="Chọn ngày"
              align="right"
              showClear={false}
              className="min-w-[8.5rem] sm:min-w-[10rem]"
            />

            <button
              type="button"
              onClick={handleNextDay}
              className="h-7 w-7 rounded-[3px] bg-[#FCFBF9] hover:bg-[#F3EFE6] flex items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all cursor-pointer"
              title="Hôm sau (Phím →)"
            >
              <ChevronRight size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* Nút Thêm ghi chép */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleAddNewEntry()}
            className="h-8 px-3 rounded-[4px] bg-[#1C1917] hover:bg-[#262626] border border-[#262626] text-xs font-bold text-white shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} strokeWidth={2.6} />
            <span>Thêm ghi chép</span>
          </button>
        </div>
      </div>

      {/* 2. Nội Dung Nhật Ký (Thoáng đãng trực tiếp trên nền giấy, không khung bao) */}
      <div className="space-y-4 pt-1">
        {/* Header Ngày */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-[#1C1917] border-[1.5px] border-[#262626] flex items-center justify-center text-white shadow-[1px_1px_0px_#262626]">
              <BookOpen size={14} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
                  {dateInfo.titleStr}
                </h3>
                {isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.2 bg-[#1C1917] text-white border border-[#262626] rounded-full">
                    Hôm nay
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#78716C] font-mono">
                {currentDayEntries.length > 0
                  ? `${currentDayEntries.length} mục ghi chép trong ngày`
                  : "Chưa có dòng nhật ký nào"}
              </p>
            </div>
          </div>

          {dayCompletedTasks.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-[#1C1917] bg-white px-2.5 py-1 rounded-[4px] border border-[#262626] shadow-[1px_1px_0px_#262626]">
              <CheckCircle2 size={13} strokeWidth={2.4} className="text-[#16A34A]" />
              <span className="font-bold">{dayCompletedTasks.length} việc đã xong</span>
            </div>
          )}
        </div>

        {/* Danh Sách Các Dòng Nhật Ký */}
        {currentDayEntries.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F3] border-[1.5px] border-[#262626] flex items-center justify-center shadow-[2px_2px_0px_#262626]">
              <Sparkles size={20} className="text-[#1C1917]" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-bold text-sm text-[#1C1917]">
                Chưa có nhật ký cho ngày này
              </p>
              <p className="text-xs text-[#78716C]">
                Hãy ghi lại cảm nghĩ, bài học hoặc sự kiện đáng nhớ hôm nay.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAddNewEntry()}
              className="px-4 py-2 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[4px] font-bold text-xs text-white shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} strokeWidth={2.6} />
              <span>Viết dòng đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            {currentDayEntries.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={deleteJournalEntry}
                isFocused={focusedEntryId === entry.id}
                onAddNewAfter={() => handleAddNewEntry()}
              />
            ))}

            {/* Nút viết tiếp nhanh */}
            <button
              type="button"
              onClick={() => handleAddNewEntry()}
              className="w-full py-2.5 px-3 border border-dashed border-[#262626]/40 hover:border-[#262626] rounded-[6px] text-xs font-bold text-[#78716C] hover:text-[#1C1917] bg-white/50 hover:bg-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
            >
              <Plus size={13} strokeWidth={2.4} />
              <span>Thêm dòng ghi chép mới...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
