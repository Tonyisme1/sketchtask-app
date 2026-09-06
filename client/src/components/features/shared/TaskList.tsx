import React, { useState } from "react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { TaskCard } from "./TaskCard";
import { EmptyStateDoodle } from "../../ui/feedback/EmptyStateDoodle";
import { buildMultiLevelTaskTree, TaskHierarchyNode } from "../../../utils/taskHierarchy";

// ==========================================
// COMPONENT: TaskList (Danh Sách Công Việc Phân Cấp Cây Đa Tầng: Ông ➔ Cha ➔ Con)
// ==========================================

export interface TaskListProps {
  tasks: TaskDto[];
  emptyMessage?: string;
  emptySubMessage?: string;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick?: (task: TaskDto) => void;
  variant?: "today" | "planner" | "notebook" | "overdue";
  hideDate?: boolean;
  hideNotebookBadge?: boolean;
  baseDateStr?: string;
  moveButtonTitle?: string;
  activeTaskId?: string | null;
}

// Component Đệ Quy Render Từng Nhánh Trong Cây Phân Cấp Đa Tầng
const TaskTreeNodeItem: React.FC<{
  node: TaskHierarchyNode;
  index: number;
  collapsedParents: Record<string, boolean>;
  onToggleParentCollapse: (parentId: string) => void;
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onMoveTomorrow?: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick?: (task: TaskDto) => void;
  variant?: "today" | "planner" | "notebook" | "overdue";
  hideDate?: boolean;
  hideNotebookBadge?: boolean;
  baseDateStr?: string;
  moveButtonTitle?: string;
  activeTaskId?: string | null;
}> = ({
  node,
  index,
  collapsedParents,
  onToggleParentCollapse,
  onToggle,
  onEdit,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  variant,
  hideDate,
  hideNotebookBadge,
  baseDateStr,
  moveButtonTitle,
  activeTaskId,
}) => {
  const isCollapsed = Boolean(collapsedParents[node.task.id]);
  const hasChildren = node.children.length > 0;

  // Đếm tất cả con trực thuộc
  const childCount = node.children.length;
  const completedChildCount = node.children.filter((c) => c.task.completed).length;

  return (
    <div className="space-y-2">
      {/* 1. Thẻ Task Hiện Tại */}
      <TaskCard
        task={node.task}
        index={index}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveTomorrow={onMoveTomorrow}
        onAddSubtask={onAddSubtask}
        onClick={onClick}
        variant={variant}
        hideDate={hideDate}
        hideNotebookBadge={hideNotebookBadge}
        baseDateStr={baseDateStr}
        moveButtonTitle={moveButtonTitle}
        isSubtask={node.depth > 0}
        childCount={childCount}
        completedChildCount={completedChildCount}
        isExpanded={!isCollapsed}
        onToggleExpand={() => onToggleParentCollapse(node.task.id)}
        showParentBadge={node.isOrphanSubtask}
        isOutOfFilterContext={node.isOutOfFilterContext}
        isSelected={Boolean(activeTaskId && node.task.id === activeTaskId)}
      />

      {/* 2. Danh Sách Con / Cháu Đệ Quy (Nếu có và đang mở) */}
      {hasChildren && !isCollapsed && (
        <div className="relative pl-4 sm:pl-6 space-y-2 ml-2.5 sm:ml-3.5 border-l-2 border-[#262626] animate-in fade-in duration-150">
          {node.children.map((childNode, childIdx) => (
            <div key={childNode.task.id} className="relative">
              {/* Nhánh rẽ Connector Nét Mực */}
              <div className="absolute -left-4 sm:-left-6 top-4 w-3.5 sm:w-5 h-0.5 bg-[#262626]" />

              <TaskTreeNodeItem
                node={childNode}
                index={index + childIdx + 1}
                collapsedParents={collapsedParents}
                onToggleParentCollapse={onToggleParentCollapse}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onMoveTomorrow={onMoveTomorrow}
                onAddSubtask={onAddSubtask}
                onClick={onClick}
                variant={variant}
                hideDate={hideDate}
                hideNotebookBadge={hideNotebookBadge}
                baseDateStr={baseDateStr}
                moveButtonTitle={moveButtonTitle}
                activeTaskId={activeTaskId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  emptyMessage = "Không có công việc nào",
  emptySubMessage = "Thêm việc mới để bắt đầu ngày làm việc hiệu quả!",
  emptyActionText,
  onEmptyAction,
  onToggle,
  onEdit,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  variant = "today",
  hideDate = false,
  hideNotebookBadge = false,
  baseDateStr,
  moveButtonTitle,
  activeTaskId,
}) => {
  const { tasks: allTasks } = useAppStore();

  // Trạng thái mở/thu gọn các task cha (mặc định mở tất cả)
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  if (tasks.length === 0) {
    return (
      <EmptyStateDoodle
        title={emptyMessage}
        message={emptySubMessage}
        actionText={emptyActionText}
        onAction={onEmptyAction}
      />
    );
  }

  // Xây dựng cây phân cấp đa tầng (Ông -> Cha -> Con -> Cháu)
  const rootNodes = buildMultiLevelTaskTree(tasks, allTasks);
  const orderedRootNodes = [...rootNodes].sort(
    (a, b) => Number(a.task.completed) - Number(b.task.completed),
  );

  const toggleParentCollapse = (parentId: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  return (
    <div className="space-y-2 select-none">
      {orderedRootNodes.map((node, index) => (
        <React.Fragment key={node.task.id}>
          {node.task.completed &&
            (index === 0 || !orderedRootNodes[index - 1].task.completed) && (
              <div className="border-t-[1.5px] border-[#D4CEBF] pt-2 text-[11px] font-bold uppercase tracking-wide text-[#78716C]">
                Đã xong
              </div>
            )}
          <TaskTreeNodeItem
            node={node}
            index={index}
            collapsedParents={collapsedParents}
            onToggleParentCollapse={toggleParentCollapse}
            onToggle={onToggle}
            onEdit={onEdit}
            onDelete={onDelete}
            onMoveTomorrow={onMoveTomorrow}
            onAddSubtask={onAddSubtask}
            onClick={onClick}
            variant={variant}
            hideDate={hideDate}
            hideNotebookBadge={hideNotebookBadge}
            baseDateStr={baseDateStr}
            moveButtonTitle={moveButtonTitle}
            activeTaskId={activeTaskId}
          />
        </React.Fragment>
      ))}
    </div>
  );
};
