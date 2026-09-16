import React, { useState, useEffect } from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
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
import { Sparkles } from "lucide-react";

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

  // Kiểm tra xem người dùng có đang ở chế độ Full Screen (Task detail, Full Note/Journal editor)
  const isFullScreenView =
    Boolean(activeDetailTaskId) ||
    (activeTab === "notes" && Boolean(isMobileNoteDetailOpen)) ||
    (activeTab === "journal" && Boolean(isJournalBookOpen));

  return (
    <div
      className={`min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans flex flex-col selection:bg-[#FEF08A] selection:text-[#1C1917] ${
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

      {/* 3. Floating AI Action Button (Chỉ hiển thị khi không ở chế độ Full Screen & không ở tab AI) */}
      {!isFullScreenView && activeTab !== "ai" && (
        <button
          type="button"
          onClick={() => onTabChange("ai")}
          aria-label="Trợ lý AI"
          title="Trợ lý AI"
          className="fixed bottom-[72px] right-3.5 sm:right-5 z-40 flex items-center justify-center gap-1.5 h-11 px-3.5 rounded-2xl border shadow-lg transition-all duration-200 cursor-pointer active:scale-95 bg-white/95 dark:bg-[#2C2C2E]/95 backdrop-blur-md text-[#1C1917] dark:text-white border-[#E5E5EA] dark:border-[#3A3A3C] shadow-black/10 hover:border-[#1C1917] dark:hover:border-white"
        >
          <Sparkles
            size={18}
            strokeWidth={2.3}
            className="text-amber-500 dark:text-amber-400"
          />
          <span className="text-xs font-black tracking-wider">AI</span>
        </button>
      )}

      {/* 4. Mobile Bottom Dock (Ẩn khi ở chế độ Full Screen / Task Detail / Note Editor / AI Page) */}
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
