import React, { useMemo } from "react";
import { DesktopDeadlinesView } from "../components/deadlines/DesktopDeadlinesView";
import {
  DeadlinesScreenModel,
  useDeadlinesScreenModel,
} from "../../features/deadlines/model/createDeadlinesScreenModel";
import { getTaskItemType } from "../../utils/taskSemantics";

export interface DesktopDeadlinesPageProps {
  model?: DeadlinesScreenModel;
}

export const DesktopDeadlinesPage: React.FC<DesktopDeadlinesPageProps> = ({
  model: propModel,
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
    <DesktopDeadlinesView {...desktopTaskModel} />
  );
};
