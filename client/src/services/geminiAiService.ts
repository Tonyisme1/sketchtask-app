import { TaskDto, TaskPriority, TaskTimeType } from "../types";
import { getLocalTodayStr } from "../utils/date";
import {
  getTaskItemType,
  getTaskTemporalState,
  isTaskDeadline,
  isTaskDueToday,
} from "../utils/taskSemantics";
import { AI_CONFIG, getEffectiveGeminiApiKey } from "../config/aiConfig";
import {
  AIActionProposal,
  AIProposalAction,
  AIQueryResult,
  AgentProcessContext,
  GoalPlanBreakdown,
  ParsedTaskIntent,
} from "./aiAgentService";

type GeminiAction =
  | "create_tasks"
  | "breakdown_plan"
  | "complete_task"
  | "delete_task"
  | "create_journal_entry"
  | "create_note"
  | "none";

interface GeminiActionPayload {
  action?: GeminiAction;
  type?: GeminiAction;
  tasks?: unknown;
  plan?: unknown;
  taskId?: unknown;
  journal?: unknown;
  note?: unknown;
}

interface GeminiPayload extends GeminiActionPayload {
  actions?: unknown[];
}

const DAY_NAMES = [
  "Chủ nhật",
  "Thứ hai",
  "Thứ ba",
  "Thứ tư",
  "Thứ năm",
  "Thứ sáu",
  "Thứ bảy",
];

const createProposalId = () => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `ai-proposal-${crypto.randomUUID()}`;
    }
  } catch {
    // Fall through to a compatible identifier for older browsers.
  }
  return `ai-proposal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isValidDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const normalizePriority = (value: unknown): TaskPriority =>
  value === "high" || value === "low" ? value : "medium";

const normalizeTimeType = (value: unknown): TaskTimeType => {
  if (value === "scheduled" || value === "deadline" || value === "event") return value;
  return "task";
};

const parseTaskIntent = (value: unknown): ParsedTaskIntent | null => {
  if (!isObject(value) || typeof value.title !== "string" || !value.title.trim()) return null;

  const timeType = normalizeTimeType(value.timeType ?? value.itemType);
  const dueDate = isValidDate(value.dueDate)
    ? value.dueDate
    : isValidDate(value.date)
      ? value.date
      : undefined;
  const startTime = isValidTime(value.startTime) ? value.startTime : undefined;
  const endTime = isValidTime(value.endTime) ? value.endTime : undefined;
  const deadlineTime = isValidTime(value.deadlineTime) ? value.deadlineTime : undefined;
  const deadlineDate = isValidDate(value.deadlineDate)
    ? value.deadlineDate
    : timeType === "deadline"
      ? dueDate
      : undefined;
  const legacyTags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim())).slice(0, 8)
    : undefined;
  const tag = typeof value.tag === "string"
    ? value.tag.trim().slice(0, 64) || undefined
    : legacyTags?.[0]?.trim().slice(0, 64) || undefined;

  return {
    title: value.title.trim().slice(0, 240),
    dueDate,
    timeType,
    startTime,
    endTime,
    deadlineTime,
    deadlineDate,
    priority: normalizePriority(value.priority),
    tag,
    description:
      typeof value.description === "string" ? value.description.trim().slice(0, 2000) || undefined : undefined,
  };
};

const uniqueTaskIntents = (intents: ParsedTaskIntent[]) => {
  const seenTitles = new Set<string>();
  return intents.filter((intent) => {
    const key = intent.title.trim().toLocaleLowerCase();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });
};

const taskExists = (tasks: TaskDto[], taskId: unknown) =>
  typeof taskId === "string" && tasks.some((task) => task.id === taskId);

const parseAction = (
  payload: GeminiActionPayload,
  tasks: TaskDto[],
  todayStr: string,
): AIProposalAction | null => {
  const action = payload.action || payload.type;

  if (action === "create_tasks" && Array.isArray(payload.tasks)) {
    const parsedTasks = payload.tasks
      .map((task) => parseTaskIntent(task))
      .filter((task): task is ParsedTaskIntent => Boolean(task))
      .slice(0, 8);
    const uniqueTasks = uniqueTaskIntents(parsedTasks);
    return uniqueTasks.length ? { type: "create_tasks", tasks: uniqueTasks } : null;
  }

  const planPayload = payload.plan;
  if (action === "breakdown_plan" && isObject(planPayload)) {
    const steps = Array.isArray(planPayload.steps)
      ? planPayload.steps
          .map((step) => parseTaskIntent(step))
          .filter((step): step is ParsedTaskIntent => Boolean(step))
          .slice(0, 7)
      : [];
    const uniqueSteps = uniqueTaskIntents(steps);
    const targetTask = taskExists(tasks, planPayload.targetTaskId)
      ? tasks.find((task) => task.id === planPayload.targetTaskId)
      : undefined;
    if (typeof planPayload.goalTitle === "string" && planPayload.goalTitle.trim() && uniqueSteps.length >= 2) {
      const plan: GoalPlanBreakdown = {
        goalTitle: planPayload.goalTitle.trim().slice(0, 240),
        subtasks: uniqueSteps,
        targetTaskId: targetTask && getTaskItemType(targetTask) !== "event"
          ? targetTask.id
          : undefined,
      };
      return { type: "breakdown_goal", plan };
    }
  }

  if (
    (action === "complete_task" || action === "delete_task") &&
    taskExists(tasks, payload.taskId)
  ) {
    const task = tasks.find((candidate) => candidate.id === payload.taskId);
    if (task && getTaskItemType(task) !== "event") {
      return { type: action, taskId: String(payload.taskId) };
    }
  }

  if (action === "create_journal_entry" && isObject(payload.journal)) {
    const date = isValidDate(payload.journal.date) ? payload.journal.date : todayStr;
    const time = isValidTime(payload.journal.time) ? payload.journal.time : "09:00";
    const content = typeof payload.journal.content === "string" ? payload.journal.content.trim().slice(0, 4000) : "";
    if (content) {
      return {
        type: "create_journal_entry",
        date,
        time,
        content,
        linkedTaskId: taskExists(tasks, payload.journal.linkedTaskId)
          ? String(payload.journal.linkedTaskId)
          : undefined,
      };
    }
  }

  if (action === "create_note" && isObject(payload.note)) {
    const title = typeof payload.note.title === "string" ? payload.note.title.trim().slice(0, 240) : "";
    const content = typeof payload.note.content === "string" ? payload.note.content.trim().slice(0, 10000) : "";
    if (title || content) {
      return { type: "create_note", title: title || "Ghi chú không tiêu đề", content };
    }
  }

  return null;
};

const parseProposal = (
  payload: GeminiPayload,
  tasks: TaskDto[],
  todayStr: string,
): AIActionProposal | null => {
  const actionPayloads = Array.isArray(payload.actions) && payload.actions.length > 0
    ? payload.actions.filter(isObject).slice(0, 8).map((action) => action as GeminiActionPayload)
    : [payload];
  const actions = actionPayloads
    .map((action) => parseAction(action, tasks, todayStr))
    .filter((action): action is AIProposalAction => Boolean(action));

  return actions.length ? { id: createProposalId(), actions } : null;
};

const extractAnswer = (rawAnswer: string) => {
  const fenced = rawAnswer.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) {
    try {
      return {
        text: rawAnswer.replace(fenced[0], "").trim(),
        payload: JSON.parse(fenced[1]) as GeminiPayload,
      };
    } catch {
      // Keep the natural language answer when the model returned malformed JSON.
    }
  }

  const firstBrace = rawAnswer.indexOf("{");
  const lastBrace = rawAnswer.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return {
        text: rawAnswer.slice(0, firstBrace).trim(),
        payload: JSON.parse(rawAnswer.slice(firstBrace, lastBrace + 1)) as GeminiPayload,
      };
    } catch {
      // Not an action response.
    }
  }

  return { text: rawAnswer.trim(), payload: null };
};

const getActionInstruction = () => `
Nếu người dùng yêu cầu thay đổi dữ liệu, hãy trả lời ngắn gọn rồi thêm đúng một khối JSON ở cuối câu trả lời. Nếu có nhiều việc độc lập trong cùng một câu, dùng "actions" để gom tất cả đề xuất trong một lần:
{
  "action": "create_tasks" | "breakdown_plan" | "complete_task" | "delete_task" | "create_journal_entry" | "create_note" | "none",
  "actions": [{ "action": "create_tasks|breakdown_plan|complete_task|delete_task|create_journal_entry|create_note", "tasks": [], "plan": {}, "taskId": "...", "journal": {}, "note": {} }],
  "tasks": [{ "title": "...", "dueDate": "YYYY-MM-DD", "timeType": "task|scheduled|deadline|event", "startTime": "HH:MM", "endTime": "HH:MM", "deadlineTime": "HH:MM", "priority": "high|medium|low", "tag": "...", "description": "..." }],
  "plan": { "goalTitle": "...", "targetTaskId": "id chính xác nếu có", "steps": [{ "title": "...", "dueDate": "YYYY-MM-DD", "timeType": "task|scheduled|deadline", "startTime": "HH:MM", "endTime": "HH:MM", "deadlineTime": "HH:MM", "priority": "high|medium|low", "tag": "..." }] },
  "taskId": "id chính xác từ danh mục công việc",
  "journal": { "date": "YYYY-MM-DD", "time": "HH:MM", "content": "...", "linkedTaskId": "id chính xác nếu có" },
  "note": { "title": "...", "content": "..." }
}
Quy tắc xử lý: phân biệt việc thường, task có deadline, và lịch hẹn/event có thời gian bắt đầu-kết thúc. Chỉ điền ngày, giờ, ưu tiên và nhãn khi người dùng nêu rõ hoặc có ngữ cảnh chắc chắn; nếu không biết thì bỏ trường đó, tuyệt đối không mặc định là hôm nay. Hiểu ngày tương đối theo ngày hiện tại. Chỉ dùng action khi người dùng thật sự yêu cầu thay đổi, và không tự nhận đã tạo, xóa hoặc hoàn thành dữ liệu. Event không có checkbox hoàn thành. Với hoàn thành/xóa, chỉ dùng taskId có trong danh mục, không đoán theo tên.

Quy tắc chia nhỏ mục tiêu: chỉ dùng "breakdown_plan" khi người dùng nói rõ muốn chia nhỏ/lập kế hoạch. Không bao giờ tự chọn một số lượng cố định như 4 bước. Chỉ đề xuất số bước ít nhất đủ để làm được việc (tối đa 7); nếu mục tiêu, thời hạn hoặc mức độ chi tiết chưa rõ thì hỏi đúng một câu làm rõ và không trả JSON action. Không bịa thêm bước trùng nhau. Mọi action chỉ là đề xuất để người dùng chọn từng mục ở giao diện.
`;

export async function askGeminiAIAssistant(
  userQuery: string,
  history: { sender: "ai" | "user"; text: string }[],
  context: AgentProcessContext,
  now: Date = new Date(),
): Promise<AIQueryResult> {
  const apiKey = getEffectiveGeminiApiKey();
  if (!apiKey) {
    return { type: "text_reply", text: "Hệ thống AI hiện chưa sẵn sàng kết nối. Vui lòng thử lại sau." };
  }

  const todayStr = getLocalTodayStr(now);
  const todayTasks = context.tasks.filter((task) => isTaskDueToday(task, now));
  const overdueTasks = context.tasks.filter((task) => {
    if (task.completed || !isTaskDeadline(task)) return false;
    const state = getTaskTemporalState(task, now);
    return state === "overdue";
  });
  const taskCatalog = context.tasks.slice(0, 400).map((task) => ({
    id: task.id,
    title: task.title,
    completed: task.completed,
    itemType: getTaskItemType(task),
    timeType: task.timeType || "task",
    priority: task.priority || "medium",
    tag: task.tag,
    description: task.description?.slice(0, 400),
    dueDate: task.dueDate,
    deadlineDate: task.deadlineDate,
    startTime: task.startTime,
    endTime: task.endTime,
    deadlineTime: task.deadlineTime,
    parentTaskId: task.parentTaskId,
  }));

  const contextText = JSON.stringify(taskCatalog);
  const systemInstruction = `Bạn là trợ lý cá nhân của SketchTask. Trả lời bằng tiếng Việt, rõ ràng, thực tế và không dài dòng.
Hôm nay: ${DAY_NAMES[now.getDay()]}, ${todayStr}; giờ hiện tại: ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}.
Hôm nay có ${todayTasks.length} việc, trong đó ${todayTasks.filter((task) => task.completed).length} đã xong. Có ${overdueTasks.length} việc quá hạn.
Danh mục công việc hiện tại (ID là định danh duy nhất, phải dùng nguyên văn khi thao tác): ${contextText}
${getActionInstruction()}`;

  const recentHistory = history.slice(-8).map((message) => ({
    role: message.sender === "user" ? "user" : "model",
    parts: [{ text: message.text }],
  }));
  const models = AI_CONFIG.FALLBACK_MODELS?.length ? AI_CONFIG.FALLBACK_MODELS : [AI_CONFIG.DEFAULT_MODEL];

  for (const model of models) {
    try {
      const response = await fetch(
        `${AI_CONFIG.BASE_URL}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [...recentHistory, { role: "user", parts: [{ text: userQuery }] }],
            generationConfig: { temperature: 0.15, maxOutputTokens: 4000 },
          }),
        },
      );
      if (!response.ok) continue;

      const data = await response.json();
      const rawAnswer = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof rawAnswer !== "string" || !rawAnswer.trim()) continue;

      const { text: cleanText, payload } = extractAnswer(rawAnswer);
      const proposal = payload ? parseProposal(payload, context.tasks, todayStr) : null;
      if (proposal) {
        return {
          type: "action_proposal",
          text: cleanText || "Mình đã chuẩn bị đề xuất để bạn xem lại trước khi áp dụng.",
          proposal,
        };
      }

      return { type: "text_reply", text: cleanText || rawAnswer.trim() };
    } catch (error) {
      console.warn(`Gemini model ${model} error, trying next model:`, error);
    }
  }

  return {
    type: "text_reply",
    text: "Không thể kết nối đến máy chủ Gemini. Vui lòng kiểm tra mạng hoặc thử lại sau.",
  };
}
