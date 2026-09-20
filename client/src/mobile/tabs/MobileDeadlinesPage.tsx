import React from "react";
import {
  DeadlinesView,
} from "../../components/shared/deadlines/DeadlinesView";
import {
  DeadlinesScreenModel,
  useDeadlinesScreenModel,
} from "../../features/deadlines/model/createDeadlinesScreenModel";

export interface MobileDeadlinesPageProps {
  model?: DeadlinesScreenModel;
  onNavigateToTaskDate?: (dateStr: string, taskId: string) => void;
}

export const MobileDeadlinesPage: React.FC<MobileDeadlinesPageProps> = ({
  model: propModel,
  onNavigateToTaskDate,
}) => {
  const defaultModel = useDeadlinesScreenModel();
  const model = propModel || defaultModel;

  return <DeadlinesView {...model} onNavigateToTaskDate={onNavigateToTaskDate} />;
};
