import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../hooks";
import { DeadlinesScreenModel } from "./types";

export const useDeadlinesScreenModel = (): DeadlinesScreenModel => {
  const {
    tasks,
    toggleTask,
    deleteTask,
    updateTask,
    openTaskDetail,
  } = useAppStore();
  const { isMobile } = useResponsiveLayout();

  return {
    tasks,
    toggleTask,
    deleteTask,
    updateTask,
    openTaskDetail,
    isMobile,
  };
};
