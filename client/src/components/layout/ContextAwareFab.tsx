import React from "react";
import { Plus } from "lucide-react";
import { TabKey } from "../../types";

type CreateAction = "task" | "event" | "note" | "journal";

interface ContextAwareFabProps {
  activeTab: TabKey;
  onCreateTask: () => void;
  onCreateEvent?: () => void;
  showOnDesktop?: boolean;
  showOnTablet?: boolean;
}

const actionByTab: Partial<Record<TabKey, { type: CreateAction; label: string }>> = {
  tasks: { type: "task", label: "Tạo task mới" },
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
  onCreateTask,
  onCreateEvent,
  showOnDesktop = false,
  showOnTablet = false,
}) => {
  let action: { type: CreateAction; label: string } | undefined;

  if (activeTab === "tasks") {
    action = { type: "task", label: "Tạo công việc mới" };
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
      className={`${positionClass} z-40 flex h-12 w-12 items-center justify-center rounded-2xl border-[1.5px] border-[var(--border-ink)] bg-[var(--text-strong)] text-[var(--bg-surface)] shadow-[2px_2px_0px_var(--border-ink)] transition-transform duration-150 motion-reduce:transition-none cursor-pointer active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none`}
    >
      <Plus size={22} strokeWidth={2.8} />
    </button>
  );
};
