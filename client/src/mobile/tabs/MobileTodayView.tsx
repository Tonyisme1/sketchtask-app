import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import { useAppStore } from "../../stores";
import {
  getLocalTodayStr,
  getTaskEffectiveTime,
  getTaskItemType,
  getTaskTemporalState,
  isTaskDueToday,
  normalizeTaskTimeType,
} from "../../utils";
import { TodayTaskList } from "../../components/shared/today/TodayTaskList";

const NEAR_DEADLINE_WINDOW_MINUTES = 120;

const getTimeMinutes = (time?: string): number | null => {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
};

export interface MobileTodayViewProps {
  targetTaskId?: string;
  onClearTarget?: () => void;
}

export const MobileTodayView: React.FC<MobileTodayViewProps> = ({
  targetTaskId,
}) => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    hideCompletedTasks,
    openTaskDetail,
  } = useAppStore();

  const [isCompletedSectionOpen, setIsCompletedSectionOpen] = useState(false);

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const todayList = useMemo(() => {
    return tasks.filter(
      (task) => getTaskItemType(task) !== "event" && isTaskDueToday(task, now),
    );
  }, [tasks, todayStr]);

  // === PHẦN 1: Một dòng việc duy nhất, ưu tiên theo mức cần xử lý ===
  const activeTodayTasks = useMemo(() => {
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const getPriority = (task: (typeof todayList)[number]) => {
      const timeType = normalizeTaskTimeType(task);
      const effectiveTime = getTaskEffectiveTime(task);
      const effectiveMinutes = getTimeMinutes(effectiveTime);

      // Deadline cận giờ hoặc đã quá giờ cần nổi lên đầu để người dùng không bỏ sót.
      if (timeType === "deadline" && effectiveMinutes !== null) {
        const temporal = getTaskTemporalState(task, now);
        const minutesUntilDeadline = effectiveMinutes - currentMinutes;
        if (
          temporal === "overdue" ||
          (minutesUntilDeadline >= 0 && minutesUntilDeadline <= NEAR_DEADLINE_WINDOW_MINUTES)
        ) {
          return 0;
        }
      }

      // Task có khoảng thời gian luôn đứng trước task chỉ có một mốc deadline.
      if (timeType === "scheduled") return 1;
      return 2;
    };

    return todayList
      .filter((task) => !task.completed)
      .sort((a, b) => {
        const priorityDifference = getPriority(a) - getPriority(b);
        if (priorityDifference !== 0) return priorityDifference;

        const timeA = getTimeMinutes(getTaskEffectiveTime(a));
        const timeB = getTimeMinutes(getTaskEffectiveTime(b));
        if (timeA === null && timeB !== null) return 1;
        if (timeA !== null && timeB === null) return -1;
        if (timeA !== null && timeB !== null && timeA !== timeB) return timeA - timeB;
        return a.title.localeCompare(b.title, "vi");
      });
  }, [todayList, now]);

  const completedTodayTasks = useMemo(() => {
    if (hideCompletedTasks) return [];
    return todayList.filter((task) => task.completed);
  }, [todayList, hideCompletedTasks]);

  return (
    <div className="w-full min-w-0 space-y-2.5 select-none pb-6">
      {/* === PHẦN 1: Dòng việc active và dropdown việc đã xong === */}
      <div className="space-y-4 w-full">
        <TodayTaskList
          tasks={activeTodayTasks}
          onToggle={toggleTask}
          onEdit={(task) => openTaskDetail(task.id)}
          onDelete={deleteTask}
          onMoveTomorrow={moveTaskToTomorrow}
          onClick={(task) => openTaskDetail(task.id)}
          activeTaskId={targetTaskId}
          showQuickAdd={false}
        />

        {/* Việc đã xong luôn đóng khi vào màn hình; chỉ mở khi người dùng chủ động bấm. */}
        {completedTodayTasks.length > 0 && (
          <section className="mt-5 pt-3">
            <button
              type="button"
              onClick={() => setIsCompletedSectionOpen((open) => !open)}
              className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-semibold text-[#8E8E93] transition-colors hover:bg-black/[0.03] dark:text-[#AEAEB2] dark:hover:bg-white/[0.04]"
              aria-expanded={isCompletedSectionOpen}
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} strokeWidth={2.2} className="text-emerald-500 shrink-0" />
                <span>Đã hoàn thành ({completedTodayTasks.length})</span>
              </span>
              <ChevronDown
                size={17}
                strokeWidth={2.2}
                className={`transition-transform ${isCompletedSectionOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCompletedSectionOpen && (
              <div className="mt-2">
                <TodayTaskList
                  tasks={completedTodayTasks}
                  onToggle={toggleTask}
                  onEdit={(task) => openTaskDetail(task.id)}
                  onDelete={deleteTask}
                  onMoveTomorrow={moveTaskToTomorrow}
                  onClick={(task) => openTaskDetail(task.id)}
                  activeTaskId={targetTaskId}
                  showQuickAdd={false}
                  showCompletionSection={false}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
