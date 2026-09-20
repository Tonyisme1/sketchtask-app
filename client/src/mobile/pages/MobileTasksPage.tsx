import React, { useState, useEffect } from "react";
import { NavigationTarget } from "../../types";
import { MobileTodayView } from "../tabs/MobileTodayView";
import { MobileDeadlinesPage } from "../tabs/MobileDeadlinesPage";
import { MobilePlannerPage } from "../tabs/MobilePlannerPage";
import { getLocalTodayStr, getTaskEffectiveDate } from "../../utils";
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

  const { activeTaskSubTab } = model;
  const { setActiveTaskSubTab } = model.actions;

  const [plannerTargetDateStr, setPlannerTargetDateStr] = useState<string | undefined>(undefined);
  const [plannerTargetTaskId, setPlannerTargetTaskId] = useState<string | undefined>(undefined);
  const [plannerSourceTab, setPlannerSourceTab] = useState<"deadlines" | undefined>(undefined);
  const [todayTargetTaskId, setTodayTargetTaskId] = useState<string | undefined>(undefined);

  const todayStr = getLocalTodayStr(new Date());

  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = model.tasks.find((item) => item.id === navigationTarget.taskId);
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
  }, [navigationTarget, model.tasks, todayStr, setActiveTaskSubTab, onClearNavigationTarget]);

  return (
    <div className="w-full min-w-0 select-none">
      {/* Content */}
      {activeTaskSubTab === "today" ? (
        <MobileTodayView
          targetTaskId={todayTargetTaskId}
          onClearTarget={() => setTodayTargetTaskId(undefined)}
        />
      ) : activeTaskSubTab === "planner" ? (
        <MobilePlannerPage
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
        <MobileDeadlinesPage
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
