import React, { useEffect, useState } from "react";
import { TaskDto } from "../../../types";
import { getTaskCardVisualStyle } from "../../../utils/taskSemantics";

interface TimelineTaskOverflowPopoverProps {
  tasks: TaskDto[];
  anchorRect: DOMRect;
  onClose: () => void;
  onOpenTask: (task: TaskDto) => void;
}

const POPOVER_WIDTH = 300;
const VIEWPORT_GUTTER = 12;

const getPosition = (anchorRect: DOMRect) => {
  const viewportWidth = typeof window === "undefined" ? 1280 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 800 : window.innerHeight;
  const estimatedHeight = Math.min(360, Math.max(150, 72 + anchorRect.height * 5));
  const canOpenRight = anchorRect.right + VIEWPORT_GUTTER + POPOVER_WIDTH <= viewportWidth - VIEWPORT_GUTTER;
  const left = canOpenRight
    ? anchorRect.right + VIEWPORT_GUTTER
    : Math.max(VIEWPORT_GUTTER, anchorRect.left - POPOVER_WIDTH - VIEWPORT_GUTTER);
  const top = Math.max(
    VIEWPORT_GUTTER,
    Math.min(anchorRect.top, viewportHeight - estimatedHeight - VIEWPORT_GUTTER),
  );

  return { left, top };
};

export const TimelineTaskOverflowPopover: React.FC<TimelineTaskOverflowPopoverProps> = ({
  tasks,
  anchorRect,
  onClose,
  onOpenTask,
}) => {
  const [position, setPosition] = useState(() => getPosition(anchorRect));

  useEffect(() => {
    const updatePosition = () => setPosition(getPosition(anchorRect));
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [anchorRect]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-label="Các công việc còn lại"
        className="fixed z-50 w-[min(300px,calc(100vw-24px))] max-h-[360px] overflow-y-auto rounded-3xl bg-white dark:bg-[#1E1E22] p-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150 select-none"
        style={{ left: position.left, top: position.top }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-2 pb-2 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
          <span>Việc còn lại</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-2 py-1 text-xs text-[#8E8E93] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] cursor-pointer transition-colors"
            aria-label="Đóng danh sách việc còn lại"
          >
            Đóng
          </button>
        </div>
        <div className="space-y-1 pt-1.5">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onClose();
                onOpenTask(task);
              }}
              style={getTaskCardVisualStyle(task)}
              className={`block w-full truncate rounded-2xl px-3 py-2 text-left text-xs font-semibold hover:brightness-95 dark:hover:brightness-110 transition-colors cursor-pointer ${task.completed ? "line-through opacity-60" : ""}`}
              title={task.title}
            >
              {task.title || "Công việc không tên"}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
