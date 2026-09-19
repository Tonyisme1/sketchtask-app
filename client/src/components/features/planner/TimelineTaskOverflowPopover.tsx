import React, { useEffect, useState } from "react";
import { TaskDto } from "../../../types";

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
        className="fixed z-50 w-[min(300px,calc(100vw-24px))] max-h-[360px] overflow-y-auto rounded-[8px] border border-[#E5E5EA] dark:border-[#3A3A3C] bg-white dark:bg-[#1C1C1E] p-2 shadow-sm"
        style={{ left: position.left, top: position.top }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-2 pb-1.5 text-xs font-bold text-[#1C1C1E] dark:text-white">
          <span>Việc còn lại</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[4px] px-1.5 py-0.5 text-[#8E8E93] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]"
            aria-label="Đóng danh sách việc còn lại"
          >
            Đóng
          </button>
        </div>
        <div className="space-y-1">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onClose();
                onOpenTask(task);
              }}
              className="block w-full truncate rounded-[6px] border border-transparent px-2 py-1.5 text-left text-xs font-semibold text-[#1C1C1E] hover:border-[#E5E5EA] hover:bg-[#F2F2F7] dark:text-[#F2F2F7] dark:hover:border-[#3A3A3C] dark:hover:bg-[#2C2C2E]"
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
