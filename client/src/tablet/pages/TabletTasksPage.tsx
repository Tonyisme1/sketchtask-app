import React, { useState, useEffect } from "react";
import { NavigationTarget } from "../../types";
import { TabletPlannerPage } from "../tabs/TabletPlannerPage";
import { getTaskEffectiveDate } from "../../utils";
import { TaskScreenModel, useTaskScreenModel } from "../../features/tasks/model/createTaskScreenModel";

export interface TabletTasksPageProps {
  model?: TaskScreenModel;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const TabletTasksPage: React.FC<TabletTasksPageProps> = ({
  model: propModel,
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const defaultModel = useTaskScreenModel();
  const model = propModel || defaultModel;


  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<string | undefined>(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = model.tasks.find((item) => item.id === navigationTarget.taskId);
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    const taskDate = navigationTarget.date || getTaskEffectiveDate(task);
    setPlannerTargetDateStr(taskDate);
    setPlannerTargetTaskId(task.id);
    onClearNavigationTarget?.();
  }, [navigationTarget, model.tasks, onClearNavigationTarget]);

  return (
    <div className="w-full min-w-0 select-none pb-12">
      <TabletPlannerPage
        targetDateStr={plannerTargetDateStr}
        targetTaskId={plannerTargetTaskId}
        onClearTarget={() => {
          setPlannerTargetDateStr(undefined);
          setPlannerTargetTaskId(undefined);
        }}
      />
    </div>
  );
};
