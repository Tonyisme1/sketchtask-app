import { AppContextType } from "../../../stores/appStore";

export type DeadlinesScreenModel = Pick<
  AppContextType,
  "tasks" | "toggleTask" | "deleteTask" | "updateTask" | "openTaskDetail"
> & {
  isMobile: boolean;
};
