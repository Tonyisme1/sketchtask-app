import React, { useRef, useEffect, useMemo } from "react";
import { Bell, Settings, AlertTriangle, Clock, Flame, Check } from "lucide-react";
import { useAppStore } from "../../stores/appStore";
import { NavigationTarget, TabKey, TaskDto } from "../../types";
import { formatFullDate, getLocalTodayStr } from "../../utils/date";
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
  const { tasks, habits, toggleTask, toggleHabitDay } = useAppStore();
  const todayStr = getLocalTodayStr(new Date());

  // 1. Quá hạn
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
      className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-32px)] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[8px] shadow-[4px_4px_0px_#262626] z-50 overflow-hidden select-none flex flex-col max-h-[520px] animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* 1. Header Bar: Tiêu đề + Nút Cài Đặt */}
      <div className="flex items-center justify-between px-4 py-3 border-b-[1.5px] border-[#262626] bg-[#FFFDF8]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-[#1C1917] tracking-tight">
            Thông báo
          </h3>
          {totalAlerts > 0 && (
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-[3px] bg-[#1C1917] text-white border border-[#262626]">
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
          className="p-1 rounded-[4px] hover:bg-[#FAF8F3] border border-transparent hover:border-[#262626] text-[#57534E] hover:text-[#1C1917] transition-all cursor-pointer"
          title="Cài đặt thông báo"
          aria-label="Cài đặt thông báo"
        >
          <Settings size={16} strokeWidth={2.2} />
        </button>
      </div>

      {/* 2. Nội dung danh sách thông báo hoặc Empty State */}
      <div className="flex-1 overflow-y-auto max-h-[440px] divide-y divide-[#262626]/10">
        {totalAlerts === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[#FAF8F3] border-[1.5px] border-[#262626]/20 flex items-center justify-center mb-4 text-[#A8A29E]">
              <Bell size={32} strokeWidth={1.6} />
            </div>
            <h4 className="text-sm font-bold text-[#1C1917] mb-1">
              Thông báo của bạn hiển thị ở đây
            </h4>
            <p className="text-xs text-[#78716C] leading-relaxed max-w-[250px]">
              Nhắc nhở công việc, hạn định và thói quen hàng ngày sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-3">
            {/* Việc quá hạn */}
            {overdueGroups.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-black uppercase text-[#1C1917]">
                  <AlertTriangle size={12} className="text-[#1C1917]" />
                  <span>Quá hạn ({overdueTasks.length})</span>
                </div>
                {overdueGroups.map((group) => (
                  <div key={group.dateStr} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-0.5 text-[10px] font-mono font-bold text-[#78716C]">
                      <span>{formatFullDate(group.dateStr)}</span>
                      <span>{group.tasks.length} việc</span>
                    </div>
                    {group.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (onSelectTask) onSelectTask(task);
                      onNavigateTab("tasks", { taskId: task.id, date: getTaskEffectiveDate(task) });
                      onClose();
                    }}
                    className="p-2.5 rounded-[6px] bg-[#FAF8F3] hover:bg-[#F5F5F4] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1C1917] truncate">{task.title}</p>
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
                      className="w-6 h-6 rounded-[3px] bg-white hover:bg-[#FAF8F3] border border-[#262626] flex items-center justify-center text-[#1C1917] shrink-0"
                      title="Đánh dấu hoàn thành"
                    >
                      <Check size={12} strokeWidth={2.4} />
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
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-black uppercase text-[#1C1917]">
                  <Clock size={12} className="text-[#1C1917]" />
                  <span>Cần làm hôm nay ({todayDueTasks.length})</span>
                </div>
                {todayDueTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (onSelectTask) onSelectTask(task);
                      onNavigateTab("tasks", { taskId: task.id, date: getTaskEffectiveDate(task) });
                      onClose();
                    }}
                    className="p-2.5 rounded-[6px] bg-white hover:bg-[#FAF8F3] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1C1917] truncate">{task.title}</p>
                      <p className="text-[10px] text-[#78716C] font-mono mt-0.5">
                        {getTaskEffectiveTime(task) || "Trong ngày hôm nay"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(task.id);
                      }}
                      className="w-6 h-6 rounded-[3px] bg-white hover:bg-[#FAF8F3] border border-[#262626] flex items-center justify-center text-[#1C1917] shrink-0"
                      title="Đánh dấu hoàn thành"
                    >
                      <Check size={12} strokeWidth={2.4} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Thói quen */}
            {pendingHabits.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono font-black uppercase text-[#1C1917]">
                  <Flame size={12} className="text-[#1C1917]" />
                  <span>Thói quen chưa tích ({pendingHabits.length})</span>
                </div>
                {pendingHabits.slice(0, 3).map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => {
                      onNavigateTab("today");
                      onClose();
                    }}
                    className="p-2 rounded-[6px] bg-[#FAF8F3] hover:bg-[#F5F5F4] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-between gap-2 cursor-pointer transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#1C1917] truncate">{habit.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleHabitDay(habit.id, todayStr);
                      }}
                      className="px-2 py-0.5 rounded-[3px] bg-[#1C1917] hover:bg-[#262626] text-white text-[10px] font-bold border border-[#262626] shrink-0"
                    >
                      Tích
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
        <div className="p-2 border-t border-[#262626]/20 bg-[#FAF8F3] text-center">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateTab("today");
            }}
            className="w-full py-1.5 text-xs font-bold text-[#1C1917] hover:bg-white rounded-[4px] transition-all border border-[#262626]/30"
          >
            Mở bảng công việc hôm nay ➔
          </button>
        </div>
      )}
    </div>
  );
};
