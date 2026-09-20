import { TaskDto } from "../../../types";
import {
  getTaskDeadlineDate,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
} from "../../../utils/taskSemantics";

export const getDesktopTaskDate = (task: TaskDto): string | undefined =>
  getTaskDeadlineDate(task) || getTaskEffectiveDate(task);

export const sortDesktopTasks = (tasks: TaskDto[]): TaskDto[] =>
  [...tasks].sort((taskA, taskB) => {
    if (taskA.completed !== taskB.completed) return taskA.completed ? 1 : -1;

    const timeA = getTaskEffectiveTime(taskA) || "99:99";
    const timeB = getTaskEffectiveTime(taskB) || "99:99";
    const timeOrder = timeA.localeCompare(timeB);
    if (timeOrder !== 0) return timeOrder;

    return taskA.title.localeCompare(taskB.title, undefined, { sensitivity: "base" });
  });

export const groupDesktopTasksByDate = (tasks: TaskDto[]) => {
  const groups = new Map<string, TaskDto[]>();

  for (const task of tasks) {
    const date = getDesktopTaskDate(task) || "no-date";
    const group = groups.get(date) || [];
    group.push(task);
    groups.set(date, group);
  }

  return [...groups.entries()]
    .sort(([dateA], [dateB]) => {
      if (dateA === "no-date") return 1;
      if (dateB === "no-date") return -1;
      return dateA.localeCompare(dateB);
    })
    .map(([dateStr, groupTasks]) => ({
      dateStr,
      tasks: sortDesktopTasks(groupTasks),
    }));
};
