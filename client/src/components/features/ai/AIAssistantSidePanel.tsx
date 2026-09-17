// ==========================================
// COMPONENT: AIAssistantSidePanel (Desktop Floating AI Assistant)
// ==========================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  Send,
  RotateCcw,
  Sparkles,
  ListPlus,
  Check,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import {
  generateDynamicPromptChips,
  AIQueryResult,
  GoalPlanBreakdown,
} from "../../../services/aiAgentService";
import { askGeminiAIAssistant } from "../../../services/geminiAiService";

const CHAT_STORAGE_KEY = "sketchtask_ai_chat_history";

interface StoredChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
  time: string;
  queryResult?: AIQueryResult;
}

const getTimeLabel = () =>
  new Date().toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

const DEFAULT_WELCOME_MESSAGE: StoredChatMessage = {
  id: "welcome",
  sender: "ai",
  text: "Chào bạn! Mình có thể giúp bạn lên lịch, phân tích tiến độ hoặc chia nhỏ mục tiêu công việc.",
  time: getTimeLabel(),
};

export interface AIAssistantSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistantSidePanel: React.FC<AIAssistantSidePanelProps> = ({
  isOpen,
  onClose,
}) => {
  const { tasks, addTask, toggleTask, openTaskDetail } = useAppStore();
  const now = new Date();

  const [messages, setMessages] = useState<StoredChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [DEFAULT_WELCOME_MESSAGE];
  });

  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [addedBreakdownGoals, setAddedBreakdownGoals] = useState<{ [goalTitle: string]: boolean }>({});

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync chat to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Dynamic Prompt Chips
  const dynamicChips = useMemo(() => {
    return generateDynamicPromptChips(tasks, now);
  }, [tasks]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [messages, isTyping, isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isTyping) return;

    const userMsg: StoredChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: getTimeLabel(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputVal("");
    setIsTyping(true);

    try {
      const result = await askGeminiAIAssistant(
        text,
        nextMessages.map((m) => ({ sender: m.sender, text: m.text })),
        {
          tasks,
          addTask,
          toggleTask,
        },
        new Date()
      );

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: result.text,
          time: getTimeLabel(),
          queryResult: result,
        },
      ]);
    } catch (err) {
      console.error("AI processing error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAddBreakdownTasks = (breakdown: GoalPlanBreakdown) => {
    if (!breakdown || addedBreakdownGoals[breakdown.goalTitle]) return;

    for (const item of breakdown.subtasks) {
      addTask({
        title: item.title,
        dueDate: item.dueDate,
        timeType: item.timeType,
        startTime: item.startTime,
        deadlineTime: item.deadlineTime,
        priority: item.priority,
        tag: item.tag || "Mục tiêu",
        description: item.description,
      });
    }

    setAddedBreakdownGoals((prev) => ({
      ...prev,
      [breakdown.goalTitle]: true,
    }));
  };

  const handleClearChat = () => {
    if (window.confirm("Bạn có muốn xóa toàn bộ lịch sử trò chuyện AI?")) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Trợ lý AI Phác Thảo"
      className="fixed top-[68px] right-4 bottom-4 w-[420px] sm:w-[460px] max-w-[calc(100vw-2rem)] z-40 flex flex-col rounded-2xl border-[1.5px] border-[#262626] bg-[#FBF9F4] dark:bg-[#1C1C1E] shadow-[4px_4px_0px_#262626] overflow-hidden animate-in slide-in-from-right-4 duration-150 select-none"
    >
      {/* 1. Header Cửa Sổ AI */}
      <header className="flex h-12 items-center justify-between border-b-[1.5px] border-[#262626] bg-[#FFFDF8] dark:bg-[#2C2C2E] px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEF08A] dark:bg-amber-500/20 text-[#1C1917] dark:text-amber-300 border border-[#262626]">
            <Sparkles size={15} strokeWidth={2.4} />
          </div>
          <h3 className="text-xs font-bold text-[#1C1917] dark:text-white tracking-tight">
            Trợ lý AI Phác Thảo
          </h3>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleClearChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#262626] bg-white dark:bg-[#1C1C1E] text-[#78716C] hover:text-[#1C1917] dark:hover:text-white shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            title="Xóa đoạn chat"
            aria-label="Xóa đoạn chat"
          >
            <RotateCcw size={12} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#262626] bg-white dark:bg-[#1C1C1E] text-[#1C1917] dark:text-white shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            title="Đóng (ESC)"
            aria-label="Đóng"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* 2. Danh sách tin nhắn cuộc trò chuyện */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 font-sans">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === "user" ? "items-end" : "items-start"
            }`}
          >
            <div
              className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] ${
                msg.sender === "user"
                  ? "bg-[#FEF08A] text-[#1C1917] font-medium"
                  : "bg-white dark:bg-[#2C2C2E] text-[#1C1917] dark:text-[#F2F2F7]"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>

              {/* Rich Query Result Blocks */}
              {msg.queryResult && (
                <div className="mt-2.5 pt-2 border-t border-[#262626]/15 space-y-2">
                  {/* Task list created */}
                  {msg.queryResult.createdTasks &&
                    msg.queryResult.createdTasks.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-[#1C1917] dark:text-white uppercase tracking-wider">
                          Đã thêm {msg.queryResult.createdTasks.length} việc:
                        </p>
                        <div className="space-y-1">
                          {msg.queryResult.createdTasks.map((t) => (
                            <div
                              key={t.id}
                              onClick={() => openTaskDetail(t.id)}
                              className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-[#FAF8F3] dark:bg-[#1C1C1E] border border-[#262626]/30 hover:border-[#262626] cursor-pointer text-[11px]"
                            >
                              <span className="font-semibold truncate">
                                {t.title}
                              </span>
                              {t.timeLabel && (
                                <span className="font-mono text-[9.5px] text-[#78716C] shrink-0">
                                  {t.timeLabel}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {/* Plan Breakdown */}
                  {msg.queryResult.breakdownPlan && (
                    <div className="space-y-1.5 p-2 rounded-lg bg-[#FAF8F3] dark:bg-[#1C1C1E] border border-[#262626]/30">
                      <p className="text-[11px] font-bold text-[#1C1917] dark:text-white">
                        🎯 {msg.queryResult.breakdownPlan.goalTitle}
                      </p>
                      <div className="space-y-1">
                        {msg.queryResult.breakdownPlan.subtasks.map((st, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[10.5px] text-[#78716C] dark:text-[#A1A1AA]"
                          >
                            <span>•</span>
                            <span className="truncate">{st.title}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={
                          addedBreakdownGoals[
                            msg.queryResult.breakdownPlan.goalTitle
                          ]
                        }
                        onClick={() =>
                          handleAddBreakdownTasks(
                            msg.queryResult!.breakdownPlan!
                          )
                        }
                        className={`w-full mt-1.5 py-1 px-2 rounded-md border border-[#262626] text-[10.5px] font-bold flex items-center justify-center gap-1 shadow-[1px_1px_0px_#262626] active:shadow-none transition-all cursor-pointer ${
                          addedBreakdownGoals[
                            msg.queryResult.breakdownPlan.goalTitle
                          ]
                            ? "bg-[#BBF7D0] text-[#065F46] opacity-70"
                            : "bg-[#FEF08A] hover:bg-[#FDE047] text-[#1C1917]"
                        }`}
                      >
                        {addedBreakdownGoals[
                          msg.queryResult.breakdownPlan.goalTitle
                        ] ? (
                          <>
                            <Check size={11} strokeWidth={2.4} />
                            <span>Đã thêm vào danh sách</span>
                          </>
                        ) : (
                          <>
                            <ListPlus size={11} strokeWidth={2.4} />
                            <span>Thêm tất cả vào việc cần làm</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <span className="block text-[9px] text-[#78716C] dark:text-[#A1A1AA] text-right mt-1">
                {msg.time}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-[#2C2C2E] border border-[#262626] shadow-[1px_1px_0px_#262626] w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-white animate-bounce" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-white animate-bounce [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-white animate-bounce [animation-delay:0.4s]" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. Prompt Chips Gợi Ý Nhanh */}
      {dynamicChips.length > 0 && (
        <div className="px-3 py-1.5 bg-[#FFFDF8] dark:bg-[#2C2C2E] border-t border-[#262626]/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {dynamicChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSend(chip.query)}
              className="px-2 py-1 rounded-md border border-[#262626] bg-white dark:bg-[#1C1C1E] text-[10.5px] font-medium text-[#1C1917] dark:text-[#F2F2F7] hover:bg-[#FEF08A] hover:text-[#1C1917] shadow-[1px_1px_0px_#262626] active:shadow-none transition-all whitespace-nowrap cursor-pointer shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Ô Nhập Lệnh Chat */}
      <div className="p-3 bg-[#FFFDF8] dark:bg-[#2C2C2E] border-t-[1.5px] border-[#262626]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi AI hoặc giao việc: 'Họp lúc 3h chiều'..."
            className="flex-1 min-w-0 h-9 px-3 rounded-lg border-[1.5px] border-[#262626] bg-white dark:bg-[#1C1C1E] text-xs text-[#1C1917] dark:text-white placeholder:text-[#78716C] shadow-[1px_1px_0px_#262626] focus:outline-none focus:ring-1 focus:ring-[#1C1917]"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isTyping}
            className="h-9 px-3 rounded-lg border-[1.5px] border-[#262626] bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center shrink-0"
          >
            <Send size={13} strokeWidth={2.4} />
          </button>
        </form>
      </div>
    </div>
  );
};
