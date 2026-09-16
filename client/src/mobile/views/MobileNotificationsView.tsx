import React, { useState, useMemo, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Check,
  Calendar,
  ArrowRight,
  Sparkles,
  CalendarPlus,
  RotateCcw,
  Tag as TagIcon,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "../../shared/stores";
import { NavigationTarget, TabKey, TaskDto } from "../../shared/types";
import {
  formatFullDate,
  getLocalTodayStr,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  isTaskDueToday,
} from "../../shared/utils";
import { formatDisplayDate } from "../../components/ui/pickers/time/DatePickerPopover";
import { RescheduleDateModal } from "../../components/ui/overlays/RescheduleDateModal";

export interface MobileNotificationsViewProps {
  onNavigateTab?: (tab: TabKey | string, target?: NavigationTarget) => void;
}

type NotificationFilterTab = "all" | "overdue" | "today" | "completed";

export const MobileNotificationsView: React.FC<MobileNotificationsViewProps> = ({
  onNavigateTab,
}) => {
  const { tasks, toggleTask, updateTask, openTaskDetail } = useAppStore();
  const [now, setNow] = useState(() => Date.now());
  const [activeFilter, setActiveFilter] = useState<NotificationFilterTab>("all");
  const [rescheduleToastText, setRescheduleToastText] = useState<string | null>(null);
  const [rescheduleModalState, setRescheduleModalState] = useState<{
    isOpen: boolean;
    taskIds: string[];
    taskTitle?: string;
  } | null>(null);

  const todayStr = getLocalTodayStr(new Date());

  // Cập nhật đồng hồ mỗi 30s
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // 1. Danh sách việc quá hạn
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const state = getTaskTemporalState(t);
      return state === "overdue" || state === "pastScheduled";
    });
  }, [tasks, now]);

  // 2. Danh sách việc đến hạn hôm nay
  const todayDueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      if (!isTaskDueToday(t)) return false;
      const state = getTaskTemporalState(t);
      return state !== "overdue" && state !== "pastScheduled";
    });
  }, [tasks, now]);

  // 3. Danh sách việc đã hoàn thành hôm nay
  const completedTodayTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!t.completed) return false;
      const date = getTaskEffectiveDate(t);
      return date === todayStr;
    });
  }, [tasks, todayStr]);

  // Gom nhóm theo ngày cho danh sách quá hạn
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
            getTaskEffectiveTime(taskB) || "99:99"
          )
        ),
      }));
  }, [overdueTasks]);

  const totalActiveAlerts = overdueTasks.length + todayDueTasks.length;

  // Mở modal dời toàn bộ việc quá hạn
  const handleOpenRescheduleAll = () => {
    if (overdueTasks.length === 0) return;
    setRescheduleModalState({
      isOpen: true,
      taskIds: overdueTasks.map((t) => t.id),
    });
  };

  // Mở modal dời 1 việc cụ thể
  const handleOpenRescheduleSingle = (task: TaskDto) => {
    setRescheduleModalState({
      isOpen: true,
      taskIds: [task.id],
      taskTitle: task.title,
    });
  };

  // Xác nhận dời ngày sang targetDate
  const handleConfirmReschedule = (targetDate: string) => {
    if (!rescheduleModalState || rescheduleModalState.taskIds.length === 0) return;
    const { taskIds } = rescheduleModalState;
    for (const id of taskIds) {
      const task = tasks.find((t) => t.id === id);
      if (!task) continue;
      if (task.dueDate) {
        updateTask(id, { dueDate: targetDate });
      } else if (task.deadlineDate) {
        updateTask(id, { deadlineDate: targetDate });
      } else {
        updateTask(id, { dueDate: targetDate });
      }
    }
    const formatted = formatDisplayDate(targetDate);
    const msg =
      taskIds.length === 1
        ? `Đã dời công việc sang ${formatted}`
        : `Đã dời ${taskIds.length} việc quá hạn sang ${formatted}`;
    setRescheduleToastText(msg);
    setTimeout(() => setRescheduleToastText(null), 3000);
    setRescheduleModalState(null);
  };

  const handleOpenTask = (task: TaskDto) => {
    openTaskDetail(task.id);
  };

  return (
    <div className="w-full space-y-3.5 pb-28 select-none">
      {/* Toast thông báo dời ngày thành công */}
      {rescheduleToastText && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-4 py-2 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={15} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{rescheduleToastText}</span>
        </div>
      )}

      {/* 1. SMART BATCH BANNER (Hiển thị khi có việc quá hạn) */}
      {overdueTasks.length > 0 && (activeFilter === "all" || activeFilter === "overdue") && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle size={16} strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 leading-tight">
                {overdueTasks.length} việc quá hạn cần xử lý
              </p>
              <p className="text-[10px] text-[#8E8E93] dark:text-[#aeaeb2] mt-0.5">
                Chọn ngày dời lại để không bỏ sót
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenRescheduleAll}
            className="px-3 py-1.5 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-bold shrink-0 transition-all active:scale-95 shadow-xs cursor-pointer"
          >
            Dời ngày
          </button>
        </div>
      )}

      {/* 2. THANH BỘ LỌC PHÂN TẦNG ĐƠN NHẤT (UNIFIED SEGMENTED TABS) */}
      <div className="bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1 rounded-2xl flex items-center gap-1">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeFilter === "all"
              ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
              : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
          }`}
        >
          <span>Tất cả</span>
          <span className="font-mono text-[10px] opacity-75">
            ({totalActiveAlerts})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("overdue")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeFilter === "overdue"
              ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
              : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
          }`}
        >
          <span>Quá hạn</span>
          <span className="font-mono text-[10px] opacity-75">
            ({overdueTasks.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("today")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeFilter === "today"
              ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
              : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
          }`}
        >
          <span>Hôm nay</span>
          <span className="font-mono text-[10px] opacity-75">
            ({todayDueTasks.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("completed")}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeFilter === "completed"
              ? "bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
              : "text-[#8E8E93] dark:text-[#aeaeb2] hover:text-[#1C1C1E] dark:hover:text-white"
          }`}
        >
          <span>Đã xong</span>
          <span className="font-mono text-[10px] opacity-75">
            ({completedTodayTasks.length})
          </span>
        </button>
      </div>

      {/* 3. NỘI DUNG DANH SÁCH THÔNG BÁO */}
      <div className="space-y-3.5">
        {/* Trường hợp: Không có bất kỳ thông báo nào */}
        {totalActiveAlerts === 0 && activeFilter !== "completed" && (
          <div className="text-center py-14 px-4 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} strokeWidth={2.2} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7]">
                Hộp thông báo sạch sẽ
              </p>
              <p className="text-xs text-[#8E8E93] dark:text-[#aeaeb2] max-w-xs mx-auto">
                Không có việc quá hạn hay cần gấp hôm nay.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: VIỆC QUÁ HẠN */}
        {(activeFilter === "all" || activeFilter === "overdue") && overdueGroups.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={13} strokeWidth={2.4} />
                <span>Việc quá hạn ({overdueTasks.length})</span>
              </span>
            </div>

            {overdueGroups.map((group) => (
              <div key={group.dateStr} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-[#8E8E93] dark:text-[#aeaeb2] px-1">
                  <span>{formatFullDate(group.dateStr)}</span>
                  <span className="font-mono text-[10px]">{group.tasks.length} việc</span>
                </div>

                {group.tasks.map((task) => (
                  <div
                    key={`overdue-${task.id}`}
                    onClick={() => handleOpenTask(task)}
                    className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle size={10} strokeWidth={2.5} />
                          <span>Quá hạn</span>
                        </span>
                        {getTaskEffectiveTime(task) && (
                          <span className="font-mono text-[10px] text-[#8E8E93] dark:text-[#aeaeb2]">
                            {getTaskEffectiveTime(task)}
                          </span>
                        )}
                        {task.tag && (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] text-[10px] font-medium flex items-center gap-1">
                            <TagIcon size={9} />
                            <span>{task.tag}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-[#1C1917] dark:text-[#F2F2F7] truncate">
                        {task.title}
                      </p>

                      {task.description && (
                        <p className="text-xs text-[#8E8E93] dark:text-[#aeaeb2] line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenRescheduleSingle(task)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#E5E5EA] dark:border-[#3A3A3C] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Dời ngày"
                      >
                        <CalendarPlus size={12} strokeWidth={2.4} />
                        <span>Dời</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleTask(task.id)}
                        className="px-3 py-1.5 rounded-xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
                        title="Hoàn thành"
                      >
                        <Check size={13} strokeWidth={2.6} />
                        <span>Xong</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* SECTION 2: VIỆC ĐẾN HẠN HÔM NAY */}
        {(activeFilter === "all" || activeFilter === "today") && todayDueTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <span className="flex items-center gap-1.5">
                <Clock size={13} strokeWidth={2.4} />
                <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
              </span>
            </div>

            <div className="space-y-2">
              {todayDueTasks.map((task) => (
                <div
                  key={`today-${task.id}`}
                  onClick={() => handleOpenTask(task)}
                  className="bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl p-3.5 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                        <Clock size={10} strokeWidth={2.5} />
                        <span>Hôm nay</span>
                      </span>
                      {getTaskEffectiveTime(task) && (
                        <span className="font-mono text-[10px] text-[#8E8E93] dark:text-[#aeaeb2]">
                          {getTaskEffectiveTime(task)}
                        </span>
                      )}
                      {task.tag && (
                        <span className="px-1.5 py-0.5 rounded-md bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#8E8E93] dark:text-[#aeaeb2] text-[10px] font-medium flex items-center gap-1">
                          <TagIcon size={9} />
                          <span>{task.tag}</span>
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-semibold text-[#1C1917] dark:text-[#F2F2F7] truncate">
                      {task.title}
                    </p>

                    {task.description && (
                      <p className="text-xs text-[#8E8E93] dark:text-[#aeaeb2] line-clamp-1">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    title="Hoàn thành"
                  >
                    <Check size={13} strokeWidth={2.6} />
                    <span>Xong</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: VIỆC ĐÃ HOÀN THÀNH HÔM NAY */}
        {activeFilter === "completed" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} strokeWidth={2.4} />
                <span>Đã hoàn thành hôm nay ({completedTodayTasks.length})</span>
              </span>
            </div>

            {completedTodayTasks.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-[#1C1C1E] border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-xs space-y-2">
                <p className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">
                  Chưa có công việc nào hoàn thành hôm nay
                </p>
                <p className="text-[11px] text-[#8E8E93] dark:text-[#aeaeb2]">
                  Hãy bắt tay hoàn thành các việc trong danh sách nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTodayTasks.map((task) => (
                  <div
                    key={`completed-${task.id}`}
                    onClick={() => handleOpenTask(task)}
                    className="bg-white/70 dark:bg-[#1C1C1E]/70 border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl p-3.5 shadow-2xs transition-all cursor-pointer flex items-center justify-between gap-3 group opacity-75 hover:opacity-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#8E8E93] dark:text-[#aeaeb2] line-through truncate">
                        {task.title}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-[#E5E5EA] dark:border-[#3A3A3C] bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] text-xs font-semibold text-[#8E8E93] dark:text-[#aeaeb2] transition-all active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Hoàn tác"
                    >
                      <RotateCcw size={12} strokeWidth={2.4} />
                      <span>Hoàn tác</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. FOOTER QUICK JUMP TO DEADLINES / PLANNER */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab("deadlines");
            }
          }}
          className="w-full py-3 px-4 rounded-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center justify-between transition-all cursor-pointer shadow-xs active:scale-[0.99]"
        >
          <div className="flex items-center gap-2">
            <Calendar size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
            <span>Mở Lịch Quản lý Hạn định</span>
          </div>
          <ChevronRight size={15} strokeWidth={2.4} className="text-[#8E8E93]" />
        </button>
      </div>

      {/* Reschedule Date Modal */}
      {rescheduleModalState && (
        <RescheduleDateModal
          isOpen={rescheduleModalState.isOpen}
          taskCount={rescheduleModalState.taskIds.length}
          taskTitle={rescheduleModalState.taskTitle}
          onClose={() => setRescheduleModalState(null)}
          onConfirm={handleConfirmReschedule}
        />
      )}
    </div>
  );
};