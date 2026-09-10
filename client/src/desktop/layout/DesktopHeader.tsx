import React, { useEffect, useMemo, useState } from "react";
import { Bell, Menu } from "lucide-react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { BrandLogo } from "../../shared/ui";
import { DesktopSearchAutocomplete } from "../../components/layout/DesktopSearchAutocomplete";
import { DesktopNotificationDropdown } from "../../components/layout/DesktopNotificationDropdown";
import { AccountMenu } from "../../components/layout/AccountMenu";
import { getTaskTemporalState, isTaskDueToday } from "../../shared/utils";

export interface DesktopHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  onOpenSettings,
  onOpenLogin,
  onLogout,
}) => {
  const { user, toggleSidebar, tasks } = useAppStore();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const alertCount = useMemo(() => {
    const overdue = tasks.filter((task) => {
      if (task.completed) return false;
      const temporal = getTaskTemporalState(task);
      return temporal === "overdue" || temporal === "pastScheduled";
    }).length;
    const dueToday = tasks.filter((task) => {
      if (task.completed || !isTaskDueToday(task)) return false;
      const temporal = getTaskTemporalState(task);
      return temporal !== "overdue" && temporal !== "pastScheduled";
    }).length;
    return overdue + dueToday;
  }, [tasks, now]);

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#262626]/20 bg-[#FBF9F4] px-0 pr-6 lg:pr-8 xl:pr-10">
      <div className="flex min-w-0 shrink-0 items-center">
        <div className="flex w-[72px] shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-white text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
            title="Mở / Thu gọn menu bên (Ctrl + B)"
            aria-label="Thanh menu"
          >
            <Menu size={20} strokeWidth={2.4} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onTabChange("tasks")}
          className="flex cursor-pointer items-center gap-2 pl-0 transition-opacity hover:opacity-90"
          aria-label="Về Công việc"
        >
          <BrandLogo size="md" />
        </button>
      </div>

      {activeTab !== "settings" && (
        <div className="mx-4 flex max-w-md flex-1 justify-center lg:max-w-lg">
          <DesktopSearchAutocomplete onNavigateTab={onTabChange} />
        </div>
      )}

      {activeTab !== "settings" && (
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((open) => !open)}
              title="Thông báo & Nhắc việc"
              aria-label="Thông báo & Nhắc việc"
              aria-expanded={isNotificationOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] transition-all cursor-pointer ${
                isNotificationOpen
                  ? "translate-x-[0.5px] translate-y-[0.5px] bg-[#1C1917] text-white shadow-none"
                  : "bg-white text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              }`}
            >
              <Bell size={18} strokeWidth={2.3} />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[17px] items-center justify-center rounded-full border border-[#262626] bg-rose-500 px-1 font-mono text-[10px] font-bold text-white shadow-[0.5px_0.5px_0px_#262626]">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>
            <DesktopNotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
              onNavigateTab={onTabChange}
            />
          </div>

          <AccountMenu
            user={user}
            onOpenSettings={onOpenSettings || (() => onTabChange("settings"))}
            onOpenLogin={onOpenLogin || (() => onNavigateRoute?.("/login"))}
            onLogout={onLogout || (() => undefined)}
          />
        </div>
      )}
    </header>
  );
};
