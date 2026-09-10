import React, { useMemo } from "react";
import { ArrowLeft, AlertTriangle, Clock, Flame, CheckCircle2, X } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { NavigationTarget, TabKey, TaskDto } from "../../../types";
import { formatFullDate, getLocalTodayStr } from "../../../utils/date";
import { getTaskEffectiveDate, getTaskEffectiveTime, getTaskTemporalState, isTaskDueToday } from "../../../utils/taskSemantics";
import { useScrollLock } from "../../../hooks/useScrollLock";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: TabKey, target?: NavigationTarget) => void;
  onSelectTask?: (task: TaskDto) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectTask,
}) => {
  const { tasks, habits, toggleTask, toggleHabitDay } = useAppStore();
  const todayStr = getLocalTodayStr(new Date());
  const [isVisible, setIsVisible] = React.useState(isOpen);
  const [isClosing, setIsClosing] = React.useState(false);

  useScrollLock(isVisible);

  // Keep the drawer mounted long enough to play the reverse transition.
  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }

    if (!isVisible) return;

    setIsClosing(true);
    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 220);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, isVisible]);

  // 1. Việc quá hạn
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const state = getTaskTemporalState(t);
      return state === "overdue" || state === "pastScheduled";
    });
  }, [tasks]);

  // 2. Việc đến hạn hôm nay
  const todayDueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      if (!isTaskDueToday(t)) return false;
      const state = getTaskTemporalState(t);
      return state !== "overdue" && state !== "pastScheduled";
    });
  }, [tasks]);

  const overdueGroups = useMemo(() => {
    const groups = new Map<string, TaskDto[]>();

    for (const task of overdueTasks) {
      const date = getTaskEffectiveDate(task) || "no-date";
      const group = groups.get(date) || [];
      group.push(task);
      groups.set(date, group);
    }

    return [...groups.entries()]
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([dateStr, groupTasks]) => ({
        dateStr,
        tasks: groupTasks.sort((taskA, taskB) =>
          (getTaskEffectiveTime(taskA) || "99:99").localeCompare(
            getTaskEffectiveTime(taskB) || "99:99",
          ),
        ),
      }));
  }, [overdueTasks]);

  // 3. Thói quen chưa hoàn thành hôm nay
  const pendingHabits = useMemo(() => {
    return habits.filter((h) => !h.completedDates.includes(todayStr));
  }, [habits, todayStr]);

  const totalAlerts = overdueTasks.length + todayDueTasks.length + pendingHabits.length;

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch sm:items-center justify-center sm:justify-end p-0 sm:p-4 bg-black/50 mobile-scrim-enter select-none"
      onClick={onClose}
    >
      <div
        className={`relative w-full h-[100dvh] sm:h-auto sm:max-w-md bg-[#FBF9F4] border-none sm:border-[2px] sm:border-[#262626] rounded-none sm:rounded-[8px] shadow-none sm:shadow-[4px_4px_0px_#262626] p-4 sm:p-5 pt-[max(env(safe-area-inset-top),16px)] sm:pt-5 pb-[max(env(safe-area-inset-bottom),16px)] sm:pb-5 space-y-4 max-h-[100dvh] sm:max-h-[90vh] flex flex-col ${isClosing ? "mobile-panel-exit" : "mobile-panel-enter"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Back Arrow & Close Button */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]/20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-white hover:bg-[#FAF8F3] border border-[#262626] rounded-[4px] text-[#1C1917] shadow-[1px_1px_0px_#262626] flex items-center justify-center active:translate-y-[0.5px] active:shadow-none cursor-pointer shrink-0"
              title="Quay lại"
            >
              <ArrowLeft size={17} strokeWidth={2.4} />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-black text-[#1C1917]">Thông báo</h2>
              <p className="text-[10px] text-[#78716C] font-mono">Nhắc nhở công việc</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[4px] bg-white hover:bg-[#FAF8F3] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-h-0 sm:max-h-[60vh]">
          {totalAlerts === 0 ? (
            <div className="text-center py-10 text-[#78716C] space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-[#1C1917]" />
              <p className="text-sm font-bold text-[#1C1917]">Không có thông báo</p>
              <p className="text-xs font-mono">Bạn đã xử lý hết việc và thói quen hôm nay.</p>
            </div>
          ) : (
            <>
              {/* Overdue Alerts */}
              {overdueGroups.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={13} className="text-[#1C1917]" />
                      <span>Quá hạn ({overdueTasks.length})</span>
                    </span>
                  </div>
                  {overdueGroups.map((group) => (
                    <div key={group.dateStr} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-[#78716C] font-mono">
                        <span>{formatFullDate(group.dateStr)}</span>
                        <span>{group.tasks.length} việc</span>
                      </div>
                      {group.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (onSelectTask) onSelectTask(task);
                        if (onNavigateTab) {
                          onNavigateTab("today", { taskId: task.id, date: getTaskEffectiveDate(task) });
                        }
                        onClose();
                      }}
                      className="bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] hover:bg-[#F5F5F4] cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">{task.title}</p>
                        <p className="text-[10px] text-[#78716C] font-mono mt-0.5">
                          {getTaskTemporalState(task) === "pastScheduled" ? "Lịch hẹn đã qua" : "Hạn quá hạn"}
                          {getTaskEffectiveTime(task) ? ` · ${getTaskEffectiveTime(task)}` : ""}
                        </p>
                        <p className="hidden text-[10px] text-[#78716C] font-mono mt-0.5">
                          Hạn: {getTaskEffectiveDate(task) || "Trước đó"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id);
                        }}
                        className="px-2 py-0.5 bg-white border border-[#262626] text-[#1C1917] rounded text-[10px] font-bold shadow-[0.5px_0.5px_0px_#262626] hover:bg-[#FAF8F3] cursor-pointer shrink-0"
                      >
                        Xong
                      </button>
                    </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Today Due Tasks */}
              {todayDueTasks.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#1C1917]" />
                      <span>Hôm nay ({todayDueTasks.length})</span>
                    </span>
                  </div>
                  {todayDueTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        if (onSelectTask) onSelectTask(task);
                        if (onNavigateTab) {
                          onNavigateTab("today", { taskId: task.id, date: getTaskEffectiveDate(task) });
                        }
                        onClose();
                      }}
                      className="bg-white border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] hover:bg-[#FAF8F3] cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">{task.title}</p>
                        <p className="text-[10px] text-[#78716C] font-mono mt-0.5">
                          {getTaskEffectiveTime(task) ? `⏰ ${getTaskEffectiveTime(task)}` : "Hôm nay"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id);
                        }}
                        className="px-2 py-0.5 bg-white border border-[#262626] text-[#1C1917] rounded text-[10px] font-bold shadow-[0.5px_0.5px_0px_#262626] hover:bg-[#FAF8F3] cursor-pointer shrink-0"
                      >
                        Xong
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Today Pending Habits */}
              {pendingHabits.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917] font-mono uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Flame size={13} className="text-[#1C1917]" />
                      <span>Thói quen chưa tích ({pendingHabits.length})</span>
                    </span>
                  </div>
                  {pendingHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2"
                    >
                      <p className="text-xs font-bold text-[#1C1917] truncate leading-tight">{habit.name}</p>
                      <button
                        type="button"
                        onClick={() => toggleHabitDay(habit.id, todayStr)}
                        className="px-2 py-0.5 bg-[#1C1917] hover:bg-[#262626] text-white border border-[#262626] rounded text-[10px] font-bold shadow-[0.5px_0.5px_0px_#262626] cursor-pointer shrink-0"
                      >
                        Tích ngay
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
