import React from "react";
import { Plus } from "lucide-react";
import { TabKey, TaskSubTab } from "../../types";

type CreateAction = "task" | "event" | "note" | "journal";

interface ContextAwareFabProps {
  activeTab: TabKey;
  activeTaskSubTab?: TaskSubTab;
  onCreateTask: () => void;
  onCreateEvent?: () => void;
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
}

const actionByTab: Partial<Record<TabKey, { type: CreateAction; label: string }>> = {
  tasks: { type: "task", label: "Tạo task mới" },
  planner: { type: "task", label: "Tạo task trong kế hoạch" },
  deadlines: { type: "task", label: "Tạo task có hạn" },
  events: { type: "event", label: "Tạo sự kiện mới" },
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
  onCreateEvent,
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
          : activeTaskSubTab === "all"
          ? "Tạo task mới"
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
    if (action?.type === "event") {
      onCreateEvent?.();
      return;
    }
    dispatchCreateRequest(action.type);
  };

  return (
    <button
      type="button"
      data-onboarding={showOnDesktop ? "desktop-create" : showOnTablet ? "tablet-create" : "mobile-create"}
      onClick={handleClick}
      aria-label={action.label}
      title={action.label}
      className={`${positionClass} z-40 w-12 h-12 bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all duration-150 motion-reduce:transition-none cursor-pointer border-none`}
    >
      <Plus size={22} strokeWidth={2.8} />
    </button>
  );
};
