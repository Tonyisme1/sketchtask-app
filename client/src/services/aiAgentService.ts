import { TaskDto, TaskPriority, TaskTimeType } from "../types";
import {
  isTaskDueToday,
  getTaskTemporalState,
} from "../utils/taskSemantics";

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ParsedTaskIntent {
  title: string;
  dueDate: string;
  timeType: TaskTimeType;
  startTime?: string;
  endTime?: string;
  deadlineTime?: string;
  deadlineDate?: string;
  priority: TaskPriority;
  tag?: string;
  tags?: string[];
  description?: string;
}

export interface GoalPlanBreakdown {
  goalTitle: string;
  subtasks: ParsedTaskIntent[];
}

export interface AIQueryResult {
  type:
    | "created_task"
    | "batch_created"
    | "goal_breakdown"
    | "task_action"
    | "stats_progress"
    | "task_query"
    | "text_reply";
  text: string;
  createdTasks?: {
    id: string;
    title: string;
    priority: TaskPriority;
    timeLabel?: string;
    tag?: string;
    dueDate?: string;
  }[];
  breakdownPlan?: GoalPlanBreakdown;
  queriedTasks?: {
    id: string;
    title: string;
    completed: boolean;
    priority: TaskPriority;
    timeLabel?: string;
    tag?: string;
  }[];
  stats?: {
    totalCount: number;
    completedTotal: number;
    totalPercent: number;
    todayCount: number;
    completedToday: number;
    todayPercent: number;
    overdueCount: number;
    urgentCount: number;
  };
}

export interface DynamicPromptChip {
  id: string;
  label: string;
  icon?: string;
  query: string;
}

export interface AgentProcessContext {
  tasks: TaskDto[];
  addTask: (task: {
    title: string;
    description?: string;
    dueDate?: string;
    startDate?: string;
    endDate?: string;
    timeType?: TaskTimeType;
    startTime?: string;
    endTime?: string;
    deadlineDate?: string;
    deadlineTime?: string;
    tag?: string;
    tags?: string[];
    parentTaskId?: string;
    priority?: TaskPriority;
    [key: string]: any;
  }) => TaskDto;
  toggleTask: (taskId: string) => void;
  deleteTask?: (taskId: string) => void;
}

// ==========================================
// DYNAMIC SMART PROMPT CHIPS GENERATOR
// ==========================================

export function generateDynamicPromptChips(
  tasks: TaskDto[],
  now: Date = new Date()
): DynamicPromptChip[] {
  const chips: DynamicPromptChip[] = [];
  const todayTasks = tasks.filter((t) => isTaskDueToday(t, now));
  const openToday = todayTasks.filter((t) => !t.completed);
  const completedToday = todayTasks.filter((t) => t.completed);

  const overdue = tasks.filter((t) => {
    if (t.completed) return false;
    const state = getTaskTemporalState(t, now);
    return state === "overdue" || state === "pastScheduled";
  });

  const urgent = tasks.filter((t) => !t.completed && t.priority === "high");

  // 1. Cảnh báo quá hạn nếu có
  if (overdue.length > 0) {
    chips.push({
      id: "overdue",
      label: `${overdue.length} việc quá hạn`,
      query: "Phân tích và cho tôi danh sách các việc đang bị quá hạn",
    });
  }

  // 2. Việc gấp nếu có
  if (urgent.length > 0) {
    chips.push({
      id: "urgent",
      label: `${urgent.length} việc gấp`,
      query: "Tổng hợp các việc gấp cần làm ưu tiên nhất",
    });
  }

  // 3. Tóm tắt hôm nay hoặc việc tiếp theo
  if (openToday.length > 0) {
    chips.push({
      id: "today_summary",
      label: `Hôm nay (${openToday.length} việc)`,
      query: "Tóm tắt danh sách công việc cần làm hôm nay",
    });
    chips.push({
      id: "next_task",
      label: "Việc nên làm tiếp theo",
      query: "Dựa vào danh sách hôm nay, tôi nên làm việc gì tiếp theo?",
    });
  } else if (completedToday.length > 0 && todayTasks.length === completedToday.length) {
    chips.push({
      id: "completed_all",
      label: "Tổng kết hôm nay",
      query: "Đánh giá hiệu suất làm việc hôm nay của tôi",
    });
  } else {
    chips.push({
      id: "plan_today",
      label: "Lên kế hoạch hôm nay",
      query: "Gợi ý lịch trình làm việc hiệu quả cho hôm nay",
    });
  }

  // 4. Phân tích tiến độ
  chips.push({
    id: "stats",
    label: "Phân tích tiến độ",
    query: "Phân tích tiến độ công việc và tỷ lệ hoàn thành",
  });

  // 5. Gợi ý chia nhỏ mục tiêu
  chips.push({
    id: "breakdown",
    label: "Chia nhỏ mục tiêu",
    query: "Lập kế hoạch dọn dẹp nhà cửa cuối tuần",
  });

  return chips.slice(0, 5);
}
