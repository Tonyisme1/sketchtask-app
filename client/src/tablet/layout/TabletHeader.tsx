import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Bell } from "lucide-react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { BrandLogo } from "../../shared/ui";
import { AccountMenu } from "../../components/layout/AccountMenu";
import { getTaskTemporalState, isTaskDueToday } from "../../shared/utils";

export interface TabletHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenNotifications: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  previousTab?: TabKey;
}

export const TabletHeader: React.FC<TabletHeaderProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  onOpenSettings,
  onOpenNotifications,
  onOpenLogin,
  onLogout,
  previousTab,
}) => {
  const {
    user,
    tasks,
    settingsMobileSubView,
    setSettingsMobileSubView,
  } = useAppStore();
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

  const settingsTitle =
    settingsMobileSubView === "account"
      ? "Tài khoản & Đồng bộ"
      : settingsMobileSubView === "general"
        ? "Giao diện & Trải nghiệm"
        : settingsMobileSubView === "notifications"
          ? "Thông báo & Âm thanh"
          : settingsMobileSubView === "data"
            ? "Dữ liệu & Bộ nhớ"
            : settingsMobileSubView === "security"
              ? "Bảo mật"
              : settingsMobileSubView === "shortcuts"
                ? "Phím tắt bàn phím"
                : settingsMobileSubView === "about"
                  ? "Trợ giúp & Giới thiệu"
                  : "Cài đặt";

  return (
    <header className="sticky top-0 z-30 flex min-h-[58px] items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-white/92 dark:bg-[#1C1C1E]/92 backdrop-blur-xl px-4 pb-2.5 pt-[max(env(safe-area-inset-top),10px)] md:px-6 select-none">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {activeTab === "settings" ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (settingsMobileSubView) setSettingsMobileSubView(null);
                else onTabChange(previousTab || "today");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F2F2F7] transition-all active:scale-95 cursor-pointer"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
            <span className="truncate text-lg font-bold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">{settingsTitle}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onTabChange("tasks")}
            className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-90"
            aria-label="Về Công việc"
          >
            <BrandLogo size="md" />
          </button>
        )}
      </div>

      {activeTab !== "settings" && (
        <div className="flex shrink-0 items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={onOpenNotifications}
              title="Thông báo & Nhắc việc"
              aria-label="Thông báo & Nhắc việc"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white shadow-sm hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] transition-all cursor-pointer active:scale-95"
            >
              <Bell size={18} strokeWidth={2.2} />
              {alertCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[17px] items-center justify-center rounded-full bg-rose-500 px-1 font-mono text-[10px] font-bold text-white border border-white dark:border-[#1C1C1E]">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>
          </div>

          <AccountMenu
            user={user}
            onOpenSettings={onOpenSettings || (() => {
              setSettingsMobileSubView(null);
              onTabChange("settings");
            })}
            onOpenLogin={onOpenLogin || (() => onNavigateRoute?.("/login"))}
            onLogout={onLogout || (() => undefined)}
          />
        </div>
      )}
    </header>
  );
};
