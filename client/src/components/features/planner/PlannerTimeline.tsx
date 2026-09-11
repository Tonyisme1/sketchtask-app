import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Compass,
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
const HOUR_HEIGHT = 260; // Kích thước siêu lớn (gấp 4 lần), cực kỳ rộng rãi và trực quan
const QUARTER_START_MINUTES = [0, 15, 30, 45];

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
  onDeleteTask: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
}

// === PHẦN 1: Thẻ task hiển thị trong ô giờ của timeline (Giao diện cũ gọn gàng, bố trí chuẩn) ===
const TimelineTaskCard: React.FC<TimelineTaskCardProps> = ({
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
  const timeLabel =
    type === "scheduled" && time
      ? `${time}${task.endTime ? ` - ${task.endTime}` : ""}`
      : time
        ? `Hạn ${time}`
        : "";

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

// === PHẦN 2: Lưới Thời khóa biểu 7 Cột Tuần Siêu Lớn 4X cho Desktop ===
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

      // Kiểm tra có task sáng sớm (00:00 - 06:00) hoặc đêm muộn (22:00 - 24:00)
      const hasEarlyOrNightTasks = timedTasks.some((t) => {
        const range = getTaskTimelineRangeForDate(t, day.dateStr);
        return range ? range.start < 360 || range.end > 1320 : false;
      });

      const layout = buildTimelineGridLayout(
        timedTasks,
        (task) => getTaskTimelineRangeForDate(task, day.dateStr),
        HOUR_HEIGHT,
        85,
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

  // Kiểm tra toàn tuần có việc ngoài giờ (00:00 - 06:00 hoặc sau 22:00) không
  const hasOffHoursTasksInWeek = useMemo(() => {
    return daysLayoutData.some((d) => d.hasEarlyOrNightTasks);
  }, [daysLayoutData]);

  // Tự động cuộn đến vị trí giờ hiện tại khi mở giao diện lần đầu
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const targetScroll = Math.max(0, currentHourTop - 180);
    timelineScrollRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  // Điều hướng nhanh đến các khung giờ
  const scrollToHour = (hour: number) => {
    if (!timelineScrollRef.current) return;
    timelineScrollRef.current.scrollTo({
      top: Math.max(0, hour * HOUR_HEIGHT - 60),
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
    <div className="w-full space-y-3 select-none animate-in fade-in duration-150">
      {/* 1. Header Toolbar của Lịch Trình Tuần */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-[#262626]/20 pb-2.5">
        <div className="flex items-center gap-2.5 text-sm font-bold text-[#1C1917]">
          <Clock size={18} strokeWidth={2.4} />
          <span className="text-sm font-black">Thời khóa biểu 7 ngày (24 giờ)</span>
          {hasOffHoursTasksInWeek && (
            <span className="rounded-[4px] border border-[#CA8A04] bg-[#FEF08A] px-2.5 py-1 text-xs font-bold text-[#854D0E] shadow-sm">
              🌙 Có việc sáng sớm / đêm muộn
            </span>
          )}
        </div>

        {/* Nút điều hướng nhanh khung giờ */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={scrollToNow}
            title="Cuộn tới giờ hiện tại"
            className="flex items-center gap-1.5 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Compass size={14} strokeWidth={2.4} className="text-[#E11D48]" />
            <span>Bây giờ ({formatTime(currentMinutes)})</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToHour(7)}
            title="Cuộn tới 07:00 sáng"
            className="flex items-center gap-1.5 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Sun size={14} strokeWidth={2.4} className="text-[#D97706]" />
            <span>Ban ngày (07h)</span>
          </button>

          <button
            type="button"
            onClick={() => scrollToHour(20)}
            title="Cuộn tới 20:00 tối"
            className="flex items-center gap-1.5 rounded-[5px] border-2 border-[#262626] bg-[#FAF8F3] px-3 py-1.5 text-xs font-bold text-[#1C1917] shadow-[2px_2px_0px_#262626] transition-all hover:bg-white active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            <Moon size={14} strokeWidth={2.4} className="text-[#4338CA]" />
            <span>Ban đêm (20h)</span>
          </button>
        </div>
      </div>

      {/* 2. Container Lưới 7 Cột Tuần Cuộn Thông Minh Cỡ Lớn */}
      <div
        ref={timelineScrollRef}
        className="max-h-[78vh] min-h-[550px] overflow-auto rounded-[8px] border-2 border-[#262626] bg-white shadow-[3px_3px_0px_#262626]"
        tabIndex={0}
        aria-label="Khung cuộn thời khóa biểu tuần"
      >
        <div className="min-w-[1680px]">
          {/* A. Sticky Header: 7 Cột Tiêu Đề Ngày Cỡ Lớn */}
          <div className="sticky top-0 z-30 grid grid-cols-[80px_repeat(7,minmax(220px,1fr))] border-b-2 border-[#262626] bg-[#FAF8F3] shadow-md">
            {/* Cột mốc giờ góc trái */}
            <div className="flex flex-col items-center justify-center border-r-2 border-[#D4CEBF] bg-[#F5F2EA] p-2 font-mono text-xs font-bold text-[#78716C]">
              <span className="text-sm font-black">GIỜ</span>
              <span className="text-[10px] text-[#A8A29E]">24H</span>
            </div>

            {/* 7 Cột ngày Thứ 2 -> Chủ Nhật */}
            {daysLayoutData.map(
              ({
                day,
                allTasks,
                completedCount,
                scheduledCount,
                deadlineCount,
              }) => {
                const isSelected = day.dateStr === selectedDateStr;
                const isToday = day.isToday;
                const progressPercent =
                  allTasks.length > 0
                    ? Math.round((completedCount / allTasks.length) * 100)
                    : 0;

                return (
                  <div
                    key={day.dateStr}
                    className={`relative flex flex-col justify-between border-r-2 border-[#D4CEBF] p-3 transition-colors last:border-r-0 ${
                      isSelected
                        ? "bg-[#1C1917] text-white"
                        : isToday
                          ? "bg-[#FEF9C3]/60"
                          : "bg-[#FAF8F3]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? "text-white" : "text-[#1C1917]"
                          }`}
                        >
                          {day.dayName}
                        </span>
                        <span
                          className={`text-lg font-black ${
                            isSelected
                              ? "text-[#FEF08A]"
                              : isToday
                                ? "text-[#E11D48]"
                                : "text-[#57534E]"
                          }`}
                        >
                          {day.dayNum}
                        </span>
                      </div>

                      {isToday && (
                        <span className="rounded-[3px] bg-[#E11D48] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                          Hôm nay
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-xs">
                      <span
                        className={
                          isSelected ? "text-[#D6D3D1]" : "text-[#78716C]"
                        }
                      >
                        {allTasks.length} việc
                        {scheduledCount > 0 && ` · ${scheduledCount} hẹn`}
                        {deadlineCount > 0 && ` · ${deadlineCount} hạn`}
                      </span>

                      <button
                        type="button"
                        onClick={() => onSelectDate(day.dateStr)}
                        title="Xem chi tiết ngày"
                        className={`rounded-[4px] px-2 py-1 text-xs font-bold transition-all shadow-sm ${
                          isSelected
                            ? "bg-white text-[#1C1917] hover:bg-[#FEF08A]"
                            : "border border-[#262626]/40 bg-white text-[#1C1917] hover:bg-[#E7E5E4]"
                        }`}
                      >
                        Chi tiết ➔
                      </button>
                    </div>

                    {/* Thanh tiến độ */}
                    <div
                      className={`mt-2 h-2 w-full overflow-hidden rounded-[3px] border border-[#262626]/40 ${
                        isSelected ? "bg-[#44403C]" : "bg-[#E7E5E4]"
                      }`}
                    >
                      <div
                        className={`h-full ${
                          isSelected ? "bg-[#FEF08A]" : "bg-[#16A34A]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* B. Hàng Việc Cả Ngày (All-day Tasks Row) Cỡ Lớn */}
          <div className="grid grid-cols-[80px_repeat(7,minmax(220px,1fr))] border-b-2 border-[#262626] bg-[#F5F2EA]/90">
            <div className="flex items-center justify-center border-r-2 border-[#D4CEBF] px-2 py-2 font-mono text-xs font-bold text-[#78716C]">
              CẢ NGÀY
            </div>

            {daysLayoutData.map(({ day, allDayTasks }) => (
              <div
                key={`allday-${day.dateStr}`}
                className="min-h-[44px] space-y-1.5 border-r-2 border-[#D4CEBF] p-2 last:border-r-0"
              >
                {allDayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onSelectTask(t)}
                    className={`block w-full truncate rounded-[5px] border-[1.5px] border-[#262626] px-2.5 py-1 text-left text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                      t.completed
                        ? "bg-[#BBF7D0] line-through opacity-70"
                        : "bg-white hover:bg-[#FAF8F3]"
                    }`}
                  >
                    📌 {t.title}
                  </button>
                ))}
                {allDayTasks.length > 3 && (
                  <span className="block text-center font-mono text-xs font-bold text-[#78716C]">
                    +{allDayTasks.length - 3} việc khác
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* C. Thân Lưới 24 Giờ & 7 Cột Lịch Trình Cỡ Siêu Lớn */}
          <div className="relative grid grid-cols-[80px_repeat(7,minmax(220px,1fr))] bg-white">
            {/* Cột Trục Giờ (Left Gutter) */}
            <div
              className="relative border-r-2 border-[#D4CEBF] bg-[#FAF8F3]"
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end border-b border-[#E7E5E4] pr-2.5 pt-2.5 font-mono text-xs font-bold text-[#78716C]"
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
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-end pr-1.5"
                style={{ top: currentHourTop - 11 }}
              >
                <span className="rounded-[4px] bg-[#E11D48] px-2 py-1 font-mono text-xs font-black text-white shadow-md">
                  {formatTime(currentMinutes)}
                </span>
              </div>
            </div>

            {/* 7 Cột Timeline Tương Ứng 7 Ngày */}
            {daysLayoutData.map(({ day, layout }) => (
              <div
                key={`timeline-${day.dateStr}`}
                className={`relative border-r-2 border-[#D4CEBF] last:border-r-0 ${
                  day.isToday ? "bg-[#FEF9C3]/15" : ""
                }`}
                style={{ height: hours.length * HOUR_HEIGHT }}
              >
                {/* Các ô giờ (Click để thêm task mới) */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => handleCellClick(day.dateStr, hour)}
                    className="group/hour absolute left-0 right-0 border-b border-[#E7E5E4] transition-colors hover:bg-[#F3EFE6]/70 cursor-pointer"
                    style={{
                      top: hour * HOUR_HEIGHT,
                      height: HOUR_HEIGHT,
                    }}
                    title={`Bấm để thêm việc lúc ${formatTime(hour * 60)}`}
                  >
                    {/* Vạch kẻ chia 15 phút */}
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

                    {/* Nút cộng mờ xuất hiện khi hover ô giờ */}
                    <div className="absolute right-2.5 top-2.5 hidden items-center gap-1.5 rounded-[4px] border border-[#262626]/20 bg-white/95 px-2.5 py-1 font-mono text-xs font-bold text-[#57534E] shadow-sm group-hover/hour:flex">
                      <Plus size={13} />
                      <span>Thêm {formatTime(hour * 60)}</span>
                    </div>
                  </div>
                ))}

                {/* Vạch Đỏ Giờ Hiện Tại (Current Time Red Line) nếu là Hôm Nay */}
                {day.isToday && (
                  <div
                    className="pointer-events-none absolute left-0 right-0 z-20 h-[3px] bg-[#E11D48] shadow-[0_0_8px_#E11D48]"
                    style={{ top: currentHourTop }}
                  >
                    <span className="absolute -left-1.5 -top-[5px] h-3.5 w-3.5 rounded-full border-2 border-white bg-[#E11D48]" />
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
