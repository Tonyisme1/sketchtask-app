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

  // Kiểm tra xem người dùng có đang ở chế độ Full Screen (Task detail, Full Note/Journal editor, hoặc Toàn màn hình AI)
  const isFullScreenView =
    Boolean(activeDetailTaskId) ||
    (activeTab === "notes" && Boolean(isMobileNoteDetailOpen)) ||
    (activeTab === "journal" && Boolean(isJournalBookOpen)) ||
    activeTab === "ai";

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
      {!isFullScreenView && (
        <button
          type="button"
          onClick={() => onTabChange("ai")}
          aria-label="Trợ lý AI"
          title="Trợ lý AI"
          className="fixed bottom-[72px] right-3.5 sm:right-5 z-40 flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-2xl border bg-white dark:bg-[#1C1C1E] text-[#1C1C1E] dark:text-[#F2F2F7] border-[#E5E5EA] dark:border-[#2C2C2E] shadow-sm hover:border-[#1C1C1E] dark:hover:border-white transition-all cursor-pointer active:scale-95"
        >
          <Sparkles
            size={16}
            strokeWidth={2.4}
            className="text-[#1C1C1E] dark:text-white"
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
