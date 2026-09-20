import React from "react";
import { TaskDetailPage, TaskDetailPageProps } from "../../components/shared/tasks/TaskDetailPage";

export type TabletTaskDetailPageProps = TaskDetailPageProps;

export const TabletTaskDetailPage: React.FC<TabletTaskDetailPageProps> = (props) => {
  return (
    <div className="w-full animate-detail-slide-in select-none">
      <TaskDetailPage {...props} />
    </div>
  );
};
