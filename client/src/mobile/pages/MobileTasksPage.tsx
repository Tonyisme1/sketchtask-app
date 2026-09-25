import React, { useState, useEffect } from "react";
import { NavigationTarget } from "../../types";
import { MobileDeadlinesPage } from "../tabs/MobileDeadlinesPage";
import { MobilePlannerPage } from "../tabs/MobilePlannerPage";
import { getTaskEffectiveDate } from "../../utils";
import { TaskScreenModel, useTaskScreenModel } from "../../features/tasks/model/createTaskScreenModel";
import { useAppStore } from "../../stores";

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

  const { activeTaskSubTab } = model;
  const { setActiveTaskSubTab } = model.actions;
  const { mobileDeadlineView, setMobileDeadlineView } = useAppStore();

  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<string | undefined>(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<string | undefined>(undefined);


  useEffect(() => {
    if (activeTaskSubTab === "all" || activeTaskSubTab === "today") {
      setActiveTaskSubTab("planner");
    }
  }, [activeTaskSubTab, setActiveTaskSubTab]);

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
    setActiveTaskSubTab("planner");
    onClearNavigationTarget?.();
  }, [navigationTarget, model.tasks, setActiveTaskSubTab, onClearNavigationTarget]);

  return (
    <div className="w-full min-w-0 select-none">
      {/* Content */}
      {activeTaskSubTab === "planner" || activeTaskSubTab === "today" || activeTaskSubTab === "all" ? (
        <MobilePlannerPage
          targetDateStr={plannerTargetDateStr}
          targetTaskId={plannerTargetTaskId}
          onClearTarget={() => {
            setPlannerTargetDateStr(undefined);
            setPlannerTargetTaskId(undefined);
          }}
        />
      ) : (
        <MobileDeadlinesPage
          view={mobileDeadlineView}
          onViewChange={setMobileDeadlineView}
        />
      )}
    </div>
  );
};
