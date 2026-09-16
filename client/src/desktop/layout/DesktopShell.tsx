import React, { useState, useEffect } from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { DesktopHeader } from "./DesktopHeader";
import { DesktopSidebar } from "./DesktopSidebar";
import {
  AuthModal,
  PinLockModal,
  QuickTaskModal,
  SettingsTab,
} from "../../features";
import {
  GlobalSearchModal,
} from "../../shared/ui";
import { Settings, X } from "lucide-react";
import { NotesSectionTabs } from "../../components/layout/NotesSectionTabs";
import { useModalBackClose } from "../../hooks/useModalBackClose";

export interface DesktopShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  children: React.ReactNode;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  children,
}) => {
  const {
    isTiltEnabled,
    pinCode,
    isPinLocked,
    unlockWithPin,
    paperStyle,
    toggleSidebar,
    activeTaskSubTab,
    activeDetailTaskId,
    isAuthModalOpen,
    closeAuthModal,
    setSettingsMobileSubView,
    openQuickTaskModal,
    logout,
    isMobileNoteDetailOpen,
    isJournalBookOpen,
  } = useAppStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsPopupOpen, setIsSettingsPopupOpen] = useState(false);

  useModalBackClose(isSettingsPopupOpen, () => setIsSettingsPopupOpen(false));

  // Scroll to top on tab and subtab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, activeTaskSubTab, activeDetailTaskId]);

  const isDetailOpen =
    (activeTab === "notes" && Boolean(isMobileNoteDetailOpen)) ||
    (activeTab === "journal" && Boolean(isJournalBookOpen));

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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.toLowerCase() === "n" &&
        !isInput
      ) {
        e.preventDefault();
        openQuickTaskModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, openQuickTaskModal]);

  const handleOpenDesktopSettings = () => {
    setSettingsMobileSubView(null);
    setIsSettingsPopupOpen(true);
  };

  const handleTabChange = (tab: TabKey, target?: NavigationTarget) => {
    if (tab === "settings") {
      handleOpenDesktopSettings();
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
      className="min-h-screen bg-[#F2F2F7] dark:bg-[#000000] text-[#1C1C1E] dark:text-[#F2F2F7] font-sans flex flex-col selection:bg-[#007AFF] selection:text-white"
    >
      {/* 1. Desktop Topbar Header (Ẩn khi mở nội dung chi tiết) */}
      {!isDetailOpen && (
        <DesktopHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNavigateRoute={onNavigateRoute}
          onOpenSettings={handleOpenDesktopSettings}
          onOpenLogin={() => onNavigateRoute("/login")}
          onLogout={logout}
        />
      )}

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 w-full">
        {/* Desktop Left Sidebar (Ẩn khi mở nội dung chi tiết) */}
        {!isDetailOpen && (
          <DesktopSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onCreateTask={openQuickTaskModal}
            onOpenSettings={handleOpenDesktopSettings}
          />
        )}

        {/* Main Content Area (Thoáng đãng & Hỗ trợ Docked Side Panel) */}
        <main
          key={`desktop-${activeTab}-${activeTaskSubTab}`}
          className="flex-1 min-w-0 flex flex-col w-full overflow-x-hidden"
        >
          {!isDetailOpen && (activeTab === "notes" || activeTab === "journal") ? (
            <div className="px-6 pt-6 lg:px-8 xl:px-10">
              <div className="mx-auto w-full max-w-6xl 2xl:max-w-[1480px]">
                <NotesSectionTabs activeTab={activeTab} onTabChange={handleTabChange} />
              </div>
            </div>
          ) : null}
          {children}
        </main>
      </div>

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
          className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 lg:p-8 animate-in fade-in duration-150"
        >
          <section
            role="document"
            onClick={(event) => event.stopPropagation()}
            className="flex h-[min(90dvh,840px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] shadow-2xl animate-in zoom-in-95 duration-150"
          >
            <header className="flex min-h-[56px] items-center justify-between border-b border-[#E5E5EA] dark:border-[#2C2C2E] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl px-5 lg:px-6 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.06] dark:bg-white/[0.1] text-[#1C1C1E] dark:text-[#F2F2F7]">
                  <Settings size={16} strokeWidth={2.2} />
                </span>
                <h2 className="text-base font-semibold tracking-tight text-[#1C1C1E] dark:text-[#F2F2F7]">Cài đặt</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsPopupOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#2C2C2E] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs transition-all active:scale-95 cursor-pointer"
                aria-label="Đóng cài đặt"
                title="Đóng (ESC)"
              >
                <X size={15} strokeWidth={2.2} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6 bg-[#F2F2F7]/50 dark:bg-black/30">
              <SettingsTab
                onNavigateTab={handleTabChange}
                onNavigateRoute={onNavigateRoute}
                embedded
                platform="desktop"
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

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={onTabChange}
      />

    </div>
  );
};
