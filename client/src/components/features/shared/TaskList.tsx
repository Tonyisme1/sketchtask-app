import React, { useState } from "react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { TaskCard } from "./TaskCard";
import { InlineQuickAddRow } from "./InlineQuickAddRow";
import { EmptyStateDoodle } from "../../ui/feedback/EmptyStateDoodle";
import { buildMultiLevelTaskTree, TaskHierarchyNode } from "../../../utils/taskHierarchy";

// ==========================================
// COMPONENT: TaskList (Danh Sách Công Việc 1 Dòng Chuẩn Xu Hướng Hiện Đại)
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
  notebookId?: string;
  showQuickAdd?: boolean;
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
  // Mặc định thu gọn nhánh có việc con để danh sách không bị kéo quá dài.
  const isCollapsed = collapsedParents[node.task.id] ?? true;
  const hasChildren = node.children.length > 0;

  const childCount = node.children.length;
  const completedChildCount = node.children.filter((c) => c.task.completed).length;

  return (
    <div className="w-full">
      {/* 1. Thẻ Task 1 Dòng */}
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
        hierarchyDepth={node.depth}
        childCount={childCount}
        completedChildCount={completedChildCount}
        isExpanded={!isCollapsed}
        onToggleExpand={() => onToggleParentCollapse(node.task.id)}
        showParentBadge={node.isOrphanSubtask}
        isOutOfFilterContext={node.isOutOfFilterContext}
        isSelected={Boolean(activeTaskId && node.task.id === activeTaskId)}
      />

      {/* 2. Danh Sách Con Trực Thuộc (nếu không bị gập) */}
      {hasChildren && !isCollapsed && (
        <div className="w-full">
          {node.children.map((childNode, childIdx) => (
            <div key={childNode.task.id} className="animate-in fade-in duration-100">
              <TaskTreeNodeItem
                node={childNode}
                index={childIdx}
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
  emptySubMessage = "Gõ tên việc bên dưới để bắt đầu ngày mới!",
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
  notebookId,
  showQuickAdd = true,
}) => {
  const { tasks: allTasks } = useAppStore();
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});

  // Xây dựng cây phân cấp đa tầng
  const rootNodes = buildMultiLevelTaskTree(tasks, allTasks);
  const orderedRootNodes = [...rootNodes].sort(
    (a, b) => Number(a.task.completed) - Number(b.task.completed),
  );

  const toggleParentCollapse = (parentId: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [parentId]: !(prev[parentId] ?? true),
    }));
  };

  return (
    <div className="space-y-2 select-none">
      {/* 1. Hàng Thêm Nhanh Inline Tại Đầu Hoặc Cuối Danh Sách */}
      {showQuickAdd && (
        <InlineQuickAddRow
          notebookId={notebookId}
          defaultDueDate={baseDateStr}
          placeholder="Thêm công việc mới... (Nhấn Enter để lưu)"
        />
      )}

      {/* 2. Danh Sách Task */}
      {orderedRootNodes.length === 0 ? (
        <div className="py-6 text-center text-xs font-medium text-[#78716C]">
          <p>{emptyMessage}</p>
          <p className="text-[11px] text-[#A8A29E] mt-0.5">{emptySubMessage}</p>
        </div>
      ) : (
        <div className="border-t border-[#D4CEBF]">
          {orderedRootNodes.map((node, index) => (
            <React.Fragment key={node.task.id}>
              {node.task.completed &&
                (index === 0 || !orderedRootNodes[index - 1].task.completed) && (
                  <div className="border-t-2 border-[#262626]/20 pt-2 pb-0.5 px-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] bg-[#FAF8F3]/40">
                    Đã hoàn thành
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
      )}
    </div>
  );
};
