import React from "react";
import { TaskDto } from "../../../types";
import { Clock } from "lucide-react";
import { getTaskEffectiveTime } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskList } from "../shared/TaskList";

interface TodayScheduleNotesProps {
  scheduledTasks: TaskDto[];
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick: (task: TaskDto) => void;
  activeTaskId?: string | null;
  title?: string;
  hideHeader?: boolean;
}

export const TodayScheduleNotes: React.FC<TodayScheduleNotesProps> = ({
  scheduledTasks,
  onToggle,
  onEdit,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  activeTaskId,
  title = "Lịch hẹn theo giờ",
  hideHeader = false,
}) => {
  const { isMobile } = useResponsiveLayout();
  if (scheduledTasks.length === 0) {
    return null;
  }

  // Sắp xếp lịch hẹn theo mốc giờ
  const sortedTasks = [...scheduledTasks].sort((a, b) => {
    const timeA = getTaskEffectiveTime(a) || "99:99";
    const timeB = getTaskEffectiveTime(b) || "99:99";
    return timeA.localeCompare(timeB);
  });

  return (
    <section className={`space-y-3 select-none ${isMobile ? "" : "animate-in fade-in duration-150"}`}>
      {!hideHeader && (
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
            <Clock size={16} className="text-[#1C1917]" strokeWidth={2.2} />
            <span>{title} ({sortedTasks.length})</span>
          </div>
        </div>
      )}

      {/* Dùng TaskList để lịch hẹn cũng hiển thị đúng cây cha/con. */}
      <TaskList
        tasks={sortedTasks}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveTomorrow={onMoveTomorrow}
        onAddSubtask={onAddSubtask}
        onClick={onClick}
        variant="today"
        hideDate={true}
        activeTaskId={activeTaskId}
        showQuickAdd={false}
      />
    </section>
  );
};
