// ==========================================
// COMPONENT: PlannerDayTimeline (Desktop Day Timeline Grid & Task List)
// ==========================================

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  Clock,
  Hourglass,
  Pin,
  Plus,
  X,
} from "lucide-react";
import { TaskDto, TaskItemType } from "../../../types";
import {
  getTaskEffectiveTime,
  getTaskEffectiveEndTime,
  getTaskItemType,
  normalizeTaskTimeType,
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
  createTimelineDragPayload,
  formatDuration,
  getTimelineDropUpdates,
  getTimelineResizeUpdates,
  readTimelineDragPayload,
  TIMELINE_DRAG_MIME,
} from "./timelineDragAndDrop";

export type PlannerDayDisplayMode = "chart" | "list";

export interface ResizingState {
  taskId: string;
  edge: "top" | "bottom";
  startY: number;
  originalStartMinutes: number;
  originalEndMinutes: number;
  currentStartMinutes: number;
  currentEndMinutes: number;
}

interface PlannerDayTimelineProps {
  tasks: TaskDto[];
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskDto>) => void;
  onPreviewTask?: (task: TaskDto, anchorRect?: DOMRect | null) => void;
  dateStr?: string;
  isToday?: boolean;
}

const END_HOUR = 24;
const HOUR_ROW_HEIGHT = 64; // Chiều cao 64px/giờ thoáng và dễ đọc
const MIN_LANE_HEIGHT = 26;
type PointerDragState = {
  taskId: string;
  task: TaskDto;
  durationMinutes: number;
  originalStartMinutes: number;
  currentStartMinutes: number;
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

// === PHẦN 1: Thẻ Khối Thời Gian (Scheduled Block) Có Kéo Thả & Kéo To Nhỏ ===
const DayScheduledBlockCard: React.FC<{
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
  ) => void;
  onStartResize: (event: React.PointerEvent<HTMLElement>, task: TaskDto, edge: "top" | "bottom") => void;
}> = ({
  block,
  dateStr,
  isActive,
  isGhost,
  resizingState,
  onOpenPopover,
  onStartPointerDrag,
  onStartResize,
}) => {
  const suppressClickRef = useRef(false);
  const { task } = block;
  const time = getTaskEffectiveTime(task);
  const isEvent = getTaskItemType(task) === "event";
  const isCompleted = !isEvent && task.completed;
  const hasMultipleLanes = block.laneCount > 1;

  const isBeingResized = Boolean(resizingState && resizingState.taskId === task.id);
  const effectiveTop = isBeingResized
    ? (resizingState!.currentStartMinutes / 60) * HOUR_ROW_HEIGHT
    : block.top;
  const effectiveHeight = isBeingResized
    ? Math.max(MIN_LANE_HEIGHT, ((resizingState!.currentEndMinutes - resizingState!.currentStartMinutes) / 60) * HOUR_ROW_HEIGHT)
    : block.height;

  const displayStart = isBeingResized
    ? formatTime(resizingState!.currentStartMinutes)
    : time;
  const displayEnd = isBeingResized
    ? formatTime(resizingState!.currentEndMinutes)
    : getTaskEffectiveEndTime(task);

  const isCompact = effectiveHeight < 60;
  const isTight = effectiveHeight < 32;

  const tone = isCompleted
    ? "bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] opacity-60 rounded-[8px]"
    : isEvent
      ? "bg-[var(--accent-blue)] border border-[var(--accent-blue)] rounded-[8px] hover:brightness-95 dark:hover:brightness-110"
      : "bg-[var(--accent-sky)] border border-[var(--accent-sky)] rounded-[8px] hover:brightness-95 dark:hover:brightness-110";

  // Calculate task duration in minutes
  const duration = block.durationMinutes || 60;

  if (isGhost) {
    return (
      <article
        style={{
          top: block.top,
          left: `calc(${block.left}% + 1px)`,
          width: `calc(${block.width}% - 2px)`,
          height: block.height,
          zIndex: 10,
        }}
        className={`group absolute overflow-visible select-none pointer-events-none opacity-25 border-2 border-dashed border-[var(--accent-blue)] ${tone} ${
          isTight ? "px-1 py-0" : isCompact ? "px-1.5 py-1" : "p-2"
        }`}
      >
        <div className="flex min-w-0 h-full overflow-hidden flex-col justify-between">
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <Clock size={12} strokeWidth={2.2} className="shrink-0 text-current" />
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
        top: effectiveTop,
        left: hasMultipleLanes ? `calc(${block.left}% + 1px)` : "0%",
        width: hasMultipleLanes ? `calc(${block.width}% - 2px)` : "100%",
        height: effectiveHeight,
        zIndex: isBeingResized ? 60 : isActive ? 45 : (block.zIndex ?? 10),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (suppressClickRef.current || isBeingResized) {
          suppressClickRef.current = false;
          return;
        }
        onOpenPopover(task, (e.currentTarget as HTMLElement).getBoundingClientRect());
      }}
      draggable={false}
      onDragStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(event) => {
        if (event.button === 0 && !(event.target as HTMLElement).closest("button") && !(event.target as HTMLElement).closest("[data-resize-handle]")) {
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          const clickOffsetMinutes = Math.max(0, Math.min(duration, Math.round(((event.clientY - rect.top) / HOUR_ROW_HEIGHT) * 60)));
          onStartPointerDrag(event, task, duration, (block.top / HOUR_ROW_HEIGHT) * 60, clickOffsetMinutes);
        }
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
        <div className="absolute -top-7.5 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xl border border-white/20 flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in duration-75">
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
            onStartResize(e, task, "top");
          }}
          className="absolute top-0 left-0 right-0 h-2.5 cursor-ns-resize z-20 touch-none"
          title="Kéo viền trên để đổi giờ bắt đầu"
        />
      )}

      <div className={`flex min-w-0 h-full overflow-hidden ${
        isCompact ? "flex-row items-center gap-1" : "flex-col justify-between"
      }`}>
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <Clock
            size={12}
            strokeWidth={2.2}
            className={`shrink-0 ${isEvent ? "text-white" : "text-[var(--text-main)]"}`}
          />

          <span className={`truncate text-[10.5px] font-bold font-mono ${isEvent ? "text-white" : "text-[var(--text-main)]"}`}>
            {displayStart}
            {displayEnd && ` - ${displayEnd}`}
          </span>
        </div>

        <div className={`min-w-0 overflow-hidden ${isCompact ? "flex-1" : "mt-1 flex-1"}`}>
          <p
            className={`truncate text-xs font-bold leading-tight ${
              isCompleted ? "line-through text-[#8E8E93]" : isEvent ? "text-white" : "text-[var(--text-main)]"
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
            onStartResize(e, task, "bottom");
          }}
          className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize z-20 touch-none"
          title="Kéo viền dưới để đổi thời lượng"
        />
      )}
    </article>
  );
};

// === PHẦN 2: Thẻ Marker Hạn Chót (Deadline Marker Point) ===
const DayDeadlineMarkerCard: React.FC<{
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
  ) => void;
  onStartResize?: (
    event: React.PointerEvent<HTMLElement>,
    task: TaskDto,
    edge: "top" | "bottom"
  ) => void;
}> = ({
  marker,
  dateStr,
  isActive,
  isGhost,
  onOpenPopover,
  onOpenOverflow,
  onStartPointerDrag,
  onStartResize,
}) => {
  const { task } = marker;
  const isCompleted = task.completed;
  const suppressClickRef = useRef(false);
  const hasMultipleLanes = marker.laneCount > 1;

  const tone = isCompleted
    ? "bg-[var(--accent-sky)] border border-[var(--accent-sky)] opacity-60 rounded-[8px]"
    : "bg-[var(--accent-sky)] border border-[#262626] rounded-[8px] hover:brightness-95 dark:hover:brightness-110";

  if (isGhost) {
    return (
      <article
        style={{
          top: marker.top,
          left: `calc(${marker.left}% + 1px)`,
          width: `calc(${marker.width}% - 2px)`,
          height: 25,
          zIndex: 10,
        }}
        className={`group absolute flex items-center overflow-hidden ${tone} px-2 select-none pointer-events-none opacity-25 border-2 border-dashed border-[var(--accent-blue)]`}
      >
        <div className="flex min-w-0 items-center gap-1.5 flex-1 overflow-hidden">
          <Hourglass size={11} strokeWidth={2.2} className="shrink-0 text-[#1C1917]" />
          <span className="font-mono text-[10px] font-bold text-[#1C1917] shrink-0">{marker.time}</span>
          <span className="truncate text-xs font-bold leading-none text-[#1C1917]">{task.title}</span>
        </div>
      </article>
    );
  }

  return (
    <article
      style={{
        top: marker.top,
        left: hasMultipleLanes ? `calc(${marker.left}% + 1px)` : "0%",
        width: hasMultipleLanes ? `calc(${marker.width}% - 2px)` : "100%",
        height: 25,
        zIndex: isActive ? 45 : (marker.zIndex ?? 10),
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        onOpenPopover(task, (e.currentTarget as HTMLElement).getBoundingClientRect());
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
          onStartPointerDrag(event, task, 30, (marker.top / HOUR_ROW_HEIGHT) * 60, 0);
        }
      }}
      title={`Hạn chót: ${marker.time} · ${task.title}${marker.overflowCount ? ` (+${marker.overflowCount} việc khác)` : ""}`}
      className={`group absolute flex items-center overflow-hidden ${tone} px-2 shadow-sm transition-all select-none cursor-grab active:cursor-grabbing ${
        isActive ? "ring-2 ring-[var(--accent-blue)] shadow-md !z-40" : ""
      }`}
    >
      <div className="flex min-w-0 items-center justify-between gap-1.5 w-full overflow-hidden">
        <div className="flex min-w-0 items-center gap-1.5 flex-1 overflow-hidden">
          <Hourglass size={11} strokeWidth={2.2} className="shrink-0 text-[#1C1917]" />

          <span className="font-mono text-[10px] font-bold text-[#1C1917] shrink-0">
            {marker.time}
          </span>

          <span
            className={`truncate text-xs font-bold leading-none ${
              isCompleted ? "line-through text-[#8E8E93]" : "text-[#1C1917]"
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
            className="shrink-0 rounded-[6px] bg-[var(--accent-blue)] px-1.5 py-[1px] font-mono text-[9px] font-bold text-white shadow-sm"
            title={`+${marker.overflowCount} hạn chót khác`}
          >
            +{marker.overflowCount}
          </button>
        )}
      </div>

      {/* Tay cầm kéo dãn ở cạnh dưới */}
      {!isCompleted && onStartResize && (
        <div
          data-resize-handle="bottom"
          onPointerDown={(e) => {
            e.stopPropagation();
            onStartResize(e, task, "bottom");
          }}
          className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize z-20 touch-none"
          title="Kéo viền dưới để kéo dài thành khung giờ làm việc"
        />
      )}
    </article>
  );
};

// === PHẦN 3: Biểu đồ ngày 24 Giờ cho Desktop ===
export const PlannerDayTimeline: React.FC<PlannerDayTimelineProps> = ({
  tasks,
  onUpdateTask,
  onPreviewTask,
  dateStr,
  isToday = true,
}) => {
  const { addTask, openQuickTaskModal, openTaskDetail } = useAppStore();
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [draggingTaskState, setDraggingTaskState] = useState<PointerDragState | null>(null);
  const pointerDragRef = useRef<PointerDragState | null>(null);

  const [resizingState, setResizingState] = useState<ResizingState | null>(null);
  const resizingStateRef = useRef<ResizingState | null>(null);

  const [overflowPopover, setOverflowPopover] = useState<{
    tasks: TaskDto[];
    anchorRect: DOMRect;
  } | null>(null);

  const effectiveDayDate = dateStr || getLocalTodayStr();

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
    hour: number
  ) => {
    if (draftTask && draftTask.title.trim().length > 0) {
      if (draftTask.hour === hour) {
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
      dateStr: effectiveDayDate,
      hour,
      startMinutes: hour * 60,
      endMinutes: Math.min(24 * 60, (hour + 1) * 60),
      title: "",
      itemType: "task",
      anchorRect: rect,
    });
  };

  // Cập nhật giờ hiện tại mỗi 60 giây
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentHourTop = (currentMinutes / 60) * HOUR_ROW_HEIGHT;

  const allDayTasks = useMemo(
    () => tasks.filter((t) => !getTaskEffectiveTime(t)),
    [tasks],
  );

  const timelineLayout = useMemo(
    () =>
      buildTimelineGridLayout(
        tasks,
        effectiveDayDate,
        HOUR_ROW_HEIGHT,
        MIN_LANE_HEIGHT,
      ),
    [tasks, effectiveDayDate],
  );

  const handleStartResize = (
    event: React.PointerEvent<HTMLElement>,
    task: TaskDto,
    edge: "top" | "bottom",
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const block = timelineLayout.scheduledBlocks.find((b) => b.task.id === task.id);
    const marker = timelineLayout.deadlineMarkers.find((m) => m.task.id === task.id);
    const startM = block
      ? Math.round((block.top / HOUR_ROW_HEIGHT) * 60)
      : marker
      ? Math.round((marker.top / HOUR_ROW_HEIGHT) * 60)
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
        const deltaMinutes = Math.round((deltaY / HOUR_ROW_HEIGHT) * 4) * 15;

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
      const col = document.querySelector<HTMLElement>("[data-timeline-column]");
      if (col) {
        const colRect = col.getBoundingClientRect();
        const mouseY = event.clientY - colRect.top;
        const rawMinutes = (mouseY / HOUR_ROW_HEIGHT) * 60 - drag.offsetMinutes;
        const snappedMinutes = Math.max(
          0,
          Math.min(24 * 60 - drag.durationMinutes, Math.round(rawMinutes / 15) * 15)
        );

        if (snappedMinutes !== drag.currentStartMinutes) {
          drag.currentStartMinutes = snappedMinutes;
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

        const task = tasks.find((t) => t.id === r.taskId);
        if (task) {
          const finalMinutes = r.edge === "top" ? r.currentStartMinutes : r.currentEndMinutes;
          const updates = getTimelineResizeUpdates(task, effectiveDayDate, r.edge, finalMinutes);
          onUpdateTask(task.id, updates);
        }
        return;
      }

      // 2. Kết thúc Dragging - Cập nhật vị trí mới nếu đã kéo
      const drag = pointerDragRef.current;
      pointerDragRef.current = null;
      setDraggingTaskState(null);

      if (!drag?.dragging) return;

      if (drag.currentStartMinutes !== drag.originalStartMinutes) {
        onUpdateTask(drag.task.id, getTimelineDropUpdates(drag.task, effectiveDayDate, drag.currentStartMinutes));
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
  }, [effectiveDayDate, onUpdateTask, tasks, draggingTaskState]);

  // Tự động cuộn đến vị trí giờ hiện tại khi mở giao diện lần đầu
  useEffect(() => {
    if (!timelineScrollRef.current) return;
    const initialHourTop = isToday ? currentHourTop : 8 * HOUR_ROW_HEIGHT;
    const targetScroll = Math.max(0, initialHourTop - 120);
    timelineScrollRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  const handleCellClick = (startMinutes: number) => {
    const startStr = formatTime(startMinutes);
    const endMinutes = Math.min(24 * 60, startMinutes + 15);
    const endStr = endMinutes >= 24 * 60 ? "23:59" : formatTime(endMinutes);
    openQuickTaskModal({
      dueDate: effectiveDayDate,
      timeType: "scheduled",
      startTime: startStr,
      endTime: endStr,
    });
  };

  const quarterSlots = Array.from({ length: END_HOUR * 4 }, (_, index) => index);

  return (
    <section className="w-full h-full flex-1 flex flex-col min-h-0 select-none animate-in fade-in duration-150">
      {/* Khay việc cả ngày nếu có */}
      {allDayTasks.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F2F2F7]/80 dark:bg-[#202023]/80 p-2 shadow-sm shrink-0">
          <span className="font-mono text-[10px] font-bold uppercase text-[#8E8E93] dark:text-[#8E8E93]">
            Cả ngày ({allDayTasks.length}):
          </span>
          {allDayTasks.map((task) => (
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
              className={`rounded-[4px] border px-2 py-[3px] text-xs font-bold shadow-sm transition-all active:scale-[0.98] inline-flex items-center gap-1 cursor-pointer ${
                task.completed
                  ? "bg-[var(--bg-surface-muted)] border-[var(--border-ink)] line-through opacity-60 text-[var(--text-muted)]"
                  : getTaskItemType(task) === "event"
                    ? "bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white hover:brightness-95 dark:hover:brightness-110"
                    : "bg-[var(--accent-sky)] border-[var(--accent-sky)] text-[var(--text-main)] hover:brightness-95 dark:hover:brightness-110"
              }`}
            >
              <Pin
                size={11}
                className={`shrink-0 ${getTaskItemType(task) === "event" ? "text-white" : "text-[var(--text-main)]"}`}
              />
              <span>{task.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Khung cuộn Timeline 24 Giờ của Ngày Vừa Vặn 100% */}
      <div
        ref={timelineScrollRef}
        onScroll={() => {
          if (overflowPopover) setOverflowPopover(null);
        }}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#1C1C1E]"
        tabIndex={0}
        aria-label="Vùng cuộn biểu đồ chi tiết ngày"
      >
        <div className="w-full min-w-0">
          <div className="grid grid-cols-[56px_minmax(0,1fr)]">
            {/* Cột Trục Giờ (Left Gutter) */}
            <div
              className="relative border-r border-[#E5E5EA] dark:border-[#2C2C2E] bg-[#F2F2F7] dark:bg-[#18181A]"
              style={{ height: timelineLayout.totalHeight }}
            >
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 flex items-start justify-end border-t border-[#C7C7CC] dark:border-[#48484A] pr-1.5 font-mono text-[10px] font-medium text-[#8E8E93] dark:text-[#8E8E93]"
                  style={{ top, height }}
                >
                  <span className="-translate-y-1/2">{formatTime(hour * 60)}</span>
                </div>
              ))}

              {/* Chỉ báo thời gian hiện tại trên trục giờ */}
              {isToday && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 flex items-center justify-end pr-1"
                  style={{ top: currentHourTop - 8 }}
                >
                  <span className="rounded bg-[#FF3B30] px-1 py-[1px] font-mono text-[9px] font-bold text-white shadow-sm">
                    {formatTime(currentMinutes)}
                  </span>
                </div>
              )}
            </div>

            {/* Cột Lưới Sự Kiện Trong Ngày */}
            <div
              data-timeline-date={effectiveDayDate}
              data-timeline-column="true"
              className="relative bg-white dark:bg-[#1C1C1E]"
              style={{ height: timelineLayout.totalHeight }}
            >
              {/* 24 ô 60 phút (1 ô cho mỗi giờ) */}
              {timelineLayout.hours.map(({ hour, top, height }) => (
                <div
                  key={hour}
                  onClick={(e) => handleHourCellClick(e, hour)}
                  className="group/hour absolute left-0 right-0 border-t border-[#C7C7CC] dark:border-[#48484A] transition-colors hover:bg-[#F2F2F7]/50 dark:hover:bg-neutral-800/30 cursor-pointer"
                  style={{ top, height }}
                />
              ))}

              {/* Khối Task Tạm Thời 60 Phút hiển thị trực tiếp trên lưới lịch */}
              {draftTask && (
                <div
                  style={{
                    top: (draftTask.startMinutes / 60) * HOUR_ROW_HEIGHT,
                    left: "1px",
                    width: "calc(100% - 2px)",
                    height: HOUR_ROW_HEIGHT,
                  }}
                  className={`absolute z-30 rounded-[8px] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] p-2 flex flex-col justify-between select-none animate-in fade-in zoom-in-95 duration-100 ${
                    draftTask.itemType === "event"
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--accent-sky)] text-[#1C1917]"
                  }`}
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

              {/* Vạch Đỏ Giờ Hiện Tại (Current Time Red Line) */}
              {isToday && (
                <div
                  className="pointer-events-none absolute left-0 right-0 z-20 h-[2px] bg-[#FF3B30]"
                  style={{ top: currentHourTop }}
                >
                  <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full border border-white dark:border-[#1C1C1E] bg-[#FF3B30]" />
                </div>
              )}

              {/* Scheduled Blocks */}
              {timelineLayout.scheduledBlocks.map((block, index) => {
                const isBeingDragged = draggingTaskState?.taskId === block.task.id;
                return (
                  <React.Fragment key={`day-sched-${block.task.id}-${index}`}>
                    <DayScheduledBlockCard
                      block={block}
                      dateStr={effectiveDayDate}
                      isGhost={isBeingDragged}
                      resizingState={resizingState}
                      onStartPointerDrag={(_, task, duration, startM, offsetM) => {
                        pointerDragRef.current = {
                          taskId: task.id,
                          task,
                          durationMinutes: duration,
                          originalStartMinutes: startM,
                          currentStartMinutes: startM,
                          offsetMinutes: offsetM,
                          startX: _.clientX,
                          startY: _.clientY,
                          isEvent: getTaskItemType(task) === "event",
                          isCompleted: task.completed,
                          dragging: false,
                        };
                      }}
                      onStartResize={handleStartResize}
                      onOpenPopover={(task, anchorRect) => {
                        if (onPreviewTask) {
                          onPreviewTask(task, anchorRect);
                        } else {
                          openTaskDetail(task.id);
                        }
                      }}
                    />

                    {/* Thẻ đang được kéo: hiển thị trực tiếp tại vị trí giờ mới trong lưới */}
                    {isBeingDragged && draggingTaskState && (
                      <article
                        style={{
                          top: (draggingTaskState.currentStartMinutes / 60) * HOUR_ROW_HEIGHT,
                          left: "1px",
                          width: "calc(100% - 2px)",
                          height: Math.max(MIN_LANE_HEIGHT, (draggingTaskState.durationMinutes / 60) * HOUR_ROW_HEIGHT),
                          zIndex: 60,
                        }}
                        className={`group absolute overflow-visible shadow-2xl select-none ring-2 ring-[var(--accent-blue)] pointer-events-none p-2 ${
                          draggingTaskState.isCompleted
                            ? "bg-[var(--bg-surface-muted)] border border-[var(--border-ink)] rounded-[8px]"
                            : draggingTaskState.isEvent
                              ? "bg-[var(--accent-blue)] border border-[var(--accent-blue)] rounded-[8px]"
                              : "bg-[var(--accent-sky)] border border-[var(--accent-sky)] rounded-[8px]"
                        }`}
                      >
                        {/* Live Dragging Tooltip Time Indicator */}
                        <div className="absolute -top-7.5 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold shadow-xl border border-white/20 flex items-center gap-1.5 pointer-events-none whitespace-nowrap animate-in fade-in duration-75">
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
                            <Clock
                              size={12}
                              strokeWidth={2.2}
                              className={`shrink-0 ${draggingTaskState.isEvent ? "text-white" : "text-[var(--text-main)]"}`}
                            />
                            <span className={`truncate text-[10.5px] font-bold font-mono ${draggingTaskState.isEvent ? "text-white" : "text-[var(--text-main)]"}`}>
                              {formatTime(draggingTaskState.currentStartMinutes)} - {formatTime(draggingTaskState.currentStartMinutes + draggingTaskState.durationMinutes)}
                            </span>
                          </div>

                          <div className="min-w-0 overflow-hidden mt-1 flex-1">
                            <p
                              className={`truncate text-xs font-bold leading-tight ${
                                draggingTaskState.isCompleted ? "line-through text-[#8E8E93]" : draggingTaskState.isEvent ? "text-white" : "text-[var(--text-main)]"
                              }`}
                            >
                              {draggingTaskState.task.title}
                            </p>
                          </div>
                        </div>
                      </article>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Deadline Markers */}
              {timelineLayout.deadlineMarkers.map((marker, index) => {
                const isBeingDragged = draggingTaskState?.taskId === marker.task.id;
                return (
                  <React.Fragment key={`day-dead-${marker.task.id}-${index}`}>
                    <DayDeadlineMarkerCard
                      marker={marker}
                      dateStr={effectiveDayDate}
                      isGhost={isBeingDragged}
                      onStartPointerDrag={(_, task, duration, startM, offsetM) => {
                        pointerDragRef.current = {
                          taskId: task.id,
                          task,
                          durationMinutes: 30,
                          originalStartMinutes: startM,
                          currentStartMinutes: startM,
                          offsetMinutes: offsetM,
                          startX: _.clientX,
                          startY: _.clientY,
                          isEvent: false,
                          isCompleted: task.completed,
                          dragging: false,
                        };
                      }}
                      onStartResize={handleStartResize}
                      onOpenPopover={(task, anchorRect) => {
                        if (onPreviewTask) {
                          onPreviewTask(task, anchorRect);
                        } else {
                          openTaskDetail(task.id);
                        }
                      }}
                      onOpenOverflow={(tasks, rect) => setOverflowPopover({ tasks, anchorRect: rect })}
                    />

                    {/* Deadline Marker đang được kéo */}
                    {isBeingDragged && draggingTaskState && (
                      <article
                        style={{
                          top: (draggingTaskState.currentStartMinutes / 60) * HOUR_ROW_HEIGHT,
                          left: "1px",
                          width: "calc(100% - 2px)",
                          height: 25,
                          zIndex: 60,
                        }}
                        className="group absolute flex items-center overflow-hidden bg-[var(--accent-sky)] border border-[var(--accent-sky)] rounded-[8px] px-2 shadow-2xl select-none ring-2 ring-[var(--accent-blue)] pointer-events-none"
                      >
                        <div className="flex min-w-0 items-center gap-1.5 flex-1 overflow-hidden">
                          <Hourglass size={11} strokeWidth={2.2} className="shrink-0 text-[var(--accent-blue)]" />
                          <span className="font-mono text-[10px] font-bold text-[var(--accent-blue)] shrink-0">
                            {formatTime(draggingTaskState.currentStartMinutes)}
                          </span>
                          <span className="truncate text-xs font-bold leading-none">
                            {draggingTaskState.task.title}
                          </span>
                        </div>
                      </article>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
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
          onSave={handleSaveDraft}
          onCancel={handleCancelDraft}
          onOpenFullDetail={handleOpenFullDetailFromDraft}
        />
      )}

    </section>
  );
};
