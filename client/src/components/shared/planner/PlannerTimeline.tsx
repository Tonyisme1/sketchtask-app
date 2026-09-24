// ==========================================
// COMPONENT: PlannerTimeline (Desktop 7-Day Responsive Timeline Grid)
// ==========================================

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Clock,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { TaskDto, TaskItemType } from "../../../types";
import {
  getTaskEffectiveTime,
  getTaskEffectiveEndTime,
  getTaskItemType,
  getTaskCardVisualStyle,
} from "../../../utils/taskSemantics";
import { getLocalTodayStr } from "../../../utils/date";
import {
  buildTimelineGridLayout,
  PositionedScheduledBlock,
  PositionedDeadlineMarker,
} from "./plannerTimelineLayout";
import { useAppStore } from "../../../stores/appStore";
import { TimelineTaskOverflowPopover } from "./TimelineTaskOverflowPopover";
import { PlannerQuickCreatePopover } from "./PlannerQuickCreatePopover";
import {
  formatDuration,
  getTimelineDropUpdates,
  getTimelineResizeUpdates,
} from "./timelineDragAndDrop";

interface TimelineDay {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

export interface ResizingState {
  taskId: string;
  edge: "top" | "bottom";
  startY: number;
  originalStartMinutes: number;
  originalEndMinutes: number;
  currentStartMinutes: number;
  currentEndMinutes: number;
  dateStr: string;
}

interface PlannerTimelineProps {
  weekDays: TimelineDay[];
  selectedDateStr?: string;
  previewedTaskId?: string | null;
  getTasksForDate: (dateStr: string) => TaskDto[];
  onSelectDate: (dateStr: string) => void;
  onOpenDay?: (dateStr: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskDto>) => void;
  onPreviewTask?: (task: TaskDto, anchorRect?: DOMRect | null) => void;
  calendarItemType?: TaskItemType;
}

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 64; // Chiều cao 64px/giờ chuẩn Google Calendar
const MIN_LANE_HEIGHT = 24;
const DRAG_START_DISTANCE_PX = 6;

type PointerDragState = {
  taskId: string;
  task: TaskDto;
  durationMinutes: number;
  originalStartMinutes: number;
  originalDateStr: string;
  currentStartMinutes: number;
  currentDateStr: string;
  offsetMinutes: number;
  startX: number;
  startY: number;
  isEvent: boolean;
  isCompleted: boolean;
  dragging: boolean;
};

const formatTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

// Quick view is positioned from the full day column, not the pre-focus lane.
// The selected card expands to this width immediately after opening.
const getPreviewAnchorRect = (cardElement: HTMLElement): DOMRect => {
  const cardRect = cardElement.getBoundingClientRect();
  const columnRect = cardElement
    .closest<HTMLElement>("[data-timeline-column]")
    ?.getBoundingClientRect();

  if (!columnRect) return cardRect;

  return new DOMRect(
    columnRect.left,
    cardRect.top,
    columnRect.width,
    cardRect.height,
  );
};

// === PHẦN 1: Thẻ Khối Thời Gian (Scheduled Block) Có Kéo Thả & Kéo To Nhỏ ===
const ScheduledBlockCard: React.FC<{
  block: PositionedScheduledBlock;
  dateStr: string;
  isActive?: boolean;
  isGhost?: boolean;
  resizingState?: ResizingState | null;
  onOpenPopover: (task: TaskDto, rect: DOMRect) => void;
  onStartPointerDrag: (
    event: React.PointerEvent<HTMLElement>,
    task: TaskDto,
    duration: number,
    startM: number,
    offsetM: number,
    pointerOrigin?: { x: number; y: number },
  ) => void;
  onStartResize: (event: React.PointerEvent<HTMLElement>, task: TaskDto, edge: "top" | "bottom", dateStr: string) => void;
  onToggleComplete: (taskId: string) => void;
}> = ({
  block,
  dateStr,
  isActive,
  isGhost,
  resizingState,
  onOpenPopover,
  onStartPointerDrag,
  onStartResize,
  onToggleComplete,
}) => {
  const suppressClickRef = useRef(false);
  const pointerStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const pointerDragStartedRef = useRef(false);
  const { task } = block;
  const time = getTaskEffectiveTime(task);
  const isEvent = getTaskItemType(task) === "event";
  const isPastEvent = isEvent && dateStr < getLocalTodayStr();
  const isCompleted = !isEvent && task.completed;
  const hasMultipleLanes = block.laneCount > 1;

  const isBeingResized = Boolean(resizingState && resizingState.taskId === task.id);
  const effectiveTop = isBeingResized
    ? (resizingState!.currentStartMinutes / 60) * HOUR_HEIGHT
    : block.top;
  const effectiveHeight = isBeingResized
    ? Math.max(MIN_LANE_HEIGHT, ((resizingState!.currentEndMinutes - resizingState!.currentStartMinutes) / 60) * HOUR_HEIGHT)
    : block.height;

  const displayStart = isBeingResized
    ? formatTime(resizingState!.currentStartMinutes)
    : time;
  const displayEnd = isBeingResized
    ? formatTime(resizingState!.currentEndMinutes)
    : getTaskEffectiveEndTime(task);

  const isCompact = effectiveHeight < 60;
  const isTight = effectiveHeight < 32;

  // Event/task color is semantic, independent from scheduled/deadline time data.
  const visualStyle = getTaskCardVisualStyle(task);
  const tone = `border-none shadow-xs rounded-2xl hover:brightness-105 ${isCompleted ? "opacity-55" : isPastEvent ? "opacity-60" : ""}`;

  const duration = block.durationMinutes || 60;

  if (isGhost) {
    return (
      <article
        style={{
          ...visualStyle,
          top: block.top,
          left: `calc(${block.left}% + 1px)`,
          width: `calc(${block.width}% - 2px)`,
          height: block.height,
          zIndex: 10,
        }}
        className={`group absolute overflow-visible select-none pointer-events-none opacity-30 ${tone} ${
          isTight ? "px-1 py-0" : isCompact ? "px-1.5 py-1" : "p-2"
        }`}
      >
        <div className="flex min-w-0 h-full overflow-hidden flex-col justify-between">
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <span className="truncate text-[10.5px] font-bold font-mono">
              {time}{getTaskEffectiveEndTime(task) ? ` - ${getTaskEffectiveEndTime(task)}` : ""}
            </span>
          </div>
          <div className="min-w-0 overflow-hidden mt-1 flex-1">
            <p className="truncate text-xs font-bold leading-tight">{task.title}</p>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        ...visualStyle,
        top: effectiveTop,
        // The selected card temporarily owns its time cell so the quick view has
        // an unambiguous visual source even when several cards share that slot.
        left: isActive ? "0%" : hasMultipleLanes ? `calc(${block.left}% + 1px)` : "0%",
        width: isActive ? "100%" : hasMultipleLanes ? `calc(${block.width}% - 2px)` : "100%",
        height: effectiveHeight,
        zIndex: isBeingResized ? 60 : isActive ? 70 : (block.zIndex ?? 10),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (suppressClickRef.current || isBeingResized) {
          suppressClickRef.current = false;
          return;
        }
        onOpenPopover(task, getPreviewAnchorRect(e.currentTarget as HTMLElement));
      }}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(event) => {
        if (event.button === 0 && !(event.target as HTMLElement).closest("button") && !(event.target as HTMLElement).closest("[data-resize-handle]")) {
          pointerStartRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
          pointerDragStartedRef.current = false;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }
      }}
      onPointerMove={(event) => {
        const start = pointerStartRef.current;
        if (!start || start.pointerId !== event.pointerId || pointerDragStartedRef.current) return;

        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (distance < DRAG_START_DISTANCE_PX) return;

        pointerDragStartedRef.current = true;
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const clickOffsetMinutes = Math.max(
          0,
          Math.min(duration, Math.round(((start.y - rect.top) / HOUR_HEIGHT) * 60)),
        );
        onStartPointerDrag(
          event,
          task,
          duration,
          (block.top / HOUR_HEIGHT) * 60,
          clickOffsetMinutes,
          { x: start.x, y: start.y },
        );
      }}
      onPointerUp={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start || start.pointerId !== event.pointerId || isBeingResized) return;

        event.currentTarget.releasePointerCapture?.(event.pointerId);
        if (pointerDragStartedRef.current) {
          pointerDragStartedRef.current = false;
          return;
        }
        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (distance >= DRAG_START_DISTANCE_PX) return;

        // A click opens quick view; a moved pointer is reserved for drag-and-drop.
        suppressClickRef.current = true;
        onOpenPopover(task, getPreviewAnchorRect(event.currentTarget as HTMLElement));
      }}
      title={`${isEvent ? "Sự kiện" : "Lịch hẹn"}: ${displayStart || ""}${displayEnd ? ` - ${displayEnd}` : ""} · ${task.title}`}
      className={`group absolute overflow-visible shadow-sm select-none transition-[box-shadow,opacity] cursor-grab active:cursor-grabbing ${
        isBeingResized ? "ring-2 ring-[var(--accent-blue)] shadow-xl !z-50 cursor-ns-resize" : ""
      } ${
        isTight ? "px-1 py-0" : isCompact ? "px-1.5 py-1" : "p-2"
      } ${
        isActive ? "ring-2 ring-[var(--accent-blue)] shadow-md !z-40" : ""
      } ${tone}`}
    >
      {/* Live Resizing Tooltip Time Indicator */}
      {isBeingResized && (
        <div className="absolute -top-7.5 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-3 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xl border-none flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in duration-75">
          <Clock size={11} strokeWidth={2.4} />
          <span>{displayStart} - {displayEnd}</span>
          <span className="opacity-75">({formatDuration(resizingState!.currentStartMinutes, resizingState!.currentEndMinutes)})</span>
        </div>
      )}

      {/* Top Resize Handle (Kéo viền trên trong suốt để đổi giờ bắt đầu) */}
      {!isCompleted && (
        <div
          data-resize-handle="top"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e, task, "top", dateStr);
          }}
          className="absolute top-0 left-0 right-0 h-2.5 cursor-ns-resize z-20 touch-none"
          title="Kéo viền trên để đổi giờ bắt đầu"
        />
      )}

      <div className={`flex min-w-0 h-full overflow-hidden ${
        isCompact ? "flex-row items-center gap-1" : "flex-col justify-between"
      }`}>
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          {!isEvent && (
            <button
              type="button"
              aria-label={task.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
              aria-pressed={task.completed}
              onClick={(event) => {
                event.stopPropagation();
                onToggleComplete(task.id);
              }}
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border border-current/50 transition-colors ${
                task.completed ? "bg-current text-[var(--bg-surface)]" : "bg-transparent"
              }`}
            >
              {task.completed && <Check size={10} strokeWidth={3} />}
            </button>
          )}

          <span className="truncate text-[10.5px] font-bold font-mono text-current">
            {displayStart}
            {displayEnd && ` - ${displayEnd}`}
          </span>
        </div>

        <div className={`min-w-0 overflow-hidden ${isCompact ? "flex-1" : "mt-1 flex-1"}`}>
          <p
            className={`truncate text-xs font-bold leading-tight ${
              isCompleted ? "line-through text-current" : "text-current"
            }`}
          >
            {task.title}
          </p>
        </div>
      </div>

      {/* Bottom Resize Handle (Kéo viền dưới trong suốt để đổi thời lượng) */}
      {!isCompleted && (
        <div
          data-resize-handle="bottom"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e, task, "bottom", dateStr);
          }}
          className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize z-20 touch-none"
          title="Kéo viền dưới để đổi thời lượng / giờ kết thúc"
        />
      )}
    </article>
  );
};

// === PHẦN 2: Thẻ Marker Hạn Chót (Deadline Marker Point) ===
const DeadlineMarkerCard: React.FC<{
  marker: PositionedDeadlineMarker;
  dateStr: string;
  isActive?: boolean;
  isGhost?: boolean;
  onOpenPopover: (task: TaskDto, rect: DOMRect) => void;
  onOpenOverflow?: (tasks: TaskDto[], rect: DOMRect) => void;
  onStartPointerDrag: (
    event: React.PointerEvent<HTMLElement>,
    task: TaskDto,
    duration: number,
    startM: number,
    offsetM: number,
    pointerOrigin?: { x: number; y: number },
  ) => void;
  onStartResize?: (
    event: React.PointerEvent<HTMLElement>,
    task: TaskDto,
    edge: "top" | "bottom",
    dateStr: string,
  ) => void;
  onToggleComplete: (taskId: string) => void;
}> = ({
  marker,
  dateStr,
  isActive,
  isGhost,
  onOpenPopover,
  onOpenOverflow,
  onStartPointerDrag,
  onStartResize,
  onToggleComplete,
}) => {
  const { task } = marker;
  const isEvent = getTaskItemType(task) === "event";
  const isCompleted = !isEvent && task.completed;
  const suppressClickRef = useRef(false);
  const pointerStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const pointerDragStartedRef = useRef(false);
  const hasMultipleLanes = marker.laneCount > 1;

  const visualStyle = getTaskCardVisualStyle(task);
  const tone = `border-none shadow-xs rounded-xl hover:brightness-105 ${isCompleted ? "opacity-55" : ""}`;

  if (isGhost) {
    return (
      <article
        style={{
          ...visualStyle,
          top: marker.top,
          left: `calc(${marker.left}% + 1px)`,
          width: `calc(${marker.width}% - 2px)`,
          height: 25,
          zIndex: 10,
        }}
        className={`group absolute flex items-center overflow-hidden ${tone} px-2 select-none pointer-events-none opacity-30`}
      >
        <div className="flex min-w-0 items-center gap-1.5 flex-1 overflow-hidden">
          <span className="font-mono text-[10px] font-bold shrink-0">{marker.time}</span>
          <span className="truncate text-xs font-bold leading-none">{task.title}</span>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        ...visualStyle,
        top: marker.top,
        left: isActive ? "0%" : hasMultipleLanes ? `calc(${marker.left}% + 1px)` : "0%",
        width: isActive ? "100%" : hasMultipleLanes ? `calc(${marker.width}% - 2px)` : "100%",
        height: 25,
        zIndex: isActive ? 70 : (marker.zIndex ?? 10),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onOpenPopover(task, getPreviewAnchorRect(e.currentTarget as HTMLElement));
      }}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(event) => {
        if (
          event.button === 0 &&
          !(event.target as HTMLElement).closest("button") &&
          !(event.target as HTMLElement).closest("[data-resize-handle]")
        ) {
          pointerStartRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
          };
          pointerDragStartedRef.current = false;
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }
      }}
      onPointerMove={(event) => {
        const start = pointerStartRef.current;
        if (!start || start.pointerId !== event.pointerId || pointerDragStartedRef.current) return;

        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (distance < DRAG_START_DISTANCE_PX) return;

        pointerDragStartedRef.current = true;
        onStartPointerDrag(
          event,
          task,
          30,
          (marker.top / HOUR_HEIGHT) * 60,
          0,
          { x: start.x, y: start.y },
        );
      }}
      onPointerUp={(event) => {
        const start = pointerStartRef.current;
        pointerStartRef.current = null;
        if (!start || start.pointerId !== event.pointerId) return;

        event.currentTarget.releasePointerCapture?.(event.pointerId);
        if (pointerDragStartedRef.current) {
          pointerDragStartedRef.current = false;
          return;
        }
        const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y);
        if (distance >= DRAG_START_DISTANCE_PX) return;

        suppressClickRef.current = true;
        onOpenPopover(task, getPreviewAnchorRect(event.currentTarget as HTMLElement));
      }}
      title={`Hạn chót: ${marker.time} · ${task.title}${marker.overflowCount ? ` (+${marker.overflowCount} việc khác)` : ""}`}
      className={`group absolute flex items-center overflow-hidden ${tone} px-2 shadow-sm transition-all select-none cursor-grab active:cursor-grabbing ${
        isActive ? "ring-2 ring-[var(--accent-blue)] shadow-md !z-40" : ""
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1.5 w-full overflow-hidden">
        <div className="flex min-w-0 items-center gap-1.5 flex-1 overflow-hidden">
          {!isEvent && (
            <button
              type="button"
              aria-label={task.completed ? "Đánh dấu chưa hoàn thành" : "Đánh dấu đã hoàn thành"}
              aria-pressed={task.completed}
              onClick={(event) => {
                event.stopPropagation();
                onToggleComplete(task.id);
              }}
              className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[4px] border border-white/80 transition-colors ${
                task.completed ? "bg-white text-[var(--accent-blue)]" : "bg-transparent"
              }`}
            >
              {task.completed && <Check size={10} strokeWidth={3} />}
            </button>
          )}

          <span className="font-mono text-[10px] font-bold text-current shrink-0">
            {marker.time}
          </span>

          <span
            className={`truncate text-xs font-bold leading-none ${
              isCompleted ? "line-through text-current" : "text-current"
            }`}
          >
            {task.title}
          </span>
        </div>

        {Boolean(marker.overflowCount && marker.overflowCount > 0) && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (marker.hiddenTasks?.length && onOpenOverflow) {
                onOpenOverflow(marker.hiddenTasks, (event.currentTarget as HTMLElement).getBoundingClientRect());
              }
            }}
            className="shrink-0 rounded-full bg-[var(--accent-blue)] px-2 py-0.5 font-mono text-[9px] font-bold text-white shadow-2xs cursor-pointer"
            title={`+${marker.overflowCount} hạn chót khác`}
          >
            +{marker.overflowCount}
          </button>
        )}
      </div>

      {/* Tay cầm kéo dãn (Resize handle) ở cạnh dưới để kéo dài hạn chót thành khung giờ */}
      {!isCompleted && onStartResize && (
        <div
          data-resize-handle="bottom"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e, task, "bottom", dateStr);
          }}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 touch-none"
          title="Kéo viền dưới để kéo dài thành khung giờ làm việc"
        />
      )}
    </article>
  );
};

// === PHẦN 3: Lưới Thời khóa biểu 7 Cột Tuần Responsive cho Desktop ===
export const PlannerTimeline: React.FC<PlannerTimelineProps> = ({
  weekDays,
  selectedDateStr,
  previewedTaskId,
  getTasksForDate,
  onSelectDate,
  onOpenDay,
  onToggleTask,
  onUpdateTask,
  onPreviewTask,
  calendarItemType = "task",
}) => {
  const { addTask, openQuickTaskModal, openTaskDetail, activeDetailTaskId } = useAppStore();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggingTaskState, setDraggingTaskState] = useState<PointerDragState | null>(null);
  const pointerDragRef = useRef<PointerDragState | null>(null);

  const [resizingState, setResizingState] = useState<ResizingState | null>(null);
  const resizingStateRef = useRef<ResizingState | null>(null);

  // Trạng thái mở rộng Hàng Cả ngày độc lập theo từng dateStr
  const [expandedAllDayDates, setExpandedAllDayDates] = useState<Record<string, boolean>>({});
  const [overflowPopover, setOverflowPopover] = useState<{
    tasks: TaskDto[];
    anchorRect: DOMRect;
  } | null>(null);

  // Trạng thái tạo việc 60 phút trực tiếp trên lưới kết hợp thẻ Popover nổi
  const [draftTask, setDraftTask] = useState<{
    dateStr: string;
    hour: number;
    startMinutes: number;
    endMinutes: number;
    title: string;
    itemType: TaskItemType;
    anchorRect: DOMRect | null;
  } | null>(null);

  // The detail panel owns the workspace while it is open, so an empty-cell
  // click cannot leave a competing quick-create popover behind it.
  useEffect(() => {
    if (activeDetailTaskId) {
      setDraftTask(null);
    }
  }, [activeDetailTaskId]);

  const handleCancelDraft = useCallback(() => {
    if (!draftTask) return;
    if (draftTask.title.trim().length > 0) {
      const confirmDiscard = window.confirm(
        "Bạn có nội dung chưa lưu. Bạn có chắc muốn hủy bỏ?"
      );
      if (!confirmDiscard) {
        return;
      }
    }
    setDraftTask(null);
  }, [draftTask]);

  const handleSaveDraft = useCallback(() => {
    if (!draftTask) return;
    const trimmedTitle = draftTask.title.trim();
    if (!trimmedTitle) {
      setDraftTask(null);
      return;
    }
    addTask({
      title: trimmedTitle,
      dueDate: draftTask.dateStr,
      itemType: draftTask.itemType,
      timeType: draftTask.itemType === "event" ? "event" : "scheduled",
      startTime: formatTime(draftTask.startMinutes),
      endTime: formatTime(draftTask.endMinutes),
      status: "todo",
      completed: false,
    });
    setDraftTask(null);
  }, [draftTask, addTask]);

  const handleOpenFullDetailFromDraft = useCallback(() => {
    if (!draftTask) return;
    openTaskDetail("new", {
      title: draftTask.title,
      dueDate: draftTask.dateStr,
      itemType: draftTask.itemType,
      timeType: draftTask.itemType === "event" ? "event" : "scheduled",
      startTime: formatTime(draftTask.startMinutes),
      endTime: formatTime(draftTask.endMinutes),
    });
    setDraftTask(null);
  }, [draftTask, openTaskDetail]);

  const handleHourCellClick = (
    event: React.MouseEvent<HTMLDivElement>,
    dateStr: string,
    hour: number
  ) => {
    if (activeDetailTaskId) return;

    if (draftTask && draftTask.title.trim().length > 0) {
      if (draftTask.dateStr === dateStr && draftTask.hour === hour) {
        return;
      }
      const confirmDiscard = window.confirm(
        "Bạn có nội dung chưa lưu. Bạn có chắc muốn hủy bỏ?"
      );
      if (!confirmDiscard) {
        return;
      }
    }
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setDraftTask({
      dateStr,
      hour,
      startMinutes: hour * 60,
      endMinutes: Math.min(24 * 60, (hour + 1) * 60),
      title: "",
      itemType: calendarItemType,
      anchorRect: rect,
    });
  };

  const toggleExpandAllDay = (dateStr: string) => {
    setExpandedAllDayDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  // Cập nhật giờ hiện tại mỗi 60 giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentHourTop = (currentMinutes / 60) * HOUR_HEIGHT;

  // Tính toán trước layout timeline cho cả 7 ngày trong tuần
  const daysLayoutData = useMemo(() => {
    return weekDays.map((day) => {
      const allTasks = getTasksForDate(day.dateStr);
      const allDayTasks = allTasks.filter(
        (task) => !getTaskEffectiveTime(task),
      );

      const layout = buildTimelineGridLayout(
        allTasks,
        day.dateStr,
        HOUR_HEIGHT,
        MIN_LANE_HEIGHT,
      );

      return {
        day,
        allTasks,
        allDayTasks,
        layout,
      };
    });
  }, [weekDays, getTasksForDate]);

  const taskById = useMemo(() => {
    const map = new Map<string, TaskDto>();
    daysLayoutData.forEach(({ allTasks }) => {
      allTasks.forEach((task) => map.set(task.id, task));
    });
    return map;
  }, [daysLayoutData]);

  const handleStartResize = (
    event: React.PointerEvent<HTMLElement>,
    task: TaskDto,
    edge: "top" | "bottom",
    dateStr: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const dayData = daysLayoutData.find((d) => d.day.dateStr === dateStr);
    const block = dayData?.layout.scheduledBlocks.find((b) => b.task.id === task.id);
    const marker = dayData?.layout.deadlineMarkers.find((m) => m.task.id === task.id);
    const startM = block
      ? Math.round((block.top / HOUR_HEIGHT) * 60)
      : marker
      ? Math.round((marker.top / HOUR_HEIGHT) * 60)
      : 9 * 60;
    const duration = block?.durationMinutes || 15;
    const endM = startM + duration;

    const state: ResizingState = {
      taskId: task.id,
      edge,
      startY: event.clientY,
      originalStartMinutes: startM,
      originalEndMinutes: endM,
      currentStartMinutes: startM,
      currentEndMinutes: endM,
      dateStr,
    };

    resizingStateRef.current = state;
    setResizingState(state);
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      // 1. Xử lý Kéo To / Nhỏ (Resizing)
      if (resizingStateRef.current) {
        event.preventDefault();
        const r = resizingStateRef.current;
        const deltaY = event.clientY - r.startY;
        const deltaMinutes = Math.round((deltaY / HOUR_HEIGHT) * 4) * 15;

        let nextStart = r.originalStartMinutes;
        let nextEnd = r.originalEndMinutes;

        if (r.edge === "top") {
          nextStart = Math.max(0, Math.min(r.originalEndMinutes - 15, r.originalStartMinutes + deltaMinutes));
        } else {
          nextEnd = Math.min(24 * 60, Math.max(r.originalStartMinutes + 15, r.originalEndMinutes + deltaMinutes));
        }

        if (nextStart !== r.currentStartMinutes || nextEnd !== r.currentEndMinutes) {
          const updated = {
            ...r,
            currentStartMinutes: nextStart,
            currentEndMinutes: nextEnd,
          };
          resizingStateRef.current = updated;
          setResizingState(updated);
        }
        return;
      }

      // 2. Xử lý Kéo Thẻ (Dragging - Di chuyển thẻ trực tiếp trong lưới thời gian)
      const drag = pointerDragRef.current;
      if (!drag) return;

      if (!drag.dragging) {
        const distance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
        if (distance < 4) return;
        drag.dragging = true;
      }

      event.preventDefault();
      const columns = Array.from(
        document.querySelectorAll<HTMLElement>("[data-timeline-column]")
      );
      const targetCol = columns.find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right;
      });

      if (targetCol && targetCol.dataset.timelineDate) {
        const targetDateStr = targetCol.dataset.timelineDate;
        const colRect = targetCol.getBoundingClientRect();
        const mouseY = event.clientY - colRect.top;
        const rawMinutes = (mouseY / HOUR_HEIGHT) * 60 - drag.offsetMinutes;
        const snappedMinutes = Math.max(
          0,
          Math.min(24 * 60 - drag.durationMinutes, Math.round(rawMinutes / 15) * 15)
        );

        if (snappedMinutes !== drag.currentStartMinutes || targetDateStr !== drag.currentDateStr) {
          drag.currentStartMinutes = snappedMinutes;
          drag.currentDateStr = targetDateStr;
          setDraggingTaskState({ ...drag });
        } else if (!draggingTaskState) {
          setDraggingTaskState({ ...drag });
        }
      }
    };

    const handlePointerUp = () => {
      // 1. Kết thúc Resizing
      if (resizingStateRef.current) {
        const r = resizingStateRef.current;
        resizingStateRef.current = null;
        setResizingState(null);

        const task = taskById.get(r.taskId);
        if (task) {
          const finalMinutes = r.edge === "top" ? r.currentStartMinutes : r.currentEndMinutes;
          const updates = getTimelineResizeUpdates(task, r.dateStr, r.edge, finalMinutes);
          onUpdateTask(task.id, updates);
        }
        return;
      }

      // 2. Kết thúc Dragging - Cập nhật vị trí mới nếu đã kéo
      const drag = pointerDragRef.current;
      pointerDragRef.current = null;
      setDraggingTaskState(null);

      if (!drag?.dragging) return;

      if (drag.currentStartMinutes !== drag.originalStartMinutes || drag.currentDateStr !== drag.originalDateStr) {
        onUpdateTask(drag.task.id, getTimelineDropUpdates(drag.task, drag.currentDateStr, drag.currentStartMinutes));
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [onUpdateTask, taskById, draggingTaskState]);

  // Tự động cuộn đến vị trí giờ hiện tại (hoặc 07:00 sáng) khi mở
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const targetScroll = Math.max(0, currentHourTop - 120);
    timelineScrollRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  // Mở modal tạo việc nhanh theo đúng ô 15 phút người dùng đã chọn.
  const handleCellClick = (dateStr: string, startMinutes: number) => {
    const startStr = formatTime(startMinutes);
    const endMinutes = Math.min(24 * 60, startMinutes + 15);
    const endStr = endMinutes >= 24 * 60 ? "23:59" : formatTime(endMinutes);
    openQuickTaskModal({
      dueDate: dateStr,
      timeType: "scheduled",
      startTime: startStr,
      endTime: endStr,
      itemType: calendarItemType,
      lockItemType: true,
    });
  };

  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const quarterSlots = Array.from({ length: 24 * 4 }, (_, index) => index);
  const timelineGridStyle = {
    gridTemplateColumns: `56px repeat(${weekDays.length}, minmax(0, 1fr))`,
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 select-none animate-in fade-in duration-150">
      {/* 2. KHUNG CUỘN THỜI KHÓA BIỂU TUẦN VỪA VẶN 100% CHIỀU CAO */}
      <div
        ref={timelineScrollRef}
        onScroll={() => {
          if (overflowPopover) setOverflowPopover(null);
        }}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-[20px] border border-[#09090B] dark:border-black bg-[var(--bg-surface)]"
        tabIndex={0}
        aria-label="Vùng cuộn bảng thời khóa biểu tuần"
      >
        <div className="w-full min-w-0">
          {/* A. Header Cố Định 7 Ngày Trong Tuần */}
          <div
            className={`sticky top-0 z-30 grid border-b border-[var(--border-ink-muted)] bg-[var(--bg-surface)] ${
              weekDays.length === 1 ? "hidden" : ""
            }`}
            style={timelineGridStyle}
          >
            <div className="flex items-center justify-center border-r border-[var(--border-ink-muted)] p-1 font-mono text-[9px] font-bold text-[#8E8E93] dark:text-[#8E8E93] uppercase tracking-wider">
              GMT+7
            </div>

            {weekDays.map((day) => {
              const isSelected = day.dateStr === selectedDateStr;
              return (
                <button
                  key={day.dateStr}
                  type="button"
                  onClick={() => {
                    if (onOpenDay && weekDays.length > 1) {
                      onOpenDay(day.dateStr);
                      return;
                    }
                    onSelectDate(day.dateStr);
                  }}
                  className={`flex flex-col items-center justify-center border-r border-[var(--border-ink-muted)] py-3 px-1 text-center transition-all cursor-pointer last:border-r-0 ${
                    isSelected
                      ? "bg-[var(--accent-blue)]/[0.08] dark:bg-[var(--accent-blue)]/[0.15]"
                      : "hover:bg-[#FAF8F3] dark:hover:bg-[#202023]"
                  }`}
                >
                  <span
                    className={`font-mono text-xs font-bold uppercase ${
                      day.isToday
                        ? "text-[var(--accent-blue)]"
                        : "text-[#8E8E93] dark:text-[#8E8E93]"
                    }`}
                  >
                    {day.dayName}
                  </span>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full font-mono text-lg font-bold transition-all ${
                      day.isToday
                        ? "bg-[var(--accent-blue)] text-white shadow-xs"
                        : isSelected
                          ? "bg-[var(--accent-blue)]/[0.15] text-[var(--accent-blue)]"
                          : "text-[#1C1C1E] dark:text-[#F2F2F7]"
                    }`}
                  >
                    {day.dayNum}
                  </span>
                </button>
              );
            })}
          </div>

          {/* B. Khay Hàng Cả Ngày (All-Day Row) */}
          <div className="grid border-b border-[var(--border-ink-muted)] bg-[var(--bg-surface)]" style={timelineGridStyle}>
            <div className="flex items-center justify-center border-r border-[var(--border-ink-muted)] p-1 font-mono text-[9px] font-bold text-[#8E8E93] dark:text-[#8E8E93] uppercase">
              Cả ngày
            </div>

            {daysLayoutData.map(({ day, allDayTasks }) => {
              const isExpanded = Boolean(expandedAllDayDates[day.dateStr]);
              const visibleTasks = isExpanded ? allDayTasks : allDayTasks.slice(0, 2);
              const hiddenCount = allDayTasks.length - 2;

              return (
                <div
                  key={`allday-${day.dateStr}`}
                  className="flex flex-col gap-1 border-r border-[var(--border-ink-muted)] p-1 last:border-r-0"
                >
                  {visibleTasks.map((task) => {
                    const isPastEvent =
                      getTaskItemType(task) === "event" && day.dateStr < getLocalTodayStr();

                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          if (onPreviewTask) {
                            onPreviewTask(task, rect);
                          } else {
                            openTaskDetail(task.id);
                          }
                        }}
                        style={getTaskCardVisualStyle(task)}
                        className={`planner-calendar-card truncate rounded-xl px-2 py-1 text-[11px] font-semibold shadow-2xs transition-all active:scale-[0.98] text-left cursor-pointer ${
                          task.completed
                            ? "line-through opacity-60"
                            : isPastEvent
                              ? "opacity-60"
                              : "hover:brightness-95 dark:hover:brightness-110"
                        }`}
                        title={task.title}
                      >
                        {task.title}
                      </button>
                    );
                  })}

                  {allDayTasks.length > 2 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpandAllDay(day.dateStr);
                      }}
                      className="inline-flex w-full items-center justify-center gap-0.5 rounded-xl py-0.5 font-mono text-[10px] font-bold text-[#007AFF] dark:text-[#0A84FF] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp size={11} />
                          <span>Thu gọn</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown size={11} />
                          <span>+{hiddenCount} khác</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* C. Thân Lưới 24 Giờ & 7 Cột Lịch Trình Vừa Vặn */}
          <div className="relative grid bg-[var(--bg-surface)]" style={timelineGridStyle}>
            {/* Cột Trục Giờ (Left Gutter) */}
            <div
              className="relative border-r border-[var(--border-ink-muted)] bg-[var(--bg-surface)]"
              style={{ height: hours.length * HOUR_HEIGHT }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end pr-2 font-mono text-[10px] font-medium text-[#8E8E93] dark:text-[#A1A1AA]"
                  style={{
                    top: hour * HOUR_HEIGHT,
                    height: HOUR_HEIGHT,
                  }}
                >
                  <span className="-translate-y-1/2 select-none">{formatTime(hour * 60)}</span>
                </div>
              ))}

              {/* Chỉ báo thời gian hiện tại trên trục giờ */}
              <div
                className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-end pr-1"
                style={{ top: currentHourTop - 8 }}
              >
                <span className="rounded-full bg-[#FF3B30] px-2 py-0.5 font-mono text-[9px] font-bold text-white shadow-2xs">
                  {formatTime(currentMinutes)}
                </span>
              </div>
            </div>

            {/* 7 Cột Timeline Tương Ứng 7 Ngày */}
            {daysLayoutData.map(({ day, layout }) => {
              return (
                <div
                  key={`timeline-${day.dateStr}`}
                  data-timeline-date={day.dateStr}
                  data-timeline-column="true"
                  className={`relative border-r border-[var(--border-ink-muted)] last:border-r-0 ${
                    day.isToday ? "bg-[#007AFF]/[0.02] dark:bg-[#0A84FF]/[0.03]" : ""
                  }`}
                  style={{ height: hours.length * HOUR_HEIGHT }}
                >
                  {/* 24 ô 60 phút (1 ô cho mỗi giờ) */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      onClick={(e) => handleHourCellClick(e, day.dateStr, hour)}
                      className="group/hour absolute left-0 right-0 border-t border-[var(--border-ink-muted)] transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] cursor-pointer"
                      style={{
                        top: hour * HOUR_HEIGHT,
                        height: HOUR_HEIGHT,
                      }}
                    />
                  ))}

                  {/* Khối Task Tạm Thời 60 Phút hiển thị trực tiếp trên lưới lịch */}
                  {draftTask && draftTask.dateStr === day.dateStr && (
                    <div
                      style={{
                        backgroundColor:
                          draftTask.itemType === "event"
                            ? "var(--task-card-event-bg)"
                            : "var(--task-card-task-bg)",
                        color:
                          draftTask.itemType === "event"
                            ? "var(--task-card-event-text)"
                            : "var(--task-card-task-text)",
                        top: (draftTask.startMinutes / 60) * HOUR_HEIGHT,
                        left: "2px",
                        width: "calc(100% - 4px)",
                        height: HOUR_HEIGHT,
                      }}
                      className="absolute z-30 rounded-2xl p-2.5 flex flex-col justify-between select-none shadow-md animate-in fade-in zoom-in-95 duration-100"
                    >
                      <div className="flex items-center gap-1.5 font-mono text-[10.5px] font-bold">
                        <Clock size={12} strokeWidth={2.4} className="shrink-0" />
                        <span>{formatTime(draftTask.startMinutes)} - {formatTime(draftTask.endMinutes)}</span>
                      </div>
                      <p className="truncate text-xs font-bold leading-tight">
                        {draftTask.title || (draftTask.itemType === "event" ? "(Sự kiện mới)" : "(Công việc mới)")}
                      </p>
                    </div>
                  )}

                  {/* Vạch Đỏ Giờ Hiện Tại (Current Time Red Line) nếu là Hôm Nay */}
                  {day.isToday && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-20 h-[2px] bg-[#FF3B30]"
                      style={{ top: currentHourTop }}
                    >
                      <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full border border-white dark:border-[#1C1C1E] bg-[#FF3B30]" />
                    </div>
                  )}

                  {/* Scheduled Blocks (Khối thời gian) */}
                  {layout.scheduledBlocks.map((block, index) => {
                    const isBeingDragged = draggingTaskState?.taskId === block.task.id;
                    const isPreviewed = previewedTaskId === block.task.id;
                    return (
                      <ScheduledBlockCard
                        key={`sched-${block.task.id}-${index}`}
                        block={block}
                        dateStr={day.dateStr}
                        isActive={isPreviewed}
                        isGhost={isBeingDragged}
                        resizingState={resizingState?.dateStr === day.dateStr ? resizingState : null}
                        onStartPointerDrag={(_, task, duration, startM, offsetM, pointerOrigin) => {
                          pointerDragRef.current = {
                            taskId: task.id,
                            task,
                            durationMinutes: duration,
                            originalStartMinutes: startM,
                            originalDateStr: day.dateStr,
                            currentStartMinutes: startM,
                            currentDateStr: day.dateStr,
                            offsetMinutes: offsetM,
                            startX: pointerOrigin?.x ?? _.clientX,
                            startY: pointerOrigin?.y ?? _.clientY,
                            isEvent: getTaskItemType(task) === "event",
                            isCompleted: task.completed,
                            dragging: false,
                          };
                        }}
                        onStartResize={handleStartResize}
                        onToggleComplete={onToggleTask}
                        onOpenPopover={(task, anchorRect) => {
                          if (onPreviewTask) {
                            onPreviewTask(task, anchorRect);
                          } else {
                            openTaskDetail(task.id);
                          }
                        }}
                      />
                    );
                  })}

                  {/* Deadline Markers (Mốc hạn chót) */}
                  {layout.deadlineMarkers.map((marker, index) => {
                    const isBeingDragged = draggingTaskState?.taskId === marker.task.id;
                    const isPreviewed = previewedTaskId === marker.task.id;
                    return (
                      <DeadlineMarkerCard
                        key={`dead-${marker.task.id}-${index}`}
                        marker={marker}
                        dateStr={day.dateStr}
                        isActive={isPreviewed}
                        isGhost={isBeingDragged}
                        onStartPointerDrag={(_, task, duration, startM, offsetM, pointerOrigin) => {
                          pointerDragRef.current = {
                            taskId: task.id,
                            task,
                            durationMinutes: duration,
                            originalStartMinutes: startM,
                            originalDateStr: day.dateStr,
                            currentStartMinutes: startM,
                            currentDateStr: day.dateStr,
                            offsetMinutes: offsetM,
                            startX: pointerOrigin?.x ?? _.clientX,
                            startY: pointerOrigin?.y ?? _.clientY,
                            isEvent: false,
                            isCompleted: task.completed,
                            dragging: false,
                          };
                        }}
                        onStartResize={handleStartResize}
                        onToggleComplete={onToggleTask}
                        onOpenPopover={(task, anchorRect) => {
                          if (onPreviewTask) {
                            onPreviewTask(task, anchorRect);
                          } else {
                            openTaskDetail(task.id);
                          }
                        }}
                        onOpenOverflow={(tasks, rect) => setOverflowPopover({ tasks, anchorRect: rect })}
                      />
                    );
                  })}

                  {/* Thẻ đang được kéo: hiển thị trực tiếp tại vị trí giờ và ngày tương ứng trong lưới */}
                  {draggingTaskState && draggingTaskState.currentDateStr === day.dateStr && (
                    <article
                      style={{
                        ...getTaskCardVisualStyle(
                          draggingTaskState.task,
                          new Date(),
                          draggingTaskState.isCompleted,
                        ),
                        top: (draggingTaskState.currentStartMinutes / 60) * HOUR_HEIGHT,
                        left: "1px",
                        width: "calc(100% - 2px)",
                        height: Math.max(MIN_LANE_HEIGHT, (draggingTaskState.durationMinutes / 60) * HOUR_HEIGHT),
                        zIndex: 60,
                      }}
                      className={`group absolute overflow-visible shadow-2xl select-none ring-2 ring-[var(--accent-blue)] pointer-events-none p-2 rounded-2xl ${
                        draggingTaskState.isCompleted ? "opacity-55" : ""
                      }`}
                    >
                      {/* Live Dragging Tooltip Time Indicator */}
                      <div className="absolute -top-7.5 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-3 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xl border-none flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in duration-75">
                        <Clock size={11} strokeWidth={2.4} />
                        <span>
                          {formatTime(draggingTaskState.currentStartMinutes)} - {formatTime(draggingTaskState.currentStartMinutes + draggingTaskState.durationMinutes)}
                        </span>
                        <span className="opacity-75">
                          ({formatDuration(draggingTaskState.currentStartMinutes, draggingTaskState.currentStartMinutes + draggingTaskState.durationMinutes)})
                        </span>
                      </div>

                      <div className="flex min-w-0 h-full overflow-hidden flex-col justify-between">
                        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                          <span className="truncate text-[10.5px] font-bold font-mono text-current">
                            {formatTime(draggingTaskState.currentStartMinutes)} - {formatTime(draggingTaskState.currentStartMinutes + draggingTaskState.durationMinutes)}
                          </span>
                        </div>

                        <div className="min-w-0 overflow-hidden mt-1 flex-1">
                          <p
                            className={`truncate text-xs font-bold leading-tight ${
                              draggingTaskState.isCompleted ? "line-through text-current" : "text-current"
                            }`}
                          >
                            {draggingTaskState.task.title}
                          </p>
                        </div>
                      </div>
                    </article>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {overflowPopover && (
        <TimelineTaskOverflowPopover
          tasks={overflowPopover.tasks}
          anchorRect={overflowPopover.anchorRect}
          onClose={() => setOverflowPopover(null)}
          onOpenTask={(task) => {
            if (onPreviewTask) {
              onPreviewTask(task, overflowPopover.anchorRect);
            } else {
              openTaskDetail(task.id);
            }
          }}
        />
      )}

      {/* 4. Thẻ Tạo Nhanh Popover Nổi Trên Điểm Click */}
      {draftTask && (
        <PlannerQuickCreatePopover
          dateStr={draftTask.dateStr}
          startMinutes={draftTask.startMinutes}
          endMinutes={draftTask.endMinutes}
          title={draftTask.title}
          itemType={draftTask.itemType}
          anchorRect={draftTask.anchorRect}
          onTitleChange={(title) => setDraftTask((prev) => (prev ? { ...prev, title } : null))}
          onItemTypeChange={(itemType) => setDraftTask((prev) => (prev ? { ...prev, itemType } : null))}
          itemTypeLocked={true}
          onSave={handleSaveDraft}
          onCancel={handleCancelDraft}
          onOpenFullDetail={handleOpenFullDetailFromDraft}
        />
      )}

    </div>
  );
};
