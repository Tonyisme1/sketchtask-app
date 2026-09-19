import React, { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckSquare, Menu, Sparkles } from "lucide-react";
import { TabKey, NavigationTarget, TaskSubTab } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { BrandLogo } from "../../shared/ui";
import { DesktopSearchAutocomplete } from "../../components/layout/DesktopSearchAutocomplete";
import { DesktopNotificationDropdown } from "../../components/layout/DesktopNotificationDropdown";
import { AccountMenu } from "../../components/layout/AccountMenu";
import { getTaskItemType, getTaskTemporalState, isTaskDueToday } from "../../shared/utils";

export interface DesktopHeaderProps {
  activeTab: TabKey;
  activeTaskSubTab: TaskSubTab;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  onOpenAIModal?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  activeTab,
  activeTaskSubTab,
  onTabChange,
  onNavigateRoute,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  onOpenAIModal,
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
      if (getTaskItemType(task) === "event") return false;
      if (task.completed) return false;
      const temporal = getTaskTemporalState(task);
      return temporal === "overdue" || temporal === "pastScheduled";
    }).length;
    const dueToday = tasks.filter((task) => {
      if (getTaskItemType(task) === "event") return false;
      if (task.completed || !isTaskDueToday(task)) return false;
      const temporal = getTaskTemporalState(task);
      return temporal !== "overdue" && temporal !== "pastScheduled";
    }).length;
    return overdue + dueToday;
  }, [tasks, now]);

  // === PHẦN: ĐIỀU HƯỚNG HAI WORKSPACE DESKTOP ===
  const isCalendarWorkspace =
    activeTab === "planner" ||
    (activeTab === "tasks" && activeTaskSubTab === "planner");
  const isTaskWorkspace =
    activeTab === "today" ||
    activeTab === "deadlines" ||
    activeTab === "notes" ||
    activeTab === "journal" ||
    (activeTab === "tasks" && activeTaskSubTab !== "planner");

  return (
    <header className="sticky top-0 z-50 shrink-0 flex h-[60px] items-center justify-between border-b border-[#E5E5EA] dark:border-[#262626] bg-[#F2F2F7] dark:bg-[#18181A] px-0 pr-6 lg:pr-8 xl:pr-10 select-none">
      <div className="flex min-w-0 shrink-0 items-center">
        <div className="flex w-[72px] shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#262626] bg-white dark:bg-black text-[#1C1917] dark:text-[#F2F2F7] shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#E5E5EA] dark:hover:bg-[#242426] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
            title="Mở / Thu gọn menu bên (Ctrl + B)"
            aria-label="Thanh menu"
          >
            <Menu size={18} strokeWidth={2.4} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onTabChange("today")}
          className="flex cursor-pointer items-center gap-2 pl-0 transition-opacity hover:opacity-85"
          aria-label="Về Hôm nay"
        >
          <BrandLogo size="md" />
        </button>
      </div>

      {activeTab !== "settings" && (
        <div className="mx-4 flex min-w-0 flex-1 items-center justify-center">
          <DesktopSearchAutocomplete onNavigateTab={onTabChange} />
        </div>
      )}

      {activeTab !== "settings" && (
        <div className="flex shrink-0 items-center gap-2.5">
          {/* === PHẦN: CHUYỂN ĐỔI WORKSPACE CẠNH NÚT AI === */}
          <div className="hidden items-center gap-1 lg:flex" role="group" aria-label="Không gian desktop">
            <button
              type="button"
              onClick={() => onTabChange("planner")}
              aria-current={isCalendarWorkspace ? "page" : undefined}
              className={`flex h-10 items-center gap-1.5 rounded-xl border-[1.5px] px-3 text-xs font-bold transition-all cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                isCalendarWorkspace
                  ? "border-[#262626] bg-[#1C1917] text-white shadow-none dark:border-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-white"
                  : "border-transparent text-[#78716C] hover:border-[#262626] hover:bg-white hover:text-[#1C1917] dark:text-[#A1A1AA] dark:hover:border-white dark:hover:bg-[#2C2C2E] dark:hover:text-white"
              }`}
            >
              <CalendarDays size={15} strokeWidth={2.3} />
              <span>Lịch</span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange("tasks")}
              aria-current={isTaskWorkspace ? "page" : undefined}
              className={`flex h-10 items-center gap-1.5 rounded-xl border-[1.5px] px-3 text-xs font-bold transition-all cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                isTaskWorkspace
                  ? "border-[#262626] bg-[#1C1917] text-white shadow-none dark:border-[#E5E5EA] dark:bg-[#2C2C2E] dark:text-white"
                  : "border-transparent text-[#78716C] hover:border-[#262626] hover:bg-white hover:text-[#1C1917] dark:text-[#A1A1AA] dark:hover:border-white dark:hover:bg-[#2C2C2E] dark:hover:text-white"
              }`}
            >
              <CheckSquare size={15} strokeWidth={2.3} />
              <span>Công việc</span>
            </button>
          </div>

          {/* Nút Kích Hoạt Trợ Lý AI Nhanh */}
          <button
            type="button"
            onClick={onOpenAIModal || (() => onTabChange("ai"))}
            title="Trợ lý AI Phác Thảo"
            aria-label="Trợ lý AI"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#262626] bg-white hover:bg-[#F4F4F5] dark:bg-black dark:hover:bg-[#1C1C1E] text-[#1C1917] dark:text-[#F2F2F7] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          >
            <Sparkles size={18} strokeWidth={2.2} />
          </button>

          {/* Nút Thông Báo & Nhắc Việc */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((open) => !open)}
              title="Thông báo & Nhắc việc"
              aria-label="Thông báo & Nhắc việc"
              aria-expanded={isNotificationOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#262626] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                isNotificationOpen
                  ? "bg-[#1C1917] text-white dark:bg-white dark:text-[#1C1917]"
                  : "bg-white dark:bg-black text-[#1C1917] dark:text-[#F2F2F7] hover:bg-[#F4F4F5] dark:hover:bg-[#1C1C1E]"
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
