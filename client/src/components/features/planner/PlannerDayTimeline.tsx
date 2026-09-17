// ==========================================
// COMPONENT: PlannerDayTimeline (Desktop Day Timeline Grid & Task List)
// ==========================================

import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Compass,
  Hourglass,
  ListTodo,
  Moon,
  Pin,
  Plus,
  Sun,
  Trash2,
} from "lucide-react";
import { TaskDto } from "../../../types";
import {
  getTaskEffectiveTime,
  normalizeTaskTimeType,
  getTaskTimelineRangeForDate,
} from "../../../utils/taskSemantics";
import { getLocalTodayStr } from "../../../utils/date";
import { TaskList } from "../shared/TaskList";
import { buildTimelineGridLayout } from "./plannerTimelineLayout";
import { useAppStore } from "../../../stores/appStore";

export type PlannerDayDisplayMode = "chart" | "list";

interface PlannerDayTimelineProps {
  tasks: TaskDto[];
  listTasks?: TaskDto[];
  displayMode: PlannerDayDisplayMode;
  onDisplayModeChange: (mode: PlannerDayDisplayMode) => void;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  dateStr?: string;
  isToday?: boolean;
}

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_ROW_HEIGHT = 64; // Chiều cao 64px/giờ cân đối và thoáng
const MIN_LANE_HEIGHT = 28;

const parseTime = (value?: string) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const getTaskTimeLabel = (task: TaskDto) => {
  const time = getTaskEffectiveTime(task);
  if (!time) return "";
  return normalizeTaskTimeType(task) === "scheduled"
    ? `${time}${task.endTime ? ` - ${task.endTime}` : ""}`
    : `Hạn ${time}`;
};

// === PHẦN 1: Thẻ task đặt trên biểu đồ chi tiết ngày ===
const DayTimelineTaskCard: React.FC<{
  task: TaskDto;
  style: React.CSSProperties;
  showLabel?: boolean;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}> = ({
  task,
  style,
  showLabel = true,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
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

        {/* Quick action buttons on hover */}
        <div className="hidden shrink-0 items-center gap-0.5 group-hover:flex">
          {onMoveTomorrow && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMoveTomorrow(task.id);
              }}
              title="Dời sang ngày mai"
              aria-label={`Dời sang ngày mai: ${task.title}`}
              className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#262626] bg-white text-[#1C1917] hover:bg-[#FAF8F3] active:scale-95"
            >
              <ArrowRight size={9} strokeWidth={2.4} />
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTask(task.id);
            }}
            title="Xóa công việc"
            aria-label={`Xóa task: ${task.title}`}
            className="flex h-4 w-4 items-center justify-center rounded-[2px] border border-[#BE123C] bg-white text-[#BE123C] hover:bg-[#FFE4E6] active:scale-95"
          >
            <Trash2 size={9} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </article>
  );
};

// === PHẦN 2: Biểu đồ ngày 24 Giờ cho Desktop ===
export const PlannerDayTimeline: React.FC<PlannerDayTimelineProps> = ({
  tasks,
  listTasks,
  displayMode,
  onDisplayModeChange,
  onSelectTask,
  onToggleTask,
  onDeleteTask,
  onMoveTomorrow,
  dateStr,
  isToday = true,
}) => {
  const { openQuickTaskModal } = useAppStore();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cập nhật giờ hiện tại mỗi 60 giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentHourTop = (currentMinutes / 60) * HOUR_ROW_HEIGHT;

  const displayListTasks = listTasks ?? tasks;
  const timedTasks = useMemo(
    () =>
      tasks.filter((task) => Boolean(getTaskEffectiveTime(task))),
    [tasks],
  );

  const allDayTasks = useMemo(
    () => tasks.filter((t) => !getTaskEffectiveTime(t)),
    [tasks],
  );

  const effectiveDayDate = dateStr || getLocalTodayStr();

  const timelineLayout = useMemo(
    () =>
      buildTimelineGridLayout(
        tasks,
        (task) => getTaskTimelineRangeForDate(task, effectiveDayDate),
        HOUR_ROW_HEIGHT,
        MIN_LANE_HEIGHT,
      ),
    [tasks, effectiveDayDate],
  );

  // Tự động cuộn đến vị trí giờ hiện tại khi mở giao diện lần đầu
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const targetScroll = Math.max(0, currentHourTop - 120);
    timelineScrollRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  const scrollToHour = (hour: number) => {
    if (!timelineScrollRef.current) return;
    timelineScrollRef.current.scrollTo({
      top: Math.max(0, hour * HOUR_ROW_HEIGHT - 30),
      behavior: "smooth",
    });
  };

  const scrollToNow = () => {
    if (!timelineScrollRef.current) return;
    timelineScrollRef.current.scrollTo({
      top: Math.max(0, currentHourTop - 120),
      behavior: "smooth",
    });
  };

  const handleCellClick = (hour: number) => {
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

  // === PHẦN 3: Danh sách task thay thế biểu đồ trong chi tiết ngày ===
  if (displayMode === "list") {
    return (
      <section className="space-y-2.5 select-none animate-in fade-in duration-150">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626]/20 pb-2">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1C1917] dark:text-white">
            <ListTodo size={16} strokeWidth={2.4} />
            <span>Công việc ({displayListTasks.length})</span>
          </div>

          <div
            className="inline-flex items-center gap-0.5 rounded-[5px] border-[1.5px] border-[#262626] dark:border-black bg-[#FAF8F3] dark:bg-[#2C2C2E] p-0.5 shadow-[1px_1px_0px_#262626]"
            role="tablist"
            aria-label="Kiểu hiển thị"
          >
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => onDisplayModeChange("chart")}
              className="rounded-[3px] px-2.5 py-1 text-xs font-bold text-[#57534E] dark:text-[#AEAEC2] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
            >
              Biểu đồ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected
              className="rounded-[3px] bg-[#1C1917] dark:bg-white px-2.5 py-1 text-xs font-bold text-white dark:text-[#1C1917] shadow-xs transition-all cursor-pointer"
            >
              Danh sách
            </button>
          </div>
        </div>

        <TaskList
          tasks={displayListTasks}
          emptyMessage="Chưa có công việc"
          onToggle={onToggleTask}
          onEdit={onSelectTask}
          onDelete={onDeleteTask}
          onMoveTomorrow={onMoveTomorrow}
          onClick={onSelectTask}
          variant="planner"
          hideDate={true}
          showQuickAdd={false}
        />
      </section>
    );
  }

  return (
    <section className="space-y-2.5 select-none animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#262626]/20 pb-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#1C1917] dark:text-white">
          <Clock size={16} strokeWidth={2.4} />
          <span>Biểu đồ 24h</span>
          <span className="font-mono text-xs font-semibold text-[#78716C] dark:text-[#A1A1AA]">
            ({timedTasks.length} việc có giờ)
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {/* Nút điều hướng nhanh khung giờ */}
          <button
            type="button"
            onClick={scrollToNow}
            title="Cuộn tới giờ hiện tại"
            className="flex items-center gap-1 rounded-[5px] border-[1.5px] border-[#262626] bg-white dark:bg-[#2C2C2E] px-2.5 py-1 text-xs font-bold text-[#1C1917] dark:text-white shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#FAF8F3] dark:hover:bg-[#3A3A3C] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
          >
            <Compass size={13} strokeWidth={2.4} className="text-[#E11D48]" />
            <span>Bây giờ</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToHour(7)}
            title="Cuộn tới 07:00 sáng"
            className="flex items-center gap-1 rounded-[5px] border-[1.5px] border-[#262626] bg-white dark:bg-[#2C2C2E] px-2.5 py-1 text-xs font-bold text-[#1C1917] dark:text-white shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#FAF8F3] dark:hover:bg-[#3A3A3C] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
          >
            <Sun size={13} strokeWidth={2.4} />
            <span>07h</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToHour(19)}
            title="Cuộn tới 19:00 tối"
            className="flex items-center gap-1 rounded-[5px] border-[1.5px] border-[#262626] bg-white dark:bg-[#2C2C2E] px-2.5 py-1 text-xs font-bold text-[#1C1917] dark:text-white shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#FAF8F3] dark:hover:bg-[#3A3A3C] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
          >
            <Moon size={13} strokeWidth={2.4} />
            <span>19h</span>
          </button>

          {/* Toggle Chế Độ Biểu Đồ / Danh Sách */}
          <div
            className="inline-flex items-center gap-0.5 rounded-[5px] border-[1.5px] border-[#262626] dark:border-black bg-[#FAF8F3] dark:bg-[#2C2C2E] p-0.5 shadow-[1px_1px_0px_#262626]"
            role="tablist"
            aria-label="Kiểu hiển thị chi tiết ngày"
          >
            <button
              type="button"
              role="tab"
              aria-selected
              className="rounded-[3px] bg-[#1C1917] dark:bg-white px-2.5 py-1 text-xs font-bold text-white dark:text-[#1C1917] shadow-xs transition-all cursor-pointer"
            >
              Biểu đồ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => onDisplayModeChange("list")}
              className="rounded-[3px] px-2.5 py-1 text-xs font-bold text-[#57534E] dark:text-[#AEAEC2] hover:text-[#1C1917] dark:hover:text-white transition-all cursor-pointer"
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Khay việc cả ngày nếu có */}
      {allDayTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 rounded-[6px] border-[1.5px] border-[#262626] dark:border-black bg-[#F5F2EA] dark:bg-[#202023] p-2 shadow-[1.5px_1.5px_0px_#262626] dark:shadow-none">
          <span className="font-mono text-[10px] font-bold uppercase text-[#78716C] dark:text-[#A1A1AA]">
            Cả ngày ({allDayTasks.length}):
          </span>
          {allDayTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task)}
              className={`rounded-[4px] border border-[#262626] dark:border-black px-2 py-0.75 text-xs font-bold shadow-[1px_1px_0px_#262626] dark:shadow-none transition-all active:scale-[0.98] inline-flex items-center gap-1 cursor-pointer ${
                task.completed
                  ? "bg-[#F5F5F4] dark:bg-[#27272A] line-through opacity-60 text-[#78716C]"
                  : "bg-white dark:bg-[#2C2C2E] hover:bg-[#FAF8F3] text-[#1C1917] dark:text-white"
              }`}
            >
              <Pin size={11} className="text-[#78716C] dark:text-[#A1A1AA] shrink-0" />
              <span>{task.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Khung cuộn Timeline 24 Giờ của Ngày Vừa Vặn 100% */}
      <div
        ref={timelineScrollRef}
        className="h-[calc(100vh-210px)] min-h-[500px] overflow-y-auto overflow-x-hidden rounded-[8px] border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#1C1C1E] shadow-[2px_2px_0px_#262626] dark:shadow-none"
        tabIndex={0}
        aria-label="Vùng cuộn biểu đồ chi tiết ngày"
      >
        <div className="w-full min-w-0">
          <div className="grid grid-cols-[50px_minmax(0,1fr)]">
            {/* Cột Trục Giờ (Left Gutter) */}
            <div
              className="relative border-r-[1.5px] border-[#262626]/20 dark:border-black bg-[#FAF8F3] dark:bg-[#202023]"
              style={{ height: timelineLayout.totalHeight }}
            >
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end border-b border-[#E7E5E4] dark:border-[#2C2C2E] pr-1.5 pt-1 font-mono text-[10px] font-medium text-[#78716C] dark:text-[#A1A1AA]"
                  style={{ top, height }}
                >
                  {formatTime(hour * 60)}
                </div>
              ))}

              {/* Chỉ báo thời gian hiện tại trên trục giờ */}
              {isToday && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-end pr-1"
                  style={{ top: currentHourTop - 8 }}
                >
                  <span className="rounded bg-[#E11D48] px-1 py-0.25 font-mono text-[9px] font-bold text-white shadow-xs">
                    {formatTime(currentMinutes)}
                  </span>
                </div>
              )}
            </div>

            {/* Cột Lưới Sự Kiện Trong Ngày */}
            <div
              className="relative bg-white dark:bg-[#1C1C1E]"
              style={{ height: timelineLayout.totalHeight }}
            >
              {/* Các ô giờ (Bấm để thêm việc) */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  onClick={() => handleCellClick(hour)}
                  className="group/hour absolute left-0 right-0 border-b border-[#E7E5E4] dark:border-[#2C2C2E] transition-colors hover:bg-[#F3EFE6]/60 dark:hover:bg-[#2C2C2E]/60 cursor-pointer"
                  style={{
                    top: hour * HOUR_ROW_HEIGHT,
                    height: HOUR_ROW_HEIGHT,
                  }}
                  title={`Bấm để thêm việc lúc ${formatTime(hour * 60)}`}
                >
                  {/* Vạch kẻ nửa giờ */}
                  <div
                    aria-hidden="true"
                    className="absolute left-0 right-0 border-b border-dashed border-[#F0ECE1] dark:border-[#27272A]"
                    style={{ top: "50%" }}
                  />

                  <div className="absolute right-2 top-1.5 hidden items-center gap-1 rounded border border-[#262626]/20 bg-white/95 dark:bg-[#2C2C2E] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[#57534E] dark:text-[#D6D3D1] shadow-2xs group-hover/hour:flex">
                    <Plus size={10} />
                    <span>Thêm ({formatTime(hour * 60)})</span>
                  </div>
                </div>
              ))}

              {/* Vạch Đỏ Giờ Hiện Tại (Current Time Red Line) */}
              {isToday && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 h-[2px] bg-[#E11D48]"
                  style={{ top: currentHourTop }}
                >
                  <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full border border-white bg-[#E11D48]" />
                </div>
              )}

              {/* Các Thẻ Task Đã Định Vị */}
              {timelineLayout.segments.map((segment, index) => (
                <DayTimelineTaskCard
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
                  onDeleteTask={onDeleteTask}
                  onMoveTomorrow={onMoveTomorrow}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
