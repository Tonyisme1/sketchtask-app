import React, { useState, useMemo, useEffect } from "react";
import { NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { DesktopTodayView } from "./DesktopTodayView";
import { DesktopAllTasksView } from "./DesktopAllTasksView";
import { PlannerTab, DeadlinesTab } from "../../features";
import { getLocalTodayStr, getTaskEffectiveDate } from "../../shared/utils";
import type { DesktopPlannerSurface } from "../../components/features/planner/DesktopPlannerHeader";

export interface DesktopTasksViewProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  desktopPlannerSurface: DesktopPlannerSurface;
  desktopPlannerSurfaceRevision: number;
}

export const DesktopTasksView: React.FC<DesktopTasksViewProps> = ({
  navigationTarget,
  onClearNavigationTarget,
  desktopPlannerSurface,
  desktopPlannerSurfaceRevision,
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

  const isPlannerSubTab = activeTaskSubTab === "planner";

  return (
    <div
      className={`w-full min-w-0 select-none animate-in fade-in duration-150 ${
        isPlannerSubTab ? "h-full flex flex-col min-h-0 w-full" : "pb-12"
      }`}
    >
      {/* Content */}
      {activeTaskSubTab === "all" ? (
        <DesktopAllTasksView />
      ) : activeTaskSubTab === "today" ? (
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
          desktopSurface={desktopPlannerSurface}
          desktopSurfaceRevision={desktopPlannerSurfaceRevision}
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
