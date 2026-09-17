import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Send,
  RotateCcw,
  ExternalLink,
  Plus,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  ListPlus,
  Check,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { TaskPriority } from "../../../types";
import {
  generateDynamicPromptChips,
  AIQueryResult,
  GoalPlanBreakdown,
  ParsedTaskIntent,
} from "../../../services/aiAgentService";
import { askGeminiAIAssistant } from "../../../services/geminiAiService";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";

// ==========================================
// CHAT MESSAGE TYPES & LOCAL STORAGE KEY
// ==========================================

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

export interface AIAssistantTabProps {
  onBack?: () => void;
  isStandalone?: boolean;
}

export const AIAssistantTab: React.FC<AIAssistantTabProps> = ({
  onBack,
  isStandalone = false,
}) => {
  const { tasks, addTask, toggleTask, openTaskDetail } = useAppStore();

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
      className={`mx-auto w-full flex flex-col bg-[#FBF9F4] dark:bg-[#18181B] select-none ${
        isStandalone
          ? "fixed inset-0 z-50 h-[100dvh] max-w-full rounded-none border-none shadow-none"
          : "max-w-3xl h-[calc(100vh-135px)] border-[1.5px] border-[#262626] dark:border-black shadow-[2px_2px_0px_#262626] dark:shadow-none overflow-hidden rounded-2xl"
      }`}
    >
      {/* 1. MINIMALIST TOPBAR */}
      <div
        className={`px-3.5 sm:px-4 py-2.5 bg-white dark:bg-[#27272A] border-b-[1.5px] border-[#262626] dark:border-black flex items-center justify-between shrink-0 ${
          isStandalone ? "pt-[max(env(safe-area-inset-top),12px)]" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-xl bg-white dark:bg-[#3F3F46] hover:bg-[#F3EFE6] dark:hover:bg-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] border-[1.5px] border-[#262626] dark:border-black shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center cursor-pointer shrink-0 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={16} strokeWidth={2.4} />
            </button>
          )}

          <h2 className="text-sm sm:text-base font-bold text-[#1C1917] dark:text-[#FAFAFA] tracking-tight truncate flex items-center gap-1.5">
            <Sparkles size={16} className="text-[#1C1917] dark:text-[#FAFAFA]" />
            <span>Trợ lý AI</span>
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            title="Làm mới cuộc trò chuyện"
            className="h-8 px-2.5 rounded-xl border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#3F3F46] hover:bg-[#F3EFE6] dark:hover:bg-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] shadow-[1.5px_1.5px_0px_#262626] flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <RotateCcw size={13} strokeWidth={2.4} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. KHUNG TIN NHẮN (MESSAGE STREAM) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-4 bg-[#FBF9F4] dark:bg-[#18181B]">
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
                className={`max-w-[90%] sm:max-w-[82%] px-3.5 py-3 text-xs sm:text-[13px] leading-relaxed break-words transition-all border-[1.5px] ${
                  isAi
                    ? "bg-white dark:bg-[#27272A] text-[#1C1917] dark:text-[#FAFAFA] border-[#262626] dark:border-black shadow-[2px_2px_0px_#262626] dark:shadow-none rounded-2xl rounded-tl-sm"
                    : "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[#1C1917] dark:border-black font-medium shadow-[2px_2px_0px_#78716C] dark:shadow-none rounded-2xl rounded-tr-sm"
                }`}
              >
                {/* Nội dung text chính */}
                <div className="whitespace-pre-line font-normal">{renderMessageContent(m.text)}</div>

                {/* CARD 1: TASK CREATED CARD (ĐƠN LẺ & BATCH) */}
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

                {/* CARD 3: STATS & PROGRESS CARD */}
                {res && res.type === "stats_progress" && res.stats && (
                  <div className="mt-3 p-3 rounded-xl bg-[#FBF9F4] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-black shadow-[1.5px_1.5px_0px_#262626] space-y-3">
                    {/* Progress Bar Hôm Nay */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-[#78716C] dark:text-[#A1A1AA]">Tiến độ hôm nay</span>
                        <span className="font-mono text-[#1C1917] dark:text-[#FAFAFA]">
                          {res.stats.completedToday}/{res.stats.todayCount} ({res.stats.todayPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-black overflow-hidden">
                        <div
                          className="h-full bg-[#1C1917] dark:bg-[#FAFAFA] transition-all duration-500 rounded-full"
                          style={{ width: `${res.stats.todayPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stat Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-xl bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center gap-2">
                        <AlertTriangle size={14} className="text-[#BE123C] shrink-0" />
                        <div>
                          <div className="text-[10px] font-semibold text-[#78716C] dark:text-[#A1A1AA]">Quá hạn</div>
                          <div className="text-xs font-bold text-[#BE123C] dark:text-rose-400 font-mono">
                            {res.stats.overdueCount} việc
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-white dark:bg-[#27272A] border-[1.5px] border-[#262626] dark:border-black shadow-[1px_1px_0px_#262626] flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#92400E] shrink-0" />
                        <div>
                          <div className="text-[10px] font-semibold text-[#78716C] dark:text-[#A1A1AA]">Việc gấp</div>
                          <div className="text-xs font-bold text-[#92400E] dark:text-amber-400 font-mono">
                            {res.stats.urgentCount} việc
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CARD 4: TASK QUERY INTERACTIVE LIST */}
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
          <div className="flex items-center gap-2 text-xs text-[#78716C] dark:text-[#A1A1AA] font-semibold pl-9">
            <Sparkles size={13} className="text-[#1C1917] dark:text-[#FAFAFA] animate-spin" />
            <span>Trợ lý AI đang suy nghĩ và phân tích...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. DYNAMIC SMART PROMPT CHIPS */}
      <div className="px-3 py-2 bg-white dark:bg-[#27272A] border-t-[1.5px] border-[#262626] dark:border-black flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {dynamicChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleSend(chip.query)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#F3EFE6] dark:bg-[#3F3F46] hover:bg-[#E5E0D4] dark:hover:bg-[#52525B] text-[#1C1917] dark:text-[#FAFAFA] border-[1.5px] border-[#262626] dark:border-black shadow-[1.5px_1.5px_0px_#262626] whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
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
        className={`p-2.5 sm:p-3 bg-white dark:bg-[#27272A] border-t-[1.5px] border-[#262626] dark:border-black flex items-center gap-2 shrink-0 ${
          isStandalone ? "pb-[max(env(safe-area-inset-bottom),12px)]" : ""
        }`}
      >
        <div className="flex-1 flex items-center bg-[#F3EFE6] dark:bg-[#18181B] border-[1.5px] border-[#262626] dark:border-black rounded-2xl shadow-[1.5px_1.5px_0px_#262626] px-3.5 py-2 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi hoặc gõ: Họp team 14:30 chiều mai #CongViec gấp..."
            className="w-full text-xs sm:text-sm font-medium bg-transparent outline-none placeholder:text-[#78716C] dark:placeholder:text-[#A1A1AA] text-[#1C1917] dark:text-[#FAFAFA]"
          />
        </div>

        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center transition-all border-[1.5px] border-[#262626] dark:border-black ${
            inputVal.trim() && !isTyping
              ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
              : "bg-[#E5E0D4] dark:bg-[#3F3F46] text-[#78716C] dark:text-[#71717A] cursor-not-allowed shadow-none"
          }`}
        >
          <Send size={15} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
};

