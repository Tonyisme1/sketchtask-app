import { config } from "../config/index.js";
import { prisma } from "../db.js";

type ChatMessage = { sender: "user" | "ai"; text: string };
type GeminiAction =
  | "create_tasks"
  | "breakdown_plan"
  | "complete_task"
  | "delete_task"
  | "create_journal_entry"
  | "create_note"
  | "none";

type TaskIntent = {
  title: string;
  itemType: "task" | "event";
  dueDate?: string;
  timeType: "deadline" | "event" | "task";
  startTime?: string;
  endTime?: string;
  deadlineTime?: string;
  deadlineDate?: string;
  priority: "low" | "medium" | "high";
  tag?: string;
  description?: string;
};

type ProposalAction =
  | { type: "create_tasks"; tasks: TaskIntent[] }
  | { type: "breakdown_goal"; plan: { goalTitle: string; subtasks: TaskIntent[]; targetTaskId?: string } }
  | { type: "complete_task"; taskId: string }
  | { type: "delete_task"; taskId: string }
  | { type: "create_journal_entry"; date: string; time: string; content: string; linkedTaskId?: string }
  | { type: "create_note"; title: string; content: string };

type ActionPayload = Record<string, unknown> & { action?: GeminiAction; type?: GeminiAction };
type GeminiPayload = ActionPayload & {
  actions?: unknown[];
  summary?: { recognizedCount?: unknown; processableCount?: unknown; missingInformation?: unknown };
};

type ParsedProposal = {
  proposal?: { id: string; actions: ProposalAction[] };
  recognizedCount: number;
  processableCount: number;
  missingInformation: string[];
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_MODEL = "gemini-3-flash-preview";
const MAX_QUERY_LENGTH = 4_000;
const MAX_HISTORY_ITEMS = 8;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);
const isDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isTime = (value: unknown): value is string =>
  typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const newProposalId = () => `ai-proposal-${crypto.randomUUID()}`;

const parseTaskIntent = (value: unknown): TaskIntent | null => {
  if (!isRecord(value) || typeof value.title !== "string" || !value.title.trim()) return null;

  const itemType = value.itemType === "event" ? "event" : "task";
  const rawTimeType = value.timeType;
  const timeType = itemType === "event"
    ? "event"
    : rawTimeType === "deadline" || rawTimeType === "scheduled"
      ? "deadline"
      : "task";
  const legacyTags = Array.isArray(value.tags)
    ? value.tags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
    : [];
  const tagValue = typeof value.tag === "string" ? value.tag : legacyTags[0];

  return {
    title: value.title.trim().slice(0, 240),
    dueDate: isDate(value.dueDate) ? value.dueDate : isDate(value.date) ? value.date : undefined,
    itemType,
    timeType,
    startTime: itemType === "event" && isTime(value.startTime) ? value.startTime : undefined,
    endTime: itemType === "event" && isTime(value.endTime) ? value.endTime : undefined,
    deadlineTime: itemType === "task"
      ? isTime(value.deadlineTime) ? value.deadlineTime : isTime(value.startTime) ? value.startTime : undefined
      : undefined,
    deadlineDate: itemType === "task" && isDate(value.deadlineDate)
      ? value.deadlineDate
      : undefined,
    priority: value.priority === "high" || value.priority === "low" ? value.priority : "medium",
    tag: tagValue?.trim().slice(0, 64) || undefined,
    description: typeof value.description === "string" ? value.description.trim().slice(0, 2_000) || undefined : undefined,
  };
};

const uniqueTasks = (tasks: TaskIntent[]) => {
  const seen = new Set<string>();
  return tasks.filter((task) => {
    const key = task.title.toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const actionCandidateCount = (payload: ActionPayload) => {
  if (Array.isArray(payload.tasks)) return payload.tasks.length;
  if (isRecord(payload.plan) && Array.isArray(payload.plan.steps)) return payload.plan.steps.length;
  return payload.action && payload.action !== "none" ? 1 : 0;
};

const parseAction = (
  payload: ActionPayload,
  allowedTaskIds: Map<string, "task" | "event">,
  allowBreakdown: boolean,
): ProposalAction | null => {
  const action = payload.action || payload.type;
  if (action === "create_tasks" && Array.isArray(payload.tasks)) {
    const tasks = uniqueTasks(payload.tasks.map(parseTaskIntent).filter((task): task is TaskIntent => Boolean(task))).slice(0, 8);
    return tasks.length ? { type: "create_tasks", tasks } : null;
  }

  if (action === "breakdown_plan" && allowBreakdown && isRecord(payload.plan)) {
    const plan = payload.plan;
    const hasContext = plan.contextSufficient === true;
    const subtasks = Array.isArray(plan.steps)
      ? uniqueTasks(plan.steps.map(parseTaskIntent).filter((task): task is TaskIntent => Boolean(task))).slice(0, 7)
      : [];
    const targetTaskId = typeof plan.targetTaskId === "string" && allowedTaskIds.get(plan.targetTaskId) === "task"
      ? plan.targetTaskId
      : undefined;
    if (hasContext && typeof plan.goalTitle === "string" && plan.goalTitle.trim() && subtasks.length >= 2) {
      return { type: "breakdown_goal", plan: { goalTitle: plan.goalTitle.trim().slice(0, 240), subtasks, targetTaskId } };
    }
  }

  if ((action === "complete_task" || action === "delete_task") && typeof payload.taskId === "string") {
    if (allowedTaskIds.get(payload.taskId) === "task") return { type: action, taskId: payload.taskId };
  }

  if (action === "create_journal_entry" && isRecord(payload.journal)) {
    const journal = payload.journal;
    const content = typeof journal.content === "string" ? journal.content.trim().slice(0, 4_000) : "";
    if (content && isDate(journal.date) && isTime(journal.time)) {
      return {
        type: "create_journal_entry",
        date: journal.date,
        time: journal.time,
        content,
        linkedTaskId: typeof journal.linkedTaskId === "string" && allowedTaskIds.has(journal.linkedTaskId)
          ? journal.linkedTaskId
          : undefined,
      };
    }
  }

  if (action === "create_note" && isRecord(payload.note)) {
    const note = payload.note;
    const title = typeof note.title === "string" ? note.title.trim().slice(0, 240) : "";
    const content = typeof note.content === "string" ? note.content.trim().slice(0, 10_000) : "";
    if (title || content) return { type: "create_note", title: title || "Ghi chú không tiêu đề", content };
  }

  return null;
};

const parseProposal = (payload: GeminiPayload, allowedTaskIds: Map<string, "task" | "event">, query: string): ParsedProposal => {
  const rawActions = Array.isArray(payload.actions) && payload.actions.length
    ? payload.actions.filter(isRecord).slice(0, 8) as ActionPayload[]
    : [payload];
  const allowBreakdown = /chia nhỏ|phân rã|tách bước|lập kế hoạch/i.test(query);
  const actions = rawActions.map((action) => parseAction(action, allowedTaskIds, allowBreakdown)).filter((action): action is ProposalAction => Boolean(action));
  const reportedMissing = Array.isArray(payload.summary?.missingInformation)
    ? payload.summary.missingInformation.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 3)
    : [];
  const recognizedFromModel = typeof payload.summary?.recognizedCount === "number" ? payload.summary.recognizedCount : 0;
  const recognizedCount = Math.max(recognizedFromModel, rawActions.reduce((total, action) => total + actionCandidateCount(action), 0));
  const processableCount = actions.reduce((total, action) => total + (
    action.type === "create_tasks" ? action.tasks.length : action.type === "breakdown_goal" ? action.plan.subtasks.length : 1
  ), 0);

  return {
    proposal: actions.length ? { id: newProposalId(), actions } : undefined,
    recognizedCount,
    processableCount,
    missingInformation: reportedMissing,
  };
};

const extractResponse = (raw: string): { text: string; payload?: GeminiPayload } => {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] || raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  if (candidate) {
    try {
      return { text: fenced ? raw.replace(fenced[0], "").trim() : raw.slice(0, raw.indexOf("{")).trim(), payload: JSON.parse(candidate) as GeminiPayload };
    } catch {
      // A malformed payload never becomes an executable proposal.
    }
  }
  return { text: raw.trim() };
};

const formatSummary = (parsed: ParsedProposal) => {
  const missing = parsed.missingInformation.length ? ` Cần làm rõ: ${parsed.missingInformation.join("; ")}.` : "";
  return `Đã nhận diện ${parsed.recognizedCount} mục; có thể xử lý ${parsed.processableCount} mục.${missing}`;
};

export class AiService {
  static async reply(userId: string, query: string, history: ChatMessage[]) {
    const normalizedQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
    if (!normalizedQuery) throw new Error("Nội dung gửi AI đang trống.");
    if (!config.geminiApiKey) throw new Error("AI chưa được cấu hình ở máy chủ.");

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 400,
      select: {
        id: true, title: true, description: true, completed: true, itemType: true,
        timeType: true, dueDate: true, startDate: true, endDate: true,
        startTime: true, endTime: true, deadlineDate: true, deadlineTime: true,
        priority: true, tag: true, parentTaskId: true,
      },
    });
    const allowedTaskIds = new Map(tasks.map((task) => [task.id, task.itemType === "event" ? "event" as const : "task" as const]));
    const catalog = tasks.map((task) => ({ ...task, description: task.description?.slice(0, 400) }));
    const systemInstruction = `Bạn là trợ lý của SketchTask. Trả lời tiếng Việt, ngắn gọn, trung thực. Danh mục dưới đây là dữ liệu duy nhất của người dùng này: ${JSON.stringify(catalog)}.
Nếu đề xuất thay đổi, thêm một JSON duy nhất trong code fence ở cuối. JSON có summary, action hoặc actions. summary phải có recognizedCount, processableCount, missingInformation. Các action hợp lệ: create_tasks, breakdown_plan, complete_task, delete_task, create_journal_entry, create_note. Mỗi task tạo mới phải có itemType task hoặc event. Task chỉ có timeType task/deadline và deadlineTime tùy chọn; Event có timeType event, startTime và endTime tùy chọn.
Không tự áp dụng thay đổi; từng mục chỉ là đề xuất. Với chia nhỏ: chỉ đề xuất khi người dùng trực tiếp yêu cầu chia nhỏ/lập kế hoạch VÀ có mục tiêu, phạm vi hoặc thời hạn đủ rõ. Khi thiếu dữ kiện, nêu đúng một câu hỏi làm rõ, summary.missingInformation và không gửi breakdown_plan. Không tự chọn số bước, không bịa ngày giờ hay taskId. Event không có checkbox và không bao giờ hoàn thành/xóa bằng task action.`;
    const contents = history.slice(-MAX_HISTORY_ITEMS).map((message) => ({
      role: message.sender === "user" ? "user" : "model",
      parts: [{ text: message.text.slice(0, MAX_QUERY_LENGTH) }],
    }));
    contents.push({ role: "user", parts: [{ text: normalizedQuery }] });

    const response = await fetch(`${GEMINI_API_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(config.geminiApiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system_instruction: { parts: [{ text: systemInstruction }] }, contents, generationConfig: { temperature: 0.15, maxOutputTokens: 4000 } }),
    });
    if (!response.ok) throw new Error("Dịch vụ AI hiện chưa phản hồi. Vui lòng thử lại sau.");

    const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const raw = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw?.trim()) throw new Error("AI không trả về nội dung hợp lệ.");

    const parsedResponse = extractResponse(raw);
    const parsedProposal = parsedResponse.payload
      ? parseProposal(parsedResponse.payload, allowedTaskIds, normalizedQuery)
      : { recognizedCount: 0, processableCount: 0, missingInformation: [] };
    const text = [parsedResponse.text || "Mình đã phân tích yêu cầu.", formatSummary(parsedProposal)].join("\n\n");
    return parsedProposal.proposal
      ? { type: "action_proposal", text, proposal: parsedProposal.proposal }
      : { type: "text_reply", text };
  }
}
