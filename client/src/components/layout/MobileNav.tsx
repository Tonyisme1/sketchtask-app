import React from "react";
import { TabKey } from "../../types";
import { SIDEBAR_TABS } from "./Sidebar";
import { useAppStore } from "../../stores/appStore";

// ==========================================
// COMPONENT: MobileNav (Thanh điều hướng đáy với Icon Hiện Đại Sắc Nét)
// ==========================================

interface MobileNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { tasks } = useAppStore();
  const activeTodayTasks = tasks.filter((t) => !t.completed).length;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F4] border-t-[1.5px] border-[#262626] shadow-[0px_-2px_0px_#262626] px-1 pt-1 pb-[max(env(safe-area-inset-bottom),4px)] select-none">
      <div className="grid grid-cols-5 gap-1 max-w-md mx-auto">
        {SIDEBAR_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const isToday = tab.key === "today";
          const IconComp = tab.icon;

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`relative flex flex-col items-center justify-center py-1.5 px-0.5 rounded-[4px] border transition-all duration-100 min-h-[48px] ${
                isActive
                  ? "bg-[#FEF08A] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] -translate-y-[1px]"
                  : "bg-transparent border-transparent text-[#78716C] hover:text-[#1C1917]"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              {/* Badge thông báo cho tab Hôm nay */}
              {isToday && activeTodayTasks > 0 && !isActive && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#FECDD3] border border-[#262626]" />
              )}

              <IconComp
                size={18}
                strokeWidth={isActive ? 2.4 : 1.9}
                className={`mb-0.5 ${isActive ? "text-[#1C1917]" : "text-[#78716C]"}`}
              />

              <span
                className={`text-[10px] tracking-tight leading-tight whitespace-nowrap ${
                  isActive
                    ? "font-bold text-[#1C1917]"
                    : "font-medium text-[#78716C]"
                }`}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
