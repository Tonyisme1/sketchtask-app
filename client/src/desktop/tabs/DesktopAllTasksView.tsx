import React, { useMemo } from "react";
import { Tags, X } from "lucide-react";
import { TaskScreenModel } from "../../features/tasks/model/createTaskScreenModel";
import { getTaskItemType, getTaskTag } from "../../utils/taskSemantics";
import { DesktopTaskGroup } from "../components/tasks/DesktopTaskGroup";
import { useAppStore } from "../../stores/appStore";

export interface DesktopAllTasksViewProps {
  model: TaskScreenModel;
  targetTaskId?: string;
}

export const DesktopAllTasksView: React.FC<DesktopAllTasksViewProps> = ({ model, targetTaskId }) => {
  const { allTasks, filters, tasks: sourceTasks } = model;
  const { openQuickTaskModal, activeTaskListTags, setActiveTaskListTags } = useAppStore();
  const {
    setSelectedTag,
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
    sourceTasks.forEach((task) => {
      if (getTaskItemType(task) === "event") return;
      const tag = getTaskTag(task);
      if (tag) taskTagSet.add(tag);
    });
    return [...taskTagSet].sort((firstTag, secondTag) => firstTag.localeCompare(secondTag, "vi"));
  }, [sourceTasks]);
  const tagGroups = useMemo(() => {
    const groupedTasks = new Map<string, typeof taskItems>();
    const untaggedTasks: typeof taskItems = [];

    taskItems.forEach((task) => {
      const tag = getTaskTag(task);
      if (!tag) {
        untaggedTasks.push(task);
        return;
      }

      const group = groupedTasks.get(tag) || [];
      group.push(task);
      groupedTasks.set(tag, group);
    });

    const taggedGroups = [...groupedTasks.entries()]
      .sort(([firstTag], [secondTag]) => firstTag.localeCompare(secondTag, "vi"))
      .map(([tag, tasks]) => ({
        key: `tag:${tag}`,
        title: `#${tag}`,
        tasks,
      }));

    return untaggedTasks.length > 0
      ? [...taggedGroups, { key: "untagged", title: "Chưa gắn tag", tasks: untaggedTasks }]
      : taggedGroups;
  }, [taskItems]);
  const selectedTags = filters.selectedTag ? [filters.selectedTag] : activeTaskListTags;

  const toggleTagFilter = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((selectedTag) => selectedTag !== tag)
      : [...selectedTags, tag];

    // Chuyển mọi filter tag cũ về cùng một nguồn đa chọn của workspace Desktop.
    setSelectedTag(undefined);
    setActiveTaskListTags(nextTags);
  };

  const clearTagFilters = () => {
    setSelectedTag(undefined);
    setActiveTaskListTags([]);
  };

  return (
    <div className="w-full min-w-0 pb-16 select-none animate-in fade-in duration-150">
      {/* === PHẦN 1: Lọc tag đa chọn tại chính workspace Desktop === */}
      {taskTags.length > 0 && (
        <section className="mb-5 flex flex-wrap items-center gap-2.5" aria-label="Lọc công việc theo tag">
          <div className="flex items-center gap-1.5 pr-1 text-xs font-bold text-[var(--text-muted)]">
            <Tags size={15} strokeWidth={2.3} />
            <span>Tag</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearTagFilters}
              aria-pressed={selectedTags.length === 0}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer active:scale-95 ${
                selectedTags.length === 0
                  ? "bg-[var(--text-strong)] text-[var(--bg-surface)]"
                  : "bg-[var(--bg-surface-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-main)]"
              }`}
            >
              Tất cả
            </button>
            {taskTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              const tagCount = sourceTasks.filter(
                (task) => getTaskItemType(task) !== "event" && getTaskTag(task) === tag,
              ).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTagFilter(tag)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer active:scale-95 ${
                    isSelected
                      ? "bg-[var(--accent-blue)] text-[var(--text-on-accent)]"
                      : "bg-[var(--bg-surface-muted)] text-[var(--text-main)] hover:bg-[var(--bg-interactive)]"
                  }`}
                >
                  <span>#{tag}</span>
                  <span className={isSelected ? "text-[var(--text-on-accent)]/80" : "text-[var(--text-muted)]"}>
                    {tagCount}
                  </span>
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={clearTagFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--text-muted)] transition-colors hover:text-[var(--text-main)] cursor-pointer"
            >
              <X size={14} /> Bỏ chọn
            </button>
          )}
        </section>
      )}

      {/* === PHẦN 2: Nhóm tag thành các khối công việc có nhịp điệu === */}
      {tagGroups.length === 0 ? (
        <DesktopTaskGroup
          title="Công việc"
          tasks={[]}
          subtitle="0 mục"
          emptyMessage="Không có công việc phù hợp"
          emptySubMessage="Thử đổi bộ lọc hoặc thêm một việc mới."
          onToggle={toggleTask}
          onOpenTask={(task) => openTaskDetail(task.id)}
          onDelete={deleteTask}
          onMoveTomorrow={moveTaskToTomorrow}
          onAddTask={() => openQuickTaskModal({ itemType: "task", lockItemType: true })}
          visualStyle="tag"
        />
      ) : (
        <div className="space-y-5">
          {tagGroups.map((group, index) => (
            <DesktopTaskGroup
              key={group.key}
              title={group.title}
              tasks={group.tasks}
              subtitle={`${group.tasks.filter((task) => task.completed).length}/${group.tasks.length} việc đã xong`}
              variant="planner"
              activeTaskId={targetTaskId}
              onToggle={toggleTask}
              onOpenTask={(task) => openTaskDetail(task.id)}
              onDelete={deleteTask}
              onMoveTomorrow={moveTaskToTomorrow}
              visualStyle="tag"
              accentIndex={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};
