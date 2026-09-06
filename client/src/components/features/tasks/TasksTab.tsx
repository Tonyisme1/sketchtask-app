import React, { useState, useMemo, useRef, useEffect } from "react";
import { NavigationTarget, TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { TodayTab } from "../today/TodayTab";
import { PlannerTab } from "../planner/PlannerTab";
import { DeadlinesTab } from "../deadlines/DeadlinesTab";
import { TaskList } from "../shared/TaskList";
import { matchesQuery } from "../../../utils/search";
import { getLocalTodayStr } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskTemporalState,
  normalizeTaskTimeType,
  isTaskDueToday,
} from "../../../utils/taskSemantics";
import {
  Sun,
  Calendar as CalendarIcon,
  Hourglass,
  Check,
} from "lucide-react";

export type TaskSubTab = "today" | "planner" | "deadlines";

interface TasksTabProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    activeTaskSubTab,
    setActiveTaskSubTab,
  } = useAppStore();

  const [isSubTabDropdownOpen, setIsSubTabDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State điều hướng từ Hạn định sang Kế hoạch ngày cụ thể
  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<string | undefined>(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<string | undefined>(undefined);
  const [plannerSourceTab, setPlannerSourceTab] = useState<"deadlines" | undefined>(undefined);
  const [todayTargetTaskId, setTodayTargetTaskId] = useState<string | undefined>(undefined);

  const todayStr = getLocalTodayStr(new Date());

  // Global search can target an exact task. Resolve it once at the workspace boundary
  // so each sub-tab receives only the navigation state it understands.
  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = tasks.find((item) => item.id === navigationTarget.taskId);
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    const taskDate = navigationTarget.date || getTaskEffectiveDate(task);
    if (taskDate === todayStr) {
      setTodayTargetTaskId(task.id);
      setActiveTaskSubTab("today");
    } else {
      setPlannerTargetDateStr(taskDate);
      setPlannerTargetTaskId(task.id);
      setActiveTaskSubTab("planner");
    }
    onClearNavigationTarget?.();
  }, [navigationTarget, tasks, todayStr, setActiveTaskSubTab, onClearNavigationTarget]);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSubTabDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Đếm số việc cần làm hôm nay cho badge
  const pendingTodayCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      return isTaskDueToday(t);
    }).length;
  }, [tasks]);

  // Đếm số việc quá hạn
  const overdueCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      return temporal === "overdue" || temporal === "pastScheduled";
    }).length;
  }, [tasks]);

  // Đếm số việc đến hạn trong vòng 24h tới
  const dueWithin24hCount = useMemo(() => {
    const tomorrowStr = getLocalTodayStr(new Date(Date.now() + 86400000));
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      if (temporal === "overdue" || temporal === "pastScheduled") return false;

      const normTime = normalizeTaskTimeType(t);
      const isDeadline = normTime === "deadline" || Boolean(t.deadlineTime);
      const effectiveDate = getTaskEffectiveDate(t);

      return isDeadline && (effectiveDate === todayStr || effectiveDate === tomorrowStr);
    }).length;
  }, [tasks, todayStr]);

  const deadlineAlertTotal = overdueCount + dueWithin24hCount;

  // Lấy cấu hình nhãn & màu của subtab đang chọn
  const currentSubTabInfo = useMemo(() => {
    switch (activeTaskSubTab) {
      case "today":
        return {
          label: "Hôm nay",
          icon: Sun,
          accentBg: "bg-[#FEF08A]",
          textColor: "text-[#1C1917]",
          iconColor: "text-amber-700",
          badge: pendingTodayCount > 0 ? pendingTodayCount : null,
          badgeColor: "bg-white text-[#1C1917] border-[#262626]",
        };
      case "planner":
        return {
          label: "Kế hoạch",
          icon: CalendarIcon,
          accentBg: "bg-[#BAE6FD]",
          textColor: "text-[#1C1917]",
          iconColor: "text-sky-700",
          badge: null,
          badgeColor: "",
        };
      case "deadlines":
        return {
          label: "Hạn định",
          icon: Hourglass,
          accentBg: "bg-[#FECDD3]",
          textColor: "text-rose-950",
          iconColor: "text-rose-700",
          badge: deadlineAlertTotal > 0 ? deadlineAlertTotal : null,
          badgeColor: overdueCount > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-amber-600 text-white",
        };
      default:
        return {
          label: "Hôm nay",
          icon: Sun,
          accentBg: "bg-[#FEF08A]",
          textColor: "text-[#1C1917]",
          iconColor: "text-amber-700",
          badge: null,
          badgeColor: "",
        };
    }
  }, [activeTaskSubTab, pendingTodayCount, deadlineAlertTotal, overdueCount]);

  return (
    <div className="space-y-3 sm:space-y-4 w-full min-w-0 pb-12 select-none animate-in fade-in duration-150">
      {/* 1. Header Task Workspace: Menu Chọn Mục [ Hôm nay | Kế hoạch | Hạn định ] */}
      <div className="flex items-center justify-start gap-2.5 pb-2.5 border-b border-[#262626]">
        {/* Tiêu đề mục hiện tại */}
        {/* Thanh chuyển đổi / Trạng thái theo ngữ cảnh */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 shrink-0">
          {activeTaskSubTab === "today" ? (
            /* Khi ở Tab Hôm nay: Hiển thị badge Hôm nay gọn gàng */
            <div className="px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] bg-[#FEF08A] text-[#1C1917]">
              <Sun size={14} strokeWidth={2.4} className="text-amber-700" />
              <span>Hôm nay</span>
              {pendingTodayCount > 0 ? (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-[3px] border border-[#262626] bg-white text-[#1C1917] leading-none font-bold">
                  {pendingTodayCount} việc
                </span>
              ) : (
                <span className="text-[10px] text-emerald-800 font-bold leading-none">
                  <span className="inline-flex items-center gap-1">
                    <Check size={11} strokeWidth={3} />
                    Xong hết
                  </span>
                </span>
              )}
            </div>
          ) : (
            /* Khi ở Tab Kế hoạch: Chỉ hiển thị 2 sub-view [ Lịch kế hoạch | Hạn định ] */
            <>
              {/* 1. Lịch kế hoạch */}
              <button
                type="button"
                onClick={() => setActiveTaskSubTab("planner")}
                className={`px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0 ${
                  activeTaskSubTab === "planner"
                    ? "bg-[#BAE6FD] text-[#1C1917]"
                    : "bg-white text-[#78716C] hover:bg-[#FAF8F3]"
                }`}
              >
                <CalendarIcon size={14} strokeWidth={2.4} className="text-sky-700" />
                <span>Lịch kế hoạch</span>
              </button>

              {/* 2. Hạn định */}
              <button
                type="button"
                onClick={() => setActiveTaskSubTab("deadlines")}
                className={`px-3 py-1.5 rounded-[5px] border-[1.5px] border-[#262626] text-xs font-bold transition-all flex items-center gap-1.5 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0 ${
                  activeTaskSubTab === "deadlines"
                    ? "bg-[#FECDD3] text-rose-950"
                    : "bg-white text-[#78716C] hover:bg-[#FAF8F3]"
                }`}
              >
                <Hourglass size={14} strokeWidth={2.4} className="text-rose-700" />
                <span>Hạn định</span>
                {deadlineAlertTotal > 0 && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[3px] border border-[#262626] leading-none font-bold ${
                      overdueCount > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-amber-600 text-white"
                    }`}
                  >
                    {deadlineAlertTotal}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Workspace View Container */}
      <div className="pt-1">
        {activeTaskSubTab === "today" ? (
          <div className="animate-in fade-in duration-150">
            <TodayTab
              targetTaskId={todayTargetTaskId}
              onClearTarget={() => setTodayTargetTaskId(undefined)}
            />
          </div>
        ) : activeTaskSubTab === "planner" ? (
          <div className="animate-in fade-in duration-150">
            <PlannerTab
              targetDateStr={plannerTargetDateStr}
              targetTaskId={plannerTargetTaskId}
              fromTab={plannerSourceTab}
              onBackToDeadlines={() => {
                setActiveTaskSubTab("deadlines");
                setPlannerSourceTab(undefined);
              }}
              onClearTarget={() => {
                setPlannerTargetDateStr(undefined);
                setPlannerTargetTaskId(undefined);
              }}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-150">
            <DeadlinesTab
              onNavigateToTaskDate={(dateStr, taskId) => {
                if (dateStr === todayStr) {
                  setActiveTaskSubTab("today");
                } else {
                  setPlannerTargetDateStr(dateStr);
                  setPlannerTargetTaskId(taskId);
                  setPlannerSourceTab("deadlines");
                  setActiveTaskSubTab("planner");
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
