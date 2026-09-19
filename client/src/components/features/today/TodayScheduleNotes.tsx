import React from "react";
import { TaskDto } from "../../../types";
import { Clock } from "lucide-react";
import { getTaskEffectiveTime } from "../../../utils/taskSemantics";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskList } from "../shared/TaskList";
import { TaskListSection } from "../shared/TaskListSection";

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
  showEventTimeLabel?: boolean;
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
  title = "Lịch hẹn",
  hideHeader = false,
  showEventTimeLabel = false,
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

  // Giữ nguyên luồng hiển thị mobile; pattern section chung áp dụng cho desktop.
  if (isMobile) {
    return (
      <section className="space-y-3 select-none">
        {!hideHeader && (
          <div className="flex items-center justify-between border-b border-[#262626]/20 pb-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#1C1917]">
              <Clock size={16} className="text-[#1C1917]" strokeWidth={2.2} />
              <span>{title} ({sortedTasks.length})</span>
            </div>
          </div>
        )}
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
          showEventTimeLabel={showEventTimeLabel}
        />
      </section>
    );
  }

  return (
    <div className="select-none animate-in fade-in duration-150">
      <TaskListSection
        title={title}
        tasks={sortedTasks}
        icon={<Clock size={16} strokeWidth={2.2} />}
        tone="info"
        hideHeader={hideHeader}
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
        showEventTimeLabel={showEventTimeLabel}
      />
    </div>
  );
};
