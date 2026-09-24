import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Hourglass, Search } from "lucide-react";
import { TabKey, NavigationTarget } from "../../types";
import { useAppStore } from "../../stores";
import { BrandLogo } from "../../components/ui";
import { AccountMenu } from "../../components/layout/AccountMenu";
import { getDeadlineAttentionCount } from "../../utils";

export interface TabletHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenDeadlines: () => void;
  onOpenSearch: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  previousTab?: TabKey;
}

export const TabletHeader: React.FC<TabletHeaderProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  onOpenSettings,
  onOpenDeadlines,
  onOpenSearch,
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

  const deadlineAttentionCount = useMemo(
    () => getDeadlineAttentionCount(tasks, new Date(now)),
    [tasks, now],
  );

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
    <header className="sticky top-0 z-30 flex min-h-[58px] items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] bg-[#F2F2F7]/95 dark:bg-[#18181A]/95 backdrop-blur-xl px-4 pb-2.5 pt-[max(env(safe-area-inset-top),10px)] md:px-6 select-none">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {activeTab === "settings" ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (settingsMobileSubView) setSettingsMobileSubView(null);
                else onTabChange(previousTab || "today");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F2F2F7] transition-all active:scale-95 cursor-pointer shadow-2xs"
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
          <button
            type="button"
            onClick={onOpenSearch}
            title="Tìm kiếm"
            aria-label="Mở tìm kiếm"
            className="flex h-10 w-10 items-center justify-center rounded-2xl border-none bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-all cursor-pointer active:scale-95"
          >
            <Search size={18} strokeWidth={2.2} />
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={onOpenDeadlines}
              title="Hạn định cần xử lý"
              aria-label="Hạn định cần xử lý"
              className="flex h-10 w-10 items-center justify-center rounded-2xl border-none bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-white shadow-xs hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E] transition-all cursor-pointer active:scale-95"
            >
              <Hourglass size={18} strokeWidth={2.2} />
              {deadlineAttentionCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-[17px] items-center justify-center rounded-full bg-[var(--accent-coral)] px-1 font-mono text-[10px] font-bold text-white border-none shadow-xs">
                  {deadlineAttentionCount > 9 ? "9+" : deadlineAttentionCount}
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
