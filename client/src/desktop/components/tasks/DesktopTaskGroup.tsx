import React from "react";
import {
  DesktopTaskGroup as SharedDesktopTaskGroup,
  type DesktopTaskGroupProps,
} from "../../../components/shared/common/DesktopTaskGroup";

/**
 * Desktop task-group boundary.
 *
 * The task tree and card behavior stay in the shared layer, while Desktop
 * owns the composition entry point used by its task and planner surfaces.
 */
export const DesktopTaskGroup: React.FC<DesktopTaskGroupProps> = (props) => (
  <SharedDesktopTaskGroup {...props} />
);

export type { DesktopTaskGroupProps };
