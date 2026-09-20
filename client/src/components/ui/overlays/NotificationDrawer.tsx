import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
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
  const { tasks, openTaskDetail, setActiveTaskSubTab } = useAppStore();
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
    } else {
      openTaskDetail(task.id);
    }
    onClose();
  };

  const handleNavigateToDeadlines = () => {
    onClose();
    setActiveTaskSubTab("deadlines");
    if (onNavigateTab) {
      onNavigateTab("deadlines");
    }
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
        className={`relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[32px] sm:rounded-3xl border-none shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden transition-all duration-200 ${
          isClosing
            ? "translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
            : "translate-y-0 sm:scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* 1. Header */}
        <div className="px-4 py-3 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center justify-center">
              <Bell size={15} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7]">
                Thông báo
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={15} strokeWidth={2.2} />
          </button>
        </div>

        {/* 2. Filter Pills */}
        {totalAlerts > 0 && (
          <div className="px-4 py-2 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                  filter === "all"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
                    : "text-[#8E8E93] dark:text-[#AEAEC2] hover:text-[#1C1C1E]"
                }`}
              >
                <span>Tất cả</span>
                <span className="font-mono text-[9.5px] opacity-80">({totalAlerts})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("overdue")}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                  filter === "overdue"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
                    : "text-[#8E8E93] dark:text-[#AEAEC2] hover:text-[#1C1C1E]"
                }`}
              >
                <AlertTriangle size={11} strokeWidth={2.2} />
                <span>Quá hạn</span>
                <span className="font-mono text-[9.5px] opacity-80">({overdueTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("today")}
                className={`py-1.5 px-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95 ${
                  filter === "today"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
                    : "text-[#8E8E93] dark:text-[#AEAEC2] hover:text-[#1C1C1E]"
                }`}
              >
                <Clock size={11} strokeWidth={2.2} />
                <span>Hôm nay</span>
                <span className="font-mono text-[9.5px] opacity-80">({todayDueTasks.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Notification Feed Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 min-h-0">
          {totalAlerts === 0 ? (
            <div className="text-center py-8 px-3 space-y-2 rounded-3xl bg-black/[0.02] dark:bg-white/[0.03]">
              <div className="w-10 h-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] flex items-center justify-center mx-auto">
                <Bell size={18} strokeWidth={1.8} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  Không có thông báo mới
                </p>
                <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] max-w-xs mx-auto">
                  Mọi công việc đều đang đúng tiến độ!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {(filter === "all" || filter === "overdue") && overdueGroups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-0.5 text-[11px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={12} strokeWidth={2.2} className="text-[#FF3B30] dark:text-[#FF453A]" />
                      <span>Quá hạn ({overdueTasks.length})</span>
                    </span>
                  </div>

                  {overdueGroups.map((group) => (
                    <div key={group.dateStr} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-medium text-[#8E8E93] dark:text-[#AEAEC2] px-1">
                        <span>Hạn: {formatFullDate(group.dateStr)}</span>
                        <span className="font-mono">{group.tasks.length}</span>
                      </div>

                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="rounded-2xl border-none shadow-xs bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] p-3 transition-all cursor-pointer flex items-center justify-between gap-2.5 group active:scale-[0.99]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-7 h-7 rounded-full bg-rose-500/10 text-[#FF3B30] dark:text-[#FF453A] flex items-center justify-center shrink-0">
                              <AlertTriangle size={13} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate group-hover:opacity-80 transition-opacity">
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93] dark:text-[#AEAEC2] mt-0.5">
                                <span className="font-medium text-[#FF3B30] dark:text-[#FF453A]">
                                  Cần dời lịch
                                </span>
                                {getTaskEffectiveTime(task) && (
                                  <span className="font-mono">
                                    • {getTaskEffectiveTime(task)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={14} strokeWidth={2.2} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Today Due Section */}
              {(filter === "all" || filter === "today") && todayDueTasks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-0.5 text-[11px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} strokeWidth={2.2} className="text-blue-500" />
                      <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {todayDueTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="rounded-2xl border-none shadow-xs bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] p-3 transition-all cursor-pointer flex items-center justify-between gap-2.5 group active:scale-[0.99]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Clock size={13} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate group-hover:opacity-80 transition-opacity">
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93] dark:text-[#AEAEC2] mt-0.5">
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                Hôm nay
                              </span>
                              {getTaskEffectiveTime(task) && (
                                <span className="font-mono">
                                  • {getTaskEffectiveTime(task)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={14} strokeWidth={2.2} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Empty States */}
              {filter === "overdue" && overdueTasks.length === 0 && (
                <div className="rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] py-6 text-center space-y-0.5">
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    Không có việc quá hạn
                  </p>
                  <p className="text-[10px] text-[#8E8E93] dark:text-[#AEAEC2]">
                    Tất cả hạn chót đã được xử lý tốt.
                  </p>
                </div>
              )}

              {filter === "today" && todayDueTasks.length === 0 && (
                <div className="rounded-3xl bg-black/[0.02] dark:bg-white/[0.03] py-6 text-center space-y-0.5">
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    Không có việc đến hạn hôm nay
                  </p>
                  <p className="text-[10px] text-[#8E8E93] dark:text-[#AEAEC2]">
                    Tất cả công việc trong ngày đã được hoàn tất.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer Quick Action */}
        <div className="px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between shrink-0">
          <span className="text-[11px] font-medium text-[#8E8E93] dark:text-[#AEAEC2]">
            Tổng: <strong className="text-[#1C1917] dark:text-white font-mono">{totalAlerts}</strong>
          </span>

          <button
            type="button"
            onClick={handleNavigateToDeadlines}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <span>Quản lý Hạn định</span>
            <ArrowRight size={12} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};
