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
    <header className="sticky top-0 z-50 shrink-0 flex h-[60px] items-center justify-between border-b border-[#E4E4E7] dark:border-[#2E2E34] bg-[#F8F9FA] dark:bg-[#141417] px-0 pr-6 lg:pr-8 xl:pr-10 select-none">
      <div className="flex min-w-0 shrink-0 items-center">
        <div className="flex w-[72px] shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#18181B] dark:border-[#2E2E34] bg-white dark:bg-[#1F1F23] text-[#09090B] dark:text-[#FFFFFF] shadow-[1.5px_1.5px_0px_#18181B] dark:shadow-none transition-all hover:bg-black/5 dark:hover:bg-[#2A2A30] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
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
                  ? "border-[#18181B] bg-[#09090B] text-white shadow-[1.5px_1.5px_0px_#18181B] dark:border-white dark:bg-white dark:text-[#09090B] dark:shadow-none"
                  : "border-transparent text-[#71717A] hover:bg-black/5 hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
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
                  ? "border-[#18181B] bg-[#09090B] text-white shadow-[1.5px_1.5px_0px_#18181B] dark:border-white dark:bg-white dark:text-[#09090B] dark:shadow-none"
                  : "border-transparent text-[#71717A] hover:bg-black/5 hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:bg-white/10 dark:hover:text-white"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#18181B] dark:border-[#2E2E34] bg-white hover:bg-black/5 dark:bg-[#1F1F23] dark:hover:bg-[#2A2A30] text-[#09090B] dark:text-[#FFFFFF] shadow-[1.5px_1.5px_0px_#18181B] dark:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
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
              className={`flex h-10 w-10 items-center justify-center rounded-xl border border-[#18181B] dark:border-[#2E2E34] transition-all cursor-pointer shadow-[1.5px_1.5px_0px_#18181B] dark:shadow-none active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                isNotificationOpen
                  ? "bg-[#09090B] text-white dark:bg-white dark:text-[#09090B]"
                  : "bg-white dark:bg-[#1F1F23] text-[#09090B] dark:text-[#FFFFFF] hover:bg-black/5 dark:hover:bg-[#2A2A30]"
              }`}
            >
              <Bell size={18} strokeWidth={2.2} />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[17px] items-center justify-center rounded-full bg-[#DC2626] dark:bg-[#EF4444] px-1 font-mono text-[10px] font-bold text-white shadow-xs">
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
