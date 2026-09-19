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
  Plus,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { TaskPriority } from "../../../types";
import {
  generateDynamicPromptChips,
  AIQueryResult,
  GoalPlanBreakdown,
} from "../../../services/aiAgentService";
import { askGeminiAIAssistant } from "../../../services/geminiAiService";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { AIActionProposalCard } from "./AIActionProposalCard";

const CHAT_STORAGE_KEY = "sketchtask_ai_chat_history_v2";

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

  const handleAddAllBreakdownTasks = (breakdown: GoalPlanBreakdown) => {
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

  const handleAddSingleSubtask = (st: GoalPlanBreakdown["subtasks"][0]) => {
    addTask({
      title: st.title,
      dueDate: st.dueDate,
      timeType: st.timeType,
      startTime: st.startTime,
      deadlineTime: st.deadlineTime,
      priority: st.priority,
      tag: st.tag || "Mục tiêu",
      description: st.description,
    });
  };

  const handleClearChat = () => {
    if (window.confirm("Bạn có muốn xóa toàn bộ lịch sử trò chuyện AI?")) {
      setMessages([DEFAULT_WELCOME_MESSAGE]);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#FFE4E6] text-[#BE123C] border border-[#FDA4AF] dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            🔴 Gấp
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7] dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            🟢 Thấp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            🟡 Vừa
          </span>
        );
    }
  };

  // Helper render text with **bold** formatting without raw markdown marks
  const renderMessageContent = (text: string) => {
    if (!text) return null;
    const regex = /\*\*([^*]+)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <strong key={match.index} className="font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Trợ lý AI Phác Thảo"
      className={`fixed top-[68px] right-4 bottom-4 w-[420px] sm:w-[460px] max-w-[calc(100vw-2rem)] z-40 flex flex-col rounded-2xl border-[1.5px] border-[#262626] dark:border-black bg-[#FBF9F4] dark:bg-[#18181B] shadow-[4px_4px_0px_#262626] dark:shadow-none overflow-hidden select-none transition-all duration-200 ease-in-out ${
        isOpen
          ? "opacity-100 translate-x-0 pointer-events-auto"
          : "opacity-0 translate-x-8 pointer-events-none"
      }`}
    >
      {/* 1. Header Cửa Sổ AI */}
      <header className="flex h-12 items-center justify-between border-b-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#27272A] px-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#1C1917] text-white dark:bg-[#FAFAFA] dark:text-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626]">
            <Sparkles size={13} strokeWidth={2.4} />
          </div>
          <h3 className="text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA] tracking-tight">
            Trợ lý AI
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleClearChat}
            className="flex h-7 w-7 items-center justify-center rounded-xl border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#3F3F46] hover:bg-[#F3EFE6] dark:hover:bg-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            title="Xóa đoạn chat"
            aria-label="Xóa đoạn chat"
          >
            <RotateCcw size={12} strokeWidth={2.4} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-xl border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#3F3F46] hover:bg-[#F3EFE6] dark:hover:bg-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            title="Đóng (ESC)"
            aria-label="Đóng"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>
      </header>

      {/* 2. Danh sách tin nhắn cuộc trò chuyện */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5 bg-[#FBF9F4] dark:bg-[#18181B] font-sans">
        {messages.map((m) => {
          const isAi = m.sender === "ai";
          const res = m.queryResult;

          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${
                isAi ? "justify-start" : "justify-end"
              }`}
            >
              {isAi && (
                <div className="w-7 h-7 rounded-xl bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={13} strokeWidth={2.4} />
                </div>
              )}

              <div
                className={`max-w-[88%] px-3.5 py-2.5 text-xs leading-relaxed break-words transition-all border-[1.5px] ${
                  isAi
                    ? "bg-white dark:bg-[#27272A] text-[#1C1917] dark:text-[#FAFAFA] border-[#262626] dark:border-black shadow-[2px_2px_0px_#262626] dark:shadow-none rounded-2xl rounded-tl-sm"
                    : "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[#1C1917] dark:border-black font-medium shadow-[2px_2px_0px_#78716C] dark:shadow-none rounded-2xl rounded-tr-sm"
                }`}
              >
                {/* Nội dung text chính */}
                <div className="whitespace-pre-line font-normal">{renderMessageContent(m.text)}</div>

                {res?.proposal && <AIActionProposalCard proposal={res.proposal} />}

                {/* CARD 1: TASK CREATED CARD */}
                {res && (res.type === "created_task" || res.type === "batch_created") && res.createdTasks && (
                  <div className="mt-3 space-y-2 pt-2.5 border-t border-[#262626]/20 dark:border-transparent">
                    {res.createdTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-[#FBF9F4] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[#1C1917] dark:text-[#FAFAFA] truncate">
                            {t.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {renderPriorityBadge(t.priority)}
                            {t.timeLabel && (
                              <span className="text-[10px] font-mono text-[#78716C] dark:text-[#A1A1AA] flex items-center gap-0.5">
                                <Clock size={10} />
                                {t.timeLabel}
                              </span>
                            )}
                            {t.tag && (
                              <span className="text-[10px] font-semibold text-[#1C1917] dark:text-[#FAFAFA] bg-[#FEF08A] dark:bg-yellow-900/40 px-1 rounded-md border border-[#262626]/30 dark:border-black">
                                #{t.tag}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openTaskDetail(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] text-[11px] font-bold text-[#1C1917] dark:text-[#FAFAFA] hover:bg-[#F3EFE6] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <span>Mở</span>
                          <ExternalLink size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* CARD 2: GOAL BREAKDOWN PLAN CARD */}
                {res && res.type === "goal_breakdown" && res.breakdownPlan && (
                  <div className="mt-3 p-3 rounded-xl bg-[#FBF9F4] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1.5px_1.5px_0px_#262626] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA] flex items-center gap-1.5">
                        <ListPlus size={14} className="text-[#1C1917] dark:text-[#FAFAFA]" />
                        <span>{res.breakdownPlan.subtasks.length} bước đề xuất</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddAllBreakdownTasks(res.breakdownPlan!)}
                        disabled={addedBreakdownGoals[res.breakdownPlan.goalTitle]}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border-[1.5px] ${
                          addedBreakdownGoals[res.breakdownPlan.goalTitle]
                            ? "bg-emerald-100 text-emerald-800 border-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[#262626] dark:border-black shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                        }`}
                      >
                        {addedBreakdownGoals[res.breakdownPlan.goalTitle] ? (
                          <>
                            <Check size={12} strokeWidth={2.6} />
                            <span>Đã thêm</span>
                          </>
                        ) : (
                          <>
                            <Plus size={12} strokeWidth={2.6} />
                            <span>Thêm tất cả</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {res.breakdownPlan.subtasks.map((st, idx) => (
                        <div
                          key={idx}
                          className="p-2 rounded-lg bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-md bg-[#262626] text-white dark:bg-[#FAFAFA] dark:text-[#18181B] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-[#1C1917] dark:text-[#FAFAFA] truncate">
                              {st.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {st.startTime && (
                              <span className="text-[10px] font-mono text-[#78716C] dark:text-[#A1A1AA]">
                                {st.startTime}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddSingleSubtask(st)}
                              title="Thêm bước này"
                              className="p-1 rounded-md border border-[#262626] dark:border-black bg-[#F3EFE6] dark:bg-[#3F3F46] hover:bg-[#E5E0D4] text-[#1C1917] dark:text-[#FAFAFA] cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] transition-all"
                            >
                              <Plus size={12} strokeWidth={2.4} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARD 3: TASK QUERY INTERACTIVE LIST */}
                {res && res.type === "task_query" && res.queriedTasks && (
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-[#262626]/20 dark:border-transparent">
                    {res.queriedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2 rounded-xl bg-[#FBF9F4] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <HandDrawnCheckbox
                            size="sm"
                            checked={Boolean(t.completed)}
                            onChange={() => toggleTask(t.id)}
                          />
                          <span
                            onClick={() => openTaskDetail(t.id)}
                            className={`font-semibold truncate cursor-pointer hover:underline ${
                              t.completed ? "line-through text-[#78716C] dark:text-[#A1A1AA]" : "text-[#1C1917] dark:text-[#FAFAFA]"
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {renderPriorityBadge(t.priority)}
                          {t.timeLabel && (
                            <span className="text-[10px] font-mono text-[#78716C] dark:text-[#A1A1AA]">
                              {t.timeLabel}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <div
                  className={`text-[9px] font-mono font-medium text-right mt-1.5 ${
                    isAi ? "text-[#78716C] dark:text-[#A1A1AA]" : "text-white/80 dark:text-[#18181B]/80"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-xl bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={13} strokeWidth={2.4} />
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl rounded-tl-sm bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-black shadow-[2px_2px_0px_#262626] dark:shadow-none w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-white animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-white animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] dark:bg-white animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. Prompt Chips Gợi Ý Nhanh */}
      {dynamicChips.length > 0 && (
        <div className="px-3 py-2 bg-white dark:bg-[#27272A] border-t-[1.5px] border-[#262626] dark:border-black flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {dynamicChips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => handleSend(chip.query)}
              className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F3EFE6] dark:bg-[#3F3F46] hover:bg-[#E5E0D4] dark:hover:bg-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] whitespace-nowrap active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. Ô Nhập Lệnh Chat */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-white dark:bg-[#27272A] border-t-[1.5px] border-[#262626] dark:border-black flex items-center gap-2 shrink-0"
      >
        <div className="flex-1 flex items-center bg-[#F3EFE6] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-black rounded-2xl shadow-[1px_1px_0px_#262626] px-3.5 py-1.5 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi AI hoặc giao việc: Họp 14h chiều mai..."
            className="w-full text-xs font-medium bg-transparent outline-none placeholder:text-[#78716C] dark:placeholder:text-[#A1A1AA] text-[#1C1917] dark:text-[#FAFAFA]"
          />
        </div>
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className={`h-9 w-9 shrink-0 rounded-2xl flex items-center justify-center transition-all border-[1.5px] border-[#262626] dark:border-black ${
            inputVal.trim() && !isTyping
              ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              : "bg-[#E5E0D4] dark:bg-[#3F3F46] text-[#78716C] dark:text-[#71717A] cursor-not-allowed shadow-none"
          }`}
        >
          <Send size={14} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
};
