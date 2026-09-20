// ==========================================
// VIEW: MobileNotificationsView (Clean Flat Notification Center)
// ==========================================

import React, { useState, useMemo, useEffect } from "react";
import {
  Bell,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAppStore } from "../../stores";
import { NavigationTarget, TabKey, TaskDto } from "../../types";
import {
  getLocalTodayStr,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  isTaskDueToday,
} from "../../utils";
import { SketchTabs } from "../../components/layout/SketchTabs";

export interface MobileNotificationsViewProps {
  onNavigateTab?: (tab: TabKey | string, target?: NavigationTarget) => void;
}

type NotificationFilterTab = "all" | "overdue" | "today";

interface NotificationItem {
  task: TaskDto;
  type: "overdue" | "today";
  dateStr: string;
  timeStr?: string;
}

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

  // === PHẦN 2: TÍNH TOÁN DỮ LIỆU THÔNG BÁO ===
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

  // Flattened Notification Items sorted logically
  const notificationItems = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];

    if (activeFilter === "all" || activeFilter === "overdue") {
      for (const t of overdueTasks) {
        items.push({
          task: t,
          type: "overdue",
          dateStr: getTaskEffectiveDate(t) || "",
          timeStr: getTaskEffectiveTime(t),
        });
      }
    }

    if (activeFilter === "all" || activeFilter === "today") {
      for (const t of todayDueTasks) {
        items.push({
          task: t,
          type: "today",
          dateStr: getTaskEffectiveDate(t) || todayStr,
          timeStr: getTaskEffectiveTime(t),
        });
      }
    }

    // Sort: overdue first (oldest date first), then today tasks
    return items.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "overdue" ? -1 : 1;
      }
      return (a.dateStr + (a.timeStr || "99:99")).localeCompare(
        b.dateStr + (b.timeStr || "99:99")
      );
    });
  }, [overdueTasks, todayDueTasks, activeFilter, todayStr]);

  // Điều hướng mở chi tiết task
  const handleOpenTask = (task: TaskDto) => {
    openTaskDetail(task.id);
  };

  // Điều hướng sang tab Hạn định để dời lịch hàng loạt
  const handleNavigateToDeadlines = () => {
    setActiveTaskSubTab("deadlines");
    if (onNavigateTab) {
      onNavigateTab("deadlines");
    }
  };

  // Format ngày hiển thị ngắn gọn: 16/09 hoặc 16 Thg 9
  const formatShortDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // === PHẦN 3: GIAO DIỆN CHÍNH (FLAT NOTIFICATION CENTER) ===
  return (
    <div className="w-full space-y-3 pb-16 select-none animate-in fade-in duration-150">
      {/* 1. THANH TABS PHÂN LOẠI */}
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
                <span className="min-w-[16px] rounded-full bg-black/[0.08] dark:bg-white/[0.12] text-[#1C1C1E] dark:text-[#F2F2F7] px-1 py-0.25 text-center font-mono text-[9.5px] leading-none font-bold shadow-2xs">
                  {totalAlerts}
                </span>
              ) : undefined,
          },
          {
            key: "overdue",
            label: "Quá hạn",
            icon: <AlertTriangle size={12} strokeWidth={2.2} className="text-[#FF3B30] dark:text-[#FF453A]" />,
            badge:
              overdueTasks.length > 0 ? (
                <span className="min-w-[16px] rounded-full bg-rose-500/15 text-[#FF3B30] dark:text-[#FF453A] px-1 py-0.25 text-center font-mono text-[9.5px] leading-none font-bold shadow-2xs">
                  {overdueTasks.length}
                </span>
              ) : undefined,
          },
          {
            key: "today",
            label: "Hôm nay",
            icon: <Clock size={12} strokeWidth={2.2} className="text-blue-500" />,
            badge:
              todayDueTasks.length > 0 ? (
                <span className="min-w-[16px] rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 px-1 py-0.25 text-center font-mono text-[9.5px] leading-none font-bold shadow-2xs">
                  {todayDueTasks.length}
                </span>
              ) : undefined,
          },
        ]}
      />

      {/* 2. THANH CHUYỂN HẠN ĐỊNH GỌN NHẸ (NẾU CÓ VIỆC QUÁ HẠN) */}
      {overdueTasks.length > 0 && (
        <div
          onClick={handleNavigateToDeadlines}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border-none shadow-2xs active:bg-black/[0.06] dark:active:bg-white/[0.08] transition-colors cursor-pointer text-[11px]"
        >
          <div className="flex items-center gap-2 text-[#8E8E93] dark:text-[#AEAEC2] min-w-0">
            <AlertTriangle size={12} strokeWidth={2.2} className="text-[#FF3B30] dark:text-[#FF453A] shrink-0" />
            <span className="truncate">
              Có <strong className="text-[#1C1C1E] dark:text-[#F2F2F7] font-semibold">{overdueTasks.length} việc quá hạn</strong> cần dời lịch
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-[#1C1C1E] dark:text-white shrink-0 ml-2">
            <span>Dời ngay</span>
            <ArrowRight size={11} strokeWidth={2.4} />
          </div>
        </div>
      )}

      {/* 3. DANH SÁCH BẢN TIN PHẲNG (FLAT LIST) */}
      {notificationItems.length > 0 ? (
        <div className="rounded-3xl border-none bg-white dark:bg-[#1C1C1E] divide-y divide-black/[0.04] dark:divide-white/[0.06] shadow-sm overflow-hidden">
          {notificationItems.map(({ task, type, dateStr, timeStr }) => {
            const isOverdue = type === "overdue";

            return (
              <div
                key={`${type}-${task.id}`}
                onClick={() => handleOpenTask(task)}
                className="flex items-center justify-between gap-3 px-3.5 py-2.5 active:bg-black/[0.04] dark:active:bg-white/[0.06] transition-colors cursor-pointer group"
              >
                {/* Trạng thái chấm màu + Tiêu đề & Thông tin */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  {/* Chấm tròn chỉ thị nhỏ gọn */}
                  <div className="mt-1 shrink-0">
                    {isOverdue ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3B30] dark:bg-[#FF453A]" />
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full h-2 w-2 bg-blue-500" />
                    )}
                  </div>

                  {/* Nội dung task */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs sm:text-[13px] font-medium text-[#1C1C1E] dark:text-[#F2F2F7] truncate leading-tight group-hover:opacity-85 transition-opacity">
                      {task.title}
                    </p>

                    {/* Metadata 1 hàng duy nhất */}
                    <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[10.5px] text-[#8E8E93] dark:text-[#AEAEC2] leading-none">
                      {isOverdue ? (
                        <span className="font-semibold text-[#FF3B30] dark:text-[#FF453A]">
                          Quá hạn {formatShortDate(dateStr)}
                        </span>
                      ) : (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Hôm nay
                        </span>
                      )}

                      {timeStr && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="font-mono">{timeStr}</span>
                        </>
                      )}

                      {task.tag && (
                        <>
                          <span className="opacity-40">•</span>
                          <span className="text-[#636366] dark:text-[#A1A1A6]">
                            #{task.tag}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mũi tên xem chi tiết */}
                <ChevronRight
                  size={14}
                  strokeWidth={2}
                  className="text-[#C7C7CC] dark:text-[#636366] group-hover:text-[#1C1C1E] dark:group-hover:text-white transition-colors shrink-0"
                />
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-3xl border-none bg-white/50 dark:bg-[#1C1C1E]/50 py-10 px-4 text-center space-y-2 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] flex items-center justify-center mx-auto">
            {activeFilter === "overdue" ? (
              <CheckCircle2 size={20} strokeWidth={1.8} className="text-emerald-500" />
            ) : (
              <Bell size={20} strokeWidth={1.8} />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
              {activeFilter === "overdue"
                ? "Tuyệt vời, không có việc quá hạn!"
                : activeFilter === "today"
                ? "Không có thông báo nào hôm nay"
                : "Hộp thông báo trống"}
            </p>
            <p className="text-[11px] text-[#8E8E93]">
              {activeFilter === "overdue"
                ? "Tất cả công việc đều đang đúng tiến độ."
                : "Các công việc cần chú ý sẽ xuất hiện tại đây."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
