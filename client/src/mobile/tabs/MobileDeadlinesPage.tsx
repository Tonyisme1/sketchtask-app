import React from "react";
import {
  DeadlinesView,
  DeadlineView,
} from "../../components/shared/deadlines/DeadlinesView";
import {
  DeadlinesScreenModel,
  useDeadlinesScreenModel,
} from "../../features/deadlines/model/createDeadlinesScreenModel";

export interface MobileDeadlinesPageProps {
  model?: DeadlinesScreenModel;
  view: DeadlineView;
  onViewChange: (view: DeadlineView) => void;
}

export const MobileDeadlinesPage: React.FC<MobileDeadlinesPageProps> = ({
  model: propModel,
  view,
  onViewChange,
}) => {
  const defaultModel = useDeadlinesScreenModel();
  const model = propModel || defaultModel;

  return (
    <DeadlinesView
      {...model}
      view={view}
      onViewChange={onViewChange}
    />
  );
};
