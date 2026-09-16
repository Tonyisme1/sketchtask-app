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
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl px-0 pr-6 lg:pr-8 xl:pr-10 select-none">
      <div className="flex min-w-0 shrink-0 items-center">
        <div className="flex w-[72px] shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs transition-all hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] active:scale-95 cursor-pointer"
            title="Mở / Thu gọn menu bên (Ctrl + B)"
            aria-label="Thanh menu"
          >
            <Menu size={19} strokeWidth={2.2} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onTabChange("tasks")}
          className="flex cursor-pointer items-center gap-2 pl-0 transition-opacity hover:opacity-85"
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
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] transition-all cursor-pointer ${
                isNotificationOpen
                  ? "bg-[#1C1C1E] text-white dark:bg-white dark:text-[#1C1C1E] shadow-sm"
                  : "bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] active:scale-95"
              }`}
            >
              <Bell size={18} strokeWidth={2.2} />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[17px] items-center justify-center rounded-full bg-[#FF3B30] px-1 font-mono text-[10px] font-bold text-white shadow-xs">
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
