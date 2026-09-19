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
import { AIActionProposal, AIProposalAction } from "../../../services/aiAgentService";
import { loadNotesFromStorage, saveNotesToStorage } from "../../../utils/noteStorage";
import { getTaskItemType } from "../../../utils/taskSemantics";

const APPLIED_PROPOSALS_KEY = "sketchtask_ai_applied_proposals_v1";

const readAppliedProposalIds = (): string[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(APPLIED_PROPOSALS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
};

const writeAppliedProposalId = (proposalId: string) => {
  try {
    const ids = new Set(readAppliedProposalIds());
    ids.add(proposalId);
    localStorage.setItem(APPLIED_PROPOSALS_KEY, JSON.stringify([...ids].slice(-100)));
  } catch {
    // The proposal can still be applied for the current session if storage is unavailable.
  }
};

const createLocalId = (prefix: string) => {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch {
    // Fall back for old webviews.
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

const actionLabel = (action: AIProposalAction) => {
  switch (action.type) {
    case "create_tasks":
      return `Tạo ${action.tasks.length} công việc`;
    case "breakdown_goal":
      return `Chia mục tiêu thành ${action.plan.subtasks.length} bước`;
    case "complete_task":
      return "Đánh dấu một công việc hoàn thành";
    case "delete_task":
      return "Xóa một công việc";
    case "create_journal_entry":
      return "Thêm một mục nhật ký";
    case "create_note":
      return `Tạo ghi chú “${action.title || "Không tiêu đề"}”`;
  }
};

const actionIcon = (action: AIProposalAction) => {
  switch (action.type) {
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

export const AIActionProposalCard: React.FC<AIActionProposalCardProps> = ({ proposal }) => {
  const { tasks, addTask, toggleTask, deleteTask, addJournalEntry } = useAppStore();
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(() => readAppliedProposalIds().includes(proposal.id));
  const taskTitleById = useMemo(() => new Map(tasks.map((task) => [task.id, task.title])), [tasks]);

  const applyProposal = () => {
    if (isApplying || isApplied) return;

    const deleteActions = proposal.actions.filter((action) => action.type === "delete_task");
    if (
      deleteActions.length > 0 &&
      !window.confirm(`Đề xuất này sẽ xóa ${deleteActions.length} công việc. Bạn có chắc muốn tiếp tục không?`)
    ) {
      return;
    }

    setIsApplying(true);
    try {
      for (const action of proposal.actions) {
        if (action.type === "create_tasks") {
          for (const task of action.tasks) {
            addTask(task);
          }
          continue;
        }

        if (action.type === "breakdown_goal") {
          const parentId = action.plan.targetTaskId || addTask({
            title: action.plan.goalTitle,
            dueDate: action.plan.subtasks[0]?.dueDate,
            timeType: "task",
            priority: "medium",
            description: "Mục tiêu được tạo từ kế hoạch AI.",
          }).id;

          for (const subtask of action.plan.subtasks) {
            addTask({ ...subtask, parentTaskId: parentId });
          }
          continue;
        }

        if (action.type === "complete_task") {
          const task = tasks.find((candidate) => candidate.id === action.taskId);
          if (task && !task.completed && getTaskItemType(task) !== "event") toggleTask(task.id);
          continue;
        }

        if (action.type === "delete_task") {
          if (tasks.some((task) => task.id === action.taskId)) deleteTask(action.taskId);
          continue;
        }

        if (action.type === "create_journal_entry") {
          addJournalEntry({
            date: action.date,
            time: action.time,
            content: action.content,
            linkedTaskId: action.linkedTaskId,
          });
          continue;
        }

        if (action.type === "create_note") {
          const timestamp = new Date().toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          });
          const currentNotes = loadNotesFromStorage();
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
            ...currentNotes,
          ]);
        }
      }

      writeAppliedProposalId(proposal.id);
      setIsApplied(true);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="mt-3 border-[1.5px] border-[#262626] bg-[#FAF8F3] p-3 shadow-[2px_2px_0px_#262626] dark:border-[#A1A1AA] dark:bg-[#27272A] dark:shadow-none">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0 text-[#57534E] dark:text-[#D4D4D8]">
          <ClipboardList size={16} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#1C1917] dark:text-[#FAFAFA]">Đề xuất thay đổi</p>
          <div className="mt-2 space-y-1.5">
            {proposal.actions.map((action, index) => (
              <div
                key={`${proposal.id}-${index}`}
                className="flex items-center gap-1.5 text-[11px] text-[#57534E] dark:text-[#D4D4D8]"
              >
                <span className="shrink-0 text-[#78716C] dark:text-[#A1A1AA]">{actionIcon(action)}</span>
                <span>{actionLabel(action)}</span>
                {action.type === "complete_task" || action.type === "delete_task" ? (
                  <span className="truncate text-[#78716C] dark:text-[#A1A1AA]">
                    · {taskTitleById.get(action.taskId) || "Công việc đã thay đổi"}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={applyProposal}
            disabled={isApplying || isApplied}
            className="mt-3 inline-flex min-h-8 items-center gap-1.5 border-[1.5px] border-[#262626] bg-[#1C1917] px-3 py-1.5 text-xs font-bold text-white shadow-[1.5px_1.5px_0px_#262626] transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#FAFAFA] dark:bg-[#FAFAFA] dark:text-[#18181B] dark:shadow-none"
          >
            {isApplied ? <Check size={14} strokeWidth={2.4} /> : <Play size={13} strokeWidth={2.4} />}
            {isApplied ? "Đã áp dụng" : isApplying ? "Đang áp dụng..." : "Xem và áp dụng"}
          </button>
        </div>
      </div>
    </div>
  );
};
