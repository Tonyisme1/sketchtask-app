import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Compass,
  ListTodo,
  Moon,
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
const HOUR_ROW_HEIGHT = 260; // Kích thước siêu lớn 4X
const QUARTER_START_MINUTES = [0, 15, 30, 45];

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

const getTaskRange = (task: TaskDto) => {
  const start = parseTime(getTaskEffectiveTime(task));
  if (start === undefined) return undefined;

  const type = normalizeTaskTimeType(task);
  const rawEnd = type === "scheduled" ? parseTime(task.endTime) : undefined;
  const end =
    rawEnd !== undefined && rawEnd > start
      ? rawEnd
      : start + (type === "scheduled" ? 60 : 45);

  return {
    start: Math.max(START_HOUR * 60, Math.min(start, END_HOUR * 60 - 15)),
    end: Math.min(END_HOUR * 60, Math.max(end, start + 15)),
  };
};

const getTaskTimeLabel = (task: TaskDto) => {
  const time = getTaskEffectiveTime(task);
  if (!time) return "";
  return normalizeTaskTimeType(task) === "scheduled"
    ? `${time}${task.endTime ? ` - ${task.endTime}` : ""}`
    : `Hạn ${time}`;
};

// === PHẦN 1: Thẻ task đặt trên biểu đồ chi tiết ngày (Giao diện cũ gọn gàng, bố trí chuẩn) ===
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
  const timeLabel = getTaskTimeLabel(task);

  const tone = task.completed
    ? "bg-[#BBF7D0]"
    : type === "scheduled"
      ? "bg-[#BAE6FD]"
      : type === "deadline"
        ? "bg-[#FECDD3]"
        : "bg-[#FEF08A]";

  return (
    <article
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelectTask(task);
      }}
      className={`group absolute overflow-hidden rounded-[4px] border-[1.5px] border-[#262626] ${tone} p-1.5 shadow-[1.5px_1.5px_0px_#262626] cursor-pointer transition-all hover:z-20 hover:shadow-[3px_3px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
    >
      <div className="flex min-w-0 items-start gap-1.5">
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
          className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border-[1.5px] border-[#262626] bg-white text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] active:scale-90"
        >
          {task.completed && <Check size={11} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1 overflow-hidden">
          <span
            className={`block truncate text-xs font-bold leading-tight text-[#1C1917] ${
              task.completed ? "line-through opacity-60" : ""
            }`}
          >
            {showLabel ? task.title : "..."}
          </span>
          {showLabel && timeLabel && (
            <span className="mt-0.5 block truncate font-mono text-[10px] font-medium text-[#57534E]">
              {timeLabel}
            </span>
          )}
        </div>

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
              className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#262626] bg-white text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] hover:bg-[#FAF8F3] active:scale-95"
            >
              <ArrowRight size={11} strokeWidth={2.4} />
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
            className="flex h-5 w-5 items-center justify-center rounded-[3px] border border-[#BE123C] bg-white text-[#BE123C] shadow-[0.5px_0.5px_0px_#BE123C] hover:bg-[#FFE4E6] active:scale-95"
          >
            <Trash2 size={11} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </article>
  );
};

// === PHẦN 2: Biểu đồ ngày 24 Giờ Siêu Lớn 4X cho Desktop ===
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
      tasks
        .map((task) => ({ task, range: getTaskRange(task) }))
        .filter(
          (
            item,
          ): item is {
            task: TaskDto;
            range: { start: number; end: number };
          } => Boolean(item.range),
        )
        .sort((a, b) => a.range.start - b.range.start),
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
        90,
      ),
    [tasks, effectiveDayDate],
  );

  // Tự động cuộn đến vị trí giờ hiện tại khi mở giao diện lần đầu
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const targetScroll = Math.max(0, currentHourTop - 180);
    timelineScrollRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  const scrollToHour = (hour: number) => {
    if (!timelineScrollRef.current) return;
    timelineScrollRef.current.scrollTo({
      top: Math.max(0, hour * HOUR_ROW_HEIGHT - 60),
      behavior: "smooth",
    });
  };

  const scrollToNow = () => {
    if (!timelineScrollRef.current) return;
    timelineScrollRef.current.scrollTo({
      top: Math.max(0, currentHourTop - 160),
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#262626]/20 pb-2">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1C1917]">
            <ListTodo size={16} strokeWidth={2.4} />
            <span className="text-sm font-bold">Danh sách công việc ({displayListTasks.length})</span>
          </div>

          <div
            className="inline-flex items-center gap-1 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] p-0.5 shadow-[1.5px_1.5px_0px_#262626]"
            role="tablist"
            aria-label="Kiểu hiển thị chi tiết ngày"
          >
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => onDisplayModeChange("chart")}
              className="rounded-[3px] px-3 py-1.5 text-xs font-bold text-[#57534E] transition-all hover:bg-white active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Biểu đồ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected
              className="rounded-[3px] border-[1.5px] border-[#262626] bg-[#1C1917] px-3 py-1.5 text-xs font-bold text-white shadow-[1px_1px_0px_#262626] transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Danh sách
            </button>
          </div>
        </div>

        <TaskList
          tasks={displayListTasks}
          emptyMessage="Chưa có công việc trong ngày này"
          emptySubMessage="Các task của ngày sẽ hiển thị ở đây."
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
    <section className="space-y-3 select-none animate-in fade-in duration-150">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#262626]/20 pb-2.5">
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1C1917]">
          <Clock size={18} strokeWidth={2.4} />
          <span className="text-sm font-black">Biểu đồ trong ngày (24 giờ)</span>
          <span className="font-mono text-xs font-bold text-[#78716C]">
            {timedTasks.length} việc có giờ
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Nút điều hướng nhanh khung giờ */}
          <button
            type="button"
            onClick={scrollToNow}
            title="Cuộn tới giờ hiện tại"
            className="flex items-center gap-1.5 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Compass size={14} strokeWidth={2.4} className="text-[#E11D48]" />
            <span>Bây giờ</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToHour(7)}
            title="Cuộn tới 07:00 sáng"
            className="flex items-center gap-1.5 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Sun size={14} strokeWidth={2.4} className="text-[#D97706]" />
            <span>07h</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToHour(20)}
            title="Cuộn tới 20:00 tối"
            className="flex items-center gap-1.5 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Moon size={14} strokeWidth={2.4} className="text-[#4338CA]" />
            <span>20h</span>
          </button>

          {/* Toggle Chế Độ Biểu Đồ / Danh Sách */}
          <div
            className="inline-flex items-center gap-1 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] p-0.5 shadow-[1.5px_1.5px_0px_#262626]"
            role="tablist"
            aria-label="Kiểu hiển thị chi tiết ngày"
          >
            <button
              type="button"
              role="tab"
              aria-selected
              className="rounded-[3px] border-[1.5px] border-[#262626] bg-[#1C1917] px-3 py-1.5 text-xs font-bold text-white shadow-[1px_1px_0px_#262626] transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Biểu đồ
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={false}
              onClick={() => onDisplayModeChange("list")}
              className="rounded-[3px] px-3 py-1.5 text-xs font-bold text-[#57534E] transition-all hover:bg-white active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              Danh sách
            </button>
          </div>
        </div>
      </div>

      {/* Khay việc cả ngày nếu có */}
      {allDayTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[8px] border-2 border-[#262626] bg-[#F5F2EA] p-3 shadow-[2px_2px_0px_#262626]">
          <span className="font-mono text-xs font-bold uppercase text-[#78716C]">
            Cả ngày ({allDayTasks.length}):
          </span>
          {allDayTasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onSelectTask(task)}
              className={`rounded-[5px] border-[1.5px] border-[#262626] px-3 py-1.5 text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none inline-flex items-center gap-1.5 ${
                task.completed
                  ? "bg-[#BBF7D0] line-through opacity-70"
                  : "bg-white hover:bg-[#FAF8F3]"
              }`}
            >
              <Pin size={12} className="text-[#1C1917] shrink-0" />
              <span>{task.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Khung cuộn Timeline 24 Giờ của Ngày */}
      <div
        ref={timelineScrollRef}
        className="max-h-[68vh] min-h-[480px] overflow-auto rounded-[8px] border-2 border-[#262626] bg-white shadow-[3px_3px_0px_#262626]"
        tabIndex={0}
        aria-label="Vùng cuộn biểu đồ chi tiết ngày"
      >
        <div className="min-w-[750px]">
          <div className="grid grid-cols-[80px_minmax(0,1fr)]">
            {/* Cột Trục Giờ (Left Gutter) */}
            <div
              className="relative border-r-2 border-[#D4CEBF] bg-[#FAF8F3]"
              style={{ height: timelineLayout.totalHeight }}
            >
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end border-b border-[#E7E5E4] pr-2.5 pt-2.5 font-mono text-xs font-bold text-[#78716C]"
                  style={{ top, height }}
                >
                  {formatTime(hour * 60)}
                </div>
              ))}

              {/* Chỉ báo thời gian hiện tại trên trục giờ */}
              {isToday && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-end pr-1.5"
                  style={{ top: currentHourTop - 11 }}
                >
                  <span className="rounded-[4px] bg-[#E11D48] px-2 py-1 font-mono text-xs font-black text-white shadow-md">
                    {formatTime(currentMinutes)}
                  </span>
                </div>
              )}
            </div>

            {/* Cột Lưới Sự Kiện Trong Ngày */}
            <div
              className="relative"
              style={{ height: timelineLayout.totalHeight }}
            >
              {/* Các ô giờ (Bấm để thêm việc) */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  onClick={() => handleCellClick(hour)}
                  className="group/hour absolute left-0 right-0 border-b border-[#E7E5E4] transition-colors hover:bg-[#F3EFE6]/70 cursor-pointer"
                  style={{
                    top: hour * HOUR_ROW_HEIGHT,
                    height: HOUR_ROW_HEIGHT,
                  }}
                  title={`Bấm để thêm việc lúc ${formatTime(hour * 60)}`}
                >
                  {QUARTER_START_MINUTES.map((minute) => (
                    <div
                      key={minute}
                      aria-hidden="true"
                      className="absolute left-0 right-0 border-b border-[#F0ECE1]"
                      style={{
                        top: `${(minute / 60) * 100}%`,
                        height: "25%",
                      }}
                    />
                  ))}

                  <div className="absolute right-3 top-3 hidden items-center gap-1.5 rounded-[4px] border border-[#262626]/20 bg-white/95 px-3 py-1.5 font-mono text-xs font-bold text-[#57534E] shadow-sm group-hover/hour:flex">
                    <Plus size={13} />
                    <span>Thêm việc ({formatTime(hour * 60)})</span>
                  </div>
                </div>
              ))}

              {/* Vạch Đỏ Giờ Hiện Tại (Current Time Red Line) */}
              {isToday && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 h-[3px] bg-[#E11D48] shadow-[0_0_8px_#E11D48]"
                  style={{ top: currentHourTop }}
                >
                  <span className="absolute -left-1.5 -top-[5px] h-3.5 w-3.5 rounded-full border-2 border-white bg-[#E11D48]" />
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
                    left: `calc(${segment.left}% + 2px)`,
                    width: `calc(${segment.width}% - 4px)`,
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
