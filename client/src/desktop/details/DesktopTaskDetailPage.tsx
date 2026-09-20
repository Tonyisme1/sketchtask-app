import React from "react";
import {
  TaskDetailPage,
  TaskDetailPageProps,
} from "../../components/shared/tasks/TaskDetailPage";

export type DesktopTaskDetailPageProps = TaskDetailPageProps;

export const DesktopTaskDetailPage: React.FC<DesktopTaskDetailPageProps> = (
  props,
) => {
  return (
    <div className="w-full h-full flex flex-col min-h-0 bg-white dark:bg-black select-none">
      <TaskDetailPage {...props} allowItemTypeSwitch={false} />
    </div>
  );
};
