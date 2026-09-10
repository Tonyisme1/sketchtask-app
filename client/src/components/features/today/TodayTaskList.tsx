import React from "react";
import { TaskDto } from "../../../types";
import { TaskList } from "../shared/TaskList";

export interface TodayTaskListProps {
  tasks: TaskDto[];
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick: (task: TaskDto) => void;
  activeTaskId?: string | null;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  showQuickAdd?: boolean;
}

export const TodayTaskList: React.FC<TodayTaskListProps> = ({
  tasks,
  onToggle,
  onEdit,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  activeTaskId,
  emptyActionText,
  onEmptyAction,
  showQuickAdd = false,
}) => {
  return (
    <TaskList
      tasks={tasks}
      emptyMessage="Hôm nay chưa có việc nào"
      emptySubMessage="Thêm việc mới để bắt đầu ngày làm việc hiệu quả!"
      emptyActionText={emptyActionText}
      onEmptyAction={onEmptyAction}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
      onMoveTomorrow={onMoveTomorrow}
      onAddSubtask={onAddSubtask}
      onClick={onClick}
      variant="today"
      hideDate={true}
      activeTaskId={activeTaskId}
      showQuickAdd={showQuickAdd}
    />
  );
};
