import React from "react";
import { BookMarked, BookOpen, CheckSquare, FileText, Plus, LucideIcon } from "lucide-react";
import { TabKey } from "../../types";

type CreateAction = "task" | "note" | "journal" | "notebook";

interface ContextAwareFabProps {
  activeTab: TabKey;
  activeTaskSubTab?: "today" | "planner" | "deadlines";
  onCreateTask: () => void;
}

const actionByTab: Partial<Record<TabKey, { type: CreateAction; label: string }>> = {
  tasks: { type: "task", label: "Tạo task mới" },
  today: { type: "task", label: "Tạo task hôm nay" },
  planner: { type: "task", label: "Tạo task trong kế hoạch" },
  deadlines: { type: "task", label: "Tạo task có hạn" },
  notes: { type: "note", label: "Tạo ghi chú mới" },
  journal: { type: "journal", label: "Viết nhật ký mới" },
  notebooks: { type: "notebook", label: "Tạo sổ tay mới" },
};

const iconByAction: Record<CreateAction, LucideIcon> = {
  task: CheckSquare,
  note: FileText,
  journal: BookOpen,
  notebook: BookMarked,
};

const dispatchCreateRequest = (type: Exclude<CreateAction, "task">) => {
  window.dispatchEvent(
    new CustomEvent("sketchtask:create", {
      detail: { type },
    }),
  );
};

export const ContextAwareFab: React.FC<ContextAwareFabProps> = ({
  activeTab,
  activeTaskSubTab = "today",
  onCreateTask,
}) => {
  const action = activeTab === "tasks"
    ? {
        type: "task" as const,
        label:
          activeTaskSubTab === "planner"
            ? "Tạo task trong kế hoạch"
            : activeTaskSubTab === "deadlines"
            ? "Tạo task có hạn"
            : "Tạo task hôm nay",
      }
    : actionByTab[activeTab];
  if (!action) return null;

  const Icon = iconByAction[action.type];
  const handleClick = () => {
    if (action.type === "task") {
      onCreateTask();
      return;
    }
    dispatchCreateRequest(action.type);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={action.label}
      title={action.label}
      className="fixed right-4 bottom-[4.75rem] md:right-7 md:bottom-7 z-40 w-12 h-12 md:w-auto md:h-10 md:px-3.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-full md:rounded-[8px] shadow-[2.5px_2.5px_0px_#262626] flex items-center justify-center gap-1.5 text-[#1C1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 motion-reduce:transition-none cursor-pointer"
    >
      <Plus size={22} strokeWidth={2.8} className="md:w-[18px] md:h-[18px]" />
      <Icon size={15} strokeWidth={2.3} className="hidden md:inline-block" />
      <span className="hidden md:inline text-xs font-bold">{action.label}</span>
    </button>
  );
};
