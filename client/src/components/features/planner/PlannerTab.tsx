import React, { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { HandDrawnCheckbox } from "../../ui/HandDrawnCheckbox";
import { Button } from "../../ui/Button";
import { TextInput } from "../../ui/TextInput";
import { EmptyStateDoodle } from "../../ui/EmptyStateDoodle";
import { CustomSelect, SelectOption } from "../../ui/CustomSelect";
import { CustomDuePicker } from "../../ui/CustomDuePicker";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { DynamicIcon } from "../../ui/DynamicIcon";
import { getCardTilt } from "../../../utils/tilt";
import { getTagStyle } from "../../../utils/tagColors";
import { getTaskDueInfo } from "../../../utils/taskDueStatus";
import {
  Calendar as CalendarIcon,
  Sun,
  ArrowRight,
  Clock,
  X,
  Star,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from "lucide-react";

// ==========================================
// COMPONENT: PlannerTab (Kế Hoạch & Task Command Center)
// ==========================================

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const SHORT_DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

import { getLocalTodayStr } from "../../../utils/date";

export const PlannerTab: React.FC = () => {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    moveTaskToToday,
    moveTaskToTomorrow,
    notebooks,
    tags,
    addTag,
    deleteTag,
    hideCompletedTasks,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [isCalendarCollapsed, setIsCalendarCollapsed] = useState<boolean>(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);

  const [dayTaskTitle, setDayTaskTitle] = useState<string>("");
  const [dayTaskTime, setDayTaskTime] = useState<string | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<"high" | "medium" | "low">("medium");
  const [selectedTag, setSelectedTag] = useState<string>(tags[0] || "Công việc");
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>("");

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Bộ Lọc Phân Tầng Nâng Cao (Task Command Center)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [notebookFilter, setNotebookFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "timed" | "allday">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const getWeekDates = () => {
    const currentDay = now.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;

    const baseMonday = new Date(now);
    baseMonday.setDate(now.getDate() + mondayOffset + weekOffset * 7);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      const dateStr = getLocalTodayStr(d);
      const dayNum = d.getDate();
      const monthNum = d.getMonth() + 1;
      const formattedDate = `${String(dayNum).padStart(2, "0")}/${String(monthNum).padStart(2, "0")}`;

      days.push({
        dayName: DAY_NAMES[i],
        shortDayName: SHORT_DAY_NAMES[i],
        dayNum,
        formattedDate,
        dateStr,
      });
    }
    return days;
  };

  const getMonthMatrix = () => {
    const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDay.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const totalDays = lastDay.getDate();
    const matrix: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      matrix.push({ dayNum: d, dateStr, isCurrentMonth: false });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      matrix.push({ dayNum: d, dateStr, isCurrentMonth: true });
    }

    let nextDay = 1;
    while (matrix.length % 7 !== 0) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(nextDay).padStart(2, "0")}`;
      matrix.push({ dayNum: nextDay, dateStr, isCurrentMonth: false });
      nextDay++;
    }

    return {
      monthLabel: `Tháng ${month + 1}, ${year}`,
      matrix,
    };
  };

  const weekDays = getWeekDates();
  const { monthLabel, matrix: monthMatrix } = getMonthMatrix();

  const selectedDayTasks = tasks.filter((t) => {
    if (t.dueDate?.includes(selectedDateStr)) return true;
    if (selectedDateStr === todayStr && !t.dueDate) return true;
    return false;
  });

  const filteredDayTasks = selectedDayTasks.filter((task) => {
    if (hideCompletedTasks && statusFilter === "all" && task.completed) return false;
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? !task.completed
        : task.completed;

    const matchPriority =
      priorityFilter === "all" ? true : (task.priority || "medium") === priorityFilter;

    const matchNotebook =
      notebookFilter === "all"
        ? true
        : notebookFilter === "none"
        ? !task.notebookId
        : task.notebookId === notebookFilter;

    const hasSpecificTime = task.dueDate && (task.dueDate.includes("T") || task.dueDate.includes(":"));
    const matchTime =
      timeFilter === "all"
        ? true
        : timeFilter === "timed"
        ? hasSpecificTime
        : !hasSpecificTime;

    const matchTag = tagFilter === "all" ? true : task.tag === tagFilter;
    return matchStatus && matchPriority && matchNotebook && matchTime && matchTag;
  });

  const getDayFormattedTitle = () => {
    const parts = selectedDateStr.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
      return `${DAY_NAMES[dayIdx]} (${parts[2]}/${parts[1]})`;
    }
    return selectedDateStr;
  };

  const handleAddDayTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!dayTaskTitle.trim()) return;

    const finalDue = dayTaskTime
      ? `${selectedDateStr} ${dayTaskTime}`
      : `${selectedDateStr}`;

    addTask({
      title: dayTaskTitle.trim(),
      dueDate: finalDue,
      tag: selectedTag,
      notebookId: selectedNotebookId || undefined,
      priority: selectedPriority,
    });

    setDayTaskTitle("");
    setDayTaskTime(undefined);
    setSelectedPriority("medium");
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) {
      setIsAddingTag(false);
      return;
    }
    addTag(newTagInput.trim());
    setSelectedTag(newTagInput.trim());
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const notebookOptions: SelectOption[] = [
    { value: "", label: "Không gán sổ", icon: "lucide:FileText" },
    ...notebooks.map((nb) => ({
      value: nb.id,
      label: nb.name,
      icon: nb.icon || "lucide:BookMarked",
    })),
  ];

  return (
    <div className="space-y-3.5 max-w-2xl mx-auto">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
          Kế Hoạch
        </h2>

        <div className="flex items-center gap-1 p-0.5 bg-white border border-[#262626] rounded-[4px]">
          <button
            type="button"
            onClick={() => setViewMode("month")}
            className={`px-2 py-0.5 rounded-[2px] text-xs font-bold transition-all ${
              viewMode === "month"
                ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C]"
            }`}
          >
            Lịch Tháng
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`px-2 py-0.5 rounded-[2px] text-xs font-bold transition-all ${
              viewMode === "week"
                ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                : "text-[#78716C]"
            }`}
          >
            Lịch Tuần
          </button>
        </div>
      </div>

      {/* 2. Lịch Tháng */}
      {viewMode === "month" && (
        <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] space-y-2">
          <div className="flex items-center justify-between pb-1 border-b border-[#D4CEBF]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMonthOffset(monthOffset - 1)}
                className="px-2 py-0.5 bg-[#FBF9F4] border border-[#262626] rounded text-xs font-bold"
              >
                ←
              </button>
              <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                {monthLabel}
              </span>
              <button
                onClick={() => setMonthOffset(monthOffset + 1)}
                className="px-2 py-0.5 bg-[#FBF9F4] border border-[#262626] rounded text-xs font-bold"
              >
                →
              </button>

              {monthOffset !== 0 && (
                <button
                  onClick={() => {
                    setMonthOffset(0);
                    setSelectedDateStr(todayStr);
                  }}
                  className="px-1.5 py-0.5 bg-[#FEF08A] border border-[#262626] rounded text-[10px] font-bold"
                >
                  Hôm nay
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCalendarCollapsed(!isCalendarCollapsed)}
              className="px-2 py-0.5 bg-[#F3EFE6] border border-[#D4CEBF] rounded text-[11px] font-medium text-[#78716C]"
            >
              {isCalendarCollapsed ? "▾ Mở lịch" : "▴ Thu gọn"}
            </button>
          </div>

          {!isCalendarCollapsed && (
            <div className="space-y-1 animate-in fade-in">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#78716C]">
                {SHORT_DAY_NAMES.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 select-none">
                {monthMatrix.map((item) => {
                  const isSelected = selectedDateStr === item.dateStr;
                  const isToday = todayStr === item.dateStr;
                  const dayTaskCount = tasks.filter(
                    (t) => t.dueDate?.includes(item.dateStr) || (isToday && !t.dueDate)
                  ).length;

                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => setSelectedDateStr(item.dateStr)}
                      className={`min-h-[34px] sm:min-h-[38px] p-0.5 rounded-[3px] border flex flex-col justify-between items-center transition-all ${
                        isSelected
                          ? "bg-[#FEF08A] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] font-bold z-10"
                          : isToday
                          ? "bg-white border-[#262626]"
                          : item.isCurrentMonth
                          ? "bg-[#FBF9F4] border-[#D4CEBF] text-[#1C1917] hover:bg-white"
                          : "border-transparent text-[#A8A29E]"
                      }`}
                    >
                      <span
                        className={`font-mono text-[11px] ${
                          isToday && !isSelected ? "underline decoration-[#FEF08A] font-bold" : ""
                        }`}
                      >
                        {item.dayNum}
                      </span>

                      {dayTaskCount > 0 ? (
                        <span
                          className={`text-[9px] font-mono font-bold px-1 rounded-[2px] border border-[#262626] leading-none py-0.2 ${
                            isSelected ? "bg-white text-[#1C1917]" : "bg-[#BBF7D0] text-[#1C1917]"
                          }`}
                        >
                          {dayTaskCount}v
                        </span>
                      ) : (
                        <span className="h-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lịch Tuần */}
      {viewMode === "week" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekOffset(weekOffset - 1)}
              className="px-2 py-0.5 bg-white border border-[#262626] rounded text-xs font-bold"
            >
              ← Trước
            </button>
            <span className="font-bold text-xs font-mono">
              Tuần {weekOffset === 0 ? "này" : `${weekOffset > 0 ? `+${weekOffset}` : weekOffset}`}
            </span>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="px-2 py-0.5 bg-white border border-[#262626] rounded text-xs font-bold"
            >
              Sau →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 select-none">
            {weekDays.map((col) => {
              const isSelected = selectedDateStr === col.dateStr;
              const isToday = todayStr === col.dateStr;
              const dayTaskCount = tasks.filter(
                (t) => t.dueDate?.includes(col.dateStr) || (isToday && !t.dueDate)
              ).length;

              return (
                <button
                  key={col.dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(col.dateStr)}
                  className={`flex flex-col items-center justify-center p-1 rounded-[4px] border-[1.5px] min-h-[50px] transition-all ${
                    isSelected
                      ? "bg-[#FEF08A] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[1px]"
                      : "bg-white border-[#262626] text-[#78716C]"
                  }`}
                >
                  <span className={`text-[10px] font-bold ${isSelected ? "text-[#1C1917]" : "text-[#78716C]"}`}>
                    {col.shortDayName}
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-[#1C1917]">
                    {col.dayNum}
                  </span>
                  <div className="h-1.5 flex items-center justify-center">
                    {dayTaskCount > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full border border-[#262626] ${
                          isSelected ? "bg-[#1C1917]" : "bg-[#BBF7D0]"
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Khung Chi Tiết Kế Hoạch */}
      <div className="bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] p-3 sm:p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <h3 className="font-bold text-xs sm:text-sm text-[#1C1917] flex items-center gap-1.5">
            <CalendarIcon size={15} strokeWidth={2.2} />
            <span>{getDayFormattedTitle()}</span>
          </h3>

          <span className="font-mono text-xs font-bold bg-[#F3EFE6] px-2 py-0.5 rounded-[2px] border border-[#D4CEBF]">
            {selectedDayTasks.filter((t) => t.completed).length}/{selectedDayTasks.length} Xong
          </span>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddDayTask} className="p-2.5 bg-[#FBF9F4] border border-[#262626] rounded-[4px] space-y-2">
          <div className="flex gap-2">
            <TextInput
              placeholder={`Lên lịch việc mới...`}
              value={dayTaskTitle}
              onChange={(e) => setDayTaskTitle(e.target.value)}
              className="flex-1 text-xs sm:text-sm bg-white"
            />
            <Button type="submit" variant="primary">
              + Lên lịch
            </Button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => {
              const tagStyle = getTagStyle(tag);
              return (
                <div key={tag} className="group/tag relative inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`px-2 py-0.5 rounded-[2px] border text-[11px] font-medium transition-all ${
                      selectedTag === tag
                        ? `${tagStyle.bg} ${tagStyle.border} text-[#1C1917] shadow-[1px_1px_0px_#262626] -translate-y-[0.5px] font-bold`
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    #{tag}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTag(tag);
                      if (selectedTag === tag && tags.length > 1) {
                        setSelectedTag(tags.find((t) => t !== tag) || "");
                      }
                    }}
                    title={`Xóa #${tag}`}
                    className="opacity-0 group-hover/tag:opacity-100 text-[9px] text-[#78716C] hover:text-red-500 ml-0.5 p-0.5"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </div>
              );
            })}

            {isAddingTag ? (
              <input
                type="text"
                autoFocus
                placeholder="Tên tag..."
                value={newTagInput}
                maxLength={15}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCreateNewTag(e);
                  } else if (e.key === "Escape") {
                    setIsAddingTag(false);
                  }
                }}
                onBlur={handleCreateNewTag}
                className="w-18 px-1.5 py-0.5 text-[11px] border border-[#262626] rounded-[2px] outline-none bg-white font-sans"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="px-1.5 py-0.5 text-[11px] text-[#78716C] hover:text-[#1C1917] border border-dashed border-[#D4CEBF] rounded-[2px]"
              >
                + Tag
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#D4CEBF]/60 text-xs">
            <CustomSelect
              options={notebookOptions}
              value={selectedNotebookId}
              onChange={setSelectedNotebookId}
              placeholder="Gán sổ tay"
              className="w-full"
            />

            <CustomDuePicker
              value={dayTaskTime}
              onChange={setDayTaskTime}
              mode="time-only"
              className="w-full"
            />
          </div>

          {/* Chọn Mức Độ Ưu Tiên Khi Lên Lịch */}
          <div className="flex items-center gap-2 pt-1.5 border-t border-[#D4CEBF]/40 text-xs">
            <span className="text-[11px] font-bold text-[#78716C] shrink-0">Ưu tiên:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "high", label: "🔴 Gấp", activeClass: "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]" },
                { key: "medium", label: "🟡 Vừa", activeClass: "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]" },
                { key: "low", label: "🟢 Thấp", activeClass: "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1px_1px_0px_#262626]" },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setSelectedPriority(p.key as any)}
                  className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                    selectedPriority === p.key
                      ? p.activeClass
                      : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* 4. Filter Bar Khoa Học & Không Bao Giờ Rớt Dòng (Task Command Center) */}
        <div className="space-y-1.5 select-none">
          <div className="p-1 bg-white border border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-center justify-between gap-1 sm:gap-2 text-xs overflow-x-auto no-scrollbar">
            {/* Nhóm lọc trạng thái chính */}
            <div className="flex items-center gap-1 shrink-0">
              {[
                { key: "all", label: "Tất cả" },
                { key: "active", label: "Cần làm" },
                { key: "completed", label: "Đã xong" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key as any)}
                  className={`px-2 sm:px-2.5 py-1 rounded-[3px] border text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    statusFilter === f.key
                      ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                      : "bg-[#FBF9F4] text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Nhóm nút bên phải: Bộ Lọc Nâng Cao & Xóa Lọc */}
            <div className="flex items-center gap-1 shrink-0">
              {(statusFilter !== "all" || priorityFilter !== "all" || notebookFilter !== "all" || timeFilter !== "all" || tagFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setNotebookFilter("all");
                    setTimeFilter("all");
                    setTagFilter("all");
                  }}
                  title="Xóa toàn bộ lọc"
                  className="px-1.5 sm:px-2 py-1 rounded-[3px] bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-bold flex items-center gap-0.5 hover:bg-rose-100 active:translate-y-[0.5px] whitespace-nowrap shrink-0"
                >
                  <X size={12} strokeWidth={2.5} />
                  <span className="hidden xs:inline sm:inline">Xóa</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
                className={`px-2 sm:px-2.5 py-1 rounded-[3px] border-[1.5px] text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  isFilterDrawerOpen || (priorityFilter !== "all" || notebookFilter !== "all" || timeFilter !== "all" || tagFilter !== "all")
                    ? "bg-[#FEF08A] border-[#262626] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                    : "bg-white border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917]"
                }`}
              >
                <SlidersHorizontal size={13} strokeWidth={2.2} />
                <span>Lọc</span>
                {((priorityFilter !== "all" ? 1 : 0) + (notebookFilter !== "all" ? 1 : 0) + (timeFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0)) > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#262626] text-white text-[10px] flex items-center justify-center font-mono font-bold shrink-0">
                    {(priorityFilter !== "all" ? 1 : 0) + (notebookFilter !== "all" ? 1 : 0) + (timeFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0)}
                  </span>
                )}
                {isFilterDrawerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
          </div>

          {/* Khung Bộ Lọc Nâng Cao Mở Rộng Cho Planner */}
          {isFilterDrawerOpen && (
            <div className="p-3 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2.5 animate-in slide-in-from-top-2 duration-150 text-xs">
              {/* 1. Mức Độ Ưu Tiên */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Ưu tiên:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: "all", label: "Tất cả" },
                    { key: "high", label: "🔴 Gấp", activeClass: "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]" },
                    { key: "medium", label: "🟡 Vừa", activeClass: "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]" },
                    { key: "low", label: "🟢 Thấp", activeClass: "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1px_1px_0px_#262626]" },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setPriorityFilter(p.key as any)}
                      className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                        priorityFilter === p.key
                          ? p.activeClass || "bg-[#262626] text-white border-[#262626] font-bold"
                          : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Theo Cuốn Sổ */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#D4CEBF]/60">
                <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Cuốn sổ:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setNotebookFilter("all")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                      notebookFilter === "all"
                        ? "bg-[#262626] text-white border-[#262626] font-bold"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    Tất cả sổ
                  </button>
                  {notebooks.map((nb) => (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => setNotebookFilter(notebookFilter === nb.id ? "all" : nb.id)}
                      className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 whitespace-nowrap ${
                        notebookFilter === nb.id
                          ? "bg-[#FEF08A] border-[#262626] text-[#1C1917] font-bold shadow-[1px_1px_0px_#262626]"
                          : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                      }`}
                    >
                      <DynamicIcon name={nb.icon || "lucide:BookMarked"} size={11} />
                      <span>{nb.name}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setNotebookFilter(notebookFilter === "none" ? "all" : "none")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                      notebookFilter === "none"
                        ? "bg-[#262626] text-white border-[#262626] font-bold"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    Chưa gán sổ
                  </button>
                </div>
              </div>

              {/* 3. Thời Gian & Giờ Hẹn */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#D4CEBF]/60">
                <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Thời gian:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTimeFilter("all")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                      timeFilter === "all"
                        ? "bg-[#262626] text-white border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    Tất cả
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeFilter(timeFilter === "timed" ? "all" : "timed")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 whitespace-nowrap ${
                      timeFilter === "timed"
                        ? "bg-[#262626] text-white border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    <Clock size={12} strokeWidth={2.2} />
                    <span>Có giờ hẹn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTimeFilter(timeFilter === "allday" ? "all" : "allday")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 whitespace-nowrap ${
                      timeFilter === "allday"
                        ? "bg-amber-500 text-white border-amber-600 font-bold shadow-[1px_1px_0px_#262626]"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    <Sun size={12} strokeWidth={2.2} />
                    <span>Cả ngày</span>
                  </button>
                </div>
              </div>

              {/* 4. Nhãn Phân Loại (#Tag) */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#D4CEBF]/60">
                <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Nhãn tag:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setTagFilter("all")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                      tagFilter === "all"
                        ? "bg-[#262626] text-white border-[#262626] font-bold"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    Tất cả tag
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)}
                      className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                        tagFilter === tag
                          ? "border-[#262626] bg-[#FEF08A] font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                          : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="space-y-2 pt-0.5">
          {filteredDayTasks.length === 0 ? (
            <EmptyStateDoodle
              icon="lucide:Calendar"
              title="Chưa có việc nào"
              message="Hãy lên lịch việc mới phía trên nếu bạn có dự định nhé."
            />
          ) : (
            filteredDayTasks.map((task, idx) => {
              const assignedNotebook = notebooks.find((n) => n.id === task.notebookId);
              const isTaskForToday = task.dueDate?.includes(todayStr) || (selectedDateStr === todayStr && !task.dueDate);
              const dueInfo = getTaskDueInfo(task.dueDate);

              return (
                <div
                  key={task.id}
                  className={`group p-2.5 sm:p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2 transition-all animate-task-pop ${getCardTilt(
                    idx
                  )}`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <div className="pt-0.5 shrink-0">
                        <HandDrawnCheckbox
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="relative inline-block max-w-full">
                          <p
                            className={`text-xs sm:text-sm font-semibold leading-snug break-all ${
                              task.completed ? "text-[#78716C]" : "text-[#1C1917]"
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.completed && (
                            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#78716C] animate-ink-strike -translate-y-1/2 pointer-events-none" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                          {/* Badge Hạn Chót */}
                          {dueInfo && !task.completed && (
                            <span
                              className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-1 font-mono ${dueInfo.badgeClass}`}
                            >
                              {dueInfo.type === "overdue" ? (
                                <AlertCircle size={10} strokeWidth={2.5} className="text-rose-700" />
                              ) : dueInfo.type === "today" ? (
                                <Clock size={10} strokeWidth={2.2} className="text-amber-800" />
                              ) : (
                                <CalendarIcon size={10} strokeWidth={2.2} className="text-emerald-700" />
                              )}
                              <span>{dueInfo.label}</span>
                            </span>
                          )}

                          {task.tag && (
                            <span
                              className={`${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} px-1.5 py-0.5 rounded border ${getTagStyle(task.tag).border} font-medium`}
                            >
                              #{task.tag}
                            </span>
                          )}
                          {assignedNotebook && (
                            <span
                              className="px-1.5 py-0.2 rounded border border-[#262626] max-w-[130px] truncate inline-flex items-center gap-1 font-medium text-[#1C1917]"
                              style={{ backgroundColor: assignedNotebook.color || "#FEF08A" }}
                            >
                              <DynamicIcon name={assignedNotebook.icon} size={11} strokeWidth={2.2} />
                              <span className="truncate">{assignedNotebook.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingTaskId(task.id)}
                      title="Xóa"
                      className="opacity-40 group-hover:opacity-100 text-[#78716C] hover:text-red-600 p-1 shrink-0 active:translate-y-[0.5px]"
                    >
                      <X size={13} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Actions */}
                  {!task.completed && (
                    <div className="pt-1.5 border-t border-[#D4CEBF]/60 flex items-center justify-between text-xs">
                      {isTaskForToday ? (
                        <>
                          <span className="text-[10px] text-emerald-800 font-bold bg-[#BBF7D0] px-1.5 py-0.2 rounded border border-[#262626] inline-flex items-center gap-1">
                            <Star size={10} strokeWidth={2.5} className="fill-emerald-800" />
                            <span>Hôm nay</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => moveTaskToTomorrow(task.id)}
                            title="Dời sang ngày mai"
                            className="flex items-center gap-1 px-2 py-0.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                          >
                            <ArrowRight size={12} strokeWidth={2.4} />
                            <span>Ngày mai</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-[#78716C] font-mono">
                            {selectedDateStr}
                          </span>
                          <button
                            type="button"
                            onClick={() => moveTaskToToday(task.id)}
                            title="Kéo vào làm hôm nay"
                            className="flex items-center gap-1 px-2.5 py-0.5 bg-[#BBF7D0] hover:bg-[#86EFAC] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                          >
                            <Sun size={12} strokeWidth={2.4} />
                            <span>Làm hôm nay</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deletingTaskId !== null}
        title="Gỡ bỏ công việc"
        message="Bạn có chắc muốn xóa việc này không?"
        onConfirm={() => {
          if (deletingTaskId) deleteTask(deletingTaskId);
          setDeletingTaskId(null);
        }}
        onCancel={() => setDeletingTaskId(null)}
      />
    </div>
  );
};
