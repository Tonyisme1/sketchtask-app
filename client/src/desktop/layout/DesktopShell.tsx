import React, { useState, useEffect } from "react";
import { TabKey, NavigationTarget, TaskSubTab } from "../../types";
import { useAppStore } from "../../stores";
import { DesktopHeader } from "./DesktopHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import { AuthModal } from "../../components/shared/auth/AuthModal";
import { PinLockModal } from "../../components/shared/auth/PinLockModal";
import { QuickTaskModal } from "../../components/shared/tasks/QuickTaskModal";
import { AIAssistantSidePanel } from "../components/ai/AIAssistantSidePanel";
import { DesktopSettingsPage } from "../tabs/DesktopSettingsPage";
import { Settings, X } from "lucide-react";
import { useModalBackClose } from "../../hooks/useModalBackClose";
import type { DesktopPlannerSurface } from "../components/planner/DesktopPlannerHeader";

export interface DesktopShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  desktopPlannerSurface: DesktopPlannerSurface;
  onDesktopPlannerSurfaceChange: (surface: DesktopPlannerSurface) => void;
  onDesktopTaskSubTabChange: (subTab: TaskSubTab) => void;
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  desktopPlannerSurface,
  onDesktopPlannerSurfaceChange,
  onDesktopTaskSubTabChange,
  children,
}) => {
  const {
    pinCode,
    isPinLocked,
    unlockWithPin,
    toggleSidebar,
    activeTaskSubTab,
    activeDetailTaskId,
    isAuthModalOpen,
    closeAuthModal,
    setSettingsMobileSubView,
    openQuickTaskModal,
    logout,
  } = useAppStore();

  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useModalBackClose(isSettingsPopupOpen, () => setIsSettingsPopupOpen(false));

  // Scroll to top on tab and subtab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, activeTaskSubTab, activeDetailTaskId]);

  // Desktop Global keyboard shortcuts: Ctrl+B (Sidebar), Ctrl+K (Search), N (New Task Modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      } else if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.toLowerCase() === "n" &&
        !isInput
      ) {
        e.preventDefault();
        openQuickTaskModal({
          itemType: activeTab === "planner" ? "event" : "task",
          lockItemType: true,
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, toggleSidebar, openQuickTaskModal]);

  const handleOpenDesktopSettings = () => {
    setSettingsMobileSubView(null);
    setIsSettingsPopupOpen(true);
  };

  const handleTabChange = (tab: TabKey, target?: NavigationTarget) => {
    if (tab === "settings") {
      handleOpenDesktopSettings();
      return;
    }
    if (tab === "ai") {
      setIsAIModalOpen((prev) => !prev);
      return;
    }
    onTabChange(tab, target);
  };

  // Close settings popup on ESC key
  useEffect(() => {
    if (!isSettingsPopupOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsPopupOpen(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isSettingsPopupOpen]);

  return (
    <div
      className="desktop-minimal h-screen max-h-screen overflow-hidden bg-[#F2F2F7] dark:bg-[#18181A] text-[#1C1917] dark:text-[#F2F2F7] font-sans flex flex-col "
    >
      {/* 1. Desktop luôn giữ topbar để editor không mất ngữ cảnh workspace. */}
      <DesktopHeader
        activeTab={activeTab}
        activeTaskSubTab={activeTaskSubTab}
        onTabChange={handleTabChange}
        onNavigateRoute={onNavigateRoute}
        onOpenSettings={handleOpenDesktopSettings}
        onOpenLogin={() => onNavigateRoute("/login")}
        onLogout={logout}
        onOpenAIModal={() => setIsAIModalOpen((prev) => !prev)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Desktop giữ sidebar khi mở note hoặc nhật ký. */}
        <DesktopSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onCreateEvent={() =>
            openQuickTaskModal({ itemType: "event", lockItemType: true })
          }
          onCreateTask={() =>
            openQuickTaskModal({ itemType: "task", lockItemType: true })
          }
          onOpenSettings={handleOpenDesktopSettings}
          onOpenAIModal={() => setIsAIModalOpen((prev) => !prev)}
          desktopPlannerSurface={desktopPlannerSurface}
          onDesktopPlannerSurfaceChange={onDesktopPlannerSurfaceChange}
          onDesktopTaskSubTabChange={onDesktopTaskSubTabChange}
        />

        {/* Main Content Area (Thoáng đãng & Tối đa hoá không gian làm việc) */}
        <main
          key={`desktop-${activeTab}-${activeTaskSubTab}`}
          className="flex-1 min-w-0 flex flex-col w-full h-full min-h-0 overflow-hidden"
        >
          {children}
        </main>
      </div>

      {/* 3. Floating AI Assistant Side Panel (Cửa sổ trợ lý AI nổi một bên) */}
      <AIAssistantSidePanel
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />

      {/* Overlays */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onOpenSettings={handleOpenDesktopSettings}
      />

      {/* Desktop account menu opens Settings as a large popup modal. */}
      {isSettingsPopupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt"
          onClick={() => setIsSettingsPopupOpen(false)}
          className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/50 p-4 lg:p-8 dark:bg-[#3C4043]/80"
        >
          <section
            role="document"
            onClick={(event) => event.stopPropagation()}
            className="flex h-[min(90dvh,840px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-[var(--bg-surface)] shadow-none dark:bg-[var(--bg-canvas)]"
          >
            <header className="flex min-h-[52px] items-center justify-between bg-[var(--bg-surface)] px-4 lg:px-5 shrink-0 dark:bg-[var(--bg-canvas)]">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1C1917] text-white dark:bg-[var(--bg-surface-muted)] dark:text-[var(--text-main)]">
                  <Settings size={16} strokeWidth={2.2} />
                </span>
                <h2 className="text-base font-bold tracking-tight text-[#1C1917] dark:text-white">Cài đặt hệ thống</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsPopupOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-surface-muted)] hover:bg-[var(--border-ink-muted)] text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                aria-label="Đóng cài đặt"
                title="Đóng (ESC)"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--bg-canvas)] p-3 lg:p-4 dark:bg-[var(--bg-surface)]">
              <DesktopSettingsPage
                onNavigateTab={handleTabChange}
                onNavigateRoute={onNavigateRoute}
                embedded
              />
            </div>
          </section>
        </div>
      )}
      <QuickTaskModal />

      {pinCode && isPinLocked && (
        <PinLockModal
          isOpen={true}
          mode="unlock"
          currentPinHash={pinCode}
          onSuccess={unlockWithPin}
        />
      )}
    </div>
  );
};
