import { AppContextType } from "../../../stores/appStore";

export type AIScreenModel = Pick<
  AppContextType,
  "tasks" | "addTask" | "toggleTask" | "openTaskDetail"
>;
