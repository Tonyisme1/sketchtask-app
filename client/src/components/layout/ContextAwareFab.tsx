import React from "react";
import { Plus } from "lucide-react";
import { TabKey } from "../../types";

type CreateAction = "task" | "note" | "journal";

interface ContextAwareFabProps {
  activeTab: TabKey;
  activeTaskSubTab?: "today" | "planner" | "deadlines";
  onCreateTask: () => void;
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
}

const actionByTab: Partial<Record<TabKey, { type: CreateAction; label: string }>> = {
  tasks: { type: "task", label: "Tạo task mới" },
  planner: { type: "task", label: "Tạo task trong kế hoạch" },
  deadlines: { type: "task", label: "Tạo task có hạn" },
  notes: { type: "note", label: "Tạo ghi chú mới" },
  journal: { type: "journal", label: "Viết nhật ký mới" },
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
  } else if (activeTab === "today") {
    action = { type: "task", label: "Tạo task hôm nay" };
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
      className={`${positionClass} z-40 w-12 h-12 bg-[#1C1917] hover:bg-[#262626] text-white border-[1.5px] border-[#1C1917] rounded-[8px] shadow-[2.5px_2.5px_0px_#262626] flex items-center justify-center active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all duration-150 motion-reduce:transition-none cursor-pointer`}
    >
      <Plus size={22} strokeWidth={2.8} />
    </button>
  );
};
