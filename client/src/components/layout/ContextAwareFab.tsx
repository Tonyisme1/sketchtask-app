import React from "react";
import { BookMarked, BookOpen, CheckSquare, FileText, Plus, LucideIcon } from "lucide-react";
import { TabKey } from "../../types";
import { useAppStore } from "../../shared/stores";

type CreateAction = "task" | "note" | "journal" | "notebook";

interface ContextAwareFabProps {
  activeTab: TabKey;
  activeTaskSubTab?: "today" | "planner" | "deadlines";
  onCreateTask: (initialData?: { notebookId?: string }) => void;
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
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
  showOnDesktop = false,
  showOnTablet = false,
}) => {
  const { selectedNotebookId } = useAppStore();

  let action: { type: CreateAction; label: string } | undefined;

  if (activeTab === "tasks") {
    action = {
      type: "task",
      label:
        activeTaskSubTab === "planner"
          ? "Tạo task trong kế hoạch"
          : activeTaskSubTab === "deadlines"
          ? "Tạo task có hạn"
          : "Tạo task hôm nay",
    };
  } else if (activeTab === "notebooks" && selectedNotebookId) {
    action = {
      type: "task",
      label: "Tạo task mới trong sổ tay này",
    };
  } else {
    action = actionByTab[activeTab];
  }

  if (!action) return null;

  const positionClass = showOnDesktop
    ? "fixed right-6 bottom-6"
    : showOnTablet
    ? "fixed right-6 bottom-[6.5rem]"
    : "md:hidden fixed right-4 bottom-[4.75rem]";

  const handleClick = () => {
    if (action?.type === "task") {
      onCreateTask(
        activeTab === "notebooks" && selectedNotebookId
          ? { notebookId: selectedNotebookId }
          : undefined,
      );
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
      className={`${positionClass} z-40 w-12 h-12 bg-[#1C1917] hover:bg-[#262626] text-white border-[1.5px] border-[#1C1917] rounded-[8px] shadow-[2.5px_2.5px_0px_#262626] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 motion-reduce:transition-none cursor-pointer`}
    >
      <Plus size={22} strokeWidth={2.8} />
    </button>
  );
};
