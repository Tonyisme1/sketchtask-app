import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { NavigationTarget, TabKey, TaskDto } from "../../../types";
import { formatFullDate } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  isTaskDueToday,
} from "../../../utils/taskSemantics";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { registerBackHandler } from "../../../utils/backNavigation";
import { HandDrawnCheckbox } from "../core/HandDrawnCheckbox";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: TabKey, target?: NavigationTarget) => void;
  onSelectTask?: (task: TaskDto) => void;
}

type NotificationFilter = "all" | "overdue" | "today";

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectTask,
}) => {
  const { tasks, toggleTask } = useAppStore();
  const [now, setNow] = useState(() => Date.now());
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useScrollLock(isVisible, { mobileStrategy: "overflow" });

  // Đăng ký phím Back trên mobile để đóng drawer trước khi thoát trang
  useEffect(() => {
    if (!isVisible) return;
    return registerBackHandler(() => {
      onCloseRef.current();
      return true;
    });
  }, [isVisible]);

  // Cập nhật mốc thời gian định kỳ mỗi 30s
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // Điều khiển animation đóng/mở mượt mà
  useEffect(() => {
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
    }, 200);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, isVisible]);

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

  // Gom nhóm việc quá hạn theo ngày
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

  const totalAlerts = overdueTasks.length + todayDueTasks.length;

  const handleTaskClick = (task: TaskDto) => {
    if (onSelectTask) {
      onSelectTask(task);
    } else if (onNavigateTab) {
      onNavigateTab("tasks", {
        taskId: task.id,
        date: getTaskEffectiveDate(task),
      });
    }
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs select-none transition-opacity duration-200 ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg bg-[#FAF8F3] dark:bg-[#27272A] rounded-t-[22px] sm:rounded-[8px] border-[1.5px] border-[#262626] dark:border-[#52525B] shadow-[4px_4px_0px_#262626] max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden transition-all duration-200 ${
          isClosing
            ? "translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
            : "translate-y-0 sm:scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1.2 rounded-full bg-[#262626]/30 dark:bg-white/30 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* 1. Header */}
        <div className="px-4.5 sm:px-5 py-3 border-b border-[#262626]/20 dark:border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] border-[1.5px] border-[#262626] bg-[#FEF08A] text-[#1C1917] flex items-center justify-center shadow-[1px_1px_0px_#262626]">
              <Bell size={15} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-[#1C1917] dark:text-[#FAFAFA] leading-none">
                  Thông báo
                </h2>
                {totalAlerts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-[4px] border border-[#FDA4AF] bg-[#FECDD3] text-[#9F1239] font-mono text-[10px] font-bold leading-none">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#A1A1AA] mt-0.5">
                Nhắc nhở công việc & hạn định
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[4px] border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#18181B] text-[#78716C] hover:text-[#1C1917] dark:hover:text-white flex items-center justify-center shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>

        {/* 2. Segmented Filter Bar (Tầng phân loại trực quan) */}
        {totalAlerts > 0 && (
          <div className="px-4.5 sm:px-5 pt-3 pb-1 shrink-0">
            <div className="grid grid-cols-3 gap-1 border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#18181B] p-1 rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`py-1.5 px-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                  filter === "all"
                    ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] shadow-[1px_1px_0px_#262626] dark:shadow-none"
                    : "text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917]"
                }`}
              >
                <span>Tất cả</span>
                <span className="font-mono text-[10px] opacity-80">({totalAlerts})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("overdue")}
                className={`py-1.5 px-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                  filter === "overdue"
                    ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] shadow-[1px_1px_0px_#262626] dark:shadow-none"
                    : "text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917]"
                }`}
              >
                <AlertTriangle size={12} strokeWidth={2.4} className="text-[#BE123C] dark:text-rose-400" />
                <span>Quá hạn</span>
                <span className="font-mono text-[10px] opacity-80">({overdueTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("today")}
                className={`py-1.5 px-2 rounded-[4px] text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] ${
                  filter === "today"
                    ? "bg-[#1C1917] dark:bg-[#FAFAFA] text-white dark:text-[#18181B] shadow-[1px_1px_0px_#262626] dark:shadow-none"
                    : "text-[#78716C] dark:text-[#A1A1AA] hover:text-[#1C1917]"
                }`}
              >
                <Clock size={12} strokeWidth={2.4} className="text-[#92400E] dark:text-[#FCD34D]" />
                <span>Hôm nay</span>
                <span className="font-mono text-[10px] opacity-80">({todayDueTasks.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Task List Content */}
        <div className="flex-1 overflow-y-auto px-4.5 sm:px-5 py-3 space-y-4 min-h-0">
          {totalAlerts === 0 ? (
            <div className="text-center py-10 px-4 space-y-2.5 border-[1.5px] border-dashed border-[#262626]/30 dark:border-white/20 rounded-[6px] bg-white dark:bg-[#18181B] shadow-[2px_2px_0px_#262626]">
              <div className="w-10 h-10 rounded-[6px] border-[1.5px] border-[#262626] bg-[#FAF8F3] dark:bg-[#27272A] text-[#1C1917] dark:text-[#FAFAFA] flex items-center justify-center mx-auto shadow-[1.5px_1.5px_0px_#262626]">
                <CheckCircle2 size={20} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                  Không có thông báo mới
                </p>
                <p className="text-xs text-[#78716C] dark:text-[#A1A1AA] max-w-xs mx-auto">
                  Bạn đã xử lý hết mọi việc quá hạn và hôm nay. Thật tuyệt vời!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {(filter === "all" || filter === "overdue") && overdueGroups.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20 dark:border-white/10 text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={13} strokeWidth={2.4} className="text-[#BE123C] dark:text-rose-400" />
                      <span>Việc quá hạn ({overdueTasks.length})</span>
                    </span>
                  </div>

                  {overdueGroups.map((group) => (
                    <div key={group.dateStr} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#78716C] dark:text-[#A1A1AA] px-0.5">
                        <span>{formatFullDate(group.dateStr)}</span>
                        <span className="font-mono text-[10px]">{group.tasks.length} việc</span>
                      </div>

                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#18181B] rounded-[6px] p-3 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                              <HandDrawnCheckbox
                                checked={Boolean(task.completed)}
                                onChange={() => toggleTask(task.id)}
                                size="sm"
                              />
                            </div>
                            <div className="min-w-0 flex-1 space-y-1">
                              <p className="text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#FAFAFA] truncate group-hover:underline">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5">
                                <span className="border border-[#FDA4AF] bg-[#FECDD3] text-[#9F1239] rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold font-sans">
                                  Quá hạn
                                </span>
                                {getTaskEffectiveTime(task) && (
                                  <span className="border border-[#D4CEBF] dark:border-[#52525B] bg-[#FAF8F3] dark:bg-[#27272A] text-[#78716C] dark:text-[#A1A1AA] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px]">
                                    {getTaskEffectiveTime(task)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Today Due Section */}
              {(filter === "all" || filter === "today") && todayDueTasks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20 dark:border-white/10 text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={2.4} className="text-[#92400E] dark:text-[#FCD34D]" />
                      <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {todayDueTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="border-[1.5px] border-[#262626] dark:border-[#52525B] bg-white dark:bg-[#18181B] rounded-[6px] p-3 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                            <HandDrawnCheckbox
                              checked={Boolean(task.completed)}
                              onChange={() => toggleTask(task.id)}
                              size="sm"
                            />
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs sm:text-sm font-semibold text-[#1C1917] dark:text-[#FAFAFA] truncate group-hover:underline">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <span className="border border-[#262626]/20 bg-[#FEF08A] text-[#1C1917] rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold font-sans">
                                Hôm nay
                              </span>
                              {getTaskEffectiveTime(task) && (
                                <span className="border border-[#D4CEBF] dark:border-[#52525B] bg-[#FAF8F3] dark:bg-[#27272A] text-[#78716C] dark:text-[#A1A1AA] rounded-[4px] px-1.5 py-0.5 font-mono text-[10px]">
                                  {getTaskEffectiveTime(task)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Empty States */}
              {filter === "overdue" && overdueTasks.length === 0 && (
                <div className="border-[1.5px] border-dashed border-[#262626]/30 dark:border-white/20 rounded-[6px] bg-white dark:bg-[#18181B] text-center py-8 space-y-1.5 shadow-[2px_2px_0px_#262626]">
                  <p className="text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                    Không có công việc nào quá hạn
                  </p>
                  <p className="text-[11px] text-[#78716C] dark:text-[#A1A1AA]">
                    Bạn đã hoàn thành tốt các hạn chót trước đó.
                  </p>
                </div>
              )}

              {filter === "today" && todayDueTasks.length === 0 && (
                <div className="border-[1.5px] border-dashed border-[#262626]/30 dark:border-white/20 rounded-[6px] bg-white dark:bg-[#18181B] text-center py-8 space-y-1.5 shadow-[2px_2px_0px_#262626]">
                  <p className="text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">
                    Không có việc nào đến hạn hôm nay
                  </p>
                  <p className="text-[11px] text-[#78716C] dark:text-[#A1A1AA]">
                    Tất cả công việc trong ngày đã được giải quyết.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer Quick Action */}
        {totalAlerts > 0 && (
          <div className="px-4.5 sm:px-5 py-2.5 bg-white dark:bg-[#18181B] border-t border-[#262626]/20 dark:border-white/10 flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold text-[#78716C] dark:text-[#A1A1AA]">
              Tổng: <strong className="text-[#1C1917] dark:text-white font-mono">{totalAlerts} việc</strong>
            </span>

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onNavigateTab) {
                  onNavigateTab("deadlines");
                }
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1C1917] dark:text-white hover:underline cursor-pointer"
            >
              <span>Xem Hạn định</span>
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
