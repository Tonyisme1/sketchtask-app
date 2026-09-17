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
  onNavigateTab?: (tab: TabKey | string, target?: NavigationTarget) => void;
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
        className={`relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-[24px] sm:rounded-2xl border border-[#E5E5EA] dark:border-black shadow-2xl max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden transition-all duration-200 ${
          isClosing
            ? "translate-y-full sm:translate-y-4 sm:scale-95 opacity-0"
            : "translate-y-0 sm:scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Grab Handle */}
        <div className="w-10 h-1.2 rounded-full bg-black/20 dark:bg-white/20 mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* 1. Header */}
        <div className="px-5 py-3.5 border-b border-[#E5E5EA] dark:border-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center justify-center">
              <Bell size={16} strokeWidth={2.2} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-[#1C1C1E] dark:text-[#F2F2F7] leading-none">
                  Thông báo
                </h2>
                {totalAlerts > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/20 text-[#1C1C1E] dark:text-white font-mono text-[10px] font-bold leading-none">
                    {totalAlerts}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] mt-0.5">
                Nhắc nhở công việc & hạn định
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-black/[0.04] dark:bg-white/[0.08] hover:bg-black/[0.08] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white flex items-center justify-center active:scale-95 transition-all cursor-pointer"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* 2. Segmented Filter Bar */}
        {totalAlerts > 0 && (
          <div className="px-5 pt-3 pb-1 shrink-0">
            <div className="grid grid-cols-3 gap-1 bg-black/[0.04] dark:bg-white/[0.06] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  filter === "all"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
                    : "text-[#8E8E93] dark:text-[#AEAEC2] hover:text-[#1C1C1E]"
                }`}
              >
                <span>Tất cả</span>
                <span className="font-mono text-[10px] opacity-80">({totalAlerts})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("overdue")}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  filter === "overdue"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
                    : "text-[#8E8E93] dark:text-[#AEAEC2] hover:text-[#1C1C1E]"
                }`}
              >
                <AlertTriangle size={12} strokeWidth={2.2} />
                <span>Quá hạn</span>
                <span className="font-mono text-[10px] opacity-80">({overdueTasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setFilter("today")}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 ${
                  filter === "today"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs font-bold"
                    : "text-[#8E8E93] dark:text-[#AEAEC2] hover:text-[#1C1C1E]"
                }`}
              >
                <Clock size={12} strokeWidth={2.2} />
                <span>Hôm nay</span>
                <span className="font-mono text-[10px] opacity-80">({todayDueTasks.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Notification Feed Content */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3 min-h-0">
          {totalAlerts === 0 ? (
            <div className="text-center py-12 px-4 space-y-2 rounded-2xl border border-dashed border-[#E5E5EA] dark:border-black">
              <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] flex items-center justify-center mx-auto">
                <Bell size={24} strokeWidth={1.8} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  Không có thông báo mới
                </p>
                <p className="text-xs text-[#8E8E93] dark:text-[#AEAEC2] max-w-xs mx-auto">
                  Bạn đã xử lý hết mọi việc quá hạn và hôm nay. Thật tuyệt vời!
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {(filter === "all" || filter === "overdue") && overdueGroups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle size={13} strokeWidth={2.4} />
                      <span>Cảnh báo quá hạn ({overdueTasks.length})</span>
                    </span>
                  </div>

                  {overdueGroups.map((group) => (
                    <div key={group.dateStr} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#8E8E93] dark:text-[#AEAEC2] px-1">
                        <span>Hạn chót: {formatFullDate(group.dateStr)}</span>
                        <span className="font-mono text-[10px]">{group.tasks.length} thông báo</span>
                      </div>

                      {group.tasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => handleTaskClick(task)}
                          className="rounded-xl border border-[#E5E5EA] dark:border-black bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] p-3 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                              <AlertTriangle size={14} strokeWidth={2.2} />
                            </div>
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <p className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate group-hover:text-[#007AFF] transition-colors">
                                Quá hạn: {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
                                <span className="font-medium text-[10px]">
                                  Cần dời lịch
                                </span>
                                {getTaskEffectiveTime(task) && (
                                  <span className="font-mono text-[10px]">
                                    • {getTaskEffectiveTime(task)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <ChevronRight size={15} strokeWidth={2.2} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Today Due Section */}
              {(filter === "all" || filter === "today") && todayDueTasks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
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
                        className="rounded-xl border border-[#E5E5EA] dark:border-black bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.04] dark:hover:bg-white/[0.08] p-3 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                            <Clock size={14} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate group-hover:text-[#007AFF] transition-colors">
                              Đến hạn: {task.title}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
                              <span className="font-medium text-[10px]">
                                Hôm nay
                              </span>
                              {getTaskEffectiveTime(task) && (
                                <span className="font-mono text-[10px]">
                                  • {getTaskEffectiveTime(task)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={15} strokeWidth={2.2} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Filter Empty States */}
              {filter === "overdue" && overdueTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#E5E5EA] dark:border-black py-8 text-center space-y-1">
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    Không có công việc nào quá hạn
                  </p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
                    Bạn đã hoàn thành tốt các hạn chót trước đó.
                  </p>
                </div>
              )}

              {filter === "today" && todayDueTasks.length === 0 && (
                <div className="rounded-xl border border-dashed border-[#E5E5EA] dark:border-black py-8 text-center space-y-1">
                  <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                    Không có việc nào đến hạn hôm nay
                  </p>
                  <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
                    Tất cả công việc trong ngày đã được hoàn tất.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Footer Quick Action */}
        <div className="px-5 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-[#E5E5EA] dark:border-black flex items-center justify-between shrink-0">
          <span className="text-[11px] font-medium text-[#8E8E93] dark:text-[#AEAEC2]">
            Tổng: <strong className="text-[#1C1C1E] dark:text-white font-mono">{totalAlerts} thông báo</strong>
          </span>

          <button
            type="button"
            onClick={handleNavigateToDeadlines}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
          >
            <span>Quản lý Hạn định</span>
            <ArrowRight size={13} strokeWidth={2.4} />
          </button>
        </div>
      </div>
    </div>
  );
};

