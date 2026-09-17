// ==========================================
// VIEW: MobileNotificationsView (Notification Feed & Alerts)
// ==========================================

import React, { useState, useMemo, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  ArrowRight,
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
import { SketchTabs } from "../../components/layout/SketchTabs";

export interface MobileNotificationsViewProps {
  onNavigateTab?: (tab: TabKey | string, target?: NavigationTarget) => void;
}

type NotificationFilterTab = "all" | "overdue" | "today";

export const MobileNotificationsView: React.FC<MobileNotificationsViewProps> = ({
  onNavigateTab,
}) => {
  // === PHẦN 1: STORE & LOCAL STATES ===
  const { tasks, openTaskDetail, setActiveTaskSubTab } = useAppStore();
  const [now, setNow] = useState(() => Date.now());
  const [activeFilter, setActiveFilter] = useState<NotificationFilterTab>("all");

  const todayStr = getLocalTodayStr(new Date());

  // Cập nhật đồng hồ định kỳ mỗi 30s
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // === PHẦN 2: TÍNH TOÁN DANH SÁCH DỮ LIỆU THÔNG BÁO ===
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

  const totalAlerts = overdueTasks.length + todayDueTasks.length;

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

  // Điều hướng mở chi tiết task
  const handleOpenTask = (task: TaskDto) => {
    openTaskDetail(task.id);
  };

  // Điều hướng sang tab Hạn định để làm việc/dời lịch
  const handleNavigateToDeadlines = () => {
    setActiveTaskSubTab("deadlines");
    if (onNavigateTab) {
      onNavigateTab("deadlines");
    }
  };

  // === PHẦN 3: GIAO DIỆN CHÍNH (NOTIFICATION FEED) ===
  return (
    <div className="w-full space-y-2.5 pb-16 select-none animate-in fade-in duration-150">
      {/* 1. THANH PHÂN LOẠI THÔNG BÁO (SKETCH TABS SIÊU GỌN) */}
      <SketchTabs
        ariaLabel="Bộ lọc thông báo"
        size="sm"
        className="w-full flex justify-center [&>button]:min-h-[34px] [&>button]:flex-1 [&>button]:py-1"
        value={activeFilter}
        onChange={(val) => setActiveFilter(val as NotificationFilterTab)}
        items={[
          {
            key: "all",
            label: "Tất cả",
            icon: <Bell size={12} strokeWidth={2.2} />,
            badge:
              totalAlerts > 0 ? (
                <span className="min-w-[16px] rounded bg-black/[0.08] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] px-1 py-0.25 text-center font-mono text-[9.5px] leading-none font-bold">
                  {totalAlerts}
                </span>
              ) : undefined,
          },
          {
            key: "overdue",
            label: "Quá hạn",
            icon: <AlertTriangle size={12} strokeWidth={2.2} />,
            badge:
              overdueTasks.length > 0 ? (
                <span className="min-w-[16px] rounded bg-black/[0.08] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] px-1 py-0.25 text-center font-mono text-[9.5px] leading-none font-bold">
                  {overdueTasks.length}
                </span>
              ) : undefined,
          },
          {
            key: "today",
            label: "Hôm nay",
            icon: <Clock size={12} strokeWidth={2.2} />,
            badge:
              todayDueTasks.length > 0 ? (
                <span className="min-w-[16px] rounded bg-black/[0.08] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] px-1 py-0.25 text-center font-mono text-[9.5px] leading-none font-bold">
                  {todayDueTasks.length}
                </span>
              ) : undefined,
          },
        ]}
      />

      {/* 2. THANH NHẮC CHUYỂN HẠN ĐỊNH GỌN GÀNG */}
      {totalAlerts > 0 && (
        <div className="rounded-xl border border-[#E5E5EA] dark:border-black bg-white dark:bg-[#1C1C1E] px-3 py-1.5 shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar size={13} strokeWidth={2.2} className="text-[#8E8E93] shrink-0" />
            <span className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] truncate">
              Dời lịch & xử lý công việc tại Hạn định
            </span>
          </div>

          <button
            type="button"
            onClick={handleNavigateToDeadlines}
            className="shrink-0 px-2 py-0.5 rounded-lg bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-[11px] font-bold active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <span>Mở</span>
            <ArrowRight size={11} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* 3. DANH SÁCH BẢN TIN THÔNG BÁO */}
      <div className="space-y-2.5">
        {/* Trường hợp: Không có thông báo nào */}
        {totalAlerts === 0 && (
          <div className="rounded-xl border border-dashed border-[#E5E5EA] dark:border-black bg-white/60 dark:bg-[#1C1C1E]/60 py-8 px-4 text-center space-y-1.5">
            <div className="w-9 h-9 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] flex items-center justify-center mx-auto">
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
        )}

        {/* SECTION 1: THÔNG BÁO VIỆC QUÁ HẠN */}
        {(activeFilter === "all" || activeFilter === "overdue") && overdueGroups.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5 text-[11px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              <span className="flex items-center gap-1">
                <AlertTriangle size={12} strokeWidth={2.2} className="text-[#FF3B30] dark:text-[#FF453A]" />
                <span>Quá hạn ({overdueTasks.length})</span>
              </span>
            </div>

            {overdueGroups.map((group) => (
              <div key={group.dateStr} className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-medium text-[#8E8E93] dark:text-[#AEAEC2] px-0.5">
                  <span>Hạn: {formatFullDate(group.dateStr)}</span>
                  <span className="font-mono">{group.tasks.length}</span>
                </div>

                {group.tasks.map((task) => (
                  <div
                    key={`overdue-${task.id}`}
                    onClick={() => handleOpenTask(task)}
                    className="rounded-xl border border-[#E5E5EA] dark:border-black bg-white dark:bg-[#1C1C1E] p-2.5 shadow-2xs hover:border-[#D1D1D6] dark:hover:border-zinc-800 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {/* Icon Badge Mini */}
                      <div className="w-6 h-6 rounded-md bg-rose-500/10 text-[#FF3B30] dark:text-[#FF453A] flex items-center justify-center shrink-0">
                        <AlertTriangle size={12} strokeWidth={2.2} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate leading-snug group-hover:opacity-80 transition-opacity">
                          {task.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#8E8E93] dark:text-[#AEAEC2] mt-0.5">
                          <span className="font-medium text-[#FF3B30] dark:text-[#FF453A]">
                            Cần dời lịch
                          </span>
                          {getTaskEffectiveTime(task) && (
                            <span className="font-mono">
                              • {getTaskEffectiveTime(task)}
                            </span>
                          )}
                          {task.tag && (
                            <span>#{task.tag}</span>
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

        {/* SECTION 2: THÔNG BÁO VIỆC ĐẾN HẠN HÔM NAY */}
        {(activeFilter === "all" || activeFilter === "today") && todayDueTasks.length > 0 && (
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center justify-between px-0.5 text-[11px] font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              <span className="flex items-center gap-1">
                <Clock size={12} strokeWidth={2.2} className="text-blue-500" />
                <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
              </span>
            </div>

            <div className="space-y-1">
              {todayDueTasks.map((task) => (
                <div
                  key={`today-${task.id}`}
                  onClick={() => handleOpenTask(task)}
                  className="rounded-xl border border-[#E5E5EA] dark:border-black bg-white dark:bg-[#1C1C1E] p-2.5 shadow-2xs hover:border-[#D1D1D6] dark:hover:border-zinc-800 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Icon Badge Mini */}
                    <div className="w-6 h-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Clock size={12} strokeWidth={2.2} />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] truncate leading-snug group-hover:opacity-80 transition-opacity">
                        {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#8E8E93] dark:text-[#AEAEC2] mt-0.5">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          Hôm nay
                        </span>
                        {getTaskEffectiveTime(task) ? (
                          <span className="font-mono">
                            • {getTaskEffectiveTime(task)}
                          </span>
                        ) : (
                          <span>• Trong ngày</span>
                        )}
                        {task.tag && (
                          <span>#{task.tag}</span>
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

        {/* Empty filter sub-states */}
        {activeFilter === "overdue" && overdueTasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E5E5EA] dark:border-black bg-white/60 dark:bg-[#1C1C1E]/60 py-6 px-3 text-center space-y-0.5">
            <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              Không có việc quá hạn
            </p>
            <p className="text-[10px] text-[#8E8E93] dark:text-[#AEAEC2]">
              Tất cả hạn chót đã được xử lý tốt.
            </p>
          </div>
        )}

        {activeFilter === "today" && todayDueTasks.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E5E5EA] dark:border-black bg-white/60 dark:bg-[#1C1C1E]/60 py-6 px-3 text-center space-y-0.5">
            <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              Không có việc đến hạn hôm nay
            </p>
            <p className="text-[10px] text-[#8E8E93] dark:text-[#AEAEC2]">
              Các việc hôm nay đã hoàn tất hoặc không có hạn.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};