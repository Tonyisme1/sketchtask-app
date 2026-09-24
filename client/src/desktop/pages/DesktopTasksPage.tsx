import React, { useState, useEffect } from "react";
import { NavigationTarget } from "../../types";
import { DesktopDeadlinesPage } from "../tabs/DesktopDeadlinesPage";
import { DesktopPlannerPage } from "../tabs/DesktopPlannerPage";
import { DesktopAllTasksView } from "../tabs/DesktopAllTasksView";
import { getTaskEffectiveDate } from "../../utils";
import {
  TaskScreenModel,
  useTaskScreenModel,
} from "../../features/tasks/model/createTaskScreenModel";

export interface DesktopTasksPageProps {
  model?: TaskScreenModel;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const DesktopTasksPage: React.FC<DesktopTasksPageProps> = ({
  model: propModel,
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const defaultModel = useTaskScreenModel();
  const model = propModel || defaultModel;

  const { activeTaskSubTab } = model;
  const { setActiveTaskSubTab } = model.actions;

  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<
    string | undefined
  >(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<
    string | undefined
  >(undefined);
  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = model.tasks.find(
      (item) => item.id === navigationTarget.taskId,
    );
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    const taskDate = navigationTarget.date || getTaskEffectiveDate(task);
    setPlannerTargetDateStr(taskDate);
    setPlannerTargetTaskId(task.id);
    setActiveTaskSubTab("planner");
    onClearNavigationTarget?.();
  }, [
    navigationTarget,
    model.tasks,
    setActiveTaskSubTab,
    onClearNavigationTarget,
  ]);

  const isPlannerSubTab = activeTaskSubTab === "planner";

  return (
    <div
      className={`w-full min-w-0 select-none animate-in fade-in duration-150 ${
        isPlannerSubTab ? "h-full flex flex-col min-h-0 w-full" : "pb-12"
      }`}
    >
      {/* Content */}
      {activeTaskSubTab === "planner" ? (
        <DesktopPlannerPage
          workspaceKind="task"
          targetDateStr={plannerTargetDateStr}
          targetTaskId={plannerTargetTaskId}
          onClearTarget={() => {
            setPlannerTargetDateStr(undefined);
            setPlannerTargetTaskId(undefined);
          }}
          desktopSurface="calendar"
        />
      ) : activeTaskSubTab === "all" ? (
        <DesktopAllTasksView model={model} />
      ) : (
        <DesktopDeadlinesPage
          onNavigateToTaskDate={(dateStr, taskId) => {
            setPlannerTargetDateStr(dateStr);
            setPlannerTargetTaskId(taskId);
            setActiveTaskSubTab("planner");
          }}
        />
      )}
    </div>
  );
};
