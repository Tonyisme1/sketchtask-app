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
                className={`min-w-[18px] border-[1px] px-1 py-0.5 text-center font-mono text-[10px] leading-none ${
                  value === "deadlines"
                    ? "border-white bg-white text-[#1C1917]"
                    : "border-[#FDA4AF] bg-[#FFE4E6] text-[#BE123C]"
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
