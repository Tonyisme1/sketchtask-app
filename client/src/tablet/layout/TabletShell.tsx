import React, { useState, useEffect } from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { TabletHeader } from "./TabletHeader";
import { TabletNav } from "./TabletNav";
import { ContextAwareFab } from "../../components/layout/ContextAwareFab";
import {
  AuthModal,
  PinLockModal,
  QuickTaskModal,
} from "../../features";
import {
  GlobalSearchModal,
  NotificationDrawer,
} from "../../shared/ui";
import { NotesSectionTabs } from "../../components/layout/NotesSectionTabs";

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
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

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
    today: 0,
    tasks: 1,
    notes: 2,
    journal: 2,
    settings: 3,
  };

  const SUBTAB_POSITION_MAP: Record<string, number> = {
    today: 0,
    planner: 1,
    deadlines: 2,
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
      className={`min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans flex flex-col selection:bg-[#FEF08A] selection:text-[#1C1917] ${
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
          onOpenNotifications={() => setIsNotificationOpen(true)}
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
          {!isDetailOpen && (activeTab === "notes" || activeTab === "journal") ? (
            <NotesSectionTabs activeTab={activeTab} onTabChange={onTabChange} />
          ) : null}
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

      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={onTabChange}
      />

      {/* Tablet Floating Action Button (Hidden when viewing task detail) */}
      {!isDetailOpen && !isSettingsView && (
        <ContextAwareFab
          activeTab={activeTab}
          activeTaskSubTab={activeTaskSubTab}
          onCreateTask={openQuickTaskModal}
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
