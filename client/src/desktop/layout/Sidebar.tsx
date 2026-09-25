// ==========================================
// COMPONENT: Desktop Sidebar (Central Ink & Paper Navigation)
// ==========================================

import React from "react";
import { TabKey, TaskSubTab } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  Calendar as CalendarIcon,
  FilePenLine,
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
  getTaskTag,
} from "../../utils/taskSemantics";
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

  const taskItems = tasks.filter((task) => getTaskItemType(task) !== "event");
  const eventItems = tasks.filter((task) => getTaskItemType(task) === "event");
  const taskLists = tags
    .map((name) => ({
      name,
      count: taskItems.filter((task) => getTaskTag(task) === name).length,
    }))
    .sort((first, second) => first.name.localeCompare(second.name, "vi"));

  const notes = loadNotesFromStorage();
  const notesCount = notes.length;

  // Active state determinations
  const isAllTasksActive = activeTab === "tasks" && activeTaskSubTab === "all";
  const isEventWorkspace = activeTab === "events";
  const isTaskWorkspace = activeTab === "tasks";
  const isSecondaryWorkspace = activeTab === "notes" || activeTab === "journal";
  const createHandler = isEventWorkspace
    ? onCreateEvent
    : isTaskWorkspace
      ? onCreateTask
      : undefined;

  // Handlers
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
      if (getTaskTag(task) !== tagToDelete) return;
      updateTask(task.id, {
        tag: undefined,
        tags: undefined,
      });
    });
    deleteTag(tagToDelete);
    setActiveTaskListTags(
      activeTaskListTags.filter((activeTag) => activeTag !== tagToDelete),
    );
    setPendingTaskListDeletion(null);
  };

  const handleSelectCalendar = () => {
    onDesktopPlannerSurfaceChange?.("calendar");
    onTabChange("events");
  };

  const handleSelectPlannerList = () => {
    onDesktopPlannerSurfaceChange?.("list");
    onTabChange("events");
  };

  const handleSelectWriting = () => {
    onTabChange("notes");
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
              data-onboarding="desktop-create"
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
              data-onboarding="desktop-tasks"
              onClick={handleSelectAllTasks}
              title="Công việc"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isAllTasksActive
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white/[0.12] dark:text-white"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <ListTodo size={18} strokeWidth={2.2} />
            </button>

            </>
            )}

            {isSecondaryWorkspace && (
            <>
            <button
              type="button"
              onClick={handleSelectWriting}
              title="Ghi chép"
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                isSecondaryWorkspace
                  ? "bg-[#09090B] text-white shadow-sm dark:bg-white/[0.12] dark:text-white"
                  : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
              } active:scale-95`}
            >
              <FilePenLine size={18} strokeWidth={2.2} />
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
                : "Ghi chép"}
          </p>

          {isTaskWorkspace && (
            <>
          {/* === PHẦN 1: WORKSPACE CÔNG VIỆC DUY NHẤT === */}
          <button
            type="button"
            data-onboarding="desktop-tasks"
            onClick={handleSelectAllTasks}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isAllTasksActive
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <ListTodo size={16} strokeWidth={2.2} />
              <span className={isAllTasksActive ? "font-bold" : ""}>Công việc</span>
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

          {isSecondaryWorkspace && (
            <>
          {/* === PHAN 4: MOT DIEM VAO GHI CHEP, DOI BANG TAB CON === */}
          <button
            type="button"
            onClick={handleSelectWriting}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${
              isSecondaryWorkspace
                ? "bg-[#09090B] text-white shadow-sm dark:bg-white dark:text-[#09090B]"
                : "text-[#71717A] dark:text-[#A1A1AA] hover:bg-black/5 hover:text-[#09090B] dark:hover:bg-white/10 dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="flex items-center gap-2.5">
              <FilePenLine size={16} strokeWidth={2.2} />
              <span className={isSecondaryWorkspace ? "font-bold" : ""}>Ghi chép</span>
            </div>
            {notesCount + journalEntries.length > 0 && (
              <span className={`font-mono text-[10px] ${
                isSecondaryWorkspace ? "text-white/80 dark:text-[#09090B]/80" : "text-[#71717A] dark:text-[#A1A1AA]"
              }`}>
                {notesCount + journalEntries.length}
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
                Công việc
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
            </>
          ) : isEventWorkspace ? (
            <div className="flex items-center justify-between gap-2 px-1 text-xs font-semibold text-[var(--text-main)]">
              <span>Sự kiện</span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                {eventItems.length} mục
              </span>
            </div>
          ) : isSecondaryWorkspace ? (
            <div className="px-1 text-xs text-[var(--text-muted)]">
              <p className="font-semibold text-[var(--text-main)]">Ghi chú và nhật ký</p>
              <p className="mt-1 text-[11px]">Chuyển loại nội dung bằng tab ngay trong vùng làm việc.</p>
            </div>
          ) : null}
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
