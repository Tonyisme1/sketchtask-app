import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  RotateCcw,
  ExternalLink,
  Plus,
  Sparkles,
  Clock,
  ListPlus,
  Check,
} from "lucide-react";
import { TaskPriority } from "../../../types";
import { AIScreenModel } from "../../../features/ai/model/types";
import {
  generateDynamicPromptChips,
  AIQueryResult,
  GoalPlanBreakdown,
  ParsedTaskIntent,
} from "../../../services/aiAgentService";
import { askGeminiAIAssistant } from "../../../services/geminiAiService";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import { AIActionProposalCard } from "./AIActionProposalCard";

// ==========================================
// CHAT MESSAGE TYPES & LOCAL STORAGE KEY
// ==========================================

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
  text: "Chào bạn! Mình có thể giúp bạn sắp xếp công việc, lên lịch hoặc chia nhỏ mục tiêu.",
  time: getTimeLabel(),
};

export interface AIAssistantViewProps extends AIScreenModel {
  onBack?: () => void;
  isStandalone?: boolean;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  onBack,
  isStandalone = false,
  tasks,
  addTask,
  toggleTask,
  openTaskDetail,
}) => {
  const now = new Date();

  // Load chat messages from localStorage with fallback
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
      // ignore storage quota errors
    }
  }, [messages]);

  // Dynamic Prompt Chips based on real-time task data
  const dynamicChips = useMemo(() => {
    return generateDynamicPromptChips(tasks, now);
  }, [tasks]);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle Send Message
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

  // Clear Chat History
  const handleClear = () => {
    const resetMessage: StoredChatMessage = {
      id: `welcome-${Date.now()}`,
      sender: "ai",
      text: "Đã làm mới lịch sử hội thoại. Bạn cần hỗ trợ tạo việc, phân tích hay chia nhỏ kế hoạch nào không?",
      time: getTimeLabel(),
    };
    setMessages([resetMessage]);
    localStorage.removeItem(CHAT_STORAGE_KEY);
  };

  // Handle Add All Subtasks from Goal Breakdown
  const handleAddAllBreakdownTasks = (plan: GoalPlanBreakdown) => {
    if (addedBreakdownGoals[plan.goalTitle]) return;

    for (const subtask of plan.subtasks) {
      addTask(subtask);
    }

    setAddedBreakdownGoals((prev) => ({ ...prev, [plan.goalTitle]: true }));

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-added-${Date.now()}`,
          sender: "ai",
          text: `✓ Đã thêm toàn bộ **${plan.subtasks.length} công việc** của kế hoạch *"${plan.goalTitle}"* vào danh sách việc của bạn!`,
          time: getTimeLabel(),
        },
      ]);
    }, 150);
  };

  // Handle Add Individual Subtask
  const handleAddSingleSubtask = (subtask: ParsedTaskIntent) => {
    addTask(subtask);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-added-${Date.now()}`,
          sender: "ai",
          text: `✓ Đã thêm: **"${subtask.title}"** vào danh sách!`,
          time: getTimeLabel(),
        },
      ]);
    }, 120);
  };

  // Render Priority Badge (Strict Hand-Drawn Sketch Tokens)
  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE4E6] text-[#BE123C] border-none shadow-2xs dark:bg-rose-950/40 dark:text-rose-300">
            🔴 Gấp
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#D1FAE5] text-[#065F46] border-none shadow-2xs dark:bg-emerald-950/40 dark:text-emerald-300">
            🟢 Thấp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#FEF3C7] text-[#92400E] border-none shadow-2xs dark:bg-amber-950/40 dark:text-amber-300">
            🟡 Vừa
          </span>
        );
    }
  };

  // Helper render text không bị lộ ký tự markdown **
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
      className={`mx-auto w-full flex flex-col bg-[var(--bg-surface)] select-none ${
        isStandalone
          ? "fixed inset-0 z-50 h-[100dvh] max-w-full rounded-none shadow-none"
          : "max-w-3xl h-[calc(100vh-135px)] rounded-3xl shadow-xs overflow-hidden"
      }`}
    >
      {/* 1. MINIMALIST TOPBAR */}
      <div
        className={`px-4 py-3 bg-[var(--bg-surface)] border-b border-[var(--border-ink-muted)] flex items-center justify-between shrink-0 ${
          isStandalone ? "pt-[max(env(safe-area-inset-top),12px)]" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="mobile-back-button w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center justify-center cursor-pointer shrink-0 shadow-2xs transition-all"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.2} />
            </button>
          )}

          <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight truncate flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#007AFF] dark:text-[#0A84FF]" />
            <span>Trợ lý AI</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            title="Làm mới cuộc trò chuyện"
            className="h-8 px-3 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
          >
            <RotateCcw size={13} strokeWidth={2.2} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. KHUNG TIN NHẮN (MESSAGE STREAM) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[var(--bg-surface-muted)]">
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
                <div className="w-7 h-7 rounded-xl bg-[var(--accent-sky)] text-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={13} strokeWidth={2.2} />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[82%] px-4 py-3 text-xs sm:text-[13px] leading-relaxed break-words transition-all shadow-2xs ${
                  isAi
                    ? "bg-[var(--bg-surface)] text-[var(--text-main)] border border-[var(--border-ink-muted)] rounded-3xl rounded-tl-sm"
                    : "bg-[var(--accent-blue)] text-[var(--text-on-accent)] font-medium rounded-3xl rounded-tr-sm"
                }`}
              >
                {/* Nội dung text chính */}
                <div className="whitespace-pre-line font-normal">{renderMessageContent(m.text)}</div>

                {res?.proposal && <AIActionProposalCard proposal={res.proposal} />}

                {/* CARD 1: TASK CREATED CARD (ĐƠN LẺ & BATCH) */}
                {res && (res.type === "created_task" || res.type === "batch_created") && res.createdTasks && (
                  <div className="mt-3 space-y-2 pt-2.5 border-t border-black/[0.06] dark:border-white/[0.08]">
                    {res.createdTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-2xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                            {t.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {renderPriorityBadge(t.priority)}
                            {t.timeLabel && (
                              <span className="text-[10px] font-mono text-[#8E8E93] dark:text-[#A1A1A6] flex items-center gap-0.5">
                                <Clock size={10} />
                                {t.timeLabel}
                              </span>
                            )}
                            {t.tag && (
                              <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
                                #{t.tag}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openTaskDetail(t.id)}
                          className="px-2.5 py-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[11px] font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs transition-all cursor-pointer flex items-center gap-1 shrink-0"
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
                  <div className="mt-3 p-3 rounded-2xl bg-white dark:bg-[#1C1C1E] shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-1.5">
                        <ListPlus size={14} className="text-[#007AFF]" />
                        <span>{res.breakdownPlan.subtasks.length} bước đề xuất</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddAllBreakdownTasks(res.breakdownPlan!)}
                        disabled={addedBreakdownGoals[res.breakdownPlan.goalTitle]}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs ${
                          addedBreakdownGoals[res.breakdownPlan.goalTitle]
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-[#007AFF] hover:bg-[#0071E3] text-white"
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
                          className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-black/[0.06] dark:bg-white/[0.1] text-[#1C1C1E] dark:text-[#F2F2F7] text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                              {st.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {st.startTime && (
                              <span className="text-[10px] font-mono text-[#8E8E93] dark:text-[#A1A1A6]">
                                {st.startTime}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddSingleSubtask(st)}
                              title="Thêm bước này"
                              className="p-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] cursor-pointer transition-all"
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
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                    {res.queriedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] shadow-2xs flex items-center justify-between gap-2 text-xs"
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
                              t.completed ? "line-through text-[#8E8E93] dark:text-[#A1A1A6]" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {renderPriorityBadge(t.priority)}
                          {t.timeLabel && (
                            <span className="text-[10px] font-mono text-[#8E8E93] dark:text-[#A1A1A6]">
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
                    isAi ? "text-[#8E8E93] dark:text-[#A1A1A6]" : "text-white/80"
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
            <div className="w-7 h-7 rounded-xl bg-[var(--accent-sky)] text-[var(--accent-blue)] ring-1 ring-[var(--accent-blue)]/20 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles size={13} strokeWidth={2.2} />
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-3xl rounded-tl-sm bg-[var(--bg-surface)] border border-[var(--border-ink-muted)] w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-blue)] animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. DYNAMIC SMART PROMPT CHIPS */}
      <div className="px-3.5 py-2 bg-[var(--bg-surface)] border-t border-[var(--border-ink-muted)] flex items-center gap-2 overflow-x-auto no-scrollbar">
        {dynamicChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleSend(chip.query)}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-2xs whitespace-nowrap transition-all cursor-pointer"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* 4. THANH NHẬP LIỆU GỌN GÀNG (INPUT BAR CÓ PADDING AN TOÀN) */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className={`p-3 bg-[var(--bg-surface)] border-t border-[var(--border-ink-muted)] flex items-center gap-2 shrink-0 ${
          isStandalone ? "pb-[max(env(safe-area-inset-bottom),12px)]" : ""
        }`}
      >
        <div className="flex-1 flex items-center bg-black/[0.04] dark:bg-white/[0.06] rounded-2xl shadow-2xs px-4 py-2 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi hoặc gõ: Họp team 14:30 chiều mai #CongViec gấp..."
            className="w-full text-xs sm:text-sm font-medium bg-transparent outline-none placeholder:text-[#8E8E93] dark:placeholder:text-[#A1A1A6] text-[#1C1C1E] dark:text-[#F2F2F7]"
          />
        </div>

        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-all ${
            inputVal.trim() && !isTyping
              ? "bg-[#007AFF] hover:bg-[#0071E3] dark:bg-[#0A84FF] dark:hover:bg-[#0071E3] text-white shadow-2xs cursor-pointer"
              : "bg-black/[0.06] dark:bg-white/[0.08] text-[#8E8E93] dark:text-[#71717A] cursor-not-allowed shadow-none"
          }`}
        >
          <Send size={15} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
};
