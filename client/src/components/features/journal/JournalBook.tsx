import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAppStore } from "../../../stores/appStore";
import { JournalEntryDto, TaskDto, NotebookDto } from "../../../types";
import { JournalEntryCard } from "./JournalEntryCard";
import { getLocalTodayStr, parseDateString, formatDateString } from "../../../utils/date";
import { getTaskEffectiveDate } from "../../../utils/taskSemantics";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  NotebookPen,
  X,
  Sparkles,
  Filter,
  BookMarked,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { TabKey } from "../../../types";

export interface JournalBookProps {
  initialDate?: string;
  initialEntryId?: string;
  notebookId?: string;
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
  } = useAppStore();

  const todayStr = getLocalTodayStr();
  const [selectedDate, setSelectedDate] = useState<string>(initialDate || todayStr);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | "none">("none");
  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState<string>(
    propNotebookId || "all"
  );
  const [isNotebookPopoverOpen, setIsNotebookPopoverOpen] = useState(false);
  const [notebookPopoverSearch, setNotebookPopoverSearch] = useState("");
  const notebookPopoverRef = useRef<HTMLDivElement>(null);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);

  const touchStartXRef = useRef<number | null>(null);

  // Đồng bộ propNotebookId nếu truyền từ ngoài (ví dụ từ NotebookDetail)
  useEffect(() => {
    if (propNotebookId) {
      setSelectedNotebookFilter(propNotebookId);
    }
  }, [propNotebookId]);

  // Xử lý navigation target: nếu có initialEntryId thì tìm date của entry đó
  useEffect(() => {
    if (initialEntryId) {
      const entry = journalEntries.find((e) => e.id === initialEntryId);
      if (entry) {
        setSelectedDate(entry.date);
        setFocusedEntryId(entry.id);
      }
    } else if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate, initialEntryId, journalEntries]);

  // Lắng nghe gợi ý viết nhật ký từ promptTask
  useEffect(() => {
    if (journalPromptTask) {
      setSelectedDate(todayStr);
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
  }, [journalPromptTask, todayStr, addJournalEntry, selectedNotebookFilter, setJournalPromptTask]);

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
      // Lọc theo Sổ tay
      if (selectedNotebookFilter === "unassigned") {
        if (entry.notebookId) return false;
      } else if (selectedNotebookFilter !== "all") {
        if (entry.notebookId !== selectedNotebookFilter) return false;
      }

      return true;
    });
  }, [journalEntries, selectedNotebookFilter]);

  // Danh sách tất cả các ngày có nhật ký (sắp xếp giảm dần từ mới nhất đến cũ nhất)
  const availableDates = useMemo(() => {
    const dateSet = new Set<string>();
    dateSet.add(todayStr); // Luôn có ngày hôm nay
    filteredEntries.forEach((e) => dateSet.add(e.date));
    return Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  }, [filteredEntries, todayStr]);

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
    setFlipDirection(targetDate > selectedDate ? "next" : "prev");
    setSelectedDate(targetDate);
  };

  const handlePrevDay = useCallback(() => {
    setFlipDirection("prev");
    setSelectedDate((prev) => getOffsetDateStr(prev, -1));
  }, []);

  const handleNextDay = useCallback(() => {
    setFlipDirection("next");
    setSelectedDate((prev) => getOffsetDateStr(prev, 1));
  }, []);

  const handleGoToToday = useCallback(() => {
    if (selectedDate !== todayStr) {
      setFlipDirection(todayStr > selectedDate ? "next" : "prev");
      setSelectedDate(todayStr);
    }
  }, [selectedDate, todayStr]);

  // Hỗ trợ phím tắt mũi tên trái / phải
  useEffect(() => {
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
  }, [handlePrevDay, handleNextDay]);

  // Thêm nhanh dòng nhật ký
  const handleAddNewEntry = (initialContent: string = "", linkedTaskId?: string) => {
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

  return (
    <div className="space-y-3.5 sm:space-y-4 pb-12 w-full min-w-0 animate-in fade-in duration-150 select-none">
      {/* 1. Header Thanh Công Cụ Nhật Ký: Segmented Tabs + Lọc Sổ */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#262626]">
        {/* Cụm Phải: Segmented Tabs [ Ghi chú | Nhật ký | Sổ tay ] & Nút Lọc Sổ */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {/* 1. Ghi chú */}
          <button
            type="button"
            onClick={() => onNavigateTab?.("notes")}
            className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-white text-[#78716C] hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
          >
            <NotebookPen size={14} strokeWidth={2.4} className="text-emerald-700" />
            <span>Ghi chú</span>
          </button>

          {/* 2. Nhật ký (Active) */}
          <button
            type="button"
            className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-[#DDD6FE] text-[#1C1917] shrink-0"
          >
            <BookOpen size={14} strokeWidth={2.4} className="text-purple-800" />
            <span>Nhật ký</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[3px] border border-[#262626] bg-white text-[#1C1917] leading-none font-bold">
              {filteredEntries.length}
            </span>
          </button>

          {/* 3. Sổ tay */}
          <button
            type="button"
            onClick={() => onNavigateTab?.("notebooks")}
            className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-white text-[#78716C] hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
          >
            <BookMarked size={14} strokeWidth={2.4} className="text-amber-700" />
            <span>Sổ tay</span>
          </button>

          {/* Bộ Lọc Sổ Tay Mở Rộng */}
          {!propNotebookId && (
            <div ref={notebookPopoverRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsNotebookPopoverOpen(!isNotebookPopoverOpen)}
                className={`h-[30px] px-2.5 rounded-[5px] border-[1.5px] border-[#262626] flex items-center gap-1.5 text-xs font-bold transition-all shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer ${
                  selectedNotebookFilter !== "all"
                    ? "bg-[#FEF08A] text-[#1C1917]"
                    : "bg-white text-[#57534E] hover:bg-[#FAF8F3]"
                }`}
              >
                <Filter size={12} strokeWidth={2.4} />
                <span className="max-w-[90px] sm:max-w-[130px] truncate">
                  {selectedNotebookFilter === "all"
                    ? "Sổ tay"
                    : selectedNotebookFilter === "unassigned"
                    ? "Không sổ"
                    : activeNotebookObj?.name || "Sổ"}
                </span>
                <ChevronDown size={11} strokeWidth={2.4} className="text-[#78716C]" />
              </button>

            {isNotebookPopoverOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-1.5 w-64 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[3px_3px_0px_#262626] z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
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
                  {/* Tất cả */}
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

                  {/* Chưa gán sổ */}
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
                      ({journalEntries.filter((j) => !j.notebookId).length})
                    </span>
                  </button>

                  {/* Danh sách các sổ tay */}
                  {filteredNotebooksForPopover.map((nb) => {
                    const count = journalEntries.filter((j) => j.notebookId === nb.id).length;
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
    </div>

      {/* 2. KHUNG CUỐN TẬP NHẬT KÝ (CAROUSEL FLIP BOOK) */}
      <div className="relative max-w-3xl mx-auto">
        {/* Thanh Điều Hướng Lật Trang Giữa Các Ngày */}
        <div className="flex items-center justify-between bg-white border-[1.5px] border-[#262626] rounded-[6px] p-2 shadow-[2px_2px_0px_#262626] mb-3">
          {/* Nút Lùi Ngày (Trang trước) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevDay}
              className="h-8 px-2.5 rounded-[4px] bg-[#FAF8F3] hover:bg-[#FEF08A] border border-[#262626] text-xs font-bold flex items-center gap-1 text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              title="Lùi 1 ngày (Phím ←)"
            >
              <ChevronLeft size={15} strokeWidth={2.4} />
              <span className="hidden sm:inline">Hôm trước</span>
            </button>

            {!isToday && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="h-8 px-2 rounded-[4px] bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1"
                title="Quay về ngày hôm nay"
              >
                <RotateCcw size={12} strokeWidth={2.4} />
                <span>Hôm nay</span>
              </button>
            )}
          </div>

          {/* Tiêu Đề Ngày & Bộ Chọn Ngày */}
          <div className="flex items-center gap-2 text-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) handleGoToDate(e.target.value);
              }}
              className="font-bold text-xs sm:text-sm text-[#1C1917] bg-[#F5F2EA] border border-[#262626] rounded-[4px] px-2 py-1 shadow-[1px_1px_0px_#262626] focus:outline-none cursor-pointer"
            />
          </div>

          {/* Nút Tiến Ngày (Trang sau) + Nút Thêm Dòng */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleAddNewEntry()}
              className="hidden sm:flex h-8 px-2.5 rounded-[4px] bg-[#BBF7D0] hover:bg-[#86EFAC] border border-[#262626] text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer items-center gap-1"
              title="Thêm dòng nhật ký mới cho ngày này"
            >
              <Plus size={14} strokeWidth={2.6} />
              <span>Thêm ghi chép</span>
            </button>

            <button
              type="button"
              onClick={handleNextDay}
              className="h-8 px-2.5 rounded-[4px] bg-[#FAF8F3] hover:bg-[#FEF08A] border border-[#262626] text-xs font-bold flex items-center gap-1 text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              title="Tiến 1 ngày (Phím →)"
            >
              <span className="hidden sm:inline">Hôm sau</span>
              <ChevronRight size={15} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        {/* 3. TRANG SỔ TẬP NHẬT KÝ VỚI VIỀN MỰC & ĐỔ BÓNG CỨNG */}
        <div
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0].clientX;
          }}
          onTouchEnd={(e) => {
            if (touchStartXRef.current === null) return;
            const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
            if (deltaX > 60) {
              handlePrevDay();
            } else if (deltaX < -60) {
              handleNextDay();
            }
            touchStartXRef.current = null;
          }}
          className={`relative bg-[#FFFDF8] border-[2px] border-[#262626] rounded-[8px] shadow-[4px_4px_0px_#262626] p-4 sm:p-6 min-h-[480px] flex flex-col justify-between transition-all duration-200 ${
            flipDirection === "next"
              ? "animate-in slide-in-from-right-3 fade-in duration-200"
              : flipDirection === "prev"
              ? "animate-in slide-in-from-left-3 fade-in duration-200"
              : ""
          }`}
        >
          {/* Header Trang: Gáy xoắn lò xo & Tiêu đề ngày */}
          <div>
            {/* Lỗ Lò Xo / Gáy Sổ */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-dashed border-[#D4CEBF]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[4px] bg-[#DDD6FE] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
                  <BookOpen size={15} strokeWidth={2.4} className="text-purple-950" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
                    {dateInfo.titleStr}
                  </h3>
                  {isToday && (
                    <span className="text-[10px] font-bold text-emerald-800 bg-[#BBF7D0] px-1.5 py-0.2 rounded border border-[#262626]">
                      Hôm nay
                    </span>
                  )}
                </div>
              </div>

              {/* Thống kê nhiệm vụ hoàn thành trong ngày */}
              {dayCompletedTasks.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[#1C1917] bg-[#FEF08A] px-2 py-1 rounded-[4px] border border-[#262626] shadow-[1px_1px_0px_#262626]">
                  <CheckCircle2 size={13} strokeWidth={2.4} className="text-emerald-700" />
                  <span className="font-bold">{dayCompletedTasks.length} việc đã xong</span>
                </div>
              )}
            </div>

            {/* Danh Sách Các Dòng Nhật Ký Trong Ngày */}
            {currentDayEntries.length === 0 ? (
              /* Trạng Thái Rỗng */
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-[#F5F2EA] border-[1.5px] border-[#262626] flex items-center justify-center shadow-[2px_2px_0px_#262626]">
                  <Sparkles size={20} className="text-amber-700" />
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
                  className="px-4 py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] font-bold text-xs text-[#1C1917] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={14} strokeWidth={2.6} />
                  <span>Viết dòng đầu tiên</span>
                </button>
              </div>
            ) : (
              /* Danh Sách Entries */
              <div className="space-y-3 py-2">
                {currentDayEntries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={deleteJournalEntry}
                    isFocused={focusedEntryId === entry.id}
                    onAddNewAfter={() => handleAddNewEntry()}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer Trang: Nút Viết Tiếp & Điều Hướng Nhanh */}
          <div className="pt-4 mt-6 border-t border-[#E7E5E4] flex items-center justify-between text-xs text-[#78716C]">
            <button
              type="button"
              onClick={() => handleAddNewEntry()}
              className="flex items-center gap-1.5 font-bold text-[#1C1917] hover:underline cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.4} />
              <span>Thêm dòng nhật ký</span>
            </button>

            <span className="font-mono text-[11px]">
              Trang ngày: {dateInfo.fullDateStr}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
