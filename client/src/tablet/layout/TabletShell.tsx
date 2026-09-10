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
    openQuickTaskModal,
  } = useAppStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab, activeTaskSubTab, activeDetailTaskId]);

  const isDetailOpen = Boolean(activeDetailTaskId);
  const isSettingsView = activeTab === "settings";

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
              : "p-5 md:p-6 pb-28 mobile-tab-enter motion-reduce:animate-none"
        }`}
      >
        <div className="w-full max-w-4xl mx-auto min-w-0">
          {activeTab === "notes" || activeTab === "journal" ? (
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
