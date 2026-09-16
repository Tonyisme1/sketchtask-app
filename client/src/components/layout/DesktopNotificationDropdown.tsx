import React, { useRef, useEffect, useMemo, useState } from "react";
import { Bell, Settings, AlertTriangle, Clock, Check } from "lucide-react";
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
// COMPONENT: DesktopNotificationDropdown (Popover chuẩn phong cách YouTube Desktop)
// ==========================================

interface DesktopNotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabKey, target?: NavigationTarget) => void;
  onSelectTask?: (task: TaskDto) => void;
}

export const DesktopNotificationDropdown: React.FC<DesktopNotificationDropdownProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectTask,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { tasks, toggleTask } = useAppStore();
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
      className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl shadow-2xl z-50 overflow-hidden select-none flex flex-col max-h-[520px] animate-in fade-in duration-150"
    >
      {/* 1. Header Bar: Tiêu đề + Nút Cài Đặt */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight">
            Thông báo
          </h3>
          {totalAlerts > 0 && (
            <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#FF3B30] text-white">
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
      <div className="flex-1 overflow-y-auto max-h-[440px] divide-y divide-[#E5E5EA] dark:divide-[#2C2C2E]/60">
        {totalAlerts === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mb-3 text-[#8E8E93]">
              <Bell size={28} strokeWidth={1.8} />
            </div>
            <h4 className="text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] mb-1">
              Không có thông báo mới
            </h4>
            <p className="text-xs text-[#8E8E93] leading-relaxed max-w-[250px]">
              Nhắc nhở công việc và hạn định sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {/* Việc quá hạn */}
            {overdueGroups.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-[#FF3B30]">
                  <AlertTriangle size={12} className="text-[#FF3B30]" />
                  <span>Quá hạn ({overdueTasks.length})</span>
                </div>
                {overdueGroups.map((group) => (
                  <div key={group.dateStr} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-mono text-[#8E8E93]">
                      <span>{formatFullDate(group.dateStr)}</span>
                      <span>{group.tasks.length} việc</span>
                    </div>
                    {group.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          if (onSelectTask) onSelectTask(task);
                          onNavigateTab("today", { taskId: task.id, date: getTaskEffectiveDate(task) });
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] flex items-center justify-between gap-2 cursor-pointer transition-all"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate">{task.title}</p>
                          <p className="text-[10px] text-[#8E8E93] font-mono mt-0.5">
                            {getTaskTemporalState(task) === "pastScheduled" ? "Lịch hẹn đã qua" : "Hạn quá hạn"}
                            {getTaskEffectiveTime(task) ? ` · ${getTaskEffectiveTime(task)}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTask(task.id);
                          }}
                          className="w-7 h-7 rounded-lg bg-white dark:bg-[#2C2C2E] shadow-xs hover:bg-[#34C759] hover:text-white dark:hover:bg-[#34C759] flex items-center justify-center text-[#8E8E93] transition-colors shrink-0"
                          title="Đánh dấu hoàn thành"
                        >
                          <Check size={13} strokeWidth={2.4} />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Việc hôm nay */}
            {todayDueTasks.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-[#007AFF]">
                  <Clock size={12} className="text-[#007AFF]" />
                  <span>Cần làm hôm nay ({todayDueTasks.length})</span>
                </div>
                {todayDueTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (onSelectTask) onSelectTask(task);
                      onNavigateTab("today", { taskId: task.id, date: getTaskEffectiveDate(task) });
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.09] flex items-center justify-between gap-2 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate">{task.title}</p>
                      <p className="text-[10px] text-[#8E8E93] font-mono mt-0.5">
                        {getTaskEffectiveTime(task) || "Trong ngày hôm nay"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className="w-7 h-7 rounded-lg bg-white dark:bg-[#2C2C2E] shadow-xs hover:bg-[#34C759] hover:text-white dark:hover:bg-[#34C759] flex items-center justify-center text-[#8E8E93] transition-colors shrink-0"
                      title="Đánh dấu hoàn thành"
                    >
                      <Check size={13} strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* 3. Footer: Xem tất cả */}
      {totalAlerts > 0 && (
        <div className="p-2 border-t border-[#E5E5EA] dark:border-[#2C2C2E] text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab("today");
            }}
            className="w-full py-2 text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] hover:bg-[#007AFF]/10 rounded-xl transition-all"
          >
            Mở bảng công việc hôm nay ➔
          </button>
        </div>
      )}
    </div>
  );
};
