import React from "react";
import { CalendarDays, Hourglass } from "lucide-react";
import { SketchTabs } from "../../layout/SketchTabs";

export type TaskWorkspaceSubTab = "planner" | "deadlines";

interface TaskSubTabSwitcherProps {
  value: TaskWorkspaceSubTab;
  deadlineAlertTotal: number;
  onChange: (value: TaskWorkspaceSubTab) => void;
  platform: "desktop" | "tablet";
}

export const TaskSubTabSwitcher: React.FC<TaskSubTabSwitcherProps> = ({
  value,
  deadlineAlertTotal,
  onChange,
  platform,
}) => {
  const isTablet = platform === "tablet";

  return (
    <SketchTabs
      ariaLabel="Chuyển khu vực công việc"
      value={value}
      onChange={onChange}
      size={isTablet ? "md" : "sm"}
      items={[
        {
          key: "planner",
          label: "Kế hoạch",
          icon: <CalendarDays size={isTablet ? 15 : 14} strokeWidth={2.4} />,
        },
        {
          key: "deadlines",
          label: "Hạn định",
          icon: <Hourglass size={isTablet ? 15 : 14} strokeWidth={2.4} />,
          badge:
            deadlineAlertTotal > 0 ? (
              <span
                className={`min-w-[18px] px-1.5 py-0.5 rounded-md text-center font-mono text-[10px] leading-none font-semibold ${
                  value === "deadlines"
                    ? "bg-[#FF3B30] text-white"
                    : "bg-[#FF3B30]/10 text-[#FF3B30]"
                }`}
              >
                {deadlineAlertTotal}
              </span>
            ) : undefined,
        },
      ]}
    />
  );
};
