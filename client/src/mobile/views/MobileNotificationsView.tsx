// ==========================================
// VIEW: MobileNotificationsView (Tier 1 & Tier 2 Ink & Paper)
// ==========================================

import React, { useState, useMemo, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
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
import { HandDrawnCheckbox } from "../../components/ui/core/HandDrawnCheckbox";

export interface MobileNotificationsViewProps {
  onNavigateTab?: (tab: TabKey | string, target?: NavigationTarget) => void;
}

type NotificationFilterTab = "all" | "overdue" | "today" | "completed";

export const MobileNotificationsView: React.FC<MobileNotificationsViewProps> = ({
  onNavigateTab,
}) => {
  // === PHẦN 1: STORE & LOCAL STATES ===
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

  // Cập nhật đồng hồ định kỳ mỗi 30s
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // === PHẦN 2: TÍNH TOÁN DANH SÁCH DỮ LIỆU ===
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

  // === PHẦN 3: XỬ LÝ SỰ KIỆN DỜI LỊCH & THAO TÁC ===
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

  // === PHẦN 4: GIAO DIỆN CHÍNH (INK & PAPER TACTILE LAYOUT) ===
  return (
    <div className="w-full space-y-3 pb-24 select-none">
      {/* Toast thông báo hoàn thành/dời ngày */}
      {rescheduleToastText && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] border-[1.5px] border-[#262626] px-3.5 py-1.5 rounded-[6px] shadow-[2px_2px_0px_#262626] text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={14} className="text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{rescheduleToastText}</span>
        </div>
      )}

      {/* 1. THANH BỘ LỌC PHÂN TẦNG (TIER 1 FILTER TOOLBAR) */}
      <div className="border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#27272A] p-1 rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-center gap-1">
        {[
          { key: "all", label: "Tất cả", count: totalActiveAlerts },
          { key: "overdue", label: "Quá hạn", count: overdueTasks.length },
          { key: "today", label: "Hôm nay", count: todayDueTasks.length },
          { key: "completed", label: "Đã xong", count: completedTodayTasks.length },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as NotificationFilterTab)}
              className={`flex-1 py-1.5 px-1 rounded-[4px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                isActive
                  ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] font-bold shadow-[1px_1px_0px_#262626] dark:shadow-none"
                  : "text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917] dark:hover:text-white"
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[10px] opacity-80">({tab.count})</span>
            </button>
          );
        })}
      </div>

      {/* 3. NỘI DUNG DANH SÁCH THÔNG BÁO */}
      <div className="space-y-4">
        {/* Trường hợp: Toàn bộ danh sách rỗng */}
        {totalActiveAlerts === 0 && activeFilter !== "completed" && (
          <div className="border-[1.5px] border-dashed border-[#262626]/30 dark:border-white/20 bg-white dark:bg-[#27272A] rounded-[6px] py-12 px-4 text-center shadow-[2px_2px_0px_#262626] space-y-2.5">
            <div className="w-10 h-10 rounded-[6px] border-[1.5px] border-[#262626] bg-[#FAF8F3] dark:bg-[#18181B] text-[#1C1917] dark:text-[#FAFAFA] flex items-center justify-center mx-auto shadow-[1.5px_1.5px_0px_#262626]">
              <CheckCircle2 size={20} strokeWidth={2.2} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                Hộp thông báo sạch sẽ
              </p>
              <p className="text-xs text-[#78716C] dark:text-[#A1A1AA] max-w-xs mx-auto">
                Không có việc quá hạn hay cần gấp hôm nay. Mọi thứ đều đang đúng tiến độ!
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: VIỆC QUÁ HẠN */}
        {(activeFilter === "all" || activeFilter === "overdue") && overdueGroups.length > 0 && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]/20 dark:border-transparent text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={13} strokeWidth={2.4} className="text-[#BE123C] dark:text-rose-400" />
                <span>Việc quá hạn ({overdueTasks.length})</span>
              </span>
            </div>

            {overdueGroups.map((group) => (
              <div key={group.dateStr} className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-[#78716C] dark:text-[#A1A1AA] px-0.5">
                  <span>{formatFullDate(group.dateStr)}</span>
                  <span className="font-mono text-[10px]">{group.tasks.length} việc</span>
                </div>

                {group.tasks.map((task) => (
                  <div
                    key={`overdue-${task.id}`}
                    onClick={() => handleOpenTask(task)}
                    className="border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#27272A] rounded-[6px] p-3 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {/* HandDrawn Checkbox */}
                      <div
                        className="shrink-0 pt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HandDrawnCheckbox
                          checked={Boolean(task.completed)}
                          onChange={() => toggleTask(task.id)}
                          size="sm"
                        />
                      </div>

                      {/* Tiêu đề + Metadata */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-[13.5px] sm:text-sm font-semibold text-[#1C1917] dark:text-[#FAFAFA] truncate leading-snug group-hover:underline">
                          {task.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="border border-[#FDA4AF] bg-[#FECDD3] text-[#9F1239] rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold font-sans leading-tight">
                            Quá hạn
                          </span>
                          {getTaskEffectiveTime(task) && (
                            <span className="border border-[#D4CEBF] dark:border-black bg-[#FAF8F3] dark:bg-[#18181B] text-[#78716C] dark:text-[#A1A1AA] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] leading-tight">
                              {getTaskEffectiveTime(task)}
                            </span>
                          )}
                          {task.tag && (
                            <span className="text-[11px] font-normal text-[#78716C] dark:text-[#A1A1AA] font-sans">
                              #{task.tag}
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-xs text-[#78716C] dark:text-[#A1A1AA] line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Nút Dời Ngày tactile */}
                    <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenRescheduleSingle(task)}
                        className="px-2.5 py-1 rounded-[4px] border-[1.5px] border-[#262626] dark:border-black bg-[#FAF8F3] dark:bg-[#18181B] hover:bg-[#F3EFE6] text-xs font-semibold text-[#1C1917] dark:text-[#FAFAFA] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all flex items-center gap-1 cursor-pointer"
                        title="Dời ngày"
                      >
                        <CalendarPlus size={12} strokeWidth={2.4} />
                        <span>Dời</span>
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
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]/20 dark:border-transparent text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
              <span className="flex items-center gap-1.5">
                <Clock size={13} strokeWidth={2.4} className="text-[#92400E] dark:text-[#FCD34D]" />
                <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
              </span>
            </div>

            <div className="space-y-2">
              {todayDueTasks.map((task) => (
                <div
                  key={`today-${task.id}`}
                  onClick={() => handleOpenTask(task)}
                  className="border-[1.5px] border-[#262626] dark:border-black bg-white dark:bg-[#27272A] rounded-[6px] p-3 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    {/* HandDrawn Checkbox */}
                    <div
                      className="shrink-0 pt-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <HandDrawnCheckbox
                        checked={Boolean(task.completed)}
                        onChange={() => toggleTask(task.id)}
                        size="sm"
                      />
                    </div>

                    {/* Tiêu đề + Metadata */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[13.5px] sm:text-sm font-semibold text-[#1C1917] dark:text-[#FAFAFA] truncate leading-snug group-hover:underline">
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="border border-[#262626]/20 bg-[#FEF08A] text-[#1C1917] rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold font-sans leading-tight">
                          Hôm nay
                        </span>
                        {getTaskEffectiveTime(task) && (
                          <span className="border border-[#D4CEBF] dark:border-black bg-[#FAF8F3] dark:bg-[#18181B] text-[#78716C] dark:text-[#A1A1AA] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] leading-tight">
                            {getTaskEffectiveTime(task)}
                          </span>
                        )}
                        {task.tag && (
                          <span className="text-[11px] font-normal text-[#78716C] dark:text-[#A1A1AA] font-sans">
                            #{task.tag}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#78716C] dark:text-[#A1A1AA] line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: VIỆC ĐÃ HOÀN THÀNH HÔM NAY */}
        {activeFilter === "completed" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]/20 dark:border-transparent text-xs font-bold text-[#78716C] dark:text-[#A1A1AA]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} strokeWidth={2.4} className="text-emerald-600 dark:text-emerald-400" />
                <span>Đã hoàn thành hôm nay ({completedTodayTasks.length})</span>
              </span>
            </div>

            {completedTodayTasks.length === 0 ? (
              <div className="border-[1.5px] border-dashed border-[#262626]/30 dark:border-white/20 bg-white dark:bg-[#27272A] rounded-[6px] py-8 px-4 text-center shadow-[2px_2px_0px_#262626] space-y-1.5">
                <p className="text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                  Chưa có công việc nào hoàn thành hôm nay
                </p>
                <p className="text-[11px] text-[#78716C] dark:text-[#A1A1AA]">
                  Bắt đầu tích hoàn thành các việc trong danh sách nhé!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedTodayTasks.map((task) => (
                  <div
                    key={`completed-${task.id}`}
                    onClick={() => handleOpenTask(task)}
                    className="border-[1.5px] border-[#D4CEBF] dark:border-[#52525B] bg-[#FAF8F3]/70 dark:bg-[#18181B]/70 rounded-[6px] p-3 shadow-[1px_1px_0px_#262626]/20 transition-all cursor-pointer flex items-center justify-between gap-2.5 opacity-80 hover:opacity-100"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <HandDrawnCheckbox
                          checked={true}
                          onChange={() => toggleTask(task.id)}
                          size="sm"
                        />
                      </div>
                      <p className="text-sm font-semibold text-[#78716C] dark:text-[#A1A1AA] line-through truncate">
                        {task.title}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className="px-2 py-1 rounded-[4px] border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#27272A] hover:bg-[#FAF8F3] text-[11px] font-semibold text-[#78716C] dark:text-[#A1A1AA] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Hoàn tác"
                    >
                      <RotateCcw size={11} strokeWidth={2.4} />
                      <span>Hoàn tác</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. FOOTER QUICK JUMP: CHUYỂN NHANH ĐẾN LỊCH HẠN ĐỊNH */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => {
            if (onNavigateTab) {
              onNavigateTab("deadlines");
            }
          }}
          className="w-full py-2.5 px-3.5 rounded-[6px] border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#27272A] hover:bg-[#FAF8F3] dark:hover:bg-[#3F3F46] text-xs font-semibold text-[#1C1917] dark:text-[#FAFAFA] flex items-center justify-between shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar size={14} strokeWidth={2.2} className="text-[#78716C] dark:text-[#A1A1AA]" />
            <span>Mở Lịch Quản lý Hạn định</span>
          </div>
          <ChevronRight size={14} strokeWidth={2.4} className="text-[#78716C] dark:text-[#A1A1AA]" />
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