import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import type { JournalEntryDto, TabKey } from "../../../types";
import { JournalEntryCard } from "./JournalEntryCard";
import { getLocalTodayStr, parseDateString, formatDateString } from "../../../utils/date";
import { getTaskEffectiveDate } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../shared/hooks";
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
  initialDate,
  initialEntryId,
  onClearNavigationTarget,
}) => {
  const {
    journalEntries,
    tasks,
    addJournalEntry,
    deleteJournalEntry,
    journalPromptTask,
    setJournalPromptTask,
    isJournalBookOpen,
    setIsJournalBookOpen,
  } = useAppStore();
  const { isMobile } = useResponsiveLayout();
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
        <div className="flex items-center justify-between gap-2.5 border-b border-[#262626] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-[#1C1917] text-white shadow-[1px_1px_0px_#262626]">
              <BookOpen size={14} strokeWidth={2.4} />
            </div>
            <span className="text-sm font-bold text-[#1C1917] sm:text-base">Nhật ký</span>
          </div>
          <span className="font-mono text-xs text-[#78716C]">{journalEntries.length} mục</span>
        </div>
        <article className="mx-auto max-w-2xl rounded-[8px] border-[1.5px] border-[#262626] bg-[#FFFDF8] p-5 shadow-[3px_3px_0px_#262626]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#78716C]">Nhật ký theo ngày</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-[#1C1917]">Nhật ký cá nhân</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#78716C]">Lưu lại suy nghĩ, bài học và những sự kiện đáng nhớ theo từng ngày.</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[6px] border-[1.5px] border-[#262626] bg-[#FEF08A] text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626]">
              <BookOpen size={20} strokeWidth={2.2} />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#262626]/20 pt-3 text-[11px] font-mono font-bold text-[#1C1917]">
            <span className="border border-[#262626] bg-white px-2 py-0.5 shadow-[1px_1px_0px_#262626]">{journalEntries.length} ghi chép</span>
            <span className="text-[#78716C]">{recentDates.length} ngày đã viết</span>
            <button type="button" onClick={() => { setSelectedDate(todayStr); setIsJournalBookOpen(true); }} className="ml-auto border-[1.5px] border-[#262626] bg-[#1C1917] px-2.5 py-1.5 text-[11px] font-bold text-white shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none">
              Mở nhật ký <ChevronRight size={12} className="ml-0.5 inline" strokeWidth={2.4} />
            </button>
          </div>
          {recentDates.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {recentDates.map((date) => {
                const info = formatVietnameseDate(date);
                return <button key={date} type="button" onClick={() => { setSelectedDate(date); setIsJournalBookOpen(true); }} className="border border-[#262626] bg-white px-1.5 py-1 text-left text-[10px] font-bold text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] hover:bg-[#FEF08A]">{info.shortDateStr}</button>;
              })}
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className={`w-full min-w-0 select-none ${isMobile ? "bg-[#FBF9F4]" : "space-y-3 pb-10"}`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-[#262626]/20 ${isMobile ? `sticky top-0 z-30 bg-[#FBF9F4] px-2 sm:px-3.5 min-h-[50px] ${isNativePlatform() ? "pt-10 pb-2" : "pt-[max(env(safe-area-inset-top),6px)] pb-2"}` : "pb-2"}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setIsJournalBookOpen(false)} className="flex h-8 items-center gap-1 rounded-[4px] border border-[#262626] bg-white px-2 text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]" title="Quay lại nhật ký">
            <ArrowLeft size={13} strokeWidth={2.4} /><span className="hidden sm:inline">Đóng</span>
          </button>
          <div className="flex items-center gap-0.5 rounded-[5px] border-[1.5px] border-[#262626] bg-white p-0.5 shadow-[1.5px_1.5px_0px_#262626]">
            <button type="button" onClick={handlePrevDay} className="flex h-7 w-7 items-center justify-center rounded-[3px] text-[#1C1917] hover:bg-[#F3EFE6]" title="Ngày trước"><ChevronLeft size={14} strokeWidth={2.4} /></button>
            {!isToday && <button type="button" onClick={handleGoToToday} className="flex h-7 items-center gap-1 rounded-[3px] bg-[#1C1917] px-2 text-xs font-bold text-white"><RotateCcw size={11} strokeWidth={2.4} /><span className="hidden sm:inline">Hôm nay</span></button>}
            <DatePickerPopover value={selectedDate} onChange={(date) => date && setSelectedDate(date)} placeholder="Chọn ngày" align="right" showClear={false} className="min-w-[8rem] sm:min-w-[9.5rem]" />
            <button type="button" onClick={handleNextDay} className="flex h-7 w-7 items-center justify-center rounded-[3px] text-[#1C1917] hover:bg-[#F3EFE6]" title="Ngày sau"><ChevronRight size={14} strokeWidth={2.4} /></button>
          </div>
        </div>
      </div>

      <div className={isMobile ? "space-y-3 px-2 py-2 pb-24 sm:px-4" : "space-y-3 pt-1"}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626]/20 pb-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-[#1C1917] text-white shadow-[1px_1px_0px_#262626]"><BookOpen size={13} strokeWidth={2.4} /></div>
            <div><div className="flex items-center gap-2"><h3 className="text-xs sm:text-sm font-bold text-[#1C1917]">{dateInfo.titleStr}</h3>{isToday && <span className="rounded-full border border-[#262626] bg-[#1C1917] px-1.5 py-0.2 text-[9px] font-bold text-white">Hôm nay</span>}</div><p className="font-mono text-[10px] text-[#78716C]">{currentDayEntries.length ? `${currentDayEntries.length} mục ghi chép` : "Chưa có dòng nhật ký"}</p></div>
          </div>
          {dayCompletedTasks.length > 0 && <div className="flex items-center gap-1 rounded-[4px] border border-[#262626] bg-white px-2 py-0.5 text-[11px] text-[#1C1917] shadow-[1px_1px_0px_#262626]"><CheckCircle2 size={12} strokeWidth={2.4} className="text-[#16A34A]" /><span className="font-bold">{dayCompletedTasks.length} việc đã xong</span></div>}
        </div>

        {currentDayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-2.5 py-8 text-center"><div className="flex h-10 w-10 items-center justify-center rounded-full border-[1.5px] border-[#262626] bg-[#FAF8F3] shadow-[1.5px_1.5px_0px_#262626]"><Sparkles size={18} className="text-[#1C1917]" /></div><div className="max-w-xs space-y-0.5"><p className="text-xs font-bold text-[#1C1917]">Chưa có nhật ký cho ngày này</p><p className="text-[11px] text-[#78716C]">Hãy ghi lại cảm nghĩ hoặc sự kiện đáng nhớ.</p></div><button type="button" onClick={() => handleAddNewEntry()} className="flex items-center gap-1.5 rounded-[4px] border-[1.5px] border-[#262626] bg-[#1C1917] px-3.5 py-1.5 text-xs font-bold text-white shadow-[1.5px_1.5px_0px_#262626]"><Plus size={13} strokeWidth={2.6} />Viết dòng đầu tiên</button></div>
        ) : (
          <div className="space-y-2.5 py-0.5">{currentDayEntries.map((entry: JournalEntryDto) => <JournalEntryCard key={entry.id} entry={entry} onDelete={deleteJournalEntry} isFocused={focusedEntryId === entry.id} onAddNewAfter={() => handleAddNewEntry()} />)}<button type="button" onClick={() => handleAddNewEntry()} className="flex w-full items-center justify-center gap-1.5 rounded-[5px] border border-dashed border-[#262626]/40 bg-white/50 px-2.5 py-2 text-xs font-bold text-[#78716C] hover:border-[#262626] hover:bg-white"><Plus size={12} strokeWidth={2.4} />Thêm dòng ghi chép mới...</button></div>
        )}
      </div>
    </div>
  );
};
