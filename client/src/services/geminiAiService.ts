import { TaskPriority, TaskTimeType } from "../types";
import { getLocalTodayStr } from "../utils/date";
import {
  isTaskDueToday,
  getTaskTemporalState,
} from "../utils/taskSemantics";
import { AI_CONFIG, getEffectiveGeminiApiKey } from "../config/aiConfig";
import { AIQueryResult, AgentProcessContext } from "./aiAgentService";

// ==========================================
// GEMINI API CALLER & INTELLIGENT AGENT
// ==========================================

interface GeminiActionPayload {
  action?: "create_tasks" | "breakdown_plan" | "complete_task" | "none";
  tasks?: {
    title: string;
    dueDate?: string;
    timeType?: "scheduled" | "deadline" | "task";
    startTime?: string;
    deadlineTime?: string;
    priority?: "high" | "medium" | "low";
    tag?: string;
    description?: string;
  }[];
  plan?: {
    goalTitle: string;
    steps: {
      title: string;
      dueDate?: string;
      timeType?: "scheduled" | "deadline" | "task";
      startTime?: string;
      deadlineTime?: string;
      priority?: "high" | "medium" | "low";
      tag?: string;
    }[];
  };
  completedTaskTitle?: string;
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

export async function askGeminiAIAssistant(
  userQuery: string,
  history: { sender: "ai" | "user"; text: string }[],
  context: AgentProcessContext,
  now: Date = new Date()
): Promise<AIQueryResult> {
  const apiKey = getEffectiveGeminiApiKey();

  if (!apiKey) {
    return {
      type: "text_reply",
      text: "Hệ thống AI hiện chưa sẵn sàng kết nối. Vui lòng thử lại sau.",
    };
  }

  const todayStr = getLocalTodayStr(now);
  const dayName = DAY_NAMES[now.getDay()];
  const timeStr = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const { tasks, addTask, toggleTask } = context;

  // Dữ liệu bối cảnh công việc thực tế
  const todayTasks = tasks.filter((t) => isTaskDueToday(t, now));
  const openToday = todayTasks.filter((t) => !t.completed);
  const completedToday = todayTasks.filter((t) => t.completed);
  const overdue = tasks.filter((t) => {
    if (t.completed) return false;
    const state = getTaskTemporalState(t, now);
    return state === "overdue" || state === "pastScheduled";
  });
  const urgent = tasks.filter((t) => !t.completed && t.priority === "high");

  const todaySummary =
    todayTasks.length > 0
      ? `Hôm nay có ${todayTasks.length} việc (${completedToday.length} đã xong, ${openToday.length} đang chờ: ${openToday
          .slice(0, 5)
          .map((t) => t.title)
          .join(", ")})`
      : "Hôm nay chưa có việc nào.";

  const overdueSummary =
    overdue.length > 0
      ? `Có ${overdue.length} việc quá hạn: ${overdue
          .slice(0, 4)
          .map((t) => t.title)
          .join(", ")}`
      : "Không có việc quá hạn.";

  const urgentSummary =
    urgent.length > 0
      ? `Có ${urgent.length} việc gấp: ${urgent
          .slice(0, 4)
          .map((t) => t.title)
          .join(", ")}`
      : "Không có việc gấp.";

  // System Prompt thông minh
  const systemInstruction = `Bạn là Trợ lý Quản lý Công việc & Đời sống Cá nhân Thông minh của ứng dụng SketchTask.

BỐI CẢNH THỜI GIAN THỰC:
- Hôm nay là: ${dayName}, ngày ${todayStr}, lúc ${timeStr}.
- Tình trạng công việc của người dùng:
  + ${todaySummary}
  + ${overdueSummary}
  + ${urgentSummary}

QUY TẮC PHẢN HỒI:
1. Giao tiếp tự nhiên, thông minh, ân cần, ngắn gọn và hữu ích bằng tiếng Việt. Dùng Markdown (in đậm, danh sách gạch đầu dòng) để trình bày đẹp mắt.
2. Khi người dùng yêu cầu:
   - Tạo việc (1 việc hoặc nhiều việc)
   - Chia nhỏ kế hoạch / mục tiêu (Goal breakdown)
   - Hoàn thành công việc
   Bạn hãy trả lời giải thích tự nhiên bằng lời, và Ở CUỐI CÙNG của câu trả lời, hãy đính kèm MỘT khối JSON hành động đặc biệt theo định dạng chuẩn xác:

\`\`\`json
{
  "action": "create_tasks" | "breakdown_plan" | "complete_task" | "none",
  "tasks": [
    {
      "title": "Tên công việc",
      "dueDate": "YYYY-MM-DD",
      "timeType": "scheduled" | "deadline" | "task",
      "startTime": "HH:MM",
      "deadlineTime": "HH:MM",
      "priority": "high" | "medium" | "low",
      "tag": "TenTag"
    }
  ],
  "plan": {
    "goalTitle": "Tên kế hoạch/mục tiêu",
    "steps": [
      {
        "title": "Tên bước hành động cụ thể",
        "dueDate": "YYYY-MM-DD",
        "timeType": "scheduled" | "deadline" | "task",
        "startTime": "HH:MM",
        "priority": "high" | "medium" | "low",
        "tag": "TenTag"
      }
    ]
  },
  "completedTaskTitle": "Tên việc cần hoàn thành"
}
\`\`\`

LƯU Ý QUAN TRỌNG:
- Luôn tính toán ngày \`dueDate\` chính xác (hôm nay là ${todayStr}).
- Nếu không có hành động nào cần thực thi (chỉ trò chuyện, tư vấn, hỏi mẹo), bạn chỉ cần trả lời bằng văn bản bình thường, không cần khối JSON.`;

  // Xây dựng lịch sử chat gửi lên Gemini
  const recentHistory = history.slice(-6).map((h) => ({
    role: h.sender === "user" ? "user" : "model",
    parts: [{ text: h.text }],
  }));

  const modelsToTry = AI_CONFIG.FALLBACK_MODELS || ["gemini-3-flash-preview", "gemini-3.6-flash"];

  for (const model of modelsToTry) {
    try {
      const url = `${AI_CONFIG.BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            ...recentHistory,
            {
              role: "user",
              parts: [{ text: userQuery }],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawAnswer =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (!rawAnswer.trim()) {
        continue;
      }

      // Bóc tách JSON Action block nếu có
      let cleanText = rawAnswer;
      let actionPayload: GeminiActionPayload | null = null;

      const jsonMatch = rawAnswer.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          actionPayload = JSON.parse(jsonMatch[1]);
          // Loại bỏ khối JSON khỏi văn bản hiển thị cho người dùng
          cleanText = rawAnswer.replace(/```(?:json)?\s*[\s\S]*?\s*```/, "").trim();
        } catch {
          // Parse JSON thất bại, giữ nguyên rawAnswer
        }
      }

      // XỬ LÝ ACTION TỪ GEMINI
      if (actionPayload) {
        // 1. Tạo tasks
        if (
          actionPayload.action === "create_tasks" &&
          actionPayload.tasks &&
          actionPayload.tasks.length > 0
        ) {
          const createdList = [];
          for (const t of actionPayload.tasks) {
            const newTask = addTask({
              title: t.title || "Công việc mới",
              dueDate: t.dueDate || todayStr,
              timeType: (t.timeType as TaskTimeType) || "task",
              startTime: t.startTime,
              deadlineTime: t.deadlineTime,
              priority: (t.priority as TaskPriority) || "medium",
              tag: t.tag,
            });

            const timeLabel = t.startTime
              ? `⏰ ${t.startTime}`
              : t.deadlineTime
              ? `⏳ Hạn ${t.deadlineTime}`
              : undefined;

            createdList.push({
              id: newTask.id,
              title: t.title || "Công việc mới",
              priority: (t.priority as TaskPriority) || "medium",
              timeLabel,
              tag: t.tag,
              dueDate: t.dueDate || todayStr,
            });
          }

          return {
            type: createdList.length > 1 ? "batch_created" : "created_task",
            text: cleanText || (createdList.length > 1 ? `✓ Đã tạo ${createdList.length} công việc mới vào danh sách:` : `✓ Đã tạo công việc mới:`),
            createdTasks: createdList,
          };
        }

        // 2. Chia nhỏ kế hoạch (Breakdown Plan)
        if (
          actionPayload.action === "breakdown_plan" &&
          actionPayload.plan &&
          actionPayload.plan.steps &&
          actionPayload.plan.steps.length > 0
        ) {
          const formattedSubtasks = actionPayload.plan.steps.map((s) => ({
            title: s.title,
            dueDate: s.dueDate || todayStr,
            timeType: (s.timeType as TaskTimeType) || "scheduled",
            startTime: s.startTime,
            deadlineTime: s.deadlineTime,
            priority: (s.priority as TaskPriority) || "medium",
            tag: s.tag || "KeHoach",
          }));

          return {
            type: "goal_breakdown",
            text: cleanText || `💡 Kế hoạch đề xuất cho: **"${actionPayload.plan.goalTitle}"**`,
            breakdownPlan: {
              goalTitle: actionPayload.plan.goalTitle,
              subtasks: formattedSubtasks,
            },
          };
        }

        // 3. Hoàn thành việc
        if (actionPayload.action === "complete_task" && actionPayload.completedTaskTitle) {
          const match = tasks.find(
            (t) =>
              !t.completed &&
              t.title.toLowerCase().includes(actionPayload!.completedTaskTitle!.toLowerCase())
          );
          if (match) {
            toggleTask(match.id);
          }
          return {
            type: "task_action",
            text: cleanText || `✓ Đã đánh dấu hoàn thành công việc: **"${actionPayload.completedTaskTitle}"**!`,
          };
        }
      }

      return {
        type: "text_reply",
        text: cleanText || rawAnswer,
      };
    } catch (err) {
      console.warn(`Gemini model ${model} error, trying next:`, err);
    }
  }

  return {
    type: "text_reply",
    text: "Không thể kết nối đến máy chủ Google Gemini AI. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau giây lát.",
  };
}
