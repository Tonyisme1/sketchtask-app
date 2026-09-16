import { TaskDto, TaskPriority, TaskTimeType } from "../types";
import { getLocalTodayStr, getNextDayStr } from "../utils/date";
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

// ==========================================
// HELPER: DATE & TIME PARSING (TIẾNG VIỆT)
// ==========================================

/**
 * Tính toán ngày theo thứ trong tuần tới (thứ 2 -> chủ nhật)
 */
function getNextDayOfWeek(targetDayOfWeek: number, refDate: Date = new Date()): string {
  const currentDay = refDate.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
  let diff = targetDayOfWeek - currentDay;
  if (diff <= 0) {
    diff += 7; // Lấy ngày của tuần tới nếu đã qua
  }
  const result = new Date(refDate);
  result.setDate(result.getDate() + diff);
  return getLocalTodayStr(result);
}

/**
 * Lấy ngày thứ Bảy tuần này (cuối tuần)
 */
function getThisWeekendStr(refDate: Date = new Date()): string {
  const currentDay = refDate.getDay();
  const diffToSat = (6 - currentDay + 7) % 7;
  const result = new Date(refDate);
  result.setDate(result.getDate() + (diffToSat === 0 ? 7 : diffToSat));
  return getLocalTodayStr(result);
}

/**
 * Phân tích ngày tự nhiên từ chuỗi tiếng Việt
 */
export function extractDateFromVietnamese(
  text: string,
  now: Date = new Date()
): { targetDate: string; dateLabel: string; cleanedText: string } {
  let cleaned = text;
  const lower = text.toLowerCase();
  const todayStr = getLocalTodayStr(now);

  // 1. Ngày mai / sáng mai / chiều mai
  if (/\b(ngày\s+)?mai\b/i.test(lower) || /\b(sáng|trưa|chiều|tối)\s+mai\b/i.test(lower)) {
    cleaned = cleaned.replace(/\b(vào\s+)?(ngày\s+)?mai\b/gi, "").trim();
    return { targetDate: getNextDayStr(todayStr), dateLabel: "Ngày mai", cleanedText: cleaned };
  }

  // 2. Ngày kia / ngày mốt
  if (/\b(ngày\s+)?(kia|mốt)\b/i.test(lower)) {
    const d = new Date(now);
    d.setDate(d.getDate() + 2);
    cleaned = cleaned.replace(/\b(vào\s+)?(ngày\s+)?(kia|mốt)\b/gi, "").trim();
    return { targetDate: getLocalTodayStr(d), dateLabel: "Ngày kia", cleanedText: cleaned };
  }

  // 3. Cuối tuần
  if (/\bcuối\s+tuần(\s+này)?\b/i.test(lower)) {
    cleaned = cleaned.replace(/\b(vào\s+)?cuối\s+tuần(\s+này)?\b/gi, "").trim();
    return { targetDate: getThisWeekendStr(now), dateLabel: "Cuối tuần", cleanedText: cleaned };
  }

  // 4. Tuần sau
  if (/\btuần\s+sau\b/i.test(lower)) {
    const nextMon = getNextDayOfWeek(1, now);
    cleaned = cleaned.replace(/\b(vào\s+)?tuần\s+sau\b/gi, "").trim();
    return { targetDate: nextMon, dateLabel: "Tuần sau", cleanedText: cleaned };
  }

  // 5. Thứ trong tuần: thứ 2 - thứ 7, chủ nhật
  const dayOfWeekMap: { [key: string]: number } = {
    "chủ nhật": 0,
    "chu nhat": 0,
    cn: 0,
    "thứ 2": 1,
    "thu 2": 1,
    "thứ hai": 1,
    "thứ 3": 2,
    "thu 3": 2,
    "thứ ba": 2,
    "thứ 4": 3,
    "thu 4": 3,
    "thứ tư": 3,
    "thứ 5": 4,
    "thu 5": 4,
    "thứ năm": 4,
    "thứ 6": 5,
    "thu 6": 5,
    "thứ sáu": 5,
    "thứ 7": 6,
    "thu 7": 6,
    "thứ bảy": 6,
  };

  for (const [kw, dayIndex] of Object.entries(dayOfWeekMap)) {
    const reg = new RegExp(`\\b(vào\\s+)?${kw}\\b`, "i");
    if (reg.test(lower)) {
      const target = getNextDayOfWeek(dayIndex, now);
      cleaned = cleaned.replace(reg, "").trim();
      const labelCapitalized = kw.charAt(0).toUpperCase() + kw.slice(1);
      return { targetDate: target, dateLabel: labelCapitalized, cleanedText: cleaned };
    }
  }

  // 6. Định dạng ngày cụ thể: dd/mm hoặc dd-mm
  const dateNumMatch = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})([\/\-](\d{4}))?\b/);
  if (dateNumMatch) {
    const day = parseInt(dateNumMatch[1], 10);
    const month = parseInt(dateNumMatch[2], 10);
    const year = dateNumMatch[4] ? parseInt(dateNumMatch[4], 10) : now.getFullYear();
    const formatted = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cleaned = cleaned.replace(dateNumMatch[0], "").trim();
    return { targetDate: formatted, dateLabel: `${day}/${month}`, cleanedText: cleaned };
  }

  // Mặc định là hôm nay
  cleaned = cleaned.replace(/\b(hôm\s+nay|bữa\s+nay)\b/gi, "").trim();
  return { targetDate: todayStr, dateLabel: "Hôm nay", cleanedText: cleaned };
}

/**
 * Phân tích giờ giấc tự nhiên từ tiếng Việt
 */
export function extractTimeFromVietnamese(text: string): {
  timeType: TaskTimeType;
  startTime?: string;
  deadlineTime?: string;
  cleanedText: string;
} {
  let cleaned = text;
  const lower = text.toLowerCase();

  const isDeadlineIntent =
    lower.includes("hạn") ||
    lower.includes("deadline") ||
    lower.includes("trước") ||
    lower.includes("chót") ||
    lower.includes("tới hạn");

  // Tìm mẫu giờ: "14:30", "14h30", "14h", "2h chiều", "7h tối", "8h sáng", "9 giờ"
  let parsedTime: string | undefined = undefined;

  // Pattern 1: 14:30, 9:00
  const colonMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      parsedTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      cleaned = cleaned.replace(/(\d{1,2}):(\d{2})/, "").trim();
    }
  }

  // Pattern 2: 14h30, 8h, 8h00, 2h chiều, 7h tối, 9 giờ
  if (!parsedTime) {
    const hMatch = cleaned.match(/(\d{1,2})\s*(h|giờ)\s*(\d{2})?\s*(sáng|trưa|chiều|tối)?/i);
    if (hMatch) {
      let hours = parseInt(hMatch[1], 10);
      const mins = hMatch[3] ? parseInt(hMatch[3], 10) : 0;
      const period = hMatch[4]?.toLowerCase();

      if (period === "chiều" && hours < 12) {
        hours += 12;
      } else if (period === "tối" && hours < 12) {
        hours += 12;
      } else if (period === "sáng" && hours === 12) {
        hours = 0;
      }

      if (hours >= 0 && hours <= 23 && mins >= 0 && mins <= 59) {
        parsedTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
        cleaned = cleaned.replace(/(\d{1,2})\s*(h|giờ)\s*(\d{2})?\s*(sáng|trưa|chiều|tối)?/i, "").trim();
      }
    }
  }

  // Dọn dẹp các từ nối thừa
  cleaned = cleaned.replace(/\b(lúc|vào lúc|trước|vào|hạn|deadline|tới hạn)\b/gi, "").trim();

  if (parsedTime) {
    if (isDeadlineIntent) {
      return { timeType: "deadline", deadlineTime: parsedTime, cleanedText: cleaned };
    }
    return { timeType: "scheduled", startTime: parsedTime, cleanedText: cleaned };
  }

  return { timeType: "task", cleanedText: cleaned };
}

/**
 * Phân tích mức độ ưu tiên
 */
export function extractPriorityFromVietnamese(text: string): {
  priority: TaskPriority;
  cleanedText: string;
} {
  let cleaned = text;
  const lower = text.toLowerCase();

  if (
    /\b(gấp|khẩn cấp|quan trọng|priority high|high|urgent|ngay|khẩn)\b/i.test(lower)
  ) {
    cleaned = cleaned.replace(/\b(gấp|khẩn cấp|quan trọng|priority high|high|urgent|ngay|khẩn)\b/gi, "").trim();
    return { priority: "high", cleanedText: cleaned };
  }

  if (/\b(ưu tiên thấp|không vội|rảnh làm|low|thấp)\b/i.test(lower)) {
    cleaned = cleaned.replace(/\b(ưu tiên thấp|không vội|rảnh làm|low|thấp)\b/gi, "").trim();
    return { priority: "low", cleanedText: cleaned };
  }

  return { priority: "medium", cleanedText: cleaned };
}

/**
 * Phân tích nhãn (#Tag)
 */
export function extractTagsFromVietnamese(text: string): {
  tags: string[];
  primaryTag?: string;
  cleanedText: string;
} {
  let cleaned = text;
  const tagMatches = cleaned.match(/#([\p{L}\p{N}_-]+)/gu) || [];
  const tags = tagMatches.map((t) => t.replace("#", "").trim()).filter(Boolean);

  cleaned = cleaned.replace(/#([\p{L}\p{N}_-]+)/gu, "").trim();

  return {
    tags,
    primaryTag: tags[0] || undefined,
    cleanedText: cleaned,
  };
}

/**
 * Phân tích hoàn chỉnh 1 câu văn tự nhiên thành ParsedTaskIntent
 */
export function parseSingleTaskIntent(rawText: string, now: Date = new Date()): ParsedTaskIntent {
  let text = rawText.trim();

  // 1. Tách Tag
  const tagRes = extractTagsFromVietnamese(text);
  text = tagRes.cleanedText;

  // 2. Tách Ngày
  const dateRes = extractDateFromVietnamese(text, now);
  text = dateRes.cleanedText;

  // 3. Tách Giờ & TimeType
  const timeRes = extractTimeFromVietnamese(text);
  text = timeRes.cleanedText;

  // 4. Tách Ưu tiên
  const prioRes = extractPriorityFromVietnamese(text);
  text = prioRes.cleanedText;

  // 5. Làm sạch tiêu đề
  const cleanTitle = text
    .replace(/^(tạo việc|tạo task|thêm việc|thêm task|nhắc tôi|nhắc nhở|cần làm|lên lịch|phải làm|hãy làm)[:\s-]*/i, "")
    .replace(/^[:\s,-]+|[:\s,-]+$/g, "")
    .trim() || "Công việc mới";

  return {
    title: cleanTitle,
    dueDate: dateRes.targetDate,
    timeType: timeRes.timeType,
    startTime: timeRes.startTime,
    deadlineTime: timeRes.deadlineTime,
    deadlineDate: timeRes.timeType === "deadline" ? dateRes.targetDate : undefined,
    priority: prioRes.priority,
    tag: tagRes.primaryTag,
    tags: tagRes.tags.length > 0 ? tagRes.tags : undefined,
  };
}

/**
 * Phân tích văn bản nhiều dòng hoặc danh sách để bóc tách nhiều task
 */
export function parseMultiTasks(text: string, now: Date = new Date()): ParsedTaskIntent[] {
  // Tách dòng
  let lines = text.split(/[\r\n]+/);

  // Nếu chỉ có 1 dòng nhưng có định dạng 1. ... 2. ... 3. ...
  if (lines.length === 1 && /(?:^|\s)(?:1[.)\/]|\d+[.)\/]|[-•*])\s+/.test(text)) {
    const parts = text.split(/(?:^|\s)(?=(?:1[.)\/]|\d+[.)\/]|[-•*])\s+)/);
    lines = parts.filter((p) => p.trim().length > 0);
  }

  const tasks: ParsedTaskIntent[] = [];

  for (let rawLine of lines) {
    let line = rawLine
      .replace(/^(?:tạo|thêm|danh sách)?\s*(?:các|những)?\s*(?:việc|task)?[:\s]*/i, "")
      .replace(/^(?:\d+[.)\/-]|[-•*])\s*/, "")
      .trim();

    if (line.length > 1) {
      const intent = parseSingleTaskIntent(line, now);
      if (intent.title && intent.title !== "Công việc mới") {
        tasks.push(intent);
      }
    }
  }

  return tasks;
}

// ==========================================
// GOAL & PROJECT BREAKDOWN ENGINE
// ==========================================

export function breakdownGoalPlan(topic: string, now: Date = new Date()): GoalPlanBreakdown {
  const cleanTopic = topic
    .replace(/^(lập kế hoạch|kế hoạch|chia nhỏ|breakdown|các bước để|hướng dẫn làm|cách thực hiện)[:\s]*/i, "")
    .trim();

  const lower = cleanTopic.toLowerCase();
  const todayStr = getLocalTodayStr(now);
  const tomorrowStr = getNextDayStr(todayStr);

  // Mẫu kế hoạch phân rã thông minh theo ngữ cảnh
  if (lower.includes("dọn nhà") || lower.includes("dọn dẹp") || lower.includes("phòng")) {
    return {
      goalTitle: cleanTopic || "Dọn dẹp nhà cửa",
      subtasks: [
        {
          title: "Thu gom đồ đạc bừa bộn và phân loại rác",
          dueDate: todayStr,
          timeType: "scheduled",
          startTime: "09:00",
          priority: "medium",
          tag: "NhaCua",
        },
        {
          title: "Quét bụi, lau kệ bàn và hút bụi sàn nhà",
          dueDate: todayStr,
          timeType: "scheduled",
          startTime: "10:00",
          priority: "medium",
          tag: "NhaCua",
        },
        {
          title: "Lau sàn nhà và giặt thảm trải",
          dueDate: todayStr,
          timeType: "scheduled",
          startTime: "11:00",
          priority: "low",
          tag: "NhaCua",
        },
        {
          title: "Sắp xếp lại tủ quần áo & bàn làm việc gọn gàng",
          dueDate: tomorrowStr,
          timeType: "task",
          priority: "low",
          tag: "NhaCua",
        },
      ],
    };
  }

  if (lower.includes("học") || lower.includes("thi") || lower.includes("tiếng anh") || lower.includes("ielts")) {
    return {
      goalTitle: cleanTopic || "Kế hoạch học tập",
      subtasks: [
        {
          title: `Tổng hợp tài liệu và đề cương mục tiêu: ${cleanTopic}`,
          dueDate: todayStr,
          timeType: "scheduled",
          startTime: "08:30",
          priority: "high",
          tag: "HocTap",
        },
        {
          title: "Học lý thuyết và ghi chép tóm tắt ý chính",
          dueDate: todayStr,
          timeType: "scheduled",
          startTime: "14:00",
          priority: "medium",
          tag: "HocTap",
        },
        {
          title: "Luyện tập 2 bộ đề thực hành / bài tập áp dụng",
          dueDate: tomorrowStr,
          timeType: "deadline",
          deadlineTime: "17:00",
          priority: "high",
          tag: "HocTap",
        },
        {
          title: "Ôn lại lỗi sai và tổng kết kiến thức tuần",
          dueDate: getThisWeekendStr(now),
          timeType: "task",
          priority: "medium",
          tag: "HocTap",
        },
      ],
    };
  }

  if (lower.includes("thuyết trình") || lower.includes("báo cáo") || lower.includes("presentation")) {
    return {
      goalTitle: cleanTopic || "Chuẩn bị bài thuyết trình",
      subtasks: [
        {
          title: "Lên dàn ý chi tiết và thu thập số liệu",
          dueDate: todayStr,
          timeType: "scheduled",
          startTime: "10:00",
          priority: "high",
          tag: "CongViec",
        },
        {
          title: "Thiết kế slide thuyết trình trực quan",
          dueDate: todayStr,
          timeType: "deadline",
          deadlineTime: "17:30",
          priority: "high",
          tag: "CongViec",
        },
        {
          title: "Tập dượt nói trước gương và canh thời gian (15-20p)",
          dueDate: tomorrowStr,
          timeType: "scheduled",
          startTime: "09:00",
          priority: "medium",
          tag: "CongViec",
        },
        {
          title: "Kiểm tra lại máy chiếu, file backup & tài liệu phát tay",
          dueDate: tomorrowStr,
          timeType: "scheduled",
          startTime: "13:30",
          priority: "medium",
          tag: "CongViec",
        },
      ],
    };
  }

  // Phân rã mục tiêu đa năng
  return {
    goalTitle: cleanTopic || "Kế hoạch thực hiện",
    subtasks: [
      {
        title: `Nghiên cứu & Lập danh sách chuẩn bị cho: ${cleanTopic}`,
        dueDate: todayStr,
        timeType: "scheduled",
        startTime: "09:00",
        priority: "high",
        tag: "KeHoach",
      },
      {
        title: `Bắt tay triển khai giai đoạn 1: ${cleanTopic}`,
        dueDate: todayStr,
        timeType: "deadline",
        deadlineTime: "16:00",
        priority: "medium",
        tag: "KeHoach",
      },
      {
        title: "Kiểm tra tiến độ, đánh giá kết quả & sửa đổi",
        dueDate: tomorrowStr,
        timeType: "task",
        priority: "medium",
        tag: "KeHoach",
      },
      {
        title: "Hoàn tất và lưu trữ tài liệu tổng kết",
        dueDate: tomorrowStr,
        timeType: "task",
        priority: "low",
        tag: "KeHoach",
      },
    ],
  };
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
      label: `⚠️ ${overdue.length} việc quá hạn`,
      query: "Xem danh sách việc quá hạn",
    });
  }

  // 2. Việc gấp nếu có
  if (urgent.length > 0) {
    chips.push({
      id: "urgent",
      label: `🔥 ${urgent.length} việc gấp`,
      query: "Xem việc gấp",
    });
  }

  // 3. Tóm tắt hôm nay hoặc việc tiếp theo
  if (openToday.length > 0) {
    chips.push({
      id: "today_summary",
      label: `📋 Hôm nay (${openToday.length} việc)`,
      query: "Tóm tắt hôm nay",
    });
    chips.push({
      id: "next_task",
      label: "🎯 Việc nên làm tiếp theo",
      query: "Gợi ý việc tiếp theo",
    });
  } else if (completedToday.length > 0 && todayTasks.length === completedToday.length) {
    chips.push({
      id: "completed_all",
      label: "🎉 Tổng kết hôm nay",
      query: "Phân tích tiến độ",
    });
  } else {
    chips.push({
      id: "plan_today",
      label: "⚡ Lên kế hoạch hôm nay",
      query: "Lập kế hoạch làm việc hôm nay",
    });
  }

  // 4. Phân tích tiến độ
  chips.push({
    id: "stats",
    label: "📊 Phân tích tiến độ",
    query: "Phân tích tiến độ",
  });

  // 5. Gợi ý chia nhỏ mục tiêu
  chips.push({
    id: "breakdown",
    label: "💡 Chia nhỏ mục tiêu",
    query: "Lập kế hoạch dọn dẹp nhà cửa cuối tuần",
  });

  return chips.slice(0, 5);
}

// ==========================================
// MAIN AGENT QUERY PROCESSOR
// ==========================================

export interface AgentProcessContext {
  tasks: TaskDto[];
  addTask: (task: Partial<TaskDto>) => TaskDto;
  toggleTask: (taskId: string) => void;
  deleteTask?: (taskId: string) => void;
}

export function processUserQueryWithAgent(
  query: string,
  context: AgentProcessContext,
  now: Date = new Date()
): AIQueryResult {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const todayStr = getLocalTodayStr(now);
  const tomorrowStr = getNextDayStr(todayStr);

  const { tasks, addTask, toggleTask } = context;

  // Tính toán dữ liệu bối cảnh
  const todayTasks = tasks.filter((t) => isTaskDueToday(t, now));
  const openTodayTasks = todayTasks.filter((t) => !t.completed);
  const completedTodayTasks = todayTasks.filter((t) => t.completed);
  const overdueTasks = tasks.filter((t) => {
    if (t.completed) return false;
    const state = getTaskTemporalState(t, now);
    return state === "overdue" || state === "pastScheduled";
  });
  const highPriorityTasks = tasks.filter((t) => !t.completed && t.priority === "high");

  // ========================================================
  // 1. CHIA NHỎ MỤC TIÊU / DỰ ÁN (GOAL & PROJECT BREAKDOWN)
  // ========================================================
  if (
    lower.startsWith("lập kế hoạch") ||
    lower.startsWith("kế hoạch") ||
    lower.startsWith("chia nhỏ") ||
    lower.startsWith("breakdown") ||
    lower.startsWith("các bước để") ||
    lower.includes("lập kế hoạch cho")
  ) {
    const breakdown = breakdownGoalPlan(trimmed, now);
    return {
      type: "goal_breakdown",
      text: `💡 **Kế hoạch đề xuất cho:** *"${breakdown.goalTitle}"*\n\nMình đã phân rã thành **${breakdown.subtasks.length} bước công việc** cụ thể. Bạn có thể bấm nút bên dưới để thêm nhanh vào danh sách việc:`,
      breakdownPlan: breakdown,
    };
  }

  // ========================================================
  // 2. THAO TÁC CÔNG VIỆC QUA LỆNH (TASK ACTIONS)
  // ========================================================
  // Hoàn thành task
  if (
    lower.startsWith("hoàn thành việc") ||
    lower.startsWith("xong việc") ||
    lower.startsWith("check việc") ||
    lower.startsWith("đã làm xong")
  ) {
    const taskNameToFind = trimmed
      .replace(/^(hoàn thành việc|xong việc|check việc|đã làm xong)[:\s]*/i, "")
      .trim()
      .toLowerCase();

    if (!taskNameToFind) {
      return {
        type: "text_reply",
        text: "Bạn muốn đánh dấu xong công việc nào? Hãy gõ: *\"Hoàn thành việc [Tên việc]\"*.",
      };
    }

    const matchedTask = tasks.find(
      (t) => !t.completed && t.title.toLowerCase().includes(taskNameToFind)
    );

    if (matchedTask) {
      toggleTask(matchedTask.id);
      return {
        type: "task_action",
        text: `✓ Đã đánh dấu hoàn thành công việc: **"${matchedTask.title}"**! Tuyệt vời!`,
      };
    } else {
      return {
        type: "text_reply",
        text: `Không tìm thấy công việc chưa xong nào khớp với từ khóa *"${taskNameToFind}"*. Hãy kiểm tra lại danh sách nhé.`,
      };
    }
  }

  // ========================================================
  // 3. TẠO NHIỀU TASK CÙNG LÚC (BATCH TASK CREATION)
  // ========================================================
  const isMultiTaskPattern =
    trimmed.includes("\n") ||
    /(?:^|\s)(?:1[.)\/]|\d+[.)\/]|[-•*])\s+/.test(trimmed) ||
    lower.startsWith("tạo các việc") ||
    lower.startsWith("tạo nhiều việc") ||
    lower.startsWith("thêm các việc");

  if (isMultiTaskPattern) {
    const parsedTasks = parseMultiTasks(trimmed, now);
    if (parsedTasks.length > 1) {
      const created: { id: string; title: string; priority: TaskPriority; timeLabel?: string; tag?: string; dueDate?: string }[] = [];

      for (const intent of parsedTasks) {
        const newTask = addTask(intent);
        const timeLabel = intent.startTime ? `⏰ ${intent.startTime}` : intent.deadlineTime ? `⏳ Hạn ${intent.deadlineTime}` : undefined;
        created.push({
          id: newTask.id,
          title: intent.title,
          priority: intent.priority,
          timeLabel,
          tag: intent.tag,
          dueDate: intent.dueDate,
        });
      }

      return {
        type: "batch_created",
        text: `✓ Đã tạo thành công **${created.length} công việc mới** vào danh sách!`,
        createdTasks: created,
      };
    }
  }

  // ========================================================
  // 4. TẠO 1 TASK ĐƠN LẺ TỰ NHIÊN (SINGLE TASK CREATION)
  // ========================================================
  const isSingleCreateIntent =
    lower.startsWith("tạo việc") ||
    lower.startsWith("tạo task") ||
    lower.startsWith("thêm việc") ||
    lower.startsWith("thêm task") ||
    lower.startsWith("nhắc tôi") ||
    lower.startsWith("nhắc nhở") ||
    lower.startsWith("cần làm") ||
    lower.startsWith("lên lịch") ||
    lower.startsWith("phải làm") ||
    lower.startsWith("tao viec") ||
    lower.startsWith("them task");

  if (isSingleCreateIntent) {
    const intent = parseSingleTaskIntent(trimmed, now);
    if (!intent.title || intent.title === "Công việc mới") {
      return {
        type: "text_reply",
        text: "Bạn muốn tạo công việc gì? Hãy gõ nội dung kèm giờ hẹn (ví dụ: *\"Tạo việc Họp team 14:30 chiều mai #CongViec gấp\"*).",
      };
    }

    const newTask = addTask(intent);
    const timeLabel = intent.startTime
      ? `⏰ ${intent.startTime}`
      : intent.deadlineTime
      ? `⏳ Hạn ${intent.deadlineTime}`
      : undefined;

    return {
      type: "created_task",
      text: `✓ Đã tạo thành công công việc mới:`,
      createdTasks: [
        {
          id: newTask.id,
          title: intent.title,
          priority: intent.priority,
          timeLabel,
          tag: intent.tag,
          dueDate: intent.dueDate,
        },
      ],
    };
  }

  // ========================================================
  // 5. TRUY VẤN: VIỆC QUÁ HẠN
  // ========================================================
  if (lower.includes("quá hạn") || lower.includes("tre han") || lower.includes("trễ hạn")) {
    if (overdueTasks.length === 0) {
      return {
        type: "text_reply",
        text: "🎉 Tuyệt vời! Hiện tại bạn **không có công việc nào bị quá hạn**.",
      };
    }

    const queried = overdueTasks.slice(0, 10).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      timeLabel: t.deadlineTime ? `Hạn ${t.deadlineTime}` : t.dueDate,
      tag: t.tag,
    }));

    return {
      type: "task_query",
      text: `⚠️ Bạn đang có **${overdueTasks.length} việc quá hạn** cần xử lý sớm:`,
      queriedTasks: queried,
    };
  }

  // ========================================================
  // 6. TRUY VẤN: VIỆC GẤP / ƯU TIÊN CAO
  // ========================================================
  if (lower.includes("việc gấp") || lower.includes("ưu tiên cao") || lower.includes("viec gap") || lower.includes("urgent")) {
    if (highPriorityTasks.length === 0) {
      return {
        type: "text_reply",
        text: "Hiện không có công việc nào được đánh dấu ưu tiên gấp (🔴).",
      };
    }

    const queried = highPriorityTasks.slice(0, 8).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      timeLabel: t.startTime ? `⏰ ${t.startTime}` : t.deadlineTime ? `⏳ Hạn ${t.deadlineTime}` : t.dueDate,
      tag: t.tag,
    }));

    return {
      type: "task_query",
      text: `🔥 Có **${highPriorityTasks.length} công việc ưu tiên cao (🔴)** cần lưu ý:`,
      queriedTasks: queried,
    };
  }

  // ========================================================
  // 7. TRUY VẤN: TÓM TẮT HÔM NAY & NGÀY MAI
  // ========================================================
  if (lower.includes("ngày mai") || lower.includes("lịch mai") || lower.includes("viec mai")) {
    const tomorrowTasks = tasks.filter((t) => t.dueDate === tomorrowStr);
    if (tomorrowTasks.length === 0) {
      return {
        type: "text_reply",
        text: `Ngày mai (${tomorrowStr}) bạn chưa có việc nào trong danh sách. Hãy gõ *"Tạo việc..."* để lên kế hoạch trước nhé.`,
      };
    }

    const queried = tomorrowTasks.slice(0, 10).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      timeLabel: t.startTime ? `⏰ ${t.startTime}` : t.deadlineTime ? `⏳ Hạn ${t.deadlineTime}` : undefined,
      tag: t.tag,
    }));

    return {
      type: "task_query",
      text: `📅 **Danh sách công việc ngày mai (${tomorrowTasks.length} việc):**`,
      queriedTasks: queried,
    };
  }

  if (lower.includes("hôm nay") || lower.includes("lịch trình") || lower.includes("tóm tắt")) {
    if (todayTasks.length === 0) {
      return {
        type: "text_reply",
        text: `Hôm nay bạn chưa có việc nào trong danh sách. Bạn có thể gõ *"Tạo việc: [Nội dung]"* hoặc chọn gợi ý để bắt đầu!`,
      };
    }

    if (openTodayTasks.length === 0) {
      return {
        type: "text_reply",
        text: `🎉 Xuất sắc! Bạn đã hoàn thành toàn bộ **${todayTasks.length}/${todayTasks.length} việc hôm nay (100%)**!`,
      };
    }

    const queried = openTodayTasks.slice(0, 10).map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
      priority: t.priority,
      timeLabel: t.startTime ? `⏰ ${t.startTime}` : t.deadlineTime ? `⏳ Hạn ${t.deadlineTime}` : undefined,
      tag: t.tag,
    }));

    return {
      type: "task_query",
      text: `📋 **Việc cần làm hôm nay (${openTodayTasks.length} việc):**`,
      queriedTasks: queried,
    };
  }

  // ========================================================
  // 8. GỢI Ý VIỆC TIẾP THEO
  // ========================================================
  if (lower.includes("nên làm") || lower.includes("gợi ý") || lower.includes("tiếp theo") || lower.includes("tiep theo")) {
    if (openTodayTasks.length === 0) {
      if (overdueTasks.length > 0) {
        const topOverdue = overdueTasks[0];
        return {
          type: "task_query",
          text: `⚠️ Hôm nay bạn đã xong việc, nhưng có **${overdueTasks.length} việc quá hạn**. Hãy giải quyết mục này:`,
          queriedTasks: [
            {
              id: topOverdue.id,
              title: topOverdue.title,
              completed: topOverdue.completed,
              priority: topOverdue.priority,
              timeLabel: "Quá hạn",
              tag: topOverdue.tag,
            },
          ],
        };
      }
      return {
        type: "text_reply",
        text: "Hôm nay bạn đã hoàn thành hết việc rồi! Bạn có thể nghỉ ngơi hoặc lên kế hoạch cho ngày mai.",
      };
    }

    const topTask =
      openTodayTasks.find((t) => t.priority === "high") ||
      openTodayTasks.find((t) => t.startTime) ||
      openTodayTasks[0];

    return {
      type: "task_query",
      text: `🎯 **Công việc nên tập trung làm tiếp theo:**`,
      queriedTasks: [
        {
          id: topTask.id,
          title: topTask.title,
          completed: topTask.completed,
          priority: topTask.priority,
          timeLabel: topTask.startTime ? `⏰ ${topTask.startTime}` : undefined,
          tag: topTask.tag,
        },
      ],
    };
  }

  // ========================================================
  // 9. PHÂN TÍCH TIẾN ĐỘ & BÁO CÁO
  // ========================================================
  if (
    lower.includes("phân tích") ||
    lower.includes("tiến độ") ||
    lower.includes("thống kê") ||
    lower.includes("báo cáo") ||
    lower.includes("tien do")
  ) {
    const totalCount = tasks.length;
    const completedTotal = tasks.filter((t) => t.completed).length;
    const totalPercent = totalCount > 0 ? Math.round((completedTotal / totalCount) * 100) : 0;
    const todayPercent =
      todayTasks.length > 0 ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;

    let advice = "Tiến độ làm việc đang rất tốt, tiếp tục phát huy nhé!";
    if (overdueTasks.length > 0) {
      advice = `⚠️ Có ${overdueTasks.length} việc quá hạn cần giải quyết sớm.`;
    } else if (highPriorityTasks.length > 0) {
      advice = `🎯 Tập trung giải quyết ${highPriorityTasks.length} việc gấp (🔴) trước.`;
    }

    return {
      type: "stats_progress",
      text: `📊 **Phân tích hiệu suất làm việc:**\n\n${advice}`,
      stats: {
        totalCount,
        completedTotal,
        totalPercent,
        todayCount: todayTasks.length,
        completedToday: completedTodayTasks.length,
        todayPercent,
        overdueCount: overdueTasks.length,
        urgentCount: highPriorityTasks.length,
      },
    };
  }

  // ========================================================
  // 10. TÌM KIẾM CÔNG VIỆC BẰNG TỪ KHÓA
  // ========================================================
  if (lower.startsWith("tìm việc") || lower.startsWith("tìm task") || lower.startsWith("tra cứu")) {
    const kw = trimmed.replace(/^(tìm việc|tìm task|tra cứu)[:\s]*/i, "").trim().toLowerCase();
    if (!kw) {
      return {
        type: "text_reply",
        text: "Bạn muốn tìm công việc gì? Hãy gõ: *\"Tìm việc [từ khóa]\"*.",
      };
    }

    const matches = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(kw) ||
        (t.tag && t.tag.toLowerCase().includes(kw)) ||
        (t.description && t.description.toLowerCase().includes(kw))
    );

    if (matches.length === 0) {
      return {
        type: "text_reply",
        text: `Không tìm thấy công việc nào chứa từ khóa *"${kw}"*.`,
      };
    }

    return {
      type: "task_query",
      text: `🔍 Tìm thấy **${matches.length} công việc** khớp với *"${kw}"*:`,
      queriedTasks: matches.slice(0, 10).map((t) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        priority: t.priority,
        timeLabel: t.dueDate,
        tag: t.tag,
      })),
    };
  }

  // ========================================================
  // 11. CHÀO HỎI & MẸO NĂNG SUẤT (PRODUCTIVITY COACHING)
  // ========================================================
  if (lower.includes("chào") || lower.includes("hi") || lower.includes("hello")) {
    return {
      type: "text_reply",
      text: "Chào bạn! Mình là Trợ lý công việc SketchTask. Hôm nay bạn cần lên lịch, phân tích tiến độ hay chia nhỏ kế hoạch nào không?",
    };
  }

  if (lower.includes("cảm ơn") || lower.includes("thanks") || lower.includes("thank you")) {
    return {
      type: "text_reply",
      text: "Rất vui được hỗ trợ bạn! Chúc bạn có một ngày làm việc thật hiệu quả và tràn đầy năng lượng.",
    };
  }

  if (lower.includes("pomodoro") || lower.includes("mẹo") || lower.includes("tập trung")) {
    return {
      type: "text_reply",
      text: "💡 **Mẹo Năng Suất (Pomodoro Technique):**\n\n1. Chọn 1 công việc quan trọng nhất.\n2. Bật hẹn giờ làm việc tập trung trong **25 phút** (không ngắt quãng).\n3. Nghỉ giải lao **5 phút**.\n4. Sau 4 chu kỳ, nghỉ dài **15-30 phút**.",
    };
  }

  // Mặc định: Nếu người dùng gõ một câu có nội dung thì tự động hiểu là ý định tạo task
  if (trimmed.length >= 3 && !lower.includes("?")) {
    const intent = parseSingleTaskIntent(trimmed, now);
    const newTask = addTask(intent);
    const timeLabel = intent.startTime
      ? `⏰ ${intent.startTime}`
      : intent.deadlineTime
      ? `⏳ Hạn ${intent.deadlineTime}`
      : undefined;

    return {
      type: "created_task",
      text: `✓ Đã tự động tạo công việc mới:`,
      createdTasks: [
        {
          id: newTask.id,
          title: intent.title,
          priority: intent.priority,
          timeLabel,
          tag: intent.tag,
          dueDate: intent.dueDate,
        },
      ],
    };
  }

  return {
    type: "text_reply",
    text: `Mình đã nhận câu hỏi: *"${trimmed}"*.\n\nBạn có thể thử:\n• *"Tạo việc: Họp team 14:30 chiều mai #CongViec gấp"*\n• *"Lập kế hoạch dọn nhà cuối tuần"*\n• *"Tóm tắt hôm nay"*\n• *"Phân tích tiến độ"*\n• *"Hoàn thành việc [tên việc]"*`,
  };
}
