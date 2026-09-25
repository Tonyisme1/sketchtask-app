import React, { useState, useEffect } from "react";
import { TabKey, NavigationTarget } from "../../types";
import { useAppStore } from "../../stores";
import { TabletHeader } from "./TabletHeader";
import { TabletNav } from "./TabletNav";
import { ContextAwareFab } from "../../components/layout/ContextAwareFab";
import { AuthModal } from "../../components/shared/auth/AuthModal";
import { PinLockModal } from "../../components/shared/auth/PinLockModal";
import { QuickTaskModal } from "../../components/shared/tasks/QuickTaskModal";
import { GlobalSearchModal } from "../../components/ui";
import { NotesSectionTabs } from "../../components/shared/notes/NotesSectionTabs";

export interface TabletShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  children: React.ReactNode;
}

export const TabletShell: React.FC<TabletShellProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  previousTab,
  children,
}) => {
  const {
    isTiltEnabled,
    pinCode,
    isPinLocked,
    unlockWithPin,
    paperStyle,
    activeTaskSubTab,
    isAuthModalOpen,
    logout,
    closeAuthModal,
    setSettingsMobileSubView,
    activeDetailTaskId,
    isMobileNoteDetailOpen,
    isJournalBookOpen,
    openQuickTaskModal,
  } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, activeTaskSubTab, activeDetailTaskId, isMobileNoteDetailOpen, isJournalBookOpen]);

  const isDetailOpen =
    Boolean(activeDetailTaskId) ||
    (activeTab === "notes" && Boolean(isMobileNoteDetailOpen)) ||
    (activeTab === "journal" && Boolean(isJournalBookOpen));
  const isSettingsView = activeTab === "settings";

  const TAB_POSITION_MAP: Record<string, number> = {
    tasks: 0,
    events: 1,
    notes: 2,
    journal: 2,
    ai: 3,
    settings: 4,
  };

  const SUBTAB_POSITION_MAP: Record<string, number> = {
    today: 0,
    planner: 1,
  };

  const previousTabRef = React.useRef<TabKey>(activeTab);
  const previousSubTabRef = React.useRef<string>(activeTaskSubTab);
  const [tabSlideClass, setTabSlideClass] = useState<string>("mobile-tab-slide-left");

  if (activeTab !== previousTabRef.current || activeTaskSubTab !== previousSubTabRef.current) {
    const prevPos = TAB_POSITION_MAP[previousTabRef.current] ?? 0;
    const currentPos = TAB_POSITION_MAP[activeTab] ?? 0;

    let nextClass = tabSlideClass;
    if (currentPos !== prevPos) {
      nextClass = currentPos > prevPos ? "mobile-tab-slide-left" : "mobile-tab-slide-right";
    } else if (activeTab === "tasks") {
      const prevSubPos = SUBTAB_POSITION_MAP[previousSubTabRef.current] ?? 0;
      const currentSubPos = SUBTAB_POSITION_MAP[activeTaskSubTab] ?? 0;
      if (currentSubPos !== prevSubPos) {
        nextClass = currentSubPos > prevSubPos ? "mobile-tab-slide-left" : "mobile-tab-slide-right";
      }
    }

    if (nextClass !== tabSlideClass) {
      setTabSlideClass(nextClass);
    }
    previousTabRef.current = activeTab;
    previousSubTabRef.current = activeTaskSubTab;
  }

  return (
    <div
      className={`min-h-screen bg-[#F2F2F7] dark:bg-[#18181A] text-[#1C1C1E] dark:text-[#F2F2F7] font-sans flex flex-col  ${
        !isTiltEnabled ? "no-tilt" : ""
      } ${paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""}`}
    >
      {/* 1. Tablet Topbar Header (Hidden when viewing task detail) */}
      {!isDetailOpen && (
        <TabletHeader
          activeTab={activeTab}
          onTabChange={onTabChange}
          onNavigateRoute={onNavigateRoute}
          onOpenSettings={() => {
            setSettingsMobileSubView(null);
            onTabChange("settings");
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenLogin={() => onNavigateRoute("/login")}
          onLogout={logout}
          previousTab={previousTab}
        />
      )}

      {/* 2. Main Workspace Layout (Một cột tập trung) */}
      <main
        key={`tablet-${activeTab}-${activeTaskSubTab}-${isDetailOpen ? "detail" : "main"}`}
        className={`flex-1 min-w-0 w-full overflow-x-hidden ${
          isDetailOpen
            ? "p-0 pb-6"
            : isSettingsView
              ? "p-5 md:p-6 pb-5"
              : `p-5 md:p-6 pb-28 ${tabSlideClass} motion-reduce:animate-none`
        }`}
      >
        <div className="w-full max-w-4xl mx-auto min-w-0">
          {!isDetailOpen && (activeTab === "notes" || activeTab === "journal") && (
            <NotesSectionTabs
              activeTab={activeTab}
              onTabChange={(tab) => onTabChange(tab)}
            />
          )}
          {children}
        </div>
      </main>

      {/* Overlays */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onOpenSettings={() => {
          setSettingsMobileSubView(null);
          onTabChange("settings");
        }}
      />
      <QuickTaskModal />
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={onTabChange}
      />

      {pinCode && isPinLocked && (
        <PinLockModal
          isOpen={true}
          mode="unlock"
          currentPinHash={pinCode}
          onSuccess={unlockWithPin}
        />
      )}

      {/* Tablet Floating Action Button (Hidden when viewing task detail) */}
      {!isDetailOpen && !isSettingsView && (
        <ContextAwareFab
          activeTab={activeTab}
          activeTaskSubTab={activeTaskSubTab}
          onCreateTask={openQuickTaskModal}
          onCreateEvent={() => openQuickTaskModal({ itemType: "event", lockItemType: true })}
          showOnTablet
        />
      )}

      {/* Tablet Bottom Dock (Hidden when viewing task detail) */}
      {!isDetailOpen && !isSettingsView && (
        <TabletNav
          activeTab={activeTab}
          activeTaskSubTab={activeTaskSubTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};
