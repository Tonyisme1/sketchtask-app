import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { JournalEntryDto, TabKey } from "../../../types";
import type { JournalScreenModel } from "../../../features/journal/model/types";
import { JournalEntryCard } from "./JournalEntryCard";
import { getLocalTodayStr, parseDateString, formatDateString } from "../../../utils/date";
import { getTaskEffectiveDate } from "../../../utils/taskSemantics";
import { isNativePlatform } from "../../../services/notificationService";
import { DatePickerPopover } from "../../ui/pickers/time/DatePickerPopover";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
  BookOpen,
} from "lucide-react";

export interface JournalBookProps {
  model: JournalScreenModel;
  initialDate?: string;
  initialEntryId?: string;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

const formatVietnameseDate = (dateStr: string) => {
  const dateObj = parseDateString(dateStr);
  const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const dayName = weekdays[dateObj.getDay()];
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return {
    shortDateStr: `${dd}/${mm}`,
    fullDateStr: `${dd}/${mm}/${yyyy}`,
    titleStr: `${dayName}, ${dd}/${mm}/${yyyy}`,
  };
};

const getOffsetDateStr = (baseDateStr: string, offsetDays: number) => {
  const dateObj = parseDateString(baseDateStr);
  dateObj.setDate(dateObj.getDate() + offsetDays);
  return formatDateString(dateObj);
};

const getNowTimeStr = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

export const JournalBook: React.FC<JournalBookProps> = ({
  model,
  initialDate,
  initialEntryId,
  onClearNavigationTarget,
}) => {
  const {
    entries: journalEntries,
    tasks,
    journalPromptTask,
    isBookOpen: isJournalBookOpen,
    isMobile,
    actions,
  } = model;
  const {
    addEntry: addJournalEntry,
    deleteEntry: deleteJournalEntry,
    setJournalPromptTask,
    setBookOpen: setIsJournalBookOpen,
  } = actions;
  const todayStr = getLocalTodayStr();
  const [selectedDate, setSelectedDate] = useState(initialDate || todayStr);
  const [focusedEntryId, setFocusedEntryId] = useState<string | null>(null);
  const isBookOpen = isJournalBookOpen || Boolean(initialDate || initialEntryId);

  useEffect(() => {
    if (initialEntryId) {
      const entry = journalEntries.find((item) => item.id === initialEntryId);
      if (entry) {
        setSelectedDate(entry.date);
        setFocusedEntryId(entry.id);
        setIsJournalBookOpen(true);
      }
      onClearNavigationTarget?.();
    } else if (initialDate) {
      setSelectedDate(initialDate);
      setIsJournalBookOpen(true);
      onClearNavigationTarget?.();
    }
  }, [initialDate, initialEntryId, journalEntries, onClearNavigationTarget, setIsJournalBookOpen]);

  useEffect(() => {
    if (!journalPromptTask) return;
    setSelectedDate(todayStr);
    setIsJournalBookOpen(true);
    const created = addJournalEntry({
      date: todayStr,
      time: getNowTimeStr(),
      content: `Đã hoàn thành: ${journalPromptTask.title}`,
      linkedTaskId: journalPromptTask.id,
    });
    setFocusedEntryId(created.id);
    setJournalPromptTask(null);
  }, [addJournalEntry, journalPromptTask, setIsJournalBookOpen, setJournalPromptTask, todayStr]);

  const dateInfo = formatVietnameseDate(selectedDate);
  const isToday = selectedDate === todayStr;
  const currentDayEntries = useMemo(
    () => journalEntries.filter((entry) => entry.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [journalEntries, selectedDate],
  );
  const dayCompletedTasks = useMemo(
    () => tasks.filter((task) => task.completed && getTaskEffectiveDate(task) === selectedDate),
    [selectedDate, tasks],
  );
  const recentDates = useMemo(
    () => Array.from(new Set(journalEntries.map((entry) => entry.date))).sort((a, b) => b.localeCompare(a)).slice(0, 3),
    [journalEntries],
  );

  const handlePrevDay = useCallback(() => setSelectedDate((date) => getOffsetDateStr(date, -1)), []);
  const handleNextDay = useCallback(() => setSelectedDate((date) => getOffsetDateStr(date, 1)), []);
  const handleGoToToday = useCallback(() => setSelectedDate(todayStr), [todayStr]);

  useEffect(() => {
    if (!isBookOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA" || activeElement?.isContentEditable) return;
      if (event.key === "ArrowLeft") handlePrevDay();
      if (event.key === "ArrowRight") handleNextDay();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNextDay, handlePrevDay, isBookOpen]);

  const handleAddNewEntry = (content = "", linkedTaskId?: string) => {
    setIsJournalBookOpen(true);
    const created = addJournalEntry({
      date: selectedDate,
      time: getNowTimeStr(),
      content,
      linkedTaskId,
    });
    setFocusedEntryId(created.id);
  };

  useEffect(() => {
    const handleCreateRequest = (event: Event) => {
      if ((event as CustomEvent<{ type?: string }>).detail?.type === "journal") handleAddNewEntry();
    };
    window.addEventListener("sketchtask:create", handleCreateRequest);
    return () => window.removeEventListener("sketchtask:create", handleCreateRequest);
  }, [selectedDate]);

  if (!isBookOpen) {
    return (
      <div className="w-full min-w-0 space-y-4 pb-12 select-none">
        <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF]">
              <BookOpen size={15} strokeWidth={2.2} />
            </div>
            <span className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Nhật ký</span>
          </div>
          <span className="font-mono text-xs text-[#8E8E93] dark:text-[#A1A1A6]">{journalEntries.length} mục</span>
        </div>
        <article className="mx-auto max-w-2xl rounded-3xl bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[#8E8E93] dark:text-[#A1A1A6] font-mono">Nhật ký theo ngày</p>
              <h2 className="mt-1.5 text-xl font-bold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">Nhật ký cá nhân</h2>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-[#8E8E93] dark:text-[#A1A1A6]">Lưu lại suy nghĩ, bài học và những sự kiện đáng nhớ theo từng ngày.</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#AF52DE]/10 text-[#AF52DE] shadow-xs">
              <BookOpen size={24} strokeWidth={2.2} />
            </div>
          </div>
          <div className="pt-4 flex flex-wrap items-center gap-2.5 border-t border-black/[0.04] dark:border-white/[0.06] text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
            <span className="bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1 rounded-full">{journalEntries.length} ghi chép</span>
            <span className="text-[#8E8E93] dark:text-[#A1A1A6]">{recentDates.length} ngày đã viết</span>
            <button
              type="button"
              onClick={() => { setSelectedDate(todayStr); setIsJournalBookOpen(true); }}
              className="ml-auto rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs transition-all cursor-pointer flex items-center gap-1"
            >
              <span>Mở nhật ký</span>
              <ChevronRight size={13} strokeWidth={2.4} />
            </button>
          </div>
          {recentDates.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-2">
              {recentDates.map((date) => {
                const info = formatVietnameseDate(date);
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => { setSelectedDate(date); setIsJournalBookOpen(true); }}
                    className="rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] px-2.5 py-1 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all cursor-pointer"
                  >
                    {info.shortDateStr}
                  </button>
                );
              })}
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 select-none ${isMobile ? "bg-white dark:bg-[#1C1C1E] min-h-screen mobile-panel-enter" : "space-y-4 pb-10"}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2.5 border-b border-black/[0.04] dark:border-white/[0.06] ${isMobile ? `sticky top-0 z-30 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-3.5 sm:px-5 min-h-[52px] ${isNativePlatform() ? "pt-11 pb-2.5" : "pt-[max(env(safe-area-inset-top),8px)] pb-2.5"}` : "pb-3"}`}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsJournalBookOpen(false)}
            className="mobile-back-button flex h-8 items-center gap-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] px-3 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs cursor-pointer transition-all"
            title="Quay lại nhật ký"
            aria-label="Quay lại nhật ký"
          >
            <ArrowLeft size={14} strokeWidth={2.2} />
            <span>Đóng</span>
          </button>
          <div className="flex items-center gap-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
              title="Ngày trước"
            >
              <ChevronLeft size={14} strokeWidth={2.4} />
            </button>
            {!isToday && (
              <button
                type="button"
                onClick={handleGoToToday}
                className="flex h-7 items-center gap-1 rounded-xl bg-[#007AFF] hover:bg-[#0071E3] px-2.5 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
              >
                <RotateCcw size={11} strokeWidth={2.4} />
                <span className="hidden sm:inline">Hôm nay</span>
              </button>
            )}
            <DatePickerPopover value={selectedDate} onChange={(date) => date && setSelectedDate(date)} placeholder="Chọn ngày" align="right" showClear={false} className="min-w-[8rem] sm:min-w-[9.5rem]" />
            <button
              type="button"
              onClick={handleNextDay}
              className="flex h-7 w-7 items-center justify-center rounded-xl text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
              title="Ngày sau"
            >
              <ChevronRight size={14} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      <div className={isMobile ? "space-y-4 px-3.5 py-3.5 pb-28 sm:px-6" : "space-y-4 pt-1"}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.04] dark:border-white/[0.06] pb-2">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF] shadow-2xs">
              <BookOpen size={14} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">{dateInfo.titleStr}</h3>
                {isToday && <span className="rounded-full bg-[#007AFF]/10 text-[#007AFF] dark:bg-[#0A84FF]/20 dark:text-[#0A84FF] px-2 py-0.5 text-[10px] font-semibold">Hôm nay</span>}
              </div>
              <p className="font-mono text-[11px] text-[#8E8E93] dark:text-[#A1A1A6]">{currentDayEntries.length ? `${currentDayEntries.length} mục ghi chép` : "Chưa có dòng nhật ký"}</p>
            </div>
          </div>
          {dayCompletedTasks.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs">
              <CheckCircle2 size={13} strokeWidth={2.4} />
              <span>{dayCompletedTasks.length} việc đã xong</span>
            </div>
          )}
        </div>

        {currentDayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.04] dark:bg-white/[0.08] shadow-xs">
              <Sparkles size={20} className="text-[#007AFF] dark:text-[#0A84FF]" />
            </div>
            <div className="max-w-xs space-y-0.5">
              <p className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Chưa có nhật ký cho ngày này</p>
              <p className="text-xs text-[#8E8E93] dark:text-[#A1A1A6]">Hãy ghi lại cảm nghĩ hoặc sự kiện đáng nhớ.</p>
            </div>
            <button
              type="button"
              onClick={() => handleAddNewEntry()}
              className="flex items-center gap-1.5 rounded-2xl bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-xs cursor-pointer transition-all"
            >
              <Plus size={14} strokeWidth={2.4} />
              <span>Viết dòng đầu tiên</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 py-1">
            {currentDayEntries.map((entry: JournalEntryDto) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                onDelete={deleteJournalEntry}
                isFocused={focusedEntryId === entry.id}
                onAddNewAfter={() => handleAddNewEntry()}
              />
            ))}
            <button
              type="button"
              onClick={() => handleAddNewEntry()}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] px-3 py-2.5 text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] shadow-2xs transition-all cursor-pointer"
            >
              <Plus size={13} strokeWidth={2.2} />
              <span>Thêm dòng ghi chép mới...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
