import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Send,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Clock,
  ListPlus,
  Check,
  Settings,
  X,
  Key,
  ShieldCheck,
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
import {
  getEffectiveGeminiApiKey,
  setEffectiveGeminiApiKey,
} from "../../../config/aiConfig";

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
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");
  const [keySavedToast, setKeySavedToast] = useState(false);

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

  // Open config modal
  const handleOpenConfig = () => {
    setTempApiKey(getEffectiveGeminiApiKey());
    setIsConfigOpen(true);
    setKeySavedToast(false);
  };

  // Save API Key
  const handleSaveApiKey = () => {
    setEffectiveGeminiApiKey(tempApiKey.trim());
    setKeySavedToast(true);
    setTimeout(() => {
      setIsConfigOpen(false);
      setKeySavedToast(false);
    }, 600);
  };

  // Render Priority Badge
  const renderPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "high":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">
            ● Gấp
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">
            ○ Thấp
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">
            ◐ Vừa
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
      className={`mx-auto w-full flex flex-col bg-white dark:bg-[#1C1C1E] select-none ${
        isStandalone
          ? "fixed inset-0 z-50 h-[100dvh] max-w-full rounded-none border-none shadow-none"
          : "max-w-3xl h-[calc(100vh-135px)] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-sm overflow-hidden"
      }`}
    >
      {/* 1. MINIMALIST TOPBAR */}
      <div
        className={`px-3.5 sm:px-4 py-3 bg-white dark:bg-[#1C1C1E] border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between shrink-0 ${
          isStandalone ? "pt-[max(env(safe-area-inset-top),14px)]" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="w-8.5 h-8.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-[#1C1917] dark:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}

          <h2 className="text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight truncate">
            Trợ lý AI
          </h2>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleOpenConfig}
            title="Cấu hình Google Gemini API Key"
            className="w-8.5 h-8.5 flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <Key size={16} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={handleClear}
            title="Làm mới cuộc trò chuyện"
            className="w-8.5 h-8.5 flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer active:scale-95"
          >
            <RotateCcw size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. KHUNG TIN NHẮN (MESSAGE STREAM) */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#F2F2F7]/50 dark:bg-black/30">
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
                <div className="w-7 h-7 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Sparkles size={14} strokeWidth={2.2} />
                </div>
              )}

              <div
                className={`max-w-[90%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed break-words transition-all ${
                  isAi
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] border border-[#E5E5EA] dark:border-[#3A3A3C] shadow-xs rounded-tl-xs"
                    : "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] font-medium shadow-sm rounded-tr-xs"
                }`}
              >
                {/* Nội dung text chính */}
                <div className="whitespace-pre-line font-normal">{renderMessageContent(m.text)}</div>

                {/* NÚT MỞ CẤU HÌNH KHI THIẾU API KEY */}
                {isAi && m.text.includes("API Key") && (
                  <div className="mt-2.5 pt-2 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                    <button
                      type="button"
                      onClick={handleOpenConfig}
                      className="px-3 py-1.5 rounded-xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                    >
                      <Key size={13} strokeWidth={2.4} />
                      <span>Nhập Gemini API Key ngay</span>
                    </button>
                  </div>
                )}

                {/* CARD 1: TASK CREATED CARD (ĐƠN LẺ & BATCH) */}
                {res && (res.type === "created_task" || res.type === "batch_created") && res.createdTasks && (
                  <div className="mt-3 space-y-2 pt-2.5 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                    {res.createdTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#3A3A3C] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-xs text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                            {t.title}
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {renderPriorityBadge(t.priority)}
                            {t.timeLabel && (
                              <span className="text-[10px] font-medium text-[#8E8E93] flex items-center gap-0.5">
                                <Clock size={10} />
                                {t.timeLabel}
                              </span>
                            )}
                            {t.tag && (
                              <span className="text-[10px] font-medium text-[#007AFF] dark:text-[#0A84FF]">
                                #{t.tag}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openTaskDetail(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#3A3A3C] text-[11px] font-semibold text-[#1C1C1E] dark:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05] active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
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
                  <div className="mt-3 p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#3A3A3C] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center gap-1.5">
                        <ListPlus size={14} className="text-[#007AFF]" />
                        <span>{res.breakdownPlan.subtasks.length} bước đề xuất</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddAllBreakdownTasks(res.breakdownPlan!)}
                        disabled={addedBreakdownGoals[res.breakdownPlan.goalTitle]}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          addedBreakdownGoals[res.breakdownPlan.goalTitle]
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] shadow-xs active:scale-95"
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
                          className="p-2 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#3A3A3C] flex items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-4 h-4 rounded-full bg-black/[0.05] dark:bg-white/[0.08] text-[10px] font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-medium text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                              {st.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {st.startTime && (
                              <span className="text-[10px] text-[#8E8E93]">
                                {st.startTime}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAddSingleSubtask(st)}
                              title="Thêm bước này"
                              className="p-1 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#8E8E93] hover:text-[#007AFF] cursor-pointer transition-colors"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CARD 3: STATS & PROGRESS CARD */}
                {res && res.type === "stats_progress" && res.stats && (
                  <div className="mt-3 p-3 rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#3A3A3C] space-y-3">
                    {/* Progress Bar Hôm Nay */}
                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-[#8E8E93]">Tiến độ hôm nay</span>
                        <span className="text-[#1C1C1E] dark:text-[#F2F2F7]">
                          {res.stats.completedToday}/{res.stats.todayCount} ({res.stats.todayPercent}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.1] overflow-hidden">
                        <div
                          className="h-full bg-[#007AFF] rounded-full transition-all duration-500"
                          style={{ width: `${res.stats.todayPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Stat Badges */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#3A3A3C] flex items-center gap-2">
                        <AlertTriangle size={14} className="text-[#FF3B30] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#8E8E93]">Quá hạn</div>
                          <div className="text-xs font-bold text-[#FF3B30]">
                            {res.stats.overdueCount} việc
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#3A3A3C] flex items-center gap-2">
                        <TrendingUp size={14} className="text-[#FF9500] shrink-0" />
                        <div>
                          <div className="text-[10px] text-[#8E8E93]">Việc gấp</div>
                          <div className="text-xs font-bold text-[#FF9500]">
                            {res.stats.urgentCount} việc
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CARD 4: TASK QUERY INTERACTIVE LIST */}
                {res && res.type === "task_query" && res.queriedTasks && (
                  <div className="mt-3 space-y-1.5 pt-2 border-t border-[#E5E5EA] dark:border-[#3A3A3C]">
                    {res.queriedTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-2 rounded-xl bg-[#F2F2F7] dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#3A3A3C] flex items-center justify-between gap-2 text-xs hover:border-[#007AFF]/40 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleTask(t.id)}
                            className="text-[#8E8E93] hover:text-[#007AFF] cursor-pointer shrink-0"
                          >
                            {t.completed ? (
                              <CheckCircle2 size={16} className="text-emerald-500" />
                            ) : (
                              <Circle size={16} />
                            )}
                          </button>
                          <span
                            onClick={() => openTaskDetail(t.id)}
                            className={`font-medium truncate cursor-pointer hover:underline ${
                              t.completed ? "line-through text-[#8E8E93]" : "text-[#1C1C1E] dark:text-[#F2F2F7]"
                            }`}
                          >
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {renderPriorityBadge(t.priority)}
                          {t.timeLabel && (
                            <span className="text-[10px] text-[#8E8E93]">
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
                    isAi ? "text-[#8E8E93]" : "text-white/70 dark:text-[#1C1917]/70"
                  }`}
                >
                  {m.time}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-[#8E8E93] font-medium pl-9">
            <Sparkles size={13} className="text-[#8E8E93]" />
            <span>Trợ lý AI đang suy nghĩ và phân tích...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 3. DYNAMIC SMART PROMPT CHIPS */}
      <div className="px-3 py-2 bg-white dark:bg-[#1C1C1E] border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {dynamicChips.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleSend(chip.query)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F2F2F7] border border-[#E5E5EA] dark:border-[#3A3A3C] whitespace-nowrap active:scale-95 transition-all cursor-pointer shadow-2xs"
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
        className={`p-3 bg-white dark:bg-[#1C1C1E] border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center gap-2 shrink-0 ${
          isStandalone ? "pb-[max(env(safe-area-inset-bottom),12px)]" : ""
        }`}
      >
        <div className="flex-1 flex items-center bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-xl px-3.5 py-2 focus-within:border-[#1C1C1E] dark:focus-within:border-white transition-all">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Hỏi hoặc gõ: Họp team 14:30 chiều mai #CongViec gấp..."
            className="w-full text-xs sm:text-sm font-medium bg-transparent outline-none placeholder:text-[#8E8E93] text-[#1C1C1E] dark:text-[#F2F2F7]"
          />
        </div>

        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          className={`h-9 w-9 shrink-0 rounded-xl flex items-center justify-center transition-all shadow-xs ${
            inputVal.trim() && !isTyping
              ? "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] hover:opacity-90 active:scale-95 cursor-pointer"
              : "bg-[#E5E5EA] dark:bg-[#2C2C2E] text-[#8E8E93] cursor-not-allowed shadow-none"
          }`}
        >
          <Send size={15} strokeWidth={2.4} />
        </button>
      </form>

      {/* 5. MODAL CẤU HÌNH API KEY (DÀNH CHO DEVELOPER / QUẢN TRỊ VIÊN) */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
                  <Key size={15} />
                </div>
                <h3 className="font-bold text-sm text-[#1C1C1E] dark:text-[#F2F2F7]">
                  Cấu hình Google Gemini API Key
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-[#8E8E93] leading-relaxed">
              Dán API Key Google Gemini vào đây để kích hoạt trí tuệ nhân tạo. Bạn có thể lấy key miễn phí tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#007AFF] underline font-semibold">Google AI Studio</a>. Key được lưu an toàn trên máy của bạn.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                Gemini API Key:
              </label>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2 text-xs font-mono bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-[#E5E5EA] dark:border-[#3A3A3C] rounded-none focus:outline-none focus:border-[#007AFF]"
              />
            </div>

            {keySavedToast && (
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck size={14} />
                <span>Đã lưu API Key thành công!</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E]">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] text-xs font-semibold text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-4 py-1.5 rounded-xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-bold hover:opacity-90 active:scale-95 shadow-xs"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
