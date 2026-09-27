import React, { useCallback, useState } from "react";
import { CalendarDays } from "lucide-react";
import { NavigationTarget, TaskDto } from "../../types";
import { useAppStore } from "../../stores";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskItemType,
} from "../../utils/taskSemantics";
import { PlannerCalendar } from "../../components/shared/planner/PlannerCalendar";
import { PlannerHeader } from "../../components/shared/planner/PlannerHeader";
import { PlannerWeekView } from "../../components/shared/planner/PlannerWeekView";
import { TaskList } from "../../components/shared/common/TaskList";
import { usePlannerScreenModel } from "../planner/model/createPlannerScreenModel";

export interface EventsWorkspaceProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
}

type EventCalendarView = "day" | "week" | "month";

const shiftDateKey = (dateStr: string, offset: number) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatHeaderDateLabel = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return year && month && day ? `${day}/${month}` : dateStr;
};

const sortEvents = (first: TaskDto, second: TaskDto) => {
  const firstKey = `${getTaskEffectiveDate(first) || "9999-12-31"} ${getTaskEffectiveTime(first) || "23:59"}`;
  const secondKey = `${getTaskEffectiveDate(second) || "9999-12-31"} ${getTaskEffectiveTime(second) || "23:59"}`;
  return firstKey.localeCompare(secondKey);
};

const EventAgenda: React.FC<{ events: TaskDto[]; selectedDate: string }> = ({
  events,
  selectedDate,
}) => {
  const { deleteTask, moveTaskToNextDay, openTaskDetail } = useAppStore();
  const dateEvents = events
    .filter((event) => getTaskEffectiveDate(event) === selectedDate)
    .sort(sortEvents);

  if (!dateEvents.length) {
    return (
      <div className="rounded-2xl bg-[var(--bg-surface)] px-5 py-12 text-center text-[var(--text-muted)]">
        <CalendarDays size={30} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm font-bold text-[var(--text-main)]">Chưa có sự kiện</p>
        <p className="mt-1 text-xs">Tạo sự kiện bằng nút + ở giữa thanh điều hướng.</p>
      </div>
    );
  }

  return (
    <TaskList
      tasks={dateEvents}
      onToggle={() => undefined}
      onEdit={(event) => openTaskDetail(event.id)}
      onDelete={deleteTask}
      onMoveTomorrow={moveTaskToNextDay}
      onClick={(event) => openTaskDetail(event.id)}
      variant="planner"
      hideDate
      activeTaskId={null}
      showQuickAdd={false}
      showEventTimeLabel
    />
  );
};

/** Shared event domain UI. Platform pages compose this without importing each other. */
export const EventsWorkspace: React.FC<EventsWorkspaceProps> = ({
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const model = usePlannerScreenModel({
    targetDateStr: navigationTarget?.date,
    targetTaskId: navigationTarget?.taskId,
    onClearTarget: onClearNavigationTarget,
  });
  const [calendarView, setCalendarView] = useState<EventCalendarView>("day");

  const getEventsForDate = useCallback(
    (dateStr: string) =>
      model.getTasksForDate(dateStr).filter((task) => getTaskItemType(task) === "event"),
    [model],
  );

  const getEventSummaryForDate = useCallback(
    (dateStr: string) => {
      const dayEvents = getEventsForDate(dateStr);
      return {
        total: dayEvents.length,
        completed: 0,
        active: dayEvents.length,
        overdue: 0,
        pastScheduled: 0,
        scheduled: dayEvents.filter((event) => Boolean(getTaskEffectiveTime(event))).length,
      };
    },
    [getEventsForDate],
  );

  const handleSelectDate = (dateStr: string) => {
    model.actions.selectDay(dateStr);
    setCalendarView("day");
  };

  const handleCalendarPrev = () => {
    if (calendarView === "day") model.actions.selectDay(shiftDateKey(model.currentDayStr, -1));
    else if (calendarView === "week") model.actions.prevWeek();
    else model.actions.prevMonth();
  };

  const handleCalendarNext = () => {
    if (calendarView === "day") model.actions.selectDay(shiftDateKey(model.currentDayStr, 1));
    else if (calendarView === "week") model.actions.nextWeek();
    else model.actions.nextMonth();
  };

  const calendarTitle =
    calendarView === "day"
      ? formatHeaderDateLabel(model.currentDayStr)
      : calendarView === "week"
        ? model.weekLabel.replace(/\s*-\s*/, "-")
        : model.monthLabel;
  const monthMatrix = model.monthDays.map((day) => ({
    dayNum: day.dayNum,
    dateStr: day.dateStr,
    isCurrentMonth: day.isCurrentMonth,
  }));

  return (
    <div className="w-full min-w-0 space-y-3 pb-16 select-none">
      <PlannerHeader
        viewMode={calendarView === "day" ? "day" : calendarView === "month" ? "month" : "agenda"}
        onViewModeChange={(mode) =>
          setCalendarView(mode === "day" ? "day" : mode === "month" ? "month" : "week")
        }
        titleLabel={calendarTitle}
        onPrev={handleCalendarPrev}
        onNext={handleCalendarNext}
        onToday={model.actions.goToToday}
      />
      {calendarView === "day" && (
        <EventAgenda events={getEventsForDate(model.currentDayStr)} selectedDate={model.currentDayStr} />
      )}
      {calendarView === "week" && (
        <PlannerWeekView
          weekDays={model.weekDays}
          selectedDateStr={model.currentDayStr}
          getTasksForDate={getEventsForDate}
          onSelectDate={handleSelectDate}
          onToggleTask={() => undefined}
          onDeleteTask={model.actions.deleteTask}
          onUpdateTask={model.actions.updateTask}
          calendarItemType="event"
        />
      )}
      {calendarView === "month" && (
        <PlannerCalendar
          selectedDateStr={model.currentDayStr}
          onSelectDate={handleSelectDate}
          todayStr={model.todayStr}
          monthMatrix={monthMatrix}
          getTasksForDate={getEventsForDate}
          getTaskSummaryForDate={getEventSummaryForDate}
          itemLabel="sự kiện"
        />
      )}
    </div>
  );
};
