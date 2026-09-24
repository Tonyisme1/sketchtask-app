import React, { useMemo } from "react";
import { CheckCircle2, ListFilter, Search, X } from "lucide-react";
import { TaskPriority } from "../../types";
import { TaskScreenModel } from "../../features/tasks/model/createTaskScreenModel";
import { formatFullDate } from "../../utils/date";
import { getTaskItemType, getTaskTags } from "../../utils/taskSemantics";
import { DesktopTaskGroup } from "../components/tasks/DesktopTaskGroup";
import { groupDesktopTasksByDate } from "../../components/shared/common/desktopTaskListUtils";
import { useAppStore } from "../../stores/appStore";
import { CustomSelect } from "../../components/ui/pickers/select/CustomSelect";

export interface DesktopAllTasksViewProps {
  model: TaskScreenModel;
  targetTaskId?: string;
}

const priorityOptions: Array<{ value: TaskPriority; label: string }> = [
  { value: "high", label: "Gấp" },
  { value: "medium", label: "Vừa" },
  { value: "low", label: "Thấp" },
];

export const DesktopAllTasksView: React.FC<DesktopAllTasksViewProps> = ({ model, targetTaskId }) => {
  const { allTasks, filters, tags } = model;
  const { openQuickTaskModal } = useAppStore();
  const {
    setSearchQuery,
    setFilterType,
    setSelectedPriority,
    setSelectedTag,
    resetFilters,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    openTaskDetail,
  } = model.actions;

  // The shared task model remains available to smaller layouts. Desktop filters
  // the event workspace at the presentation boundary.
  const taskItems = useMemo(
    () => allTasks.filter((task) => getTaskItemType(task) !== "event"),
    [allTasks],
  );
  const taskTags = useMemo(() => {
    const taskTagSet = new Set<string>();
    taskItems.forEach((task) => getTaskTags(task).forEach((tag) => taskTagSet.add(tag)));
    return tags.filter((tag) => taskTagSet.has(tag));
  }, [tags, taskItems]);
  const groups = useMemo(() => groupDesktopTasksByDate(taskItems), [taskItems]);
  const hasFilters = Boolean(
    filters.searchQuery ||
      filters.filterType !== "all" ||
      filters.selectedPriority ||
      filters.selectedTag ||
      filters.selectedListTags.length > 0,
  );

  const formatGroupTitle = (dateStr: string) =>
    dateStr === "no-date" ? "Chưa đặt ngày" : formatFullDate(dateStr);

  return (
    <div className="w-full min-w-0 pb-16 select-none animate-in fade-in duration-150">
      {/* === PHẦN 1: Header và bộ lọc chung === */}
      <header className="hidden space-y-4 pb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={21} className="text-[var(--accent-sky)]" strokeWidth={2.3} />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[var(--text-main)]">Tất cả việc</h1>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{taskItems.length} mục theo ngày hiệu lực</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openQuickTaskModal({ itemType: "task", lockItemType: true })}
            className="rounded-2xl bg-[var(--text-main)] px-4 py-2 text-xs font-bold text-[var(--bg-surface)] transition-colors hover:opacity-85 shadow-sm active:scale-95 cursor-pointer"
          >
            + Thêm việc
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl bg-[var(--bg-surface)] px-3.5 py-2 shadow-xs focus-within:ring-2 focus-within:ring-[var(--accent-blue)]/30">
            <Search size={15} className="shrink-0 text-[var(--text-muted)]" />
            <input
              type="search"
              value={filters.searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Tìm trong tất cả việc..."
              className="min-w-0 flex-1 bg-transparent text-xs text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
                aria-label="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="flex items-center gap-1 rounded-2xl bg-[var(--bg-surface-muted)] p-1">
            {(["all", "active", "completed"] as const).map((filterType) => (
              <button
                key={filterType}
                type="button"
                onClick={() => setFilterType(filterType)}
                className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                  filters.filterType === filterType
                    ? "bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs"
                    : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                }`}
              >
                {filterType === "all" ? "Tất cả" : filterType === "active" ? "Đang làm" : "Đã xong"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-[var(--bg-surface)] px-3 py-2 text-[11px] text-[var(--text-muted)] shadow-xs">
            <ListFilter size={13} />
            <CustomSelect
              className="w-[112px]"
              options={[
                { value: "", label: "Ưu tiên" },
                ...priorityOptions,
              ]}
              value={filters.selectedPriority || ""}
              onChange={(value) => setSelectedPriority((value || undefined) as TaskPriority | undefined)}
              placeholder="Ưu tiên"
            />
          </div>

          {taskTags.length > 0 && (
            <CustomSelect
              className="w-[132px]"
              options={[
                { value: "", label: "Tất cả tag" },
                ...taskTags.map((tag) => ({ value: tag, label: `#${tag}` })),
              ]}
              value={filters.selectedTag || ""}
              onChange={(value) => setSelectedTag(value || undefined)}
              placeholder="Tag"
            />
          )}

          {hasFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-bold text-[var(--accent-coral)] hover:bg-[var(--accent-coral)]/10 cursor-pointer transition-colors"
            >
              <X size={13} /> Xóa lọc
            </button>
          )}
        </div>
      </header>

      {/* === PHẦN 2: Nhóm theo ngày, không bọc thêm section card === */}
      {groups.length === 0 ? (
        <DesktopTaskGroup
          title="Tất cả việc"
          tasks={[]}
          subtitle="0 mục"
          emptyMessage="Không có công việc phù hợp"
          emptySubMessage="Thử đổi bộ lọc hoặc thêm một việc mới."
          onToggle={toggleTask}
          onOpenTask={(task) => openTaskDetail(task.id)}
          onDelete={deleteTask}
          onMoveTomorrow={moveTaskToTomorrow}
          onAddTask={() => openQuickTaskModal({ itemType: "task", lockItemType: true })}
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <DesktopTaskGroup
              key={group.dateStr}
              title={formatGroupTitle(group.dateStr)}
              dateStr={group.dateStr === "no-date" ? undefined : group.dateStr}
              tasks={group.tasks}
              subtitle={`${group.tasks.filter((task) => task.completed).length}/${group.tasks.length} việc đã xong`}
              variant="planner"
              activeTaskId={targetTaskId}
              onToggle={toggleTask}
              onOpenTask={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
            />
          ))}
        </div>
      )}
    </div>
  );
};
