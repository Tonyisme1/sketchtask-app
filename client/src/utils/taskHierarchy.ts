import { TaskDto } from "../types";

// ==========================================
// HELPER: Multi-Level Task Hierarchy (Cây Đa Tầng: Ông ➔ Cha ➔ Con ➔ Cháu)
// Hỗ trợ không giới hạn cấp độ lồng nhau với cơ chế chống vòng lặp (Anti-Cycle)
// ==========================================

export interface TaskHierarchyNode {
  task: TaskDto;
  children: TaskHierarchyNode[];
  depth: number; // 0: gốc, 1: cấp 1, 2: cấp 2...
  isOutOfFilterContext?: boolean;
  isOrphanSubtask?: boolean;
}

// Giữ tương thích ngược với kiểu cũ
export interface TaskHierarchyItem {
  task: TaskDto;
  isParent: boolean;
  children: TaskDto[];
  isOutOfFilterContext?: boolean;
  isOrphanSubtask?: boolean;
}

/**
 * Xây dựng cây phân cấp đa tầng từ danh sách task hiển thị và toàn bộ task store
 */
export const buildMultiLevelTaskTree = (
  visibleTasks: TaskDto[],
  allTasks?: TaskDto[]
): TaskHierarchyNode[] => {
  const visibleMap = new Map<string, TaskDto>();
  visibleTasks.forEach((t) => visibleMap.set(t.id, t));

  const allMap = new Map<string, TaskDto>();
  if (allTasks && allTasks.length > 0) {
    allTasks.forEach((t) => allMap.set(t.id, t));
  } else {
    visibleTasks.forEach((t) => allMap.set(t.id, t));
  }

  // 1. Tìm tất cả các task con trong visibleTasks
  const parentToVisibleChildren = new Map<string, TaskDto[]>();
  const isChildInVisible = new Set<string>();

  visibleTasks.forEach((t) => {
    if (t.parentTaskId) {
      isChildInVisible.add(t.id);
      const list = parentToVisibleChildren.get(t.parentTaskId) || [];
      list.push(t);
      parentToVisibleChildren.set(t.parentTaskId, list);
    }
  });

  // Hàm đệ quy xây dựng node con
  const buildNode = (task: TaskDto, depth: number, isOutOfContext = false): TaskHierarchyNode => {
    const rawChildren = parentToVisibleChildren.get(task.id) || [];
    const childrenNodes = rawChildren.map((child) => buildNode(child, depth + 1, false));

    const isOrphan = Boolean(task.parentTaskId && !allMap.has(task.parentTaskId));

    return {
      task,
      children: childrenNodes,
      depth,
      isOutOfFilterContext: isOutOfContext,
      isOrphanSubtask: isOrphan,
    };
  };

  const rootNodes: TaskHierarchyNode[] = [];
  const processedRootIds = new Set<string>();

  // 2. Thêm các task gốc nằm trong visibleTasks (những task không có parentTaskId hoặc parentTaskId không nằm trong visibleTasks)
  visibleTasks.forEach((t) => {
    if (!t.parentTaskId || !visibleMap.has(t.parentTaskId)) {
      // Nếu parentTaskId nằm ngoài visibleTasks nhưng có trong allMap -> Parent context
      if (t.parentTaskId && allMap.has(t.parentTaskId)) {
        // Tìm tổ tiên cao nhất nằm ngoài visibleTasks hoặc chính parent đó
        const parentTask = allMap.get(t.parentTaskId)!;
        if (!processedRootIds.has(parentTask.id)) {
          processedRootIds.add(parentTask.id);
          rootNodes.push(buildNode(parentTask, 0, true));
        }
      } else {
        // Task gốc thực thụ trong visibleTasks
        if (!processedRootIds.has(t.id)) {
          processedRootIds.add(t.id);
          rootNodes.push(buildNode(t, 0, false));
        }
      }
    }
  });

  return rootNodes;
};

/**
 * Hàm tương thích cũ cho 2 cấp nếu cần
 */
export const groupTasksByHierarchy = (
  visibleTasks: TaskDto[],
  allTasks?: TaskDto[]
): TaskHierarchyItem[] => {
  const tree = buildMultiLevelTaskTree(visibleTasks, allTasks);
  return tree.map((node) => ({
    task: node.task,
    isParent: node.children.length > 0,
    children: node.children.map((c) => c.task),
    isOutOfFilterContext: node.isOutOfFilterContext,
    isOrphanSubtask: node.isOrphanSubtask,
  }));
};
