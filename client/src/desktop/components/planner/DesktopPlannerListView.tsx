import React, { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckSquare2, ChevronLeft, ChevronRight, CircleDot } from "lucide-react";
import { TaskDto, TaskItemType } from "../../../types";
import { getTaskEffectiveTime, getTaskItemType } from "../../../utils/taskSemantics";
import { TaskCard } from "../../../components/shared/common/TaskCard";

type PlannerItemScope = TaskItemType | "all";
type PlannerPeriod = "day" | "week" | "month" | "year";

interface PlannerListDay {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface DesktopPlannerListViewProps {
  weekDays: PlannerListDay[];
  getTasksForDate: (dateStr: string) => TaskDto[];
  onToggleTask: (taskId: string) => void;
  onOpenTask: (task: TaskDto) => void;
  itemScope?: PlannerItemScope;
  period?: PlannerPeriod;
}

const ACTIVITY_DAYS_PER_PAGE = 12;

const getDayFullLabel = (day: PlannerListDay) => {
  const parts = day.dateStr.split("-");
  return parts.length === 3 ? `${day.dayName}, ${parts[2]}/${parts[1]}` : `${day.dayName}, ${day.dayNum}`;
};

const sortActivities = (tasks: TaskDto[]) =>
  [...tasks].sort((first, second) => {
    const firstTime = getTaskEffectiveTime(first) || "99:99";
    const secondTime = getTaskEffectiveTime(second) || "99:99";
    if (firstTime !== secondTime) return firstTime.localeCompare(secondTime);
    if (first.completed !== second.completed) return Number(first.completed) - Number(second.completed);
    return first.title.localeCompare(second.title, "vi");
  });

/**
 * A desktop activity stream is deliberately different from the calendar grid.
 * It follows the week chronologically and every card goes straight to the right inspector.
 */
export const DesktopPlannerListView: React.FC<DesktopPlannerListViewProps> = ({
  weekDays,
  getTasksForDate,
  onToggleTask,
  onOpenTask,
  itemScope = "task",
  period = "week",
}) => {
  const dayEntries = useMemo(
    () => weekDays.map((day) => ({ day, tasks: sortActivities(getTasksForDate(day.dateStr)) })),
    [weekDays, getTasksForDate],
  );
  const isHybridStream = itemScope === "all";
  const isEventStream = itemScope === "event";
  const visibleDayEntries = isHybridStream || isEventStream
    ? dayEntries.filter((entry) => entry.tasks.length > 0)
    : dayEntries;
  const [activityPage, setActivityPage] = useState(0);
  const activityPageCount = Math.max(1, Math.ceil(visibleDayEntries.length / ACTIVITY_DAYS_PER_PAGE));
  const todayActivityIndex = visibleDayEntries.findIndex((entry) => entry.day.isToday);
  const firstVisibleDate = visibleDayEntries[0]?.day.dateStr;
  const lastVisibleDate = visibleDayEntries[visibleDayEntries.length - 1]?.day.dateStr;

  // Keep the first render centred on today. Month/year streams remain bounded
  // even if the account contains activity on hundreds of different days.
  useEffect(() => {
    const initialPage = todayActivityIndex >= 0
      ? Math.floor(todayActivityIndex / ACTIVITY_DAYS_PER_PAGE)
      : 0;
    setActivityPage(initialPage);
  }, [firstVisibleDate, lastVisibleDate, period, todayActivityIndex, visibleDayEntries.length]);

  const safeActivityPage = Math.min(activityPage, activityPageCount - 1);
  const pagedDayEntries = (isHybridStream || isEventStream)
    ? visibleDayEntries.slice(
      safeActivityPage * ACTIVITY_DAYS_PER_PAGE,
      (safeActivityPage + 1) * ACTIVITY_DAYS_PER_PAGE,
    )
    : visibleDayEntries;
  const totalCount = dayEntries.reduce((count, entry) => count + entry.tasks.length, 0);
  const eventCount = dayEntries.reduce(
    (count, entry) => count + entry.tasks.filter((task) => getTaskItemType(task) === "event").length,
    0,
  );
  const taskCount = totalCount - eventCount;
  const periodLabel =
    period === "day" ? "ngày" : period === "month" ? "tháng" : period === "year" ? "năm" : "tuần";

  const title = isHybridStream
    ? `Nhịp hoạt động trong ${periodLabel}`
    : isEventStream
      ? `Dòng sự kiện trong ${periodLabel}`
      : `Dòng công việc trong ${periodLabel}`;

  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-canvas)] px-5 py-5 select-none">
      <div className="mx-auto w-full max-w-[1280px] pb-16">
        {/* === PHẦN 1: Context tuần, không dựng một dashboard lặp lại === */}
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[var(--text-main)]">{title}</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {isHybridStream
                ? `${eventCount} sự kiện và ${taskCount} công việc theo trục thời gian`
                : `${totalCount} ${isEventStream ? "sự kiện" : "công việc"} trong ${periodLabel} đang xem`}
            </p>
          </div>
          {isHybridStream && (
            <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1.5"><CircleDot size={14} className="text-[var(--accent-blue)]" /> Sự kiện</span>
              <span className="inline-flex items-center gap-1.5"><CheckSquare2 size={14} className="text-[var(--accent-sky-strong)]" /> Công việc</span>
            </div>
          )}
        </header>

        {(isHybridStream || isEventStream) && activityPageCount > 1 && (
          <div className="mb-5 flex items-center justify-between gap-3 px-1">
            <p className="text-[11px] font-semibold text-[var(--text-muted)]">
              {safeActivityPage * ACTIVITY_DAYS_PER_PAGE + 1}–{Math.min((safeActivityPage + 1) * ACTIVITY_DAYS_PER_PAGE, visibleDayEntries.length)} / {visibleDayEntries.length} ngày có hoạt động
            </p>
            <div className="inline-flex items-center gap-1 rounded-xl bg-[var(--bg-surface-muted)] p-1">
              <button
                type="button"
                onClick={() => setActivityPage((current) => Math.max(0, current - 1))}
                disabled={safeActivityPage === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Các ngày hoạt động trước"
              >
                <ChevronLeft size={15} strokeWidth={2.4} />
              </button>
              <button
                type="button"
                onClick={() => setActivityPage((current) => Math.min(activityPageCount - 1, current + 1))}
                disabled={safeActivityPage >= activityPageCount - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface)] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Các ngày hoạt động sau"
              >
                <ChevronRight size={15} strokeWidth={2.4} />
              </button>
            </div>
          </div>
        )}

        {/* === PHẦN 2: Trục ngày phẳng, card chỉ dành cho chính hoạt động === */}
        <div className="space-y-4">
          {pagedDayEntries.map(({ day, tasks }) => {
            const dayEventCount = tasks.filter((task) => getTaskItemType(task) === "event").length;
            const dayTaskCount = tasks.length - dayEventCount;

            return (
              <article key={day.dateStr} className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 sm:grid-cols-[132px_minmax(0,1fr)]">
                <div className="flex min-w-0 items-start gap-2 pt-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${day.isToday ? "bg-[var(--accent-blue)]" : "bg-[var(--border-ink-muted)]"}`} />
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-bold ${day.isToday ? "text-[var(--accent-blue)]" : "text-[var(--text-main)]"}`}>
                      {getDayFullLabel(day)}
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--text-muted)]">{day.isToday ? "Hôm nay" : ""}</p>
                  </div>
                </div>

                <div className="min-w-0 border-l-2 border-[var(--border-ink-muted)] py-1 pl-4">
                  <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[var(--text-muted)]">
                    <CalendarClock size={14} className="text-[var(--accent-blue)]" strokeWidth={2.3} />
                    <span>{tasks.length} hoạt động</span>
                    {isHybridStream && dayEventCount > 0 && <span>{dayEventCount} sự kiện</span>}
                    {isHybridStream && dayTaskCount > 0 && <span>{dayTaskCount} công việc</span>}
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={onToggleTask}
                        onEdit={onOpenTask}
                        onClick={onOpenTask}
                        presentation="desktop"
                        hideDate
                      />
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {visibleDayEntries.length === 0 && (
          <div className="px-5 py-16 text-center">
            <p className="text-sm font-semibold text-[var(--text-main)]">{`Chưa có hoạt động trong ${periodLabel} này`}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Các sự kiện và công việc có ngày sẽ xuất hiện theo đúng mốc thời gian.</p>
          </div>
        )}
      </div>
    </section>
  );
};
