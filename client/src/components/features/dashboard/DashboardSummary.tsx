import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { TaskDto, JournalEntryDto, TabKey } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import {
  isTaskDueToday,
  isTaskOverdue,
  isTaskPastScheduled,
} from "../../../utils/taskSemantics";

interface DashboardSummaryProps {
  tasks: TaskDto[];
  journalEntries: JournalEntryDto[];
  onNavigateTab?: (tab: TabKey) => void;
  onSelectTaskSubTab?: (subTab: "today" | "planner" | "deadlines") => void;
}

export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  tasks,
  journalEntries,
  onNavigateTab,
  onSelectTaskSubTab,
}) => {
  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  // 1. Việc hôm nay
  const todayTasks = tasks.filter((t) => isTaskDueToday(t, now));
  const todayPendingCount = todayTasks.filter((t) => !t.completed).length;
  const todayHighPriorityCount = todayTasks.filter(
    (t) => !t.completed && t.priority === "high"
  ).length;

  // 2. Việc đã hoàn thành trong hôm nay
  const todayCompletedCount = todayTasks.filter((t) => t.completed).length;
  const completionPercentage =
    todayTasks.length > 0
      ? Math.round((todayCompletedCount / todayTasks.length) * 100)
      : todayCompletedCount > 0
      ? 100
      : 0;

  // 3. Việc quá hạn (chưa hoàn thành và quá hạn deadline / quá ngày hẹn)
  const overdueTasksCount = tasks.filter(
    (t) => isTaskOverdue(t, now) || isTaskPastScheduled(t, now)
  ).length;

  // 4. Nhật ký hôm nay
  const todayJournalCount = journalEntries.filter((e) => e.date === todayStr).length;

  const handleCardClick = (type: "today" | "completed" | "overdue" | "journal") => {
    if (!onNavigateTab) return;

    switch (type) {
      case "today":
        onSelectTaskSubTab?.("today");
        onNavigateTab("tasks");
        break;
      case "completed":
        onSelectTaskSubTab?.("today");
        onNavigateTab("tasks");
        break;
      case "overdue":
        onSelectTaskSubTab?.("deadlines");
        onNavigateTab("tasks");
        break;
      case "journal":
        onNavigateTab("journal");
        break;
    }
  };

  const summaryCards = [
    {
      id: "today" as const,
      label: "Cần làm hôm nay",
      count: todayPendingCount,
      subtext:
        todayHighPriorityCount > 0
          ? `${todayHighPriorityCount} việc ưu tiên cao`
          : todayPendingCount === 0
          ? "Đã xong toàn bộ!"
          : "Đang chờ xử lý",
      icon: CalendarDays,
      bg: "bg-[#FFFDF8]",
      badgeBg: "bg-[#FEF08A]",
      borderColor: "border-[#262626]",
      iconColor: "text-amber-900",
    },
    {
      id: "completed" as const,
      label: "Đã xong hôm nay",
      count: todayCompletedCount,
      subtext:
        todayTasks.length > 0
          ? `Đạt ${completionPercentage}% hoàn thành`
          : todayCompletedCount > 0
          ? `${todayCompletedCount} việc đã xong`
          : "Bắt đầu ngày mới",
      icon: CheckCircle2,
      bg: "bg-[#FFFDF8]",
      badgeBg: "bg-[#BBF7D0]",
      borderColor: "border-[#262626]",
      iconColor: "text-emerald-800",
    },
    {
      id: "overdue" as const,
      label: "Việc quá hạn",
      count: overdueTasksCount,
      subtext:
        overdueTasksCount > 0
          ? "Cần xử lý hoặc dời ngày"
          : "Tiến độ đúng hạn",
      icon: AlertCircle,
      bg: "bg-[#FFFDF8]",
      badgeBg: overdueTasksCount > 0 ? "bg-[#FECDD3]" : "bg-[#FAF8F3]",
      borderColor: "border-[#262626]",
      iconColor: overdueTasksCount > 0 ? "text-rose-700" : "text-[#78716C]",
    },
    {
      id: "journal" as const,
      label: "Nhật ký hôm nay",
      count: todayJournalCount,
      subtext:
        todayJournalCount > 0
          ? "Đã lưu suy ngẫm"
          : "Chưa có dòng ghi chép",
      icon: BookOpen,
      bg: "bg-[#FFFDF8]",
      badgeBg: "bg-[#DDD6FE]",
      borderColor: "border-[#262626]",
      iconColor: "text-purple-900",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 select-none">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(card.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(card.id);
              }
            }}
            className={`${card.bg} border-[1.5px] border-[#262626] rounded-[6px] p-3 sm:p-3.5 shadow-[2px_2px_0px_#262626] hover:bg-[#FAF8F3] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex flex-col justify-between min-h-[94px] sm:min-h-[102px] group`}
          >
            {/* Hàng trên: Icon badge + Nút mũi tên chuyển tab */}
            <div className="flex items-center justify-between gap-1.5">
              <div
                className={`w-7 h-7 rounded-[4px] border border-[#262626] ${card.badgeBg} flex items-center justify-center shadow-[0.5px_0.5px_0px_#262626] shrink-0`}
              >
                <Icon size={14} strokeWidth={2.4} className={card.iconColor} />
              </div>
              <ArrowUpRight
                size={14}
                className="text-[#A8A29E] group-hover:text-[#1C1917] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0"
              />
            </div>

            {/* Hàng dưới: Số lượng, Nhãn và Subtext */}
            <div className="pt-2">
              <div className="font-mono text-xl sm:text-2xl font-black text-[#1C1917] leading-none">
                {card.count}
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-[#1C1917] pt-1 truncate">
                {card.label}
              </div>
              <div className="text-[10px] text-[#78716C] truncate pt-0.5 font-medium">
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
