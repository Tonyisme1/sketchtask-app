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
    <div className="w-full space-y-3.5 pb-24 select-none animate-in fade-in duration-150">
      {/* 1. THANH PHÂN LOẠI THÔNG BÁO (SKETCH TABS) */}
      <SketchTabs
        ariaLabel="Bộ lọc thông báo"
        size="md"
        className="w-full flex justify-center [&>button]:min-h-[40px] [&>button]:flex-1"
        value={activeFilter}
        onChange={(val) => setActiveFilter(val as NotificationFilterTab)}
        items={[
          {
            key: "all",
            label: "Tất cả",
            icon: <Bell size={13} strokeWidth={2.2} />,
            badge:
              totalAlerts > 0 ? (
                <span className="min-w-[18px] rounded-md bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold">
                  {totalAlerts}
                </span>
              ) : undefined,
          },
          {
            key: "overdue",
            label: "Quá hạn",
            icon: <AlertTriangle size={13} strokeWidth={2.2} />,
            badge:
              overdueTasks.length > 0 ? (
                <span className="min-w-[18px] rounded-md bg-[#FF3B30] text-white px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold">
                  {overdueTasks.length}
                </span>
              ) : undefined,
          },
          {
            key: "today",
            label: "Hôm nay",
            icon: <Clock size={13} strokeWidth={2.2} />,
            badge:
              todayDueTasks.length > 0 ? (
                <span className="min-w-[18px] rounded-md bg-[#007AFF] text-white px-1.5 py-0.5 text-center font-mono text-[10px] leading-none font-semibold">
                  {todayDueTasks.length}
                </span>
              ) : undefined,
          },
        ]}
      />

      {/* 2. BANNER HƯỚNG DẪN LÀM VIỆC TẠI HẠN ĐỊNH (CALL TO ACTION) */}
      {totalAlerts > 0 && (
        <div className="rounded-2xl border border-[#E5E5EA] dark:border-black bg-white/80 dark:bg-[#1C1C1E]/80 p-3.5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Calendar size={16} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate">
                Cần dời lịch hoặc xử lý công việc?
              </p>
              <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] truncate">
                Làm việc trực tiếp tại không gian Hạn định
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNavigateToDeadlines}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <span>Hạn định</span>
            <ArrowRight size={13} strokeWidth={2.4} />
          </button>
        </div>
      )}

      {/* 3. DANH SÁCH BẢN TIN THÔNG BÁO */}
      <div className="space-y-3">
        {/* Trường hợp: Không có thông báo nào */}
        {totalAlerts === 0 && (
          <div className="rounded-2xl border border-dashed border-[#E5E5EA] dark:border-black bg-white/60 dark:bg-[#1C1C1E]/60 py-12 px-4 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] flex items-center justify-center mx-auto">
              <Bell size={24} strokeWidth={1.8} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
                Hộp thông báo sạch sẽ
              </p>
              <p className="text-xs text-[#8E8E93] dark:text-[#AEAEC2] max-w-xs mx-auto">
                Không có việc quá hạn hay cần gấp hôm nay. Mọi thứ đều đang đúng tiến độ!
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: THÔNG BÁO VIỆC QUÁ HẠN */}
        {(activeFilter === "all" || activeFilter === "overdue") && overdueGroups.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-[#FF3B30] dark:text-[#FF453A]">
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
                    key={`overdue-${task.id}`}
                    onClick={() => handleOpenTask(task)}
                    className="rounded-2xl border border-[#E5E5EA] dark:border-black bg-white dark:bg-[#1C1C1E] p-3.5 shadow-xs hover:border-[#D1D1D6] dark:hover:border-zinc-800 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icon Badge */}
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertTriangle size={15} strokeWidth={2.2} />
                      </div>

                      {/* Notification Content */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate leading-snug group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors">
                          Quá hạn: {task.title}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
                          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-semibold">
                            Cần dời lịch
                          </span>
                          {getTaskEffectiveTime(task) && (
                            <span className="font-mono text-[10px]">
                              lúc {getTaskEffectiveTime(task)}
                            </span>
                          )}
                          {task.tag && (
                            <span className="text-[#8E8E93]">#{task.tag}</span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <ChevronRight size={16} strokeWidth={2.2} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* SECTION 2: THÔNG BÁO VIỆC ĐẾN HẠN HÔM NAY */}
        {(activeFilter === "all" || activeFilter === "today") && todayDueTasks.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1 text-xs font-bold text-[#007AFF] dark:text-[#0A84FF]">
              <span className="flex items-center gap-1.5">
                <Clock size={13} strokeWidth={2.4} />
                <span>Đến hạn hôm nay ({todayDueTasks.length})</span>
              </span>
            </div>

            <div className="space-y-1.5">
              {todayDueTasks.map((task) => (
                <div
                  key={`today-${task.id}`}
                  onClick={() => handleOpenTask(task)}
                  className="rounded-2xl border border-[#E5E5EA] dark:border-black bg-white dark:bg-[#1C1C1E] p-3.5 shadow-xs hover:border-[#D1D1D6] dark:hover:border-zinc-800 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Icon Badge */}
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock size={15} strokeWidth={2.2} />
                    </div>

                    {/* Notification Content */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs sm:text-sm font-bold text-[#1C1C1E] dark:text-[#F2F2F7] truncate leading-snug group-hover:text-[#007AFF] dark:group-hover:text-[#0A84FF] transition-colors">
                        Đến hạn: {task.title}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
                        <span className="px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-semibold">
                          Hôm nay
                        </span>
                        {getTaskEffectiveTime(task) ? (
                          <span className="font-mono text-[10px]">
                            lúc {getTaskEffectiveTime(task)}
                          </span>
                        ) : (
                          <span className="text-[10px]">Trong ngày</span>
                        )}
                        {task.tag && (
                          <span className="text-[#8E8E93]">#{task.tag}</span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2] line-clamp-1">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={16} strokeWidth={2.2} className="text-[#C7C7CC] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty filter sub-states */}
        {activeFilter === "overdue" && overdueTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#E5E5EA] dark:border-black bg-white/60 dark:bg-[#1C1C1E]/60 py-8 px-4 text-center space-y-1">
            <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              Không có công việc nào quá hạn
            </p>
            <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
              Bạn đã hoàn thành tốt các hạn chót trước đó.
            </p>
          </div>
        )}

        {activeFilter === "today" && todayDueTasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[#E5E5EA] dark:border-black bg-white/60 dark:bg-[#1C1C1E]/60 py-8 px-4 text-center space-y-1">
            <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">
              Không có việc nào đến hạn hôm nay
            </p>
            <p className="text-[11px] text-[#8E8E93] dark:text-[#AEAEC2]">
              Tất cả công việc trong ngày đã được hoàn tất hoặc không có hạn hôm nay.
            </p>
          </div>
        )}
      </div>

      {/* 4. FOOTER QUICK JUMP: CHUYỂN NHANH ĐẾN LỊCH HẠN ĐỊNH */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleNavigateToDeadlines}
          className="w-full py-3 px-4 rounded-2xl border border-[#E5E5EA] dark:border-black bg-white dark:bg-[#1C1C1E] hover:bg-[#F2F2F7] dark:hover:bg-zinc-800 text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] flex items-center justify-between shadow-xs active:scale-[0.99] transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Calendar size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
            <span>Mở không gian Quản lý Hạn định để làm việc</span>
          </div>
          <ChevronRight size={15} strokeWidth={2.4} className="text-[#8E8E93]" />
        </button>
      </div>
    </div>
  );
};