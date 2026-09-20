import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronRight } from "lucide-react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { TaskCard } from "./TaskCard";
import { InlineQuickAddRow } from "./InlineQuickAddRow";
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
  variant?: "today" | "planner" | "overdue";
  hideDate?: boolean;
  baseDateStr?: string;
  moveButtonTitle?: string;
  activeTaskId?: string | null;
  showQuickAdd?: boolean;
  showEventTimeLabel?: boolean;
  presentation?: "default" | "desktop";
  showCompletionSection?: boolean;
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
  variant?: "today" | "planner" | "overdue";
  hideDate?: boolean;
  baseDateStr?: string;
  moveButtonTitle?: string;
  activeTaskId?: string | null;
  showEventTimeLabel?: boolean;
  presentation?: "default" | "desktop";
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
  baseDateStr,
  moveButtonTitle,
  activeTaskId,
  showEventTimeLabel,
  presentation,
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
        showEventTimeLabel={showEventTimeLabel}
        presentation={presentation}
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
                baseDateStr={baseDateStr}
                moveButtonTitle={moveButtonTitle}
                activeTaskId={activeTaskId}
                showEventTimeLabel={showEventTimeLabel}
                presentation={presentation}
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
  emptyMessage = "Chưa có công việc",
  emptySubMessage = "",
  onToggle,
  onEdit,
  onDelete,
  onMoveTomorrow,
  onAddSubtask,
  onClick,
  variant = "today",
  hideDate = false,
  baseDateStr,
  moveButtonTitle,
  activeTaskId,
  showQuickAdd = true,
  showEventTimeLabel = false,
  presentation = "default",
  showCompletionSection = true,
}) => {
  const { tasks: allTasks } = useAppStore();
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});
  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);

  // Xây dựng cây phân cấp đa tầng
  const rootNodes = buildMultiLevelTaskTree(tasks, allTasks);
  const orderedRootNodes = [...rootNodes].sort(
    (a, b) => Number(a.task.completed) - Number(b.task.completed),
  );
  const completedTaskCount = orderedRootNodes.filter((node) => node.task.completed).length;

  const toggleParentCollapse = (parentId: string) => {
    setCollapsedParents((prev) => ({
      ...prev,
      [parentId]: !(prev[parentId] ?? true),
    }));
  };

  return (
    <div className={`select-none ${presentation === "desktop" ? "space-y-2" : "space-y-2.5"}`}>
      {/* 1. Hàng Thêm Nhanh Inline Tại Đầu Hoặc Cuối Danh Sách */}
      {showQuickAdd && (
        <InlineQuickAddRow
          defaultDueDate={baseDateStr}
          placeholder="Thêm việc..."
        />
      )}

      {/* 2. Danh Sách Task */}
      {orderedRootNodes.length === 0 ? (
        <div className="py-6 text-center text-xs font-medium text-[#78716C] dark:text-[#8E8E93]">
          <p>{emptyMessage}</p>
          {emptySubMessage && <p className="text-[11px] text-[#A8A29E] mt-0.5">{emptySubMessage}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {orderedRootNodes.map((node, index) => (
            <React.Fragment key={node.task.id}>
              {showCompletionSection && node.task.completed &&
                 (index === 0 || !orderedRootNodes[index - 1].task.completed) && (
                  presentation === "desktop" && (
                    <button
                      type="button"
                      onClick={() => setIsCompletedSectionOpen((open) => !open)}
                      className="mt-4 mb-1 flex w-full items-center justify-between px-1 py-2 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] cursor-pointer"
                      aria-expanded={isCompletedSectionOpen}
                    >
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 size={13} strokeWidth={2.4} className="shrink-0 text-emerald-500" />
                        <span>Đã xong ({completedTaskCount})</span>
                      </span>
                      {isCompletedSectionOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    </button>
                  )
                )}
                {showCompletionSection && node.task.completed &&
                  (index === 0 || !orderedRootNodes[index - 1].task.completed) && (
                  <div
                    className={
                      presentation === "desktop"
                        ? "hidden mt-4 mb-1 pt-2 flex items-center justify-between text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]"
                        : "mt-4 mb-2 flex items-center justify-between rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#aeaeb2]"
                    }
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={13} strokeWidth={2.4} className="text-emerald-500 shrink-0" />
                      <span>Đã hoàn thành ({orderedRootNodes.filter((n) => n.task.completed).length})</span>
                    </span>
                  </div>
                )}
              {(!node.task.completed || presentation !== "desktop" || isCompletedSectionOpen) && (
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
                baseDateStr={baseDateStr}
                moveButtonTitle={moveButtonTitle}
                activeTaskId={activeTaskId}
                showEventTimeLabel={showEventTimeLabel}
                presentation={presentation}
              />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
