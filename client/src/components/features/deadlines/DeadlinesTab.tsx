import React, { useMemo, useState } from "react";
import { AlertTriangle, BellRing, Hourglass } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { TaskDto } from "../../../types";
import { formatFullDate, getLocalTodayStr, getLocalTomorrowStr } from "../../../utils/date";
import { SketchTabs } from "../../layout/SketchTabs";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";
import { TaskList } from "../shared/TaskList";

export interface DeadlinesTabProps {
  onNavigateToTaskDate?: (dateStr: string, taskId: string) => void;
}

type DeadlineView = "overdue" | "upcoming";

const sortByDateAndTime = (tasks: TaskDto[]) =>
  [...tasks].sort((taskA, taskB) => {
    const dateA = getTaskEffectiveDate(taskA) || "9999-99-99";
    const dateB = getTaskEffectiveDate(taskB) || "9999-99-99";
    const dateOrder = dateA.localeCompare(dateB);
    if (dateOrder !== 0) return dateOrder;
    return (getTaskEffectiveTime(taskA) || "99:99").localeCompare(
      getTaskEffectiveTime(taskB) || "99:99",
    );
  });

const groupByDate = (tasks: TaskDto[]) => {
  const groups = new Map<string, TaskDto[]>();

  for (const task of tasks) {
    const date = getTaskEffectiveDate(task) || "no-date";
    const group = groups.get(date) || [];
    group.push(task);
    groups.set(date, group);
  }

  return [...groups.entries()].map(([dateStr, groupTasks]) => ({
    dateStr,
    tasks: sortByDateAndTime(groupTasks),
  }));
};

export const DeadlinesTab: React.FC<DeadlinesTabProps> = ({
  onNavigateToTaskDate,
}) => {
  const { isMobile } = useResponsiveLayout();
  const { tasks, toggleTask, deleteTask, moveTaskToTomorrow } = useAppStore();
  const todayStr = getLocalTodayStr(new Date());
  const tomorrowStr = getLocalTomorrowStr();
  const [view, setView] = useState<DeadlineView>("overdue");

  const overdueTasks = useMemo(
    () =>
      sortByDateAndTime(
        tasks.filter((task) => {
          if (task.completed) return false;
          const state = getTaskTemporalState(task);
          return state === "overdue" || state === "pastScheduled";
        }),
      ),
    [tasks],
  );

  const upcomingTasks = useMemo(
    () =>
      sortByDateAndTime(
        tasks.filter((task) => {
          if (task.completed) return false;
          const state = getTaskTemporalState(task);
          if (state === "overdue" || state === "pastScheduled") return false;
          if (normalizeTaskTimeType(task) !== "deadline") return false;
          const date = getTaskEffectiveDate(task);
          return date === todayStr || date === tomorrowStr;
        }),
      ),
    [tasks, todayStr, tomorrowStr],
  );

  const overdueGroups = useMemo(() => groupByDate(overdueTasks), [overdueTasks]);
  const upcomingGroups = useMemo(() => groupByDate(upcomingTasks), [upcomingTasks]);

  const handleSmartReschedule = (taskId: string) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    const date = getTaskEffectiveDate(task);
    if (!date) return;

    const [year, month, day] = date.split("-").map(Number);
    const taskDate = new Date(year, month - 1, day);
    const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
    const today = new Date(todayYear, todayMonth - 1, todayDay);
    const diffDays = Math.round((today.getTime() - taskDate.getTime()) / 86400000);

    if (diffDays <= 1 || !onNavigateToTaskDate) {
      moveTaskToTomorrow(taskId);
      return;
    }

    onNavigateToTaskDate(date, task.id);
  };

  const handleTaskClick = (task: TaskDto) => {
    const date = getTaskEffectiveDate(task);
    if (date && onNavigateToTaskDate) {
      onNavigateToTaskDate(date, task.id);
    }
  };

  const renderGroups = (
    groups: Array<{ dateStr: string; tasks: TaskDto[] }>,
    emptyMessage: string,
    emptySubMessage: string,
    variant: "overdue" | "planner"
  ) => {
    if (groups.length === 0) {
      return (
        <TaskList
          tasks={[]}
          emptyMessage={emptyMessage}
          emptySubMessage={emptySubMessage}
          onToggle={toggleTask}
          onEdit={handleTaskClick}
          onDelete={deleteTask}
          onMoveTomorrow={handleSmartReschedule}
          onAddSubtask={handleTaskClick}
          onClick={handleTaskClick}
          variant={variant}
          hideDate={false}
          showQuickAdd={false}
        />
      );
    }

    return (
      <div className="space-y-4 pt-1">
        {groups.map((group) => (
          <section key={group.dateStr} className="space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]/20">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917]" />
                <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                  {formatFullDate(group.dateStr)}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#FAF8F3] border border-[#262626]/30 text-[#78716C]">
                {group.tasks.length} việc
              </span>
            </div>
            <TaskList
              tasks={group.tasks}
              emptyMessage=""
              emptySubMessage=""
              onToggle={toggleTask}
              onEdit={handleTaskClick}
              onDelete={deleteTask}
              onMoveTomorrow={handleSmartReschedule}
              onAddSubtask={handleTaskClick}
              onClick={handleTaskClick}
              variant={variant}
              hideDate={true}
              baseDateStr={group.dateStr}
              showQuickAdd={false}
            />
          </section>
        ))}
      </div>
    );
  };

  const isOverdueView = view === "overdue";
  const activeCount = isOverdueView ? overdueTasks.length : upcomingTasks.length;

  return (
    <div className={`space-y-3.5 w-full min-w-0 pb-16 select-none ${
      isMobile ? "" : "animate-in fade-in duration-150"
    }`}>
      {/* 1. Header Thanh Điều Hướng Phân Nhóm Hạn Định (Chuẩn Nét Mực & Nền Giấy) */}
      <div className="flex items-center justify-between gap-2.5 flex-wrap select-none">
        <SketchTabs
          ariaLabel="Chuyển loại hạn định"
          value={view}
          onChange={setView}
          items={[
            {
              key: "overdue",
              label: "Quá hạn",
              icon: <AlertTriangle size={13} strokeWidth={2.4} />,
              badge:
                overdueTasks.length > 0 ? (
                  <span className="min-w-[18px] border-[1px] border-[#FDA4AF] bg-[#FFE4E6] px-1 py-0.5 text-center font-mono text-[10px] leading-none text-[#BE123C]">
                    {overdueTasks.length}
                  </span>
                ) : undefined,
            },
            {
              key: "upcoming",
              label: "Sắp đến",
              icon: <BellRing size={13} strokeWidth={2.4} />,
              badge:
                upcomingTasks.length > 0 ? (
                  <span className="min-w-[18px] border-[1px] border-[#7DD3FC] bg-[#E0F2FE] px-1 py-0.5 text-center font-mono text-[10px] leading-none text-[#0369A1]">
                    {upcomingTasks.length}
                  </span>
                ) : undefined,
            },
          ]}
        />

        <div className="flex items-center gap-1 text-[11px] text-[#78716C] font-mono">
          <span>Tổng cộng:</span>
          <span className="font-bold text-[#1C1917]">{activeCount} việc</span>
        </div>
      </div>

      {/* 2. Tiêu Đề Khu Vực (Đồng Bộ PlannerWeekView) */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]/20 flex-wrap gap-2 pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[4px] bg-[#1C1917] border-[1.5px] border-[#262626] flex items-center justify-center text-white shadow-[1px_1px_0px_#262626]">
            {isOverdueView ? (
              <AlertTriangle size={14} strokeWidth={2.4} className="text-red-400" />
            ) : (
              <Hourglass size={14} strokeWidth={2.4} className="text-sky-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
                {isOverdueView ? "Danh sách quá hạn" : "Hạn định sắp tới"}
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                  isOverdueView
                    ? "bg-red-50 text-red-700 border-red-300"
                    : "bg-sky-50 text-sky-700 border-sky-300"
                }`}
              >
                {isOverdueView ? "Cần xử lý" : "Hôm nay & Ngày mai"}
              </span>
            </div>
            <p className="text-[11px] text-[#78716C] font-mono">
              {isOverdueView
                ? `Có ${activeCount} công việc đã quá hạn hoàn thành hoặc lịch hẹn cũ`
                : `Có ${activeCount} công việc có hạn hoàn thành`}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Danh Sách Nhóm Việc Theo Ngày */}
      {isOverdueView
        ? renderGroups(overdueGroups, "Không có việc quá hạn", "Mọi task đang trong kế hoạch.", "overdue")
        : renderGroups(upcomingGroups, "Không có việc sắp đến hạn", "Bạn có thể thêm hạn khi tạo hoặc sửa task.", "planner")}
    </div>
  );
};
