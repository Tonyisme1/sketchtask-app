import React from "react";
import { TaskDetailPage, TaskDetailPageProps } from "../../components/shared/tasks/TaskDetailPage";

export type MobileTaskDetailPageProps = TaskDetailPageProps;

export const MobileTaskDetailPage: React.FC<MobileTaskDetailPageProps> = (props) => {
  return (
    <div className="w-full mobile-panel-enter select-none">
      <TaskDetailPage {...props} />
    </div>
  );
};
