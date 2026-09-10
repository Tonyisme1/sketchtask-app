import React, { useState, useMemo, useEffect } from "react";
import { NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { MobileTodayView } from "./MobileTodayView";
import { PlannerTab, DeadlinesTab } from "../../features";
import { getLocalTodayStr, getTaskEffectiveDate } from "../../shared/utils";

export interface MobileTasksViewProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const MobileTasksView: React.FC<MobileTasksViewProps> = ({
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

  return (
    <div className="space-y-3.5 w-full min-w-0 select-none">
      {/* Content */}
      {activeTaskSubTab === "today" ? (
        <MobileTodayView
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
