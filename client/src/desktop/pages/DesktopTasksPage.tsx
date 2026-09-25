import React, { useEffect } from "react";
import { NavigationTarget } from "../../types";
import { DesktopDeadlinesPage } from "../tabs/DesktopDeadlinesPage";
import { DesktopAllTasksView } from "../tabs/DesktopAllTasksView";
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
  const { openTaskDetail } = model.actions;

  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = model.tasks.find(
      (item) => item.id === navigationTarget.taskId,
    );
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    // Desktop no longer has a task-planner destination: search opens the task itself.
    openTaskDetail(task.id);
    onClearNavigationTarget?.();
  }, [
    navigationTarget,
    model.tasks,
    openTaskDetail,
    onClearNavigationTarget,
  ]);

  return (
    <div className="w-full min-w-0 select-none animate-in fade-in duration-150 pb-12">
      {activeTaskSubTab === "deadlines" ? (
        <DesktopDeadlinesPage />
      ) : (
        <DesktopAllTasksView model={model} />
      )}
    </div>
  );
};
