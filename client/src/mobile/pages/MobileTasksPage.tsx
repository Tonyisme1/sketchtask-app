import React, { useState, useEffect } from "react";
import { NavigationTarget } from "../../types";
import { MobilePlannerPage } from "../tabs/MobilePlannerPage";
import { getTaskEffectiveDate } from "../../utils";
import { TaskScreenModel, useTaskScreenModel } from "../../features/tasks/model/createTaskScreenModel";

export interface MobileTasksPageProps {
  model?: TaskScreenModel;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

export const MobileTasksPage: React.FC<MobileTasksPageProps> = ({
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
    <div className="w-full min-w-0 select-none">
      {/* Mobile has one task workspace; deadline is inline task metadata only. */}
      <MobilePlannerPage
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
