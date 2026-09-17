import React, { useRef, useEffect, useMemo, useState } from "react";
import { Bell, Settings, AlertTriangle, Clock, ChevronRight, ArrowRight } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { NavigationTarget, TabKey, TaskDto } from "../../types";
import { formatFullDate } from "../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  isTaskDueToday,
} from "../../utils/taskSemantics";

// ==========================================
// COMPONENT: DesktopNotificationDropdown
// ==========================================

interface DesktopNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onSelectTask?: (task: TaskDto) => void;
}

export const DesktopNotificationDropdown: React.FC<DesktopNotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectTask,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { tasks, openTaskDetail, setActiveTaskSubTab } = useAppStore();
  const [now, setNow] = useState(() => Date.now());

  // Huy hiệu và nhóm thông báo phải tự cập nhật khi đồng hồ vượt qua hạn task.
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // 1. Quá hạn
  const overdueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const state = getTaskTemporalState(t);
      return state === "overdue" || state === "pastScheduled";
    });
  }, [tasks, now]);

  // 2. Việc đến hạn hôm nay
  const todayDueTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      if (!isTaskDueToday(t)) return false;
      const state = getTaskTemporalState(t);
      return state !== "overdue" && state !== "pastScheduled";
    });
  }, [tasks, now]);

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
    onNavigateTab("deadlines");
  };

  // Xử lý đóng khi click ra ngoài hoặc bấm Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#E5E5EA] dark:border-black rounded-2xl shadow-2xl z-50 overflow-hidden select-none flex flex-col max-h-[520px] animate-in fade-in duration-150"
    >
      {/* 1. Header Bar: Tiêu đề + Nút Cài Đặt */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA] dark:border-black">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight">
            Thông báo
          </h3>
          {totalAlerts > 0 && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-white/20 text-[#1C1C1E] dark:text-white">
              {totalAlerts}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onNavigateTab("settings");
          }}
          className="p-1.5 rounded-lg text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all cursor-pointer"
          title="Cài đặt thông báo"
          aria-label="Cài đặt thông báo"
        >
          <Settings size={15} strokeWidth={2.2} />
        </button>
      </div>

      {/* 2. Nội dung danh sách thông báo hoặc Empty State */}
      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {totalAlerts === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-3 text-[#8E8E93]">
              <Bell size={24} strokeWidth={1.8} />
            </div>
            <h4 className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
              Không có thông báo mới
            </h4>
            <p className="text-xs text-[#8E8E93] dark:text-[#AEAEC2] leading-relaxed max-w-[250px]">
              Tất cả công việc và hạn định của bạn đều đang đúng tiến độ.
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {/* Việc quá hạn */}
            {overdueGroups.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  <AlertTriangle size={13} strokeWidth={2.2} />
                  <span>Cảnh báo quá hạn ({overdueTasks.length})</span>
                </div>
                {overdueGroups.map((group) => (
                  <div key={group.dateStr} className="space-y-1">
                    <div className="flex items-center justify-between px-1 py-0.5 text-[10px] font-mono text-[#8E8E93] dark:text-[#AEAEC2]">
                      <span>{formatFullDate(group.dateStr)}</span>
                      <span>{group.tasks.length} thông báo</span>
                    </div>
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleTaskClick(task)}
                        className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-6 h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle size={12} strokeWidth={2.2} />
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate group-hover:text-[#007AFF] transition-colors">
                              Quá hạn: {task.title}
                            </p>
                            <p className="text-[10px] text-[#8E8E93] dark:text-[#AEAEC2] font-mono">
                              Hạn chót: {getTaskEffectiveTime(task) ? `${getTaskEffectiveTime(task)} · ` : ""}{formatFullDate(group.dateStr)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={14} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white shrink-0" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Việc hôm nay */}
            {todayDueTasks.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 px-1 py-0.5 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  <Clock size={13} strokeWidth={2.2} />
                  <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
                </div>
                {todayDueTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] flex items-center justify-between gap-2.5 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="w-6 h-6 rounded-lg bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-white flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={12} strokeWidth={2.2} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate group-hover:text-[#007AFF] transition-colors">
                          Đến hạn: {task.title}
                        </p>
                        <p className="text-[10px] text-[#8E8E93] dark:text-[#AEAEC2] font-mono">
                          {getTaskEffectiveTime(task) ? `Lúc ${getTaskEffectiveTime(task)} hôm nay` : "Trong ngày hôm nay"}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Footer: Chuyển sang không gian Hạn định để làm việc */}
      <div className="p-2.5 bg-black/[0.02] dark:bg-white/[0.02] border-t border-[#E5E5EA] dark:border-black text-center">
        <button
          type="button"
          onClick={handleNavigateToDeadlines}
          className="w-full py-2 px-3 text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Mở không gian Quản lý Hạn định</span>
          <ArrowRight size={13} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
};

