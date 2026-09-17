// ==========================================
// COMPONENT: PlannerTimeline (Desktop 7-Day Responsive Timeline Grid)
// ==========================================

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  Check,
  Clock,
  Hourglass,
  Plus,
} from "lucide-react";
import { TaskDto } from "../../../types";
import {
  getTaskEffectiveTime,
  normalizeTaskTimeType,
  getTaskTimelineRangeForDate,
} from "../../../utils/taskSemantics";
import { buildTimelineGridLayout } from "./plannerTimelineLayout";
import { useAppStore } from "../../../stores/appStore";

interface TimelineDay {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface PlannerTimelineProps {
  weekDays: TimelineDay[];
  todayStr: string;
  selectedDateStr?: string;
  onPreviewDate?: (dateStr: string) => void;
  getTasksForDate: (dateStr: string) => TaskDto[];
  onSelectDate: (dateStr: string) => void;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 64; // Chiều cao 64px/giờ cân đối và thoáng
const MIN_LANE_HEIGHT = 28;

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

interface TimelineTaskCardProps {
  task: TaskDto;
  style?: React.CSSProperties;
  showLabel?: boolean;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
}

// === PHẦN 1: Thẻ task hiển thị trong ô giờ của timeline ===
const TimelineTaskCard: React.FC<TimelineTaskCardProps> = ({
  task,
  style,
  showLabel = true,
  onSelectTask,
  onToggleTask,
}) => {
  const type = normalizeTaskTimeType(task);
  const time = getTaskEffectiveTime(task);

  const tone = task.completed
    ? "bg-[#F5F5F4] dark:bg-[#27272A] border-[#D6D3D1] dark:border-[#3F3F46] opacity-60"
    : type === "scheduled"
      ? "bg-[#E0F2FE] dark:bg-sky-950/60 border-[#38BDF8] dark:border-sky-700 text-[#0369A1] dark:text-sky-200"
      : type === "deadline"
        ? "bg-[#FFE4E6] dark:bg-rose-950/60 border-[#FB7185] dark:border-rose-700 text-[#BE123C] dark:text-rose-200"
        : "bg-[#FEF9C3] dark:bg-amber-950/60 border-[#FCD34D] dark:border-amber-700 text-[#92400E] dark:text-amber-200";

  return (
    <article
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelectTask(task);
      }}
      title={
        type === "deadline"
          ? `Hạn chót${time ? `: ${time}` : ""} - ${task.title}`
          : type === "scheduled"
            ? `Lịch hẹn${time ? `: ${time}${task.endTime ? ` - ${task.endTime}` : ""}` : ""} - ${task.title}`
            : task.title
      }
      className={`group absolute overflow-hidden rounded-[4px] border-[1.5px] ${tone} p-1 shadow-[1px_1px_0px_#262626] dark:shadow-none cursor-pointer transition-all hover:z-20 hover:shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] select-none`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1 h-full">
        <div className="flex min-w-0 items-center gap-1.5 flex-1 overflow-hidden">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleTask(task.id);
            }}
            aria-label={
              task.completed
                ? `Bỏ hoàn thành: ${task.title}`
                : `Hoàn thành: ${task.title}`
            }
            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[2px] border border-[#262626] dark:border-white bg-white dark:bg-[#1C1C1E] text-[#1C1917] dark:text-white active:scale-90"
          >
            {task.completed && <Check size={9} strokeWidth={3} />}
          </button>

          {/* Icon phân biệt Hẹn (Clock) vs Hạn (Hourglass) */}
          {type === "deadline" ? (
            <Hourglass
              size={11}
              strokeWidth={2.4}
              className={`shrink-0 ${
                task.completed
                  ? "text-[#78716C] dark:text-[#A1A1AA]"
                  : "text-[#BE123C] dark:text-rose-300"
              }`}
            />
          ) : (
            <Clock
              size={11}
              strokeWidth={2.4}
              className={`shrink-0 ${
                task.completed
                  ? "text-[#78716C] dark:text-[#A1A1AA]"
                  : "text-[#0369A1] dark:text-sky-300"
              }`}
            />
          )}

          <span
            className={`truncate text-[11px] font-bold leading-tight ${
              task.completed ? "line-through text-[#78716C] dark:text-[#A1A1AA]" : "text-[#1C1917] dark:text-white"
            }`}
          >
            {showLabel ? task.title : "..."}
          </span>
        </div>
      </div>
    </article>
  );
};

// === PHẦN 2: Lưới Thời khóa biểu 7 Cột Tuần Responsive cho Desktop ===
export const PlannerTimeline: React.FC<PlannerTimelineProps> = ({
  weekDays,
  selectedDateStr,
  getTasksForDate,
  onSelectDate,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
}) => {
  const { openQuickTaskModal } = useAppStore();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cập nhật giờ hiện tại mỗi 60 giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Tính số phút hiện tại trong ngày (0 - 1439)
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentHourTop = (currentMinutes / 60) * HOUR_HEIGHT;

  // Tính toán trước layout timeline cho cả 7 ngày trong tuần
  const daysLayoutData = useMemo(() => {
    return weekDays.map((day) => {
      const allTasks = getTasksForDate(day.dateStr);
      const timedTasks = allTasks.filter((task) =>
        Boolean(getTaskEffectiveTime(task)),
      );
      const allDayTasks = allTasks.filter(
        (task) => !getTaskEffectiveTime(task),
      );

      const completedCount = allTasks.filter((t) => t.completed).length;
      const scheduledCount = allTasks.filter(
        (t) => normalizeTaskTimeType(t) === "scheduled",
      ).length;
      const deadlineCount = allTasks.filter(
        (t) => normalizeTaskTimeType(t) === "deadline",
      ).length;

      const hasEarlyOrNightTasks = timedTasks.some((t) => {
        const range = getTaskTimelineRangeForDate(t, day.dateStr);
        return range ? range.start < 360 || range.end > 1320 : false;
      });

      const layout = buildTimelineGridLayout(
        timedTasks,
        (task) => getTaskTimelineRangeForDate(task, day.dateStr),
        HOUR_HEIGHT,
        MIN_LANE_HEIGHT,
      );

      return {
        day,
        allTasks,
        timedTasks,
        allDayTasks,
        completedCount,
        scheduledCount,
        deadlineCount,
        hasEarlyOrNightTasks,
        layout,
      };
    });
  }, [weekDays, getTasksForDate]);

  // Tự động cuộn đến vị trí giờ hiện tại (hoặc 07:00 sáng) khi mở
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const targetScroll = Math.max(0, currentHourTop - 120);
    timelineScrollRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  // Mở modal tạo việc nhanh khi bấm vào ô giờ trống
  const handleCellClick = (dateStr: string, hour: number) => {
    const startStr = `${String(hour).padStart(2, "0")}:00`;
    const endStr = `${String(Math.min(23, hour + 1)).padStart(2, "0")}:00`;
    openQuickTaskModal({
      dueDate: dateStr,
      timeType: "scheduled",
      startTime: startStr,
      endTime: endStr,
    });
  };

  const hours = Array.from(
    { length: END_HOUR - START_HOUR },
    (_, i) => START_HOUR + i,
  );

  return (
    <div className="w-full select-none animate-in fade-in duration-150">
      {/* Container Lưới 7 Cột Tuần Vừa Vặn 100% Khung Màn Hình */}
      <div
        ref={timelineScrollRef}
        className="h-[calc(100vh-140px)] min-h-[560px] overflow-y-auto overflow-x-hidden rounded-[8px] border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#1C1C1E] shadow-[2px_2px_0px_#262626] dark:shadow-none"
        tabIndex={0}
        aria-label="Khung thời khóa biểu 7 ngày"
      >
        <div className="w-full min-w-0">
          {/* A. Sticky Header: 7 Cột Tiêu Đề Ngày */}
          <div className="sticky top-0 z-30 grid grid-cols-[50px_repeat(7,minmax(0,1fr))] border-b-[1.5px] border-[#262626] dark:border-black bg-[#FAF8F3] dark:bg-[#27272A] shadow-xs">
            {/* Cột mốc giờ góc trái */}
            <div className="flex flex-col items-center justify-center border-r-[1.5px] border-[#262626]/20 dark:border-black bg-[#F5F2EA] dark:bg-[#202023] p-1 font-mono text-[10.5px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
              <span>GIỜ</span>
            </div>

            {/* 7 Cột ngày Thứ 2 -> Chủ Nhật */}
            {daysLayoutData.map(
              ({
                day,
                allTasks,
                completedCount,
              }) => {
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;
                const progressPercent =
                  allTasks.length > 0
                    ? Math.round((completedCount / allTasks.length) * 100)
                    : 0;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => onSelectDate(day.dateStr)}
                    className={`relative flex flex-col justify-between border-r-[1.5px] border-[#262626]/20 dark:border-black p-2 transition-colors last:border-r-0 cursor-pointer text-left ${
                      isSelected
                        ? "bg-[#1C1917] text-white dark:bg-white dark:text-[#1C1917]"
                        : isToday
                          ? "bg-[#FAF8F3] dark:bg-[#2C2C2E] hover:bg-[#F3EFE6] dark:hover:bg-[#3A3A3C]"
                          : "bg-white dark:bg-[#1C1C1E] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-1">
                      <div className="flex items-baseline gap-1 min-w-0">
                        <span
                          className={`text-xs font-bold ${
                            isSelected
                              ? "text-white dark:text-[#1C1917]"
                              : "text-[#78716C] dark:text-[#A1A1AA]"
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span
                          className={`text-sm font-black ${
                            isSelected
                              ? "text-white dark:text-[#1C1917]"
                              : isToday
                                ? "text-[#1C1917] dark:text-white"
                                : "text-[#1C1917] dark:text-[#F2F2F7]"
                          }`}
                        >
                          {day.dayNum}
                        </span>
                      </div>

                      {isToday && (
                        <span
                          className={`px-1.5 py-0.25 rounded text-[9px] font-bold leading-tight ${
                            isSelected
                              ? "bg-white text-[#1C1917] dark:bg-[#1C1917] dark:text-white"
                              : "bg-[#1C1917] text-white dark:bg-white dark:text-[#1C1917]"
                          }`}
                        >
                          Nay
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex items-center justify-between w-full text-[10px]">
                      <span
                        className={`truncate ${
                          isSelected
                            ? "text-white/80 dark:text-[#1C1917]/80 font-medium"
                            : "text-[#78716C] dark:text-[#A1A1AA]"
                        }`}
                      >
                        {allTasks.length > 0 ? `${allTasks.length} việc` : "Trống"}
                      </span>

                      {allTasks.length > 0 && (
                        <span
                          className={`font-mono font-semibold ${
                            isSelected
                              ? "text-white/80 dark:text-[#1C1917]/80"
                              : "text-[#78716C] dark:text-[#A1A1AA]"
                          }`}
                        >
                          {progressPercent}%
                        </span>
                      )}
                    </div>

                    {/* Mini Progress Bar */}
                    <div
                      className={`mt-1 h-1 w-full overflow-hidden rounded-full ${
                        isSelected
                          ? "bg-white/20 dark:bg-black/20"
                          : "bg-[#E7E5E4] dark:bg-[#3A3A3C]"
                      }`}
                    >
                      <div
                        className={`h-full transition-all ${
                          isSelected
                            ? "bg-white dark:bg-[#1C1917]"
                            : "bg-[#1C1917] dark:bg-white"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </button>
                );
              },
            )}
          </div>

          {/* B. Hàng Việc Cả Ngày (All-day Tasks) */}
          <div className="grid grid-cols-[50px_repeat(7,minmax(0,1fr))] border-b-[1.5px] border-[#262626]/20 dark:border-black bg-[#F5F2EA]/60 dark:bg-[#202023]/60">
            <div className="flex items-center justify-center border-r-[1.5px] border-[#262626]/20 dark:border-black px-1 py-1.5 font-mono text-[9.5px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
              CẢ NGÀY
            </div>

            {daysLayoutData.map(({ day, allDayTasks }) => (
              <div
                key={`allday-${day.dateStr}`}
                className="min-h-[32px] space-y-1 border-r-[1.5px] border-[#262626]/20 dark:border-black p-1 last:border-r-0"
              >
                {allDayTasks.slice(0, 2).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTask(t)}
                    className={`block w-full truncate rounded-[3px] border border-[#262626] dark:border-black px-1.5 py-0.5 text-left text-[10px] font-semibold transition-all active:scale-[0.98] ${
                      t.completed
                        ? "bg-[#F5F5F4] dark:bg-[#2C2C2E] line-through opacity-60 text-[#78716C]"
                        : "bg-white dark:bg-[#2C2C2E] hover:bg-[#FAF8F3] text-[#1C1917] dark:text-white"
                    }`}
                  >
                    {t.title}
                  </button>
                ))}
                {allDayTasks.length > 2 && (
                  <span className="block text-center font-mono text-[9.5px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
                    +{allDayTasks.length - 2} khác
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* C. Thân Lưới 24 Giờ & 7 Cột Lịch Trình Vừa Vặn */}
          <div className="relative grid grid-cols-[50px_repeat(7,minmax(0,1fr))] bg-white dark:bg-[#1C1C1E]">
            {/* Cột Trục Giờ (Left Gutter) */}
            <div
              className="relative border-r-[1.5px] border-[#262626]/20 dark:border-black bg-[#FAF8F3] dark:bg-[#202023]"
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end border-b border-[#E7E5E4] dark:border-[#2C2C2E] pr-1.5 pt-1 font-mono text-[10px] font-medium text-[#78716C] dark:text-[#A1A1AA]"
                  style={{
                    top: hour * HOUR_HEIGHT,
                    height: HOUR_HEIGHT,
                  }}
                >
                  {formatTime(hour * 60)}
                </div>
              ))}

              {/* Chỉ báo thời gian hiện tại trên trục giờ */}
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-end pr-1"
                style={{ top: currentHourTop - 8 }}
              >
                <span className="rounded bg-[#E11D48] px-1 py-0.25 font-mono text-[9px] font-bold text-white shadow-xs">
                  {formatTime(currentMinutes)}
                </span>
              </div>
            </div>

            {/* 7 Cột Timeline Tương Ứng 7 Ngày */}
            {daysLayoutData.map(({ day, layout }) => (
              <div
                key={`timeline-${day.dateStr}`}
                className={`relative border-r-[1.5px] border-[#262626]/20 dark:border-black last:border-r-0 ${
                  day.isToday ? "bg-[#FEF9C3]/10 dark:bg-yellow-950/10" : ""
                }`}
                style={{ height: hours.length * HOUR_HEIGHT }}
              >
                {/* Các ô giờ (Click để thêm task mới) */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => handleCellClick(day.dateStr, hour)}
                    className="group/hour absolute left-0 right-0 border-b border-[#E7E5E4] dark:border-[#2C2C2E] transition-colors hover:bg-[#F3EFE6]/60 dark:hover:bg-[#2C2C2E]/60 cursor-pointer"
                    style={{
                      top: hour * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                    }}
                    title={`Bấm để thêm việc lúc ${formatTime(hour * 60)}`}
                  >
                    {/* Vạch kẻ nửa giờ */}
                    <div
                      aria-hidden="true"
                      className="absolute left-0 right-0 border-b border-dashed border-[#F0ECE1] dark:border-[#27272A]"
                      style={{ top: "50%" }}
                    />

                    {/* Nút cộng mờ xuất hiện khi hover ô giờ */}
                    <div className="absolute right-1 top-1 hidden items-center gap-1 rounded border border-[#262626]/20 bg-white/95 dark:bg-[#2C2C2E] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#57534E] dark:text-[#D6D3D1] shadow-2xs group-hover/hour:flex">
                      <Plus size={10} />
                      <span>{formatTime(hour * 60)}</span>
                    </div>
                  </div>
                ))}

                {/* Vạch Đỏ Giờ Hiện Tại (Current Time Red Line) nếu là Hôm Nay */}
                {day.isToday && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-20 h-[2px] bg-[#E11D48]"
                    style={{ top: currentHourTop }}
                  >
                    <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full border border-white bg-[#E11D48]" />
                  </div>
                )}

                {/* Các Thẻ Task Đã Định Vị Trong Ngày */}
                {layout.segments.map((segment, index) => (
                  <TimelineTaskCard
                    key={`${segment.task.id}-${index}`}
                    task={segment.task}
                    showLabel={segment.showLabel}
                    style={{
                      top: segment.top,
                      left: `calc(${segment.left}% + 1px)`,
                      width: `calc(${segment.width}% - 2px)`,
                      height: segment.height,
                    }}
                    onSelectTask={onSelectTask}
                    onToggleTask={onToggleTask}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
