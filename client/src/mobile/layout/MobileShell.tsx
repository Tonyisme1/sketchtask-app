import React, { useState, useEffect } from "react";
import { TabKey, NavigationTarget } from "../../types";
import { useAppStore } from "../../stores";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { ContextAwareFab } from "../../components/layout/ContextAwareFab";
import { AuthModal } from "../../components/shared/auth/AuthModal";
import { PinLockModal } from "../../components/shared/auth/PinLockModal";
import { QuickTaskModal } from "../../components/shared/tasks/QuickTaskModal";
import {
  GlobalSearchModal,
  NotificationDrawer,
} from "../../components/ui";

export interface MobileShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({
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
    activeDetailTaskId,
    openTaskDetail,
    isMobileNoteDetailOpen,
    isJournalBookOpen,
    settingsMobileSubView,
    setSettingsMobileSubView,
  } = useAppStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Cuộn lên đầu trang khi chuyển tab, sub-tab, hoặc mở/đóng bất kỳ mục chi tiết nào
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [
    activeTab,
    activeTaskSubTab,
    activeDetailTaskId,
    isMobileNoteDetailOpen,
    isJournalBookOpen,
    settingsMobileSubView,
  ]);

  // Kiểm tra xem người dùng có đang ở chế độ Full Screen (Task detail, Full Note/Journal editor, hoặc Toàn màn hình AI)
  const isFullScreenView =
    Boolean(activeDetailTaskId) ||
    (activeTab === "notes" && Boolean(isMobileNoteDetailOpen)) ||
    (activeTab === "journal" && Boolean(isJournalBookOpen)) ||
    activeTab === "ai";

  return (
    <div
      className={`min-h-screen bg-[#F2F2F7] dark:bg-[#18181A] text-[#1C1C1E] dark:text-[#F2F2F7] font-sans flex flex-col selection:bg-[#FEF08A] selection:text-[#1C1917] ${
        !isTiltEnabled ? "no-tilt" : ""
      } ${paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""}`}
    >
      {/* 1. Mobile Topbar Header (Ẩn khi ở chế độ Full Screen / Task Detail / Note Editor / AI Page) */}
      {!isFullScreenView && (
        <MobileHeader
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onOpenSettings={() => {
            setSettingsMobileSubView(null);
            onTabChange("settings");
          }}
          onOpenLogin={() => onNavigateRoute("/login")}
          onLogout={logout}
          previousTab={previousTab}
        />
      )}

      {/* 2. Main Workspace (ViewPager Carousel Track bên trong quản lý trượt ngang) */}
      <main className="flex-1 min-w-0 w-full max-w-none overflow-x-hidden p-0 pb-0">
        {children}
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

      {/* 3. Mobile Bottom Dock (Ẩn khi ở chế độ Full Screen / Task Detail / Note Editor / AI Page) */}
      {!isFullScreenView && (
        <MobileNav
          activeTab={activeTab}
          activeTaskSubTab={activeTaskSubTab}
          onTabChange={onTabChange}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          isNotificationOpen={isNotificationOpen}
        />
      )}
    </div>
  );
};
