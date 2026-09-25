import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ClipboardList,
  FilePlus2,
  ListChecks,
  Play,
  Trash2,
} from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import {
  AIActionProposal,
  AIProposalAction,
  ParsedTaskIntent,
} from "../../../services/aiAgentService";
import { loadNotesFromStorage, saveNotesToStorage } from "../../../utils/noteStorage";
import { getTaskItemType } from "../../../utils/taskSemantics";

const APPLIED_ITEMS_KEY = "sketchtask_ai_applied_proposal_items_v1";

const readAppliedItemIds = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(APPLIED_ITEMS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
};

const writeAppliedItemIds = (itemIds: string[]) => {
  try {
    const ids = new Set([...readAppliedItemIds(), ...itemIds]);
    localStorage.setItem(APPLIED_ITEMS_KEY, JSON.stringify([...ids].slice(-300)));
  } catch {
    // Applying an item still succeeds if browser storage is unavailable.
  }
};

const createLocalId = (prefix: string) => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    // Fall back for older WebViews.
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

type ProposalItem = {
  id: string;
  action: AIProposalAction;
  label: string;
  task?: ParsedTaskIntent;
};

const getActionItems = (
  proposalId: string,
  action: AIProposalAction,
  actionIndex: number,
): ProposalItem[] => {
  const prefix = `${proposalId}:${actionIndex}`;
  if (action.type === "create_tasks") {
    return action.tasks.map((task, taskIndex) => ({
      id: `${prefix}:task:${taskIndex}`,
      action,
      task,
      label: task.title,
    }));
  }
  if (action.type === "breakdown_goal") {
    return action.plan.subtasks.map((task, taskIndex) => ({
      id: `${prefix}:step:${taskIndex}`,
      action,
      task,
      label: task.title,
    }));
  }
  if (action.type === "complete_task") return [{ id: `${prefix}:complete`, action, label: "Đánh dấu hoàn thành" }];
  if (action.type === "delete_task") return [{ id: `${prefix}:delete`, action, label: "Xóa công việc" }];
  if (action.type === "create_journal_entry") return [{ id: `${prefix}:journal`, action, label: "Thêm mục nhật ký" }];
  return [{ id: `${prefix}:note`, action, label: `Tạo ghi chú “${action.title || "Không tiêu đề"}”` }];
};

const getItemIcon = (item: ProposalItem) => {
  switch (item.action.type) {
    case "create_tasks":
    case "breakdown_goal":
      return <ListChecks size={14} strokeWidth={2.2} />;
    case "complete_task":
      return <Check size={14} strokeWidth={2.2} />;
    case "delete_task":
      return <Trash2 size={14} strokeWidth={2.2} />;
    case "create_journal_entry":
      return <BookOpen size={14} strokeWidth={2.2} />;
    case "create_note":
      return <FilePlus2 size={14} strokeWidth={2.2} />;
  }
};

export interface AIActionProposalCardProps {
  proposal: AIActionProposal;
}

/** AI can only suggest changes here; the person selects every mutation explicitly. */
export const AIActionProposalCard: React.FC<AIActionProposalCardProps> = ({ proposal }) => {
  const { tasks, addTask, toggleTask, deleteTask, addJournalEntry } = useAppStore();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => new Set());
  const [appliedItemIds, setAppliedItemIds] = useState<Set<string>>(
    () => new Set(readAppliedItemIds()),
  );
  const taskTitleById = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);
  const items = useMemo(
    () => proposal.actions.flatMap((action, index) => getActionItems(proposal.id, action, index)),
    [proposal],
  );
  const availableItems = items.filter((item) => !appliedItemIds.has(item.id));
  const selectedItems = availableItems.filter((item) => selectedItemIds.has(item.id));

  const setItemSelected = (itemId: string, checked: boolean) => {
    setSelectedItemIds((previous) => {
      const next = new Set(previous);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const toggleAll = () => {
    const areAllSelected = availableItems.length > 0 && availableItems.every(
      (item) => selectedItemIds.has(item.id),
    );
    setSelectedItemIds(areAllSelected ? new Set() : new Set(availableItems.map((item) => item.id)));
  };

  const applySelected = () => {
    if (isApplying || selectedItems.length === 0) return;
    const selectedDeletes = selectedItems.filter((item) => item.action.type === "delete_task");
    if (
      selectedDeletes.length > 0 &&
      !window.confirm(`Bạn đã chọn xóa ${selectedDeletes.length} công việc. Tiếp tục chứ?`)
    ) return;

    setIsApplying(true);
    try {
      const selectedByAction = new Map<AIProposalAction, ProposalItem[]>();
      selectedItems.forEach((item) => {
        const current = selectedByAction.get(item.action) || [];
        current.push(item);
        selectedByAction.set(item.action, current);
      });

      selectedByAction.forEach((actionItems, action) => {
        if (action.type === "create_tasks") {
          actionItems.forEach((item) => item.task && addTask(item.task));
          return;
        }
        if (action.type === "breakdown_goal") {
          const parentId = action.plan.targetTaskId || addTask({
            title: action.plan.goalTitle,
            priority: "medium",
            description: "Mục tiêu được tạo từ đề xuất AI đã được chọn.",
          }).id;
          actionItems.forEach((item) => item.task && addTask({ ...item.task, parentTaskId: parentId }));
          return;
        }
        if (action.type === "complete_task") {
          const task = tasks.find((candidate) => candidate.id === action.taskId);
          if (task && !task.completed && getTaskItemType(task) !== "event") toggleTask(task.id);
          return;
        }
        if (action.type === "delete_task") {
          if (tasks.some((task) => task.id === action.taskId)) deleteTask(action.taskId);
          return;
        }
        if (action.type === "create_journal_entry") {
          addJournalEntry({
            date: action.date,
            time: action.time,
            content: action.content,
            linkedTaskId: action.linkedTaskId,
          });
          return;
        }

        const timestamp = new Date().toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const noteContent = action.content
          ? `<p>${escapeHtml(action.content).replaceAll("\n", "<br />")}</p>`
          : "";
        saveNotesToStorage([
          {
            id: createLocalId("note"),
            title: action.title || "Ghi chú không tiêu đề",
            content: noteContent,
            createdAt: timestamp,
            updatedAt: timestamp,
            isPinned: false,
          },
          ...loadNotesFromStorage(),
        ]);
      });

      const appliedIds = selectedItems.map((item) => item.id);
      writeAppliedItemIds(appliedIds);
      setAppliedItemIds((previous) => new Set([...previous, ...appliedIds]));
      setSelectedItemIds(new Set());
    } finally {
      setIsApplying(false);
    }
  };

  const areAllAvailableSelected = availableItems.length > 0 && availableItems.every(
    (item) => selectedItemIds.has(item.id),
  );

  return (
    <div className="mt-3 rounded-2xl bg-[var(--bg-surface-muted)] p-3.5 shadow-xs">
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0 text-[var(--accent-blue)]">
          <ClipboardList size={16} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-[var(--text-main)]">Đề xuất thay đổi</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                Chọn từng mục trước khi áp dụng. AI không tự thay đổi dữ liệu.
              </p>
            </div>
            {availableItems.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="shrink-0 text-[11px] font-semibold text-[var(--accent-blue)] hover:text-[var(--accent-blue-hover)]"
              >
                {areAllAvailableSelected ? "Bỏ chọn" : "Chọn tất cả"}
              </button>
            )}
          </div>

          <div className="mt-2.5 space-y-1.5">
            {items.map((item) => {
              const isApplied = appliedItemIds.has(item.id);
              const taskTitle = item.action.type === "complete_task" || item.action.type === "delete_task"
                ? taskTitleById.get(item.action.taskId) || "Công việc đã thay đổi"
                : undefined;
              return (
                <label
                  key={item.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-xs transition-colors ${
                    isApplied
                      ? "bg-black/[0.03] text-[var(--text-muted)] opacity-70 dark:bg-white/[0.05]"
                      : "bg-[var(--bg-surface)] text-[var(--text-main)] hover:bg-[var(--bg-interactive)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isApplied || selectedItemIds.has(item.id)}
                    disabled={isApplied || isApplying}
                    onChange={(event) => setItemSelected(item.id, event.target.checked)}
                    className="h-3.5 w-3.5 shrink-0 accent-[var(--accent-blue)]"
                  />
                  <span className="shrink-0 text-[var(--accent-blue)]">{getItemIcon(item)}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.label}{taskTitle ? ` · ${taskTitle}` : ""}
                  </span>
                  {isApplied && <Check size={13} className="shrink-0 text-[var(--accent-blue)]" strokeWidth={2.5} />}
                </label>
              );
            })}
          </div>

          <button
            type="button"
            onClick={applySelected}
            disabled={isApplying || selectedItems.length === 0}
            className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-[var(--accent-blue)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-blue-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play size={13} strokeWidth={2.4} />
            {isApplying ? "Đang áp dụng..." : `Áp dụng ${selectedItems.length} mục đã chọn`}
          </button>
        </div>
      </div>
    </div>
  );
};
