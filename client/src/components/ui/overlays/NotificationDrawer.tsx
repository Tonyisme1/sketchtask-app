import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Check,
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
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm select-none transition-opacity duration-200 ${
        isClosing ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-lg bg-[#FAF8F3] dark:bg-[#1C1C1E] rounded-t-[28px] sm:rounded-2xl border-t sm:border border-[#E5E5EA] dark:border-[#2C2C2E] shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden transition-all duration-200 ${
          isClosing
            ? "translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
            : "translate-y-0 sm:scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1.2 rounded-full bg-[#D1D1D6] dark:bg-[#3A3A3C] mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* 1. Header */}
        <div className="px-4.5 sm:px-5 py-3.5 border-b border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] flex items-center justify-center shadow-xs">
              <Bell size={16} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-[#1C1917] dark:text-[#F2F2F7] leading-none">
                  Thông báo
                </h2>
                {totalAlerts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold leading-none">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#78716C] dark:text-[#aeaeb2] mt-0.5">
                Nhắc nhở công việc & hạn định
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-[#8E8E93] hover:text-[#1C1917] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* 2. Segmented Filter Bar (Tầng phân loại trực quan) */}
        {totalAlerts > 0 && (
          <div className="px-4.5 sm:px-5 pt-3 pb-1 shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-[#F2F2F7] dark:bg-[#2C2C2E] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  filter === "all"
                    ? "bg-white dark:bg-[#1C1C1E] text-[#1C1917] dark:text-white shadow-xs"
                    : "text-[#78716C] dark:text-[#aeaeb2] hover:text-[#1C1917]"
                }`}
              >
                <span>Tất cả</span>
                <span className="font-mono text-[10px] opacity-75">({totalAlerts})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("overdue")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  filter === "overdue"
                    ? "bg-white dark:bg-[#1C1C1E] text-rose-600 dark:text-rose-400 shadow-xs"
                    : "text-[#78716C] dark:text-[#aeaeb2] hover:text-[#1C1917]"
                }`}
              >
                <AlertTriangle size={12} strokeWidth={2.4} className="text-rose-500" />
                <span>Quá hạn</span>
                <span className="font-mono text-[10px] opacity-75">({overdueTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("today")}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  filter === "today"
                    ? "bg-white dark:bg-[#1C1C1E] text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-[#78716C] dark:text-[#aeaeb2] hover:text-[#1C1917]"
                }`}
              >
                <Clock size={12} strokeWidth={2.4} className="text-amber-500" />
                <span>Hôm nay</span>
                <span className="font-mono text-[10px] opacity-75">({todayDueTasks.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Task List Content */}
        <div className="flex-1 overflow-y-auto px-4.5 sm:px-5 py-3 space-y-4 min-h-0">
          {totalAlerts === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 size={28} strokeWidth={2.2} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7]">
                  Không có thông báo mới
                </p>
                <p className="text-xs text-[#78716C] dark:text-[#aeaeb2] max-w-xs mx-auto">
                  Bạn đã xử lý hết mọi việc quá hạn và hôm nay. Thật tuyệt vời! 🎉
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {(filter === "all" || filter === "overdue") && overdueGroups.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={13} strokeWidth={2.4} />
                      <span>Việc quá hạn ({overdueTasks.length})</span>
                    </span>
                  </div>

                  {overdueGroups.map((group) => (
                    <div key={group.dateStr} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#78716C] dark:text-[#aeaeb2] px-1">
                        <span>{formatFullDate(group.dateStr)}</span>
                        <span className="font-mono text-[10px]">{group.tasks.length} việc</span>
                      </div>

                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="bg-white dark:bg-[#242426] border border-rose-200 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-700/60 rounded-xl p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-bold flex items-center gap-1">
                                <AlertTriangle size={10} strokeWidth={2.5} />
                                <span>Quá hạn</span>
                              </span>
                              {getTaskEffectiveTime(task) && (
                                <span className="font-mono text-[10px] text-[#78716C] dark:text-[#aeaeb2]">
                                  {getTaskEffectiveTime(task)}
                                </span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7] truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                              {task.title}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(task.id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#3A3A3C] bg-[#FAF8F3] dark:bg-[#2C2C2E] hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-xs font-bold text-[#1C1917] dark:text-white transition-all active:scale-90 flex items-center gap-1 shrink-0 cursor-pointer"
                            title="Đánh dấu hoàn thành"
                          >
                            <Check size={13} strokeWidth={2.4} />
                            <span>Xong</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Today Due Section */}
              {(filter === "all" || filter === "today") && todayDueTasks.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} strokeWidth={2.4} />
                      <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {todayDueTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="bg-white dark:bg-[#242426] border border-[#E5E5EA] dark:border-[#2C2C2E] hover:border-amber-400 dark:hover:border-amber-600/60 rounded-xl p-3 shadow-xs hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                              <Clock size={10} strokeWidth={2.5} />
                              <span>Hôm nay</span>
                            </span>
                            {getTaskEffectiveTime(task) && (
                              <span className="font-mono text-[10px] text-[#78716C] dark:text-[#aeaeb2]">
                                {getTaskEffectiveTime(task)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7] truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {task.title}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-[#E5E5EA] dark:border-[#3A3A3C] bg-[#FAF8F3] dark:bg-[#2C2C2E] hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-xs font-bold text-[#1C1917] dark:text-white transition-all active:scale-90 flex items-center gap-1 shrink-0 cursor-pointer"
                          title="Đánh dấu hoàn thành"
                        >
                          <Check size={13} strokeWidth={2.4} />
                          <span>Xong</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Empty States */}
              {filter === "overdue" && overdueTasks.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">
                    Không có công việc nào quá hạn
                  </p>
                  <p className="text-[11px] text-[#78716C] dark:text-[#aeaeb2]">
                    Bạn đã hoàn thành tốt các hạn chót trước đó.
                  </p>
                </div>
              )}

              {filter === "today" && todayDueTasks.length === 0 && (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">
                    Không có việc nào đến hạn hôm nay
                  </p>
                  <p className="text-[11px] text-[#78716C] dark:text-[#aeaeb2]">
                    Tất cả công việc trong ngày đã được giải quyết.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer Quick Action */}
        {totalAlerts > 0 && (
          <div className="px-4.5 sm:px-5 py-2.5 bg-white/60 dark:bg-[#1C1C1E]/60 border-t border-[#E5E5EA] dark:border-[#2C2C2E] flex items-center justify-between shrink-0">
            <span className="text-[11px] font-semibold text-[#78716C] dark:text-[#aeaeb2]">
              Tổng: <strong className="text-[#1C1917] dark:text-white">{totalAlerts} việc</strong>
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
