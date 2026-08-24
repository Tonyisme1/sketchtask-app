import React from "react";
import { TabKey, TabConfig } from "../../types";

// ==========================================
// COMPONENT: NotebookTabs (Tabs phong cách Sổ tay kẹp trang)
// ==========================================

export const TABS_CONFIG: TabConfig[] = [
  { key: "today", label: "Hôm nay", icon: "☀️", accentColor: "#FEF08A" }, // Yellow
  { key: "planner", label: "Kế hoạch", icon: "🗓️", accentColor: "#BAE6FD" }, // Sky
  { key: "notebooks", label: "Sổ tay", icon: "📓", accentColor: "#DDD6FE" }, // Lavender
  { key: "braindump", label: "Brain Dump", icon: "💡", accentColor: "#BBF7D0" }, // Mint
  { key: "review", label: "Tổng kết", icon: "🌱", accentColor: "#FECDD3" }, // Coral
];

interface NotebookTabsProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const NotebookTabs: React.FC<NotebookTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="flex items-end gap-1 sm:gap-2 border-b-[1.5px] border-[#262626] overflow-x-auto no-scrollbar pt-2 px-2 sm:px-4 bg-[#F3EFE6]">
      {TABS_CONFIG.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`group relative flex items-center gap-1.5 px-3 sm:px-4 py-2 border-t-[1.5px] border-l-[1.5px] border-r-[1.5px] border-[#262626] rounded-t-[6px] transition-all duration-100 whitespace-nowrap select-none text-xs sm:text-sm font-semibold ${
              isActive
                ? "bg-[#FBF9F4] -mb-[1.5px] pb-2.5 z-10 shadow-[0px_-2px_0px_rgba(0,0,0,0.05)]"
                : "bg-white/80 hover:bg-white text-[#78716C] hover:text-[#1C1917] pb-1.5 opacity-80 hover:opacity-100"
            }`}
            style={{
              borderTopColor: isActive ? "#262626" : "#262626",
            }}
          >
            {/* Color Accent Indicator Strip */}
            <span
              className="w-2 h-2 rounded-full border border-[#262626]"
              style={{ backgroundColor: tab.accentColor }}
            />
            <span className="text-sm">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

