import React, { useState, useMemo, useEffect } from "react";
import { NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { DesktopTodayView } from "./DesktopTodayView";
import { PlannerTab, DeadlinesTab } from "../../features";
import { getLocalTodayStr, getTaskEffectiveDate, normalizeTaskTimeType, getTaskTemporalState } from "../../shared/utils";
import { TaskSubTabSwitcher } from "../../components/features/tasks/TaskSubTabSwitcher";

export interface DesktopTasksViewProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const DesktopTasksView: React.FC<DesktopTasksViewProps> = ({
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const {
    tasks,
    activeTaskSubTab,
    setActiveTaskSubTab,
  } = useAppStore();

  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<string | undefined>(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<string | undefined>(undefined);
  const [plannerSourceTab, setPlannerSourceTab] = useState<"deadlines" | undefined>(undefined);
  const [todayTargetTaskId, setTodayTargetTaskId] = useState<string | undefined>(undefined);

  const todayStr = getLocalTodayStr(new Date());

  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = tasks.find((item) => item.id === navigationTarget.taskId);
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    const taskDate = navigationTarget.date || getTaskEffectiveDate(task);
    if (taskDate === todayStr) {
      setTodayTargetTaskId(task.id);
      setActiveTaskSubTab("today");
    } else {
      setPlannerTargetDateStr(taskDate);
      setPlannerTargetTaskId(task.id);
      setActiveTaskSubTab("planner");
    }
    onClearNavigationTarget?.();
  }, [navigationTarget, tasks, todayStr, setActiveTaskSubTab, onClearNavigationTarget]);

  const overdueCount = useMemo(() => {
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      return temporal === "overdue" || temporal === "pastScheduled";
    }).length;
  }, [tasks]);

  const dueWithin24hCount = useMemo(() => {
    const tomorrowStr = getLocalTodayStr(new Date(Date.now() + 86400000));
    return tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      if (temporal === "overdue" || temporal === "pastScheduled") return false;

      const normTime = normalizeTaskTimeType(t);
      const isDeadline = normTime === "deadline" || Boolean(t.deadlineTime);
      const effectiveDate = getTaskEffectiveDate(t);

      return isDeadline && (effectiveDate === todayStr || effectiveDate === tomorrowStr);
    }).length;
  }, [tasks, todayStr]);

  const deadlineAlertTotal = overdueCount + dueWithin24hCount;

  return (
    <div className="space-y-4 w-full min-w-0 pb-12 select-none animate-in fade-in duration-150">
      {/* 1. Hôm nay là workspace riêng; Công việc chỉ có hai chế độ. */}
      {activeTaskSubTab !== "today" && (
        <div className="flex items-center">
          <TaskSubTabSwitcher
            value={activeTaskSubTab === "deadlines" ? "deadlines" : "planner"}
            deadlineAlertTotal={deadlineAlertTotal}
            onChange={setActiveTaskSubTab}
            platform="desktop"
          />
        </div>
      )}

      {/* 2. Content */}
      {activeTaskSubTab === "today" ? (
        <DesktopTodayView
          targetTaskId={todayTargetTaskId}
          onClearTarget={() => setTodayTargetTaskId(undefined)}
        />
      ) : activeTaskSubTab === "planner" ? (
        <PlannerTab
          targetDateStr={plannerTargetDateStr}
          targetTaskId={plannerTargetTaskId}
          fromTab={plannerSourceTab}
          onBackToDeadlines={() => {
            setActiveTaskSubTab("deadlines");
            setPlannerSourceTab(undefined);
          }}
          onClearTarget={() => {
            setPlannerTargetDateStr(undefined);
            setPlannerTargetTaskId(undefined);
          }}
        />
      ) : (
        <DeadlinesTab
          onNavigateToTaskDate={(dateStr, taskId) => {
            if (dateStr === todayStr) {
              setActiveTaskSubTab("today");
            } else {
              setPlannerTargetDateStr(dateStr);
              setPlannerTargetTaskId(taskId);
              setPlannerSourceTab("deadlines");
              setActiveTaskSubTab("planner");
            }
          }}
        />
      )}
    </div>
  );
};
