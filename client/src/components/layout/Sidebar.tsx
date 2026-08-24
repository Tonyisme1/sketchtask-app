import React from "react";
import { TabKey, TabConfig } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { BrandLogo } from "../ui/BrandLogo";
import {
  Sun,
  Calendar,
  BookMarked,
  Lightbulb,
  CheckCheck,
  LucideIcon,
} from "lucide-react";

// ==========================================
// COMPONENT: Desktop Sidebar (Thanh điều hướng Sổ tay với Icon Hiện Đại)
// ==========================================

export interface NavTabItem extends Omit<TabConfig, "icon"> {
  shortLabel: string;
  icon: LucideIcon;
}

export const SIDEBAR_TABS: NavTabItem[] = [
  {
    key: "today",
    label: "Hôm nay",
    shortLabel: "Hôm nay",
    icon: Sun,
    accentColor: "#FEF08A", // Yellow
  },
  {
    key: "planner",
    label: "Kế hoạch",
    shortLabel: "Kế hoạch",
    icon: Calendar,
    accentColor: "#BAE6FD", // Sky
  },
  {
    key: "notebooks",
    label: "Sổ tay & Dự án",
    shortLabel: "Sổ tay",
    icon: BookMarked,
    accentColor: "#DDD6FE", // Lavender
  },
  {
    key: "braindump",
    label: "Ý tưởng (Notes)",
    shortLabel: "Ý tưởng",
    icon: Lightbulb,
    accentColor: "#BBF7D0", // Mint
  },
  {
    key: "review",
    label: "Tổng kết & Thói quen",
    shortLabel: "Tổng kết",
    icon: CheckCheck,
    accentColor: "#FECDD3", // Coral
  },
];

interface SidebarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const { tasks, notebooks, stickyNotes, habits } = useAppStore();

  const getBadgeCount = (key: TabKey): number | null => {
    switch (key) {
      case "today":
        return tasks.filter((t) => !t.completed).length;
      case "notebooks":
        return notebooks.length;
      case "braindump":
        return stickyNotes.length;
      case "review":
        return habits.length;
      default:
        return null;
    }
  };

  const completedTodayCount = tasks.filter((t) => t.completed).length;
  const totalTodayCount = tasks.length;

  return (
    <aside className="hidden md:flex flex-col justify-between w-64 h-screen sticky top-0 bg-[#F3EFE6] border-r-[1.5px] border-[#262626] p-4 select-none z-30 shrink-0">
      {/* 1. App Brand Logo */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D4CEBF]">
          <BrandLogo size="md" />
          <span className="text-[10px] font-mono text-[#78716C] bg-white px-1.5 py-0.5 rounded border border-[#D4CEBF]">
            v1.0
          </span>
        </div>

        {/* 2. Navigation Tabs */}
        <nav className="space-y-1.5">
          {SIDEBAR_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = getBadgeCount(tab.key);
            const IconComp = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[4px] border-[1.5px] text-xs font-semibold transition-all duration-100 ${
                  isActive
                    ? "bg-white text-[#1C1917] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[0.5px]"
                    : "bg-transparent text-[#78716C] border-transparent hover:bg-white/70 hover:text-[#1C1917] hover:border-[#D4CEBF]"
                } active:translate-x-[1px] active:translate-y-[1px] active:shadow-none`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-6 h-6 rounded-[3px] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
                    style={{ backgroundColor: tab.accentColor }}
                  >
                    <IconComp
                      size={14}
                      strokeWidth={2.2}
                      className="text-[#1C1917]"
                    />
                  </div>
                  <span className="tracking-tight">{tab.label}</span>
                </div>

                {/* Badge Count */}
                {count !== null && count > 0 && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.2 rounded-[2px] border ${
                      isActive
                        ? "bg-[#FEF08A] text-[#1C1917] border-[#262626]"
                        : "bg-white text-[#78716C] border-[#D4CEBF]"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* 3. Bottom Mini Widget / Stats */}
      <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[2px_2px_0px_#262626] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#1C1917]">Tiến độ ngày</span>
          <span className="font-mono text-[11px] text-[#78716C]">
            {completedTodayCount}/{totalTodayCount}
          </span>
        </div>

        <div className="w-full h-2 bg-[#F3EFE6] border border-[#262626] rounded-[2px] overflow-hidden p-[0.5px]">
          <div
            className="h-full bg-[#BBF7D0] transition-all duration-300"
            style={{
              width: `${
                totalTodayCount > 0
                  ? Math.round((completedTodayCount / totalTodayCount) * 100)
                  : 0
              }%`,
            }}
          />
        </div>

        <p className="text-[10px] text-[#78716C] font-mono pt-1 border-t border-[#D4CEBF]/60 text-center">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "numeric",
            month: "numeric",
          })}{" "}
          • Nhịp độ của bạn
        </p>
      </div>
    </aside>
  );
};
