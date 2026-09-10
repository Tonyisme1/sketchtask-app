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
    selectedNotebookId,
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
    (activeTab === "journal" && Boolean(isJournalBookOpen)) ||
    (activeTab === "notebooks" && Boolean(selectedNotebookId));

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
      className={`min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans flex flex-col selection:bg-[#FEF08A] selection:text-[#1C1917] ${
        !isTiltEnabled ? "no-tilt" : ""
      } ${paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""}`}
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

      {/* Desktop account menu opens Settings as a large B&W popup modal. */}
      {isSettingsPopupOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Cài đặt"
          onClick={() => setIsSettingsPopupOpen(false)}
          className="fixed inset-0 z-[999998] flex items-center justify-center bg-black/60 p-4 lg:p-8 backdrop-blur-[2px] animate-in fade-in duration-150"
        >
          <section
            role="document"
            onClick={(event) => event.stopPropagation()}
            className="flex h-[min(90dvh,840px)] w-full max-w-5xl flex-col overflow-hidden rounded-[8px] border-[2px] border-[#262626] bg-[#FFFDF8] shadow-[8px_8px_0px_#262626] animate-in zoom-in-95 duration-150"
          >
            <header className="flex min-h-[52px] items-center justify-between border-b-[1.5px] border-[#262626] bg-white px-5 lg:px-6 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-[#1C1917] text-white shadow-[1px_1px_0px_#262626]">
                  <Settings size={14} strokeWidth={2.4} />
                </span>
                <h2 className="text-base font-black tracking-tight text-[#1C1917]">Cài đặt</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsPopupOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-white hover:bg-[#FAF8F3] text-[#1C1917] shadow-[1px_1px_0px_#262626] transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
                aria-label="Đóng cài đặt"
                title="Đóng (ESC)"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6 bg-[#FAF8F3]/40">
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
