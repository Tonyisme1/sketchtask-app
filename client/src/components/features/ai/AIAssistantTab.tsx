import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Send,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { getLocalTodayStr, getNextDayStr } from "../../../utils/date";
import {
  isTaskDueToday,
  normalizeTaskTimeType,
  getTaskTemporalState,
} from "../../../utils/taskSemantics";
import { TaskPriority, TaskTimeType } from "../../../types";

// ==========================================
// COMPONENT: AIAssistantTab (Trợ Lý Agent Tối Giản)
// Giao diện khung chat siêu gọn, không rườm rà
// Local Context-Aware Agent (100% Offline)
// ==========================================

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
  createdTaskId?: string;
  createdTaskTitle?: string;
}

const getTimeLabel = () =>
  new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const AIAssistantTab: React.FC = () => {
  const { tasks, addTask, openTaskDetail } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);
  const tomorrowStr = getNextDayStr(todayStr);

  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "ai",
      text: "Chào bạn! Mình là Trợ lý công việc cục bộ. Mình có thể hỗ trợ bạn:\n\n• **Tạo việc nhanh** (ví dụ: *\"Tạo việc họp team 14:00 #CongViec\"*)\n• **Tóm tắt hôm nay** hoặc **Phân tích tiến độ**\n• **Gợi ý việc quan trọng nên làm tiếp theo**",
      time: getTimeLabel(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Thống kê dữ liệu bối cảnh
  const todayTasks = useMemo(
    () => tasks.filter((t) => isTaskDueToday(t, now)),
    [tasks, todayStr]
  );
  const openTodayTasks = useMemo(
    () => todayTasks.filter((t) => !t.completed),
    [todayTasks]
  );
  const completedTodayTasks = useMemo(
    () => todayTasks.filter((t) => t.completed),
    [todayTasks]
  );
  const overdueTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (t.completed) return false;
        const state = getTaskTemporalState(t, now);
        return state === "overdue" || state === "pastScheduled";
      }),
    [tasks, todayStr]
  );
  const highPriorityTasks = useMemo(
    () => tasks.filter((t) => !t.completed && t.priority === "high"),
    [tasks]
  );

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ==========================================
  // LOCAL AGENT PROCESSING
  // ==========================================
  const processQuery = (query: string): { text: string; createdTaskId?: string; createdTaskTitle?: string } => {
    const trimmed = query.trim();
    const lower = trimmed.toLowerCase();

    // 1. TẠO TASK TRỰC TIẾP
    const isCreateIntent =
      lower.startsWith("tạo việc") ||
      lower.startsWith("tạo task") ||
      lower.startsWith("thêm việc") ||
      lower.startsWith("thêm task") ||
      lower.startsWith("nhắc tôi") ||
      lower.startsWith("nhắc nhở") ||
      lower.startsWith("cần làm") ||
      lower.startsWith("lên lịch") ||
      lower.startsWith("tao viec") ||
      lower.startsWith("them task");

    if (isCreateIntent) {
      let raw = trimmed
        .replace(/^(tạo việc|tạo task|thêm việc|thêm task|nhắc tôi|nhắc nhở|cần làm|lên lịch|tao viec|them task)[:\s-]*/i, "")
        .trim();

      if (!raw) {
        return { text: "Bạn muốn tạo công việc gì? Hãy gõ nội dung, giờ hẹn và nhãn (vd: *\"Tạo việc nộp báo cáo 16:30 #CongViec\"*)." };
      }

      // Tag
      const tagMatches = raw.match(/#([\p{L}\p{N}_-]+)/gu) || [];
      const tags = tagMatches.map((t) => t.replace("#", "").trim());
      const primaryTag = tags[0] || undefined;
      raw = raw.replace(/#([\p{L}\p{N}_-]+)/gu, "").trim();

      // Date
      let targetDate = todayStr;
      let dateLabel = "Hôm nay";
      if (lower.includes("ngày mai") || lower.includes("mai")) {
        targetDate = tomorrowStr;
        dateLabel = "Ngày mai";
        raw = raw.replace(/\b(vào\s+)?(ngày\s+)?mai\b/gi, "").trim();
      }

      // Time & TimeType
      let timeType: TaskTimeType = "task";
      let startTime: string | undefined = undefined;
      let deadlineTime: string | undefined = undefined;
      let deadlineDate: string | undefined = undefined;

      const timeMatch = raw.match(/(\d{1,2})[:h](\d{2})?/i);
      if (timeMatch) {
        const hours = timeMatch[1].padStart(2, "0");
        const minutes = (timeMatch[2] || "00").padStart(2, "0");
        const parsedTime = `${hours}:${minutes}`;

        if (lower.includes("hạn") || lower.includes("deadline") || lower.includes("trước")) {
          timeType = "deadline";
          deadlineTime = parsedTime;
          deadlineDate = targetDate;
        } else {
          timeType = "scheduled";
          startTime = parsedTime;
        }

        raw = raw.replace(/(lúc|vào lúc|trước|vào|hạn)?\s*\d{1,2}[:h](\d{2})?\s*(sáng|trưa|chiều|tối)?/gi, "").trim();
      }

      // Priority
      let priority: TaskPriority = "medium";
      if (lower.includes("gấp") || lower.includes("khẩn cấp") || lower.includes("quan trọng") || lower.includes("high")) {
        priority = "high";
        raw = raw.replace(/\b(gấp|khẩn cấp|quan trọng|high)\b/gi, "").trim();
      } else if (lower.includes("ưu tiên thấp") || lower.includes("không vội") || lower.includes("low")) {
        priority = "low";
        raw = raw.replace(/\b(ưu tiên thấp|không vội|low)\b/gi, "").trim();
      }

      const cleanTitle = raw.replace(/^[:\s-]+|[:\s-]+$/g, "").trim() || "Công việc mới";

      const newTask = addTask({
        title: cleanTitle,
        dueDate: targetDate,
        timeType,
        startTime,
        deadlineTime,
        deadlineDate,
        priority,
        tag: primaryTag,
        tags: tags.length > 0 ? tags : undefined,
      });

      const timeStr = startTime ? ` [⏰ ${startTime}]` : deadlineTime ? ` [⏳ Hạn ${deadlineTime}]` : "";
      const prioStr = priority === "high" ? " 🔴 (Gấp)" : "";
      const tagStr = primaryTag ? ` #${primaryTag}` : "";

      return {
        text: `✓ Đã tạo: **${cleanTitle}** (${dateLabel}${timeStr}${prioStr}${tagStr})`,
        createdTaskId: newTask.id,
        createdTaskTitle: cleanTitle,
      };
    }

    // 2. PHÂN TÍCH TIẾN ĐỘ
    if (lower.includes("phân tích") || lower.includes("tiến độ") || lower.includes("thống kê") || lower.includes("báo cáo")) {
      const totalCount = tasks.length;
      const completedTotal = tasks.filter((t) => t.completed).length;
      const percent = totalCount > 0 ? Math.round((completedTotal / totalCount) * 100) : 0;
      const todayPercent = todayTasks.length > 0 ? Math.round((completedTodayTasks.length / todayTasks.length) * 100) : 0;

      let advice = "Tiến độ đang rất tốt, tiếp tục phát huy nhé!";
      if (overdueTasks.length > 0) {
        advice = `⚠️ Có **${overdueTasks.length} việc quá hạn**, bạn nên ưu tiên xử lý sớm.`;
      } else if (highPriorityTasks.length > 0) {
        advice = `🎯 Có **${highPriorityTasks.length} việc gấp (🔴)** cần giải quyết trước.`;
      }

      return {
        text: `📊 **Tiến độ công việc:**\n\n• Hôm nay: **${completedTodayTasks.length}/${todayTasks.length}** việc (${todayPercent}%)\n• Toàn bộ: **${completedTotal}/${totalCount}** việc (${percent}%)\n• Việc quá hạn: **${overdueTasks.length}** · Việc gấp: **${highPriorityTasks.length}**\n\n${advice}`,
      };
    }

    // 3. TÓM TẮT HÔM NAY
    if (lower.includes("tóm tắt") || lower.includes("hôm nay") || lower.includes("lịch trình")) {
      if (todayTasks.length === 0) {
        return { text: `Hôm nay bạn chưa có việc nào trong danh sách. Hãy gõ *"Tạo việc..."* để thêm nhé.` };
      }
      if (openTodayTasks.length === 0) {
        return { text: `🎉 Bạn đã hoàn thành toàn bộ **${todayTasks.length}/${todayTasks.length} việc** hôm nay (100%)!` };
      }

      const list = openTodayTasks
        .slice(0, 7)
        .map((t, idx) => {
          const normTime = normalizeTaskTimeType(t);
          const time = normTime === "scheduled" && t.startTime ? ` (${t.startTime})` : normTime === "deadline" && t.deadlineTime ? ` (Hạn ${t.deadlineTime})` : "";
          const prio = t.priority === "high" ? " 🔴" : "";
          return `${idx + 1}. ${t.title}${time}${prio}`;
        })
        .join("\n");

      return {
        text: `📋 **Việc cần làm hôm nay (${openTodayTasks.length} việc):**\n\n${list}${openTodayTasks.length > 7 ? `\n*...và ${openTodayTasks.length - 7} việc khác.*` : ""}`,
      };
    }

    // 4. GỢI Ý VIỆC TIẾP THEO
    if (lower.includes("nên làm") || lower.includes("gợi ý") || lower.includes("tiếp theo")) {
      if (openTodayTasks.length === 0) {
        return { text: "Hôm nay bạn đã hoàn thành hết việc cần làm rồi!" };
      }
      const topTask = openTodayTasks.find((t) => t.priority === "high") || openTodayTasks.find((t) => t.startTime) || openTodayTasks[0];
      return {
        text: `🎯 **Nên làm tiếp theo:**\n\n👉 **${topTask.title}**${topTask.priority === "high" ? " (🔴 Việc gấp)" : topTask.startTime ? ` (⏰ Giờ hẹn: ${topTask.startTime})` : ""}\n\nHãy dành sự tập trung cho công việc này nhé.`,
      };
    }

    // 5. VIỆC GẤP / QUÁ HẠN
    if (lower.includes("việc gấp") || lower.includes("ưu tiên")) {
      if (highPriorityTasks.length === 0) {
        return { text: "Hiện không có công việc nào được đánh dấu gấp (🔴)." };
      }
      const list = highPriorityTasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title}`).join("\n");
      return { text: `🔴 **${highPriorityTasks.length} việc ưu tiên cao:**\n\n${list}` };
    }

    // 6. CHÀO HỎI & TRÒ CHUYỆN
    if (lower.includes("chào") || lower.includes("hi") || lower.includes("hello")) {
      return { text: "Chào bạn! Hôm nay bạn cần hỗ trợ gì về công việc hoặc lịch trình?" };
    }
    if (lower.includes("cảm ơn") || lower.includes("thanks")) {
      return { text: "Rất vui được hỗ trợ bạn! Chúc bạn làm việc thật hiệu quả nhé." };
    }

    return {
      text: `Mình đã nhận câu hỏi: *"${trimmed}"*.\n\nBạn có thể thử các câu lệnh ngắn như:\n• *"Tạo việc: [Nội dung] [Giờ] [#Tag]"*\n• *"Tóm tắt hôm nay"*\n• *"Phân tích tiến độ"*\n• *"Gợi ý việc tiếp theo"*`,
    };
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: getTimeLabel(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const res = processQuery(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: res.text,
          time: getTimeLabel(),
          createdTaskId: res.createdTaskId,
          createdTaskTitle: res.createdTaskTitle,
        },
      ]);
      setIsTyping(false);
    }, 280);
  };

  const handleClear = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: "Đã xóa lịch sử trò chuyện. Bạn cần tạo việc hoặc phân tích mục nào không?",
        time: getTimeLabel(),
      },
    ]);
  };

  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col h-[calc(100dvh-130px)] sm:h-[calc(100vh-125px)] bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[10px] shadow-[3px_3px_0px_#262626] overflow-hidden select-none">
      {/* KHUNG TIN NHẮN (MESSAGE STREAM) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#FAF8F3]">
        {messages.map((m) => {
          const isAi = m.sender === "ai";
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${isAi ? "justify-start" : "justify-end"}`}
            >
              {isAi && (
                <div className="w-6 h-6 rounded-[4px] bg-[#1C1917] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_#262626]">
                  <Bot size={13} strokeWidth={2.4} />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] px-3.5 py-2.5 rounded-[7px] border-[1.5px] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] text-xs sm:text-[13px] leading-relaxed whitespace-pre-line font-medium break-words ${
                  isAi
                    ? "bg-white text-[#1C1917]"
                    : "bg-[#1C1917] text-white font-semibold"
                }`}
              >
                {m.text}

                {/* Nút xem task vừa tạo */}
                {m.createdTaskId && (
                  <div className="mt-2 pt-1.5 border-t border-[#262626]/20">
                    <button
                      type="button"
                      onClick={() => openTaskDetail(m.createdTaskId)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1C1917] hover:underline cursor-pointer"
                    >
                      <span>Mở chi tiết việc này</span>
                      <ExternalLink size={11} />
                    </button>
                  </div>
                )}

                <div className={`text-[9px] font-mono font-bold text-right mt-1 ${isAi ? "text-[#78716C]" : "text-white/70"}`}>
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-[#78716C] font-bold pl-8 animate-pulse">
            <Bot size={13} />
            <span>Đang trả lời...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* GỢI Ý NHANH (MINIMAL PILLS) */}
      <div className="px-3 py-1.5 bg-white border-t border-[#262626]/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleSend("Tóm tắt hôm nay")}
          className="px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-[#FAF8F3] hover:bg-white text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626] whitespace-nowrap active:translate-y-[0.5px] cursor-pointer"
        >
          📋 Tóm tắt hôm nay
        </button>
        <button
          type="button"
          onClick={() => handleSend("Phân tích tiến độ")}
          className="px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-[#FAF8F3] hover:bg-white text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626] whitespace-nowrap active:translate-y-[0.5px] cursor-pointer"
        >
          📊 Phân tích tiến độ
        </button>
        <button
          type="button"
          onClick={() => handleSend("Gợi ý việc tiếp theo")}
          className="px-2.5 py-1 rounded-[4px] text-[11px] font-bold bg-[#FAF8F3] hover:bg-white text-[#1C1917] border border-[#262626] shadow-[1px_1px_0px_#262626] whitespace-nowrap active:translate-y-[0.5px] cursor-pointer"
        >
          🎯 Gợi ý việc tiếp theo
        </button>
        <button
          type="button"
          onClick={handleClear}
          title="Làm mới chat"
          className="p-1 rounded-[4px] text-[#78716C] hover:text-[#1C1917] hover:bg-white border border-transparent hover:border-[#262626] ml-auto shrink-0 cursor-pointer"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* THANH NHẬP LIỆU GỌN GÀNG (INPUT BAR) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2 bg-white border-t border-[#262626]/20 flex items-center gap-1.5"
      >
        <div className="flex-1 flex items-center bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] px-3 py-1.5 focus-within:bg-white">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi hoặc gõ: Tạo việc họp team 14:00 #CongViec..."
            className="w-full text-xs sm:text-sm font-medium bg-transparent outline-none placeholder:text-[#A8A29E] text-[#1C1917]"
          />
        </div>

        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className={`h-9 w-9 shrink-0 rounded-[6px] border-[1.5px] border-[#262626] flex items-center justify-center transition-all shadow-[1.5px_1.5px_0px_#262626] ${
            inputVal.trim() && !isTyping
              ? "bg-[#1C1917] text-white hover:bg-black active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
              : "bg-[#E7E5E4] text-[#A8A29E] cursor-not-allowed border-[#D6D3D1] shadow-none"
          }`}
        >
          <Send size={14} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
};
