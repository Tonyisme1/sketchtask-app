import React from "react";
import {
  DeadlinesView,
  type DeadlinesViewProps,
} from "../../../components/shared/deadlines/DeadlinesView";

export type DesktopDeadlinesViewProps = Omit<
  DeadlinesViewProps,
  "taskListPresentation"
>;

/** Desktop presentation adapter for the shared deadline model and actions. */
export const DesktopDeadlinesView: React.FC<DesktopDeadlinesViewProps> = (props) => (
  <DeadlinesView {...props} taskListPresentation="desktop" />
);
