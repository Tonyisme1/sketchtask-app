import React, { useMemo } from "react";
import {
  DeadlinesView,
} from "../../components/shared/deadlines/DeadlinesView";
import {
  DeadlinesScreenModel,
  useDeadlinesScreenModel,
} from "../../features/deadlines/model/createDeadlinesScreenModel";
import { getTaskItemType } from "../../utils/taskSemantics";

export interface DesktopDeadlinesPageProps {
  model?: DeadlinesScreenModel;
  onNavigateToTaskDate?: (dateStr: string, taskId: string) => void;
}

export const DesktopDeadlinesPage: React.FC<DesktopDeadlinesPageProps> = ({
  model: propModel,
  onNavigateToTaskDate,
}) => {
  const defaultModel = useDeadlinesScreenModel();
  const model = propModel || defaultModel;
  const desktopTaskModel = useMemo(
    () => ({
      ...model,
      tasks: model.tasks.filter((task) => getTaskItemType(task) !== "event"),
    }),
    [model],
  );

  return (
    <DeadlinesView
      {...desktopTaskModel}
      onNavigateToTaskDate={onNavigateToTaskDate}
      taskListPresentation="desktop"
    />
  );
};
