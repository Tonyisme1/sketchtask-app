import React, { useState, useEffect } from "react";
import { NavigationTarget } from "../../types";
import { TabletTodayView } from "../tabs/TabletTodayView";
import { TabletDeadlinesPage } from "../tabs/TabletDeadlinesPage";
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

  const { activeTaskSubTab } = model;
  const { setActiveTaskSubTab } = model.actions;

  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<string | undefined>(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<string | undefined>(undefined);
  const [plannerSourceTab, setPlannerSourceTab] = useState<"deadlines" | undefined>(undefined);
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
    <div className="w-full min-w-0 select-none pb-12">
      {/* Content */}
      {activeTaskSubTab === "today" ? (
        <TabletTodayView />
      ) : activeTaskSubTab === "planner" ? (
        <TabletPlannerPage
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
        <TabletDeadlinesPage
          onNavigateToTaskDate={(dateStr, taskId) => {
            setPlannerTargetDateStr(dateStr);
            setPlannerTargetTaskId(taskId);
            setPlannerSourceTab("deadlines");
            setActiveTaskSubTab("planner");
          }}
        />
      )}
    </div>
  );
};
