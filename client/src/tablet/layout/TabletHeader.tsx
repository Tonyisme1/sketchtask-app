import React from "react";
import { ArrowLeft, Search } from "lucide-react";
import { TabKey, NavigationTarget } from "../../types";
import { useAppStore } from "../../stores";
import { BrandLogo } from "../../components/ui";
import { AccountMenu } from "../../components/layout/AccountMenu";

export interface TabletHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  onOpenSettings?: () => void;
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
  onOpenSearch,
  onOpenLogin,
  onLogout,
  previousTab,
}) => {
  const {
    user,
    settingsMobileSubView,
    setSettingsMobileSubView,
  } = useAppStore();
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
    <header className="sticky top-0 z-30 flex min-h-[58px] items-center justify-between bg-[var(--bg-canvas)] px-4 pb-2.5 pt-[max(env(safe-area-inset-top),10px)] md:px-6 select-none">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        {activeTab === "settings" ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (settingsMobileSubView) setSettingsMobileSubView(null);
                else onTabChange(previousTab || "tasks");
              }}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-[var(--border-ink-muted)] bg-[var(--bg-interactive)] text-[var(--text-main)] transition-colors hover:brightness-105 active:translate-x-[1.5px] active:translate-y-[1.5px] cursor-pointer"
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
            data-onboarding="tablet-search"
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
