import { useAppStore } from "../../../stores/appStore";
import { AIScreenModel } from "./types";

export const useAIScreenModel = (): AIScreenModel => {
  const { tasks, addTask, toggleTask, openTaskDetail } = useAppStore();

  return {
    tasks,
    addTask,
    toggleTask,
    openTaskDetail,
  };
};
