// ==========================================
// COMPONENT: Desktop Sidebar (Central Ink & Paper Navigation)
// ==========================================

import React from "react";
import { TabKey, TaskDto, TaskSubTab } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  Sun,
  Calendar as CalendarIcon,
  Hourglass,
  FilePenLine,
  BookOpen,
  List,
  ListTodo,
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Trash2,
} from "lucide-react";
import { ConfirmModal } from "../../components/ui/overlays/ConfirmModal";
import {
  getTaskItemType,
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  getTaskTags,
  isTaskDueToday,
  normalizeTaskTimeType,
} from "../../utils/taskSemantics";
import { getLocalTodayStr } from "../../utils/date";
import { loadNotesFromStorage } from "../../utils/noteStorage";

export interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onCreateEvent?: () => void;
  onCreateTask?: () => void;
  onOpenSettings?: () => void;
  onOpenAIModal?: () => void;
  desktopPlannerSurface?: "calendar" | "list";
  onDesktopPlannerSurfaceChange?: (surface: "calendar" | "list") => void;
  onDesktopTaskSubTabChange?: (subTab: TaskSubTab) => void;
}

interface SidebarTaskPreviewProps {
  title?: string;
  tasks: TaskDto[];
  formatDate: (date?: string) => string;
  emptyLabel?: string;
}

const SidebarTaskPreview: React.FC<SidebarTaskPreviewProps> = ({
  title,
  tasks,
  formatDate,
  emptyLabel = "Chưa có việc cần chú ý",
}) => (
  <div className={title ? "mt-3" : "mt-2"}>
    {title && (
      <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
        {title}
      </p>
    )}
    {tasks.length ? (
      <div className="mt-1.5 space-y-1">
        {tasks.map((task) => {
          const date = formatDate(getTaskEffectiveDate(task));
          const time = getTaskEffectiveTime(task);
          return (
            <div key={task.id} className="min-w-0 rounded-xl px-1.5 py-1 hover:bg-white/70 dark:hover:bg-[#2C2C2E]">
              <p className="truncate text-[11px] font-semibold text-[#1C1917] dark:text-[#F2F2F7]" title={task.title}>
                {task.title || "Công việc không tên"}
              </p>
              <p className="mt-0.5 font-mono text-[9px] font-medium text-[#78716C] dark:text-[#A1A1AA]">
                {time ? `${date} · ${time}` : date}
              </p>
            </div>
          );
        })}
      </div>
    ) : (
      <p className="mt-1.5 px-1 text-[11px] text-[#78716C] dark:text-[#A1A1AA]">{emptyLabel}</p>
    )}
  </div>
);

interface SidebarTextPreviewProps {
  title: string;
  items: Array<{ id: string; label: string; meta: string }>;
  emptyLabel?: string;
}

const SidebarTextPreview: React.FC<SidebarTextPreviewProps> = ({
  title,
  items,
  emptyLabel = "Chưa có nội dung gần đây",
}) => (
  <div>
    <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
      {title}
    </p>
    {items.length ? (
      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <div key={item.id} className="min-w-0 rounded-xl px-1.5 py-1 hover:bg-white/70 dark:hover:bg-[#2C2C2E]">
            <p className="truncate text-[11px] font-semibold text-[#1C1917] dark:text-[#F2F2F7]" title={item.label}>
              {item.label}
            </p>
            <p className="mt-0.5 truncate font-mono text-[9px] font-medium text-[#78716C] dark:text-[#A1A1AA]">
              {item.meta}
            </p>
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-1.5 px-1 text-[11px] text-[#78716C] dark:text-[#A1A1AA]">{emptyLabel}</p>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onCreateEvent,
  onCreateTask,
  onOpenSettings,
  onOpenAIModal,
  desktopPlannerSurface = "calendar",
  onDesktopPlannerSurfaceChange,
  onDesktopTaskSubTabChange,
}) => {
  const {
    tasks,
    tags,
    addTag,
    deleteTag,
    updateTask,
    journalEntries,
    activeTaskSubTab,
    setActiveTaskSubTab,
    activeTaskListTags,
    setActiveTaskListTags,
    toggleActiveTaskListTag,
    isSidebarOpen,
  } = useAppStore();
  const [isTaskListsOpen, setIsTaskListsOpen] = React.useState(true);
  const [isCreatingTaskList, setIsCreatingTaskList] = React.useState(false);
  const [newTaskListName, setNewTaskListName] = React.useState("");
  const [pendingTaskListDeletion, setPendingTaskListDeletion] = React.useState<string | null>(null);

  const todayStr = getLocalTodayStr(new Date());
  const taskItems = tasks.filter((task) => getTaskItemType(task) !== "event");
  const eventItems = tasks.filter((task) => getTaskItemType(task) === "event");
  const taskLists = tags
    .map((name) => ({
      name,
      count: taskItems.filter((task) => getTaskTags(task).includes(name)).length,
    }))
    .sort((first, second) => first.name.localeCompare(second.name, "vi"));

  // Task Stats for Badges
  const pendingTodayCount = taskItems.filter(
    (task) => !task.completed && isTaskDueToday(task)
  ).length;

  const overdueCount = taskItems.filter((task) => {
    if (task.completed) return false;
    const temporal = getTaskTemporalState(task);
    return temporal === "overdue" || temporal === "pastScheduled";
  }).length;

  const dueWithin24hCount = taskItems.filter((task) => {
    if (task.completed) return false;
    const temporal = getTaskTemporalState(task);
    if (temporal === "overdue" || temporal === "pastScheduled") return false;

    const timeType = normalizeTaskTimeType(task);
    const effectiveDate = getTaskEffectiveDate(task);
    const tomorrow = getLocalTodayStr(new Date(Date.now() + 86400000));
    return (
      (timeType === "deadline" || Boolean(task.deadlineTime)) &&
      (effectiveDate === todayStr || effectiveDate === tomorrow)
    );
  }).length;

  const deadlineAlertTotal = overdueCount + dueWithin24hCount;
  const notes = loadNotesFromStorage();
  const notesCount = notes.length;

  // === PHẦN: DỮ LIỆU TÓM TẮT CHO SIDEBAR MỞ RỘNG ===
  const todayTasks = taskItems.filter((task) => isTaskDueToday(task));
  const completedTodayCount = todayTasks.filter((task) => task.completed).length;
  const todayProgress = todayTasks.length
    ? Math.round((completedTodayCount / todayTasks.length) * 100)
    : 0;

  const upcomingTasks = taskItems
    .filter((task) => {
      if (task.completed) return false;
      const date = getTaskEffectiveDate(task);
      const temporal = getTaskTemporalState(task);
      return Boolean(date && date >= todayStr && temporal !== "overdue" && temporal !== "pastScheduled");
    })
    .sort((first, second) => {
      const firstKey = `${getTaskEffectiveDate(first) || "9999-12-31"} ${getTaskEffectiveTime(first) || "23:59"}`;
      const secondKey = `${getTaskEffectiveDate(second) || "9999-12-31"} ${getTaskEffectiveTime(second) || "23:59"}`;
      return firstKey.localeCompare(secondKey);
    })
    .slice(0, 2);

  const upcomingEvents = eventItems
    .filter((event) => {
      const date = getTaskEffectiveDate(event);
      return Boolean(date && date >= todayStr);
    })
    .sort((first, second) => {
      const firstKey = `${getTaskEffectiveDate(first) || "9999-12-31"} ${getTaskEffectiveTime(first) || "23:59"}`;
      const secondKey = `${getTaskEffectiveDate(second) || "9999-12-31"} ${getTaskEffectiveTime(second) || "23:59"}`;
      return firstKey.localeCompare(secondKey);
    })
    .slice(0, 2);

  const overdueTasks = taskItems
    .filter((task) => {
      if (task.completed) return false;
      const temporal = getTaskTemporalState(task);
      return temporal === "overdue" || temporal === "pastScheduled";
    })
    .slice(0, 2);

  const recentNotes = notes.slice(0, 2);
  const recentJournalDays = Array.from(
    journalEntries.reduce((days, entry) => {
      days.set(entry.date, (days.get(entry.date) || 0) + 1);
      return days;
    }, new Map<string, number>())
  )
    .sort(([firstDate], [secondDate]) => secondDate.localeCompare(firstDate))
    .slice(0, 2);

  // Active state determinations
  const isTodayActive =
    activeTab === "today" ||
    (activeTab === "tasks" && activeTaskSubTab === "today");
  const isAllTasksActive = activeTab === "tasks" && activeTaskSubTab === "all";
  const isEventWorkspace = activeTab === "planner";
  const isTaskWorkspace =
    activeTab === "tasks" || activeTab === "today" || activeTab === "deadlines";
  const isTaskPlannerActive = activeTab === "tasks" && activeTaskSubTab === "planner";
  const isDeadlinesActive =
    activeTab === "deadlines" ||
    (activeTab === "tasks" && activeTaskSubTab === "deadlines");
  const isNotesActive = activeTab === "notes";
  const isJournalActive = activeTab === "journal";
  const isSecondaryWorkspace = isNotesActive || isJournalActive;
  const createHandler = isEventWorkspace
    ? onCreateEvent
    : isTaskWorkspace
      ? onCreateTask
      : undefined;

  // Handlers
  const handleSelectToday = () => {
    if (onDesktopTaskSubTabChange) {
      onDesktopTaskSubTabChange("today");
      return;
    }
    setActiveTaskSubTab("today");
    onTabChange("today");
  };

  const handleSelectAllTasks = () => {
    setActiveTaskListTags([]);
    if (onDesktopTaskSubTabChange) {
      onDesktopTaskSubTabChange("all");
      return;
    }
    setActiveTaskSubTab("all");
    onTabChange("tasks");
  };

  const handleSelectTaskList = (tag: string) => {
    toggleActiveTaskListTag(tag);
  };

  const handleToggleTaskListFilter = (tag: string) => {
    handleSelectTaskList(tag);
  };

  const handleCreateTaskList = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newTaskListName.trim();
    if (!name) return;
    addTag(name);
    setNewTaskListName("");
    setIsCreatingTaskList(false);
  };

  const handleConfirmTaskListDeletion = () => {
    if (!pendingTaskListDeletion) return;

    const tagToDelete = pendingTaskListDeletion;
    taskItems.forEach((task) => {
      const remainingTags = getTaskTags(task).filter((tag) => tag !== tagToDelete);
      if (remainingTags.length === getTaskTags(task).length) return;
      updateTask(task.id, {
        tag: remainingTags[0],
        tags: remainingTags.length ? remainingTags : undefined,
      });
    });
    deleteTag(tagToDelete);
    setActiveTaskListTags(
      activeTaskListTags.filter((activeTag) => activeTag !== tagToDelete),
    );
    setPendingTaskListDeletion(null);
  };

  const handleSelectPlanner = () => {
    if (onDesktopTaskSubTabChange) {
      onDesktopTaskSubTabChange("planner");
      return;
    }
    setActiveTaskSubTab("planner");
    onTabChange("tasks");
  };

  const handleSelectCalendar = () => {
    onDesktopPlannerSurfaceChange?.("calendar");
    onTabChange("planner");
  };

  const handleSelectPlannerList = () => {
    onDesktopPlannerSurfaceChange?.("list");
    onTabChange("planner");
  };

  const handleSelectDeadlines = () => {
    if (onDesktopTaskSubTabChange) {
      onDesktopTaskSubTabChange("deadlines");
      return;
    }
    setActiveTaskSubTab("deadlines");
    onTabChange("deadlines");
  };

  const handleSelectNotes = () => {
    onTabChange("notes");
  };

  const handleSelectJournal = () => {
    onTabChange("journal");
  };

  const formatSidebarDate = (date?: string) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "Chưa đặt ngày";
    return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
  };

  // ----------------------------------------------------
  // COLLAPSED MODE (w-[72px] icon-only navigation)
  // ----------------------------------------------------
  if (!isSidebarOpen) {
    return (
      <aside className="hidden md:flex flex-col items-center justify-between h-[calc(100vh-64px)] sticky top-16 bg-[#F8F9FA] dark:bg-[#141417] select-none z-20 shrink-0 w-16 py-2 px-2 transition-all duration-200 ease-in-out">
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* Desktop tạo đúng loại theo workspace hiện tại, không mở menu chọn loại. */}
          {createHandler && (
            <button
              type="button"
              onClick={createHandler}
              title={isEventWorkspace ? "Tạo sự kiện" : "Tạo công việc mới (N)"}
              aria-label={isEventWorkspace ? "Tạo sự kiện" : "Tạo công việc mới"}
              className="w-10 h-10 mb-2 rounded-2xl flex items-center justify-center bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] shadow-sm hover:bg-black active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} strokeWidth={2.6} />
            </button>
          )}

          <nav className="flex flex-col items-center gap-1.5 w-full" aria-label="Menu thu gọn">
            {isEventWorkspace && (
              <>
                <button
                  type="button"
                  onClick={handleSelectCalendar}
                  title="Lịch sự kiện"
                  aria-current={desktopPlannerSurface === "calendar" ? "page" : undefined}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    desktopPlannerSurface === "calendar"
                      ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                      : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                  } active:scale-95`}
                >
                  <CalendarIcon size={18} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={handleSelectPlannerList}
                  title="Dòng sự kiện"
                  aria-current={desktopPlannerSurface === "list" ? "page" : undefined}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                    desktopPlannerSurface === "list"
                      ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                      : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                  } active:scale-95`}
                >
                  <List size={18} strokeWidth={2.2} />
                </button>
              </>
            )}

            {isTaskWorkspace && (
              <>
            <button
              type="button"
              onClick={handleSelectAllTasks}
              title="Tất cả việc"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isAllTasksActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <ListTodo size={18} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              title="Hôm nay"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isTodayActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <Sun size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleSelectPlanner}
              title="Lịch công việc"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isTaskPlannerActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <CalendarIcon size={18} strokeWidth={2.2} />
            </button>

            </>
            )}

            {isTaskWorkspace && false && (
            <>
            <button
              type="button"
              onClick={handleSelectDeadlines}
              title="Hạn định & Quá hạn"
              className={`hidden w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer relative ${
                isDeadlinesActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <Hourglass size={18} strokeWidth={2.2} />
              {deadlineAlertTotal > 0 && (
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                  isDeadlinesActive ? "bg-white dark:bg-[#09090B]" : "bg-[#DC2626] dark:bg-[#EF4444]"
                }`} />
              )}
            </button>

            </>
            )}

            {isSecondaryWorkspace && (
            <>
            <button
              type="button"
              onClick={handleSelectNotes}
              title="Ghi chú phác thảo"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isNotesActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <FilePenLine size={18} strokeWidth={2.2} />
            </button>

            <button
              type="button"
              onClick={handleSelectJournal}
              title="Sổ nhật ký"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isJournalActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <BookOpen size={18} strokeWidth={2.2} />
            </button>
              </>
            )}
          </nav>
        </div>

        {/* Bottom Actions (Settings) */}
        {onOpenSettings && (
          <div className="flex flex-col items-center gap-1.5 w-full pt-2">
            <button
              type="button"
              onClick={onOpenSettings}
              title="Cài đặt"
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#78716C] hover:text-[#1C1917] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              <Settings size={18} strokeWidth={2.2} />
            </button>
          </div>
        )}
      </aside>
    );
  }

  // ----------------------------------------------------
  // EXPANDED MODE (Full 240px Navigation Sidebar)
  // ----------------------------------------------------
  return (
    <aside className="hidden md:flex flex-col justify-between h-[calc(100vh-64px)] sticky top-16 bg-[#F8F9FA] dark:bg-[#141417] select-none z-20 shrink-0 w-56 p-2 transition-all duration-200 ease-in-out">
      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar">
        {/* Tạo thẳng đúng loại theo workspace hiện tại. */}
        {createHandler && (
          <button
            type="button"
            onClick={createHandler}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-bold bg-[#09090B] dark:bg-white text-white dark:text-[#09090B] shadow-sm hover:bg-black active:scale-95 transition-all cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.6} />
            <span>{isEventWorkspace ? "Tạo sự kiện" : "Tạo công việc mới"}</span>
          </button>
        )}

        <div className="space-y-1">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#71717A] dark:text-[#A1A1AA] px-2 py-1">
            {isEventWorkspace
              ? "Không gian sự kiện"
              : isTaskWorkspace
                ? "Không gian công việc"
                : isNotesActive
                  ? "Ghi chú"
                  : "Nhật ký"}
          </p>

          {isTaskWorkspace && (
            <>
          {/* 1. TẤT CẢ VIỆC */}
          <button
            type="button"
            onClick={handleSelectAllTasks}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isAllTasksActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <ListTodo size={16} strokeWidth={2.2} />
              <span className={isAllTasksActive ? "font-bold" : ""}>Tất cả việc</span>
            </div>
            <span className={`font-mono text-[10px] ${
              isAllTasksActive ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
            }`}>
              {taskItems.length}
            </span>
          </button>
          {/* 1. HÔM NAY */}
          <section className="space-y-1 pt-2" aria-label="Danh sách công việc">
            <button
              type="button"
              onClick={() => setIsTaskListsOpen((open) => !open)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-left text-xs font-bold text-[#1C1917] dark:text-[var(--text-main)]"
              aria-expanded={isTaskListsOpen}
            >
              <span>Danh sách</span>
              {isTaskListsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {isTaskListsOpen && (
              <div className="space-y-0.5">
                {taskLists.map((taskList) => {
                  const isActive = activeTaskListTags.includes(taskList.name);
                  return (
                    <div key={taskList.name} className="group flex items-center gap-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => handleToggleTaskListFilter(taskList.name)}
                        className={`flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[var(--bg-surface-muted)] text-[var(--text-main)]"
                            : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                        }`}
                        aria-pressed={isActive}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          {isActive ? <CheckSquare size={16} strokeWidth={2.2} /> : <Square size={16} strokeWidth={2} />}
                          <span className="truncate">{taskList.name}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] opacity-75">{taskList.count}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingTaskListDeletion(taskList.name)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--text-muted)] opacity-0 transition-opacity hover:bg-[var(--accent-coral)]/10 hover:text-[var(--accent-coral)] group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label={`Xóa danh sách ${taskList.name}`}
                        title="Xóa danh sách"
                      >
                        <Trash2 size={14} strokeWidth={2.2} />
                      </button>
                    </div>
                  );
                })}

                {isCreatingTaskList ? (
                  <form
                    onSubmit={handleCreateTaskList}
                    onBlur={(event) => {
                      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                      setIsCreatingTaskList(false);
                      setNewTaskListName("");
                    }}
                    className="flex items-center gap-1.5 px-2 pt-1"
                  >
                    <input
                      autoFocus
                      value={newTaskListName}
                      onChange={(event) => setNewTaskListName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setIsCreatingTaskList(false);
                          setNewTaskListName("");
                        }
                      }}
                      placeholder="Tên danh sách"
                      className="min-w-0 flex-1 rounded-lg bg-[var(--bg-surface-muted)] px-2 py-1.5 text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)] focus:ring-1 focus:ring-[var(--accent-sky)]"
                    />
                    <button
                      type="submit"
                      className="rounded-lg px-2 py-1.5 text-[11px] font-bold text-[var(--accent-sky)] hover:bg-[var(--accent-sky)]/10"
                    >
                      Thêm
                    </button>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsCreatingTaskList(true)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#71717A] transition-colors hover:bg-black/5 hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white cursor-pointer"
                  >
                    <Plus size={16} strokeWidth={2.2} /> Tạo danh sách mới
                  </button>
                )}
              </div>
            )}
          </section>
          <button
            type="button"
            onClick={handleSelectToday}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isTodayActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <Sun size={16} strokeWidth={2.2} />
              <span className={isTodayActive ? "font-bold" : ""}>Hôm nay</span>
            </div>
            {pendingTodayCount > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                isTodayActive
                  ? "bg-white text-[#09090B] dark:bg-[#141417] dark:text-white"
                  : "bg-black/10 text-[#09090B] dark:bg-white/15 dark:text-[#FFFFFF]"
              }`}>
                {pendingTodayCount}
              </span>
            )}
          </button>
            </>
          )}

          {isEventWorkspace && (
            <>
              {/* === PHẦN: TABS LỊCH DESKTOP === */}
              <button
                type="button"
                onClick={handleSelectCalendar}
                aria-current={desktopPlannerSurface === "calendar" ? "page" : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  desktopPlannerSurface === "calendar"
                    ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                } active:scale-95`}
              >
                <CalendarIcon size={16} strokeWidth={2.2} />
                <span className="font-bold">Lịch sự kiện</span>
              </button>
              <button
                type="button"
                onClick={handleSelectPlannerList}
                aria-current={desktopPlannerSurface === "list" ? "page" : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
                  desktopPlannerSurface === "list"
                    ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                    : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
                } active:scale-95`}
              >
                <List size={16} strokeWidth={2.2} />
                <span className="font-bold">Dòng sự kiện</span>
              </button>
            </>
          )}

          {isTaskWorkspace && (
            <>
          <button
            type="button"
            onClick={handleSelectPlanner}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isTaskPlannerActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <CalendarIcon size={16} strokeWidth={2.2} />
            <span className={isTaskPlannerActive ? "font-bold" : ""}>Lịch công việc</span>
          </button>

          {/* 3. HẠN ĐỊNH */}
          <button
            type="button"
            onClick={handleSelectDeadlines}
            className={`hidden w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isDeadlinesActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <Hourglass size={16} strokeWidth={2.2} />
              <span className={isDeadlinesActive ? "font-bold" : ""}>Hạn định</span>
            </div>
            {deadlineAlertTotal > 0 && (
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold min-w-[20px] text-center ${
                isDeadlinesActive
                  ? "bg-white text-[#09090B] dark:bg-[#141417] dark:text-white"
                  : "bg-[#DC2626] text-white dark:bg-[#EF4444] dark:text-white"
              }`}>
                {deadlineAlertTotal}
              </span>
            )}
          </button>

            </>
          )}

          {isSecondaryWorkspace && (
            <>

          {/* 4. GHI CHÚ */}
          <button
            type="button"
            onClick={handleSelectNotes}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isNotesActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <FilePenLine size={16} strokeWidth={2.2} />
              <span className={isNotesActive ? "font-bold" : ""}>Ghi chú</span>
            </div>
            {notesCount > 0 && (
              <span className={`font-mono text-[10px] ${
                isNotesActive ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
              }`}>
                {notesCount}
              </span>
            )}
          </button>

          {/* 5. SỔ NHẬT KÝ */}
          <button
            type="button"
            onClick={handleSelectJournal}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isJournalActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={16} strokeWidth={2.2} />
              <span className={isJournalActive ? "font-bold" : ""}>Nhật ký</span>
            </div>
            {journalEntries.length > 0 && (
              <span className={`font-mono text-[10px] ${
                isJournalActive ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
              }`}>
                {journalEntries.length}
              </span>
            )}
          </button>
            </>
          )}
        </div>

        {/* === PHẦN: TÓM TẮT THEO NGỮ CẢNH DESKTOP === */}
        <section data-desktop-sidebar-summary className="mt-3 pt-3" aria-label="Tóm tắt không gian đang mở">
          {isAllTasksActive ? (
            <>
              <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
                Tất cả việc
              </p>
              <div className="mt-2 rounded-2xl bg-white/70 p-3 shadow-xs dark:bg-[#2C2C2E]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">Tổng số việc</span>
                  <span className="font-mono text-[10px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
                    {taskItems.filter((task) => !task.completed).length} đang làm
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-[#78716C] dark:text-[#A1A1AA]">
                  Gồm cả việc chưa đặt ngày và việc đã hoàn thành.
                </p>
              </div>
              <SidebarTaskPreview title="Việc sắp tới" tasks={upcomingTasks} formatDate={formatSidebarDate} />
            </>
          ) : isTodayActive ? (
            <>
              <p className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
                Hôm nay
              </p>
              <div className="mt-2 rounded-2xl bg-white/70 p-3 shadow-xs dark:bg-[#2C2C2E]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7]">Tiến độ</span>
                  <span className="font-mono text-[10px] font-bold text-[#78716C] dark:text-[#A1A1AA]">
                    {completedTodayCount}/{todayTasks.length || 0}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E7E5E4] dark:bg-[#3A3A3C]">
                  <div
                    className="h-full rounded-full bg-[#1C1917] transition-[width] duration-200 dark:bg-white"
                    style={{ width: `${todayProgress}%` }}
                  />
                </div>
              </div>
              <SidebarTaskPreview title="Việc kế tiếp" tasks={upcomingTasks} formatDate={formatSidebarDate} />
            </>
          ) : isEventWorkspace ? (
            <SidebarTaskPreview
              title="Sự kiện sắp tới"
              tasks={upcomingEvents}
              formatDate={formatSidebarDate}
              emptyLabel="Chưa có sự kiện sắp tới"
            />
          ) : isTaskPlannerActive ? (
            <SidebarTaskPreview title="Lịch sắp tới" tasks={upcomingTasks} formatDate={formatSidebarDate} />
          ) : isDeadlinesActive ? (
            <>
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#78716C] dark:text-[#A1A1AA]">
                  Cần xử lý
                </p>
                <span className="rounded-full bg-[#FF3B30]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#FF3B30]">
                  {overdueCount} quá hạn
                </span>
              </div>
              <SidebarTaskPreview tasks={overdueTasks} formatDate={formatSidebarDate} />
            </>
          ) : isNotesActive ? (
            <SidebarTextPreview
              title="Ghi chú gần đây"
              items={recentNotes.map((note) => ({
                id: note.id,
                label: note.title || "Ghi chú không tiêu đề",
                meta: note.updatedAt,
              }))}
            />
          ) : isJournalActive ? (
            <SidebarTextPreview
              title="Nhật ký gần đây"
              items={recentJournalDays.map(([date, count]) => ({
                id: date,
                label: formatSidebarDate(date),
                meta: `${count} ghi chép`,
              }))}
              emptyLabel="Chưa có ngày ghi chép"
            />
          ) : (
            <SidebarTaskPreview title="Tổng quan hôm nay" tasks={upcomingTasks} formatDate={formatSidebarDate} />
          )}
        </section>
      </div>

      {/* FOOTER ACTIONS (CÀI ĐẶT) */}
      {onOpenSettings && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-[#71717A] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          >
            <Settings size={16} strokeWidth={2.2} />
            <span>Cài đặt</span>
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(pendingTaskListDeletion)}
        title="Xóa danh sách"
        message={`Xóa danh sách "${pendingTaskListDeletion || ""}" sẽ gỡ nhãn này khỏi các công việc đang dùng nó. Công việc vẫn được giữ lại.`}
        confirmText="Xóa danh sách"
        cancelText="Hủy"
        onConfirm={handleConfirmTaskListDeletion}
        onCancel={() => setPendingTaskListDeletion(null)}
      />
    </aside>
  );
};
