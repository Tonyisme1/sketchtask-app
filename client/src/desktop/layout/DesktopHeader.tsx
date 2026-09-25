import React from "react";
import { CalendarDays, CheckSquare, Menu, Sparkles } from "lucide-react";
import { NavigationTarget, TabKey, TaskSubTab } from "../../types";
import { useAppStore } from "../../stores";
import { BrandLogo } from "../../components/ui";
import { AccountMenu } from "../../components/layout/AccountMenu";

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
  onTabChange,
  onNavigateRoute,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  onOpenAIModal,
}) => {
  const { user, toggleSidebar } = useAppStore();
  const isEventWorkspace = activeTab === "events";
  const isTaskWorkspace = activeTab === "tasks";

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between bg-[var(--bg-canvas)] px-0 pr-5 text-[var(--text-main)] lg:pr-6 xl:pr-8 select-none">
      <div className="flex min-w-0 shrink-0 items-center">
        <div className="flex w-[72px] shrink-0 items-center justify-center">
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] active:scale-95 shadow-xs cursor-pointer"
            title="Mở / Thu gọn menu bên (Ctrl + B)"
            aria-label="Thanh menu"
          >
            <Menu size={18} strokeWidth={2.4} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => onTabChange("tasks")}
          className="flex cursor-pointer items-center gap-2 pl-0 transition-opacity hover:opacity-85"
          aria-label="Về Công việc"
        >
          <BrandLogo size="lg" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* === PHẦN 1: HAI WORKSPACE CHÍNH === */}
        <div className="hidden items-center gap-1.5 lg:flex" role="group" aria-label="Không gian Desktop">
          <button
            type="button"
            onClick={() => onTabChange("events")}
            aria-current={isEventWorkspace ? "page" : undefined}
            className={`flex h-9 items-center gap-1.5 rounded-2xl px-3 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isEventWorkspace
                ? "bg-[var(--text-strong)] text-[var(--bg-surface)] shadow-xs dark:bg-[var(--border-ink-muted)] dark:text-[var(--text-main)]"
                : "text-[var(--text-main)] hover:bg-[var(--bg-surface-muted)]"
            }`}
          >
            <CalendarDays size={15} strokeWidth={2.3} />
            <span>Sự kiện</span>
          </button>
          <button
            type="button"
            onClick={() => onTabChange("tasks")}
            aria-current={isTaskWorkspace ? "page" : undefined}
            className={`flex h-9 items-center gap-1.5 rounded-2xl px-3 text-xs font-bold transition-all cursor-pointer active:scale-95 ${
              isTaskWorkspace
                ? "bg-[var(--text-strong)] text-[var(--bg-surface)] shadow-xs dark:bg-[var(--border-ink-muted)] dark:text-[var(--text-main)]"
                : "text-[var(--text-main)] hover:bg-[var(--bg-surface-muted)]"
            }`}
          >
            <CheckSquare size={15} strokeWidth={2.3} />
            <span>Công việc</span>
          </button>
        </div>

        {/* === PHẦN 2: AI VÀ TÀI KHOẢN === */}
        <button
          type="button"
          onClick={onOpenAIModal || (() => onTabChange("ai"))}
          title="Trợ lý AI Phác Thảo"
          aria-label="Trợ lý AI"
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] active:scale-95 shadow-xs cursor-pointer"
        >
          <Sparkles size={18} strokeWidth={2.2} />
        </button>

        <AccountMenu
          user={user}
          onOpenSettings={onOpenSettings || (() => onTabChange("settings"))}
          onOpenLogin={onOpenLogin || (() => onNavigateRoute?.("/login"))}
          onLogout={onLogout || (() => undefined)}
        />
      </div>
    </header>
  );
};
