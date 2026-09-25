import React from "react";
import {
  DeadlinesView,
} from "../../components/shared/deadlines/DeadlinesView";
import {
  DeadlinesScreenModel,
  useDeadlinesScreenModel,
} from "../../features/deadlines/model/createDeadlinesScreenModel";

export interface TabletDeadlinesPageProps {
  model?: DeadlinesScreenModel;
}

export const TabletDeadlinesPage: React.FC<TabletDeadlinesPageProps> = ({
  model: propModel,
}) => {
  const defaultModel = useDeadlinesScreenModel();
  const model = propModel || defaultModel;

  return <DeadlinesView {...model} />;
};
