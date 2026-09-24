import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { MobileEventSubTab, TabKey, NavigationTarget } from "../../types";
import { useAppStore } from "../../stores";
import { MobileHeader } from "./MobileHeader";
import { MobileNav } from "./MobileNav";
import { ContextAwareFab } from "../../components/layout/ContextAwareFab";
import { AuthModal } from "../../components/shared/auth/AuthModal";
import { PinLockModal } from "../../components/shared/auth/PinLockModal";
import { QuickTaskModal } from "../../components/shared/tasks/QuickTaskModal";
import { GlobalSearchModal } from "../../components/ui";

export interface MobileShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  activeEventSubTab: MobileEventSubTab;
  onEventSubTabChange: (subTab: MobileEventSubTab) => void;
  children: React.ReactNode;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  previousTab,
  activeEventSubTab,
  onEventSubTabChange,
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const initialHeight = window.visualViewport?.height || window.innerHeight;
    const handleViewportResize = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setIsKeyboardOpen(
        currentHeight < initialHeight - 100 ||
          currentHeight < window.innerHeight * 0.82,
      );
    };

    window.visualViewport?.addEventListener("resize", handleViewportResize);
    window.addEventListener("resize", handleViewportResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
      window.removeEventListener("resize", handleViewportResize);
    };
  }, []);

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
      className={`min-h-screen bg-[#F5F7FA] dark:bg-[#12161B] text-[#1C1C1E] dark:text-[#F2F2F7] font-sans flex flex-col ${
        !isTiltEnabled ? "no-tilt" : ""
      } ${paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""}`}
    >
      {/* 1. Mobile Topbar Header (Ẩn khi ở chế độ Full Screen / Task Detail / Note Editor / AI Page) */}
      {!isFullScreenView && (
        <MobileHeader
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={() => {
            setSettingsMobileSubView(null);
            onTabChange("settings");
          }}
          onOpenLogin={() => onNavigateRoute("/login")}
          onLogout={logout}
          previousTab={previousTab}
          activeEventSubTab={activeEventSubTab}
          onEventSubTabChange={onEventSubTabChange}
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

      {/* 3. FAB trợ lý AI: công cụ nổi, không chiếm một ô điều hướng chính */}
      {!isFullScreenView && !isKeyboardOpen && (
        <button
          type="button"
          onClick={() => onTabChange("ai")}
          aria-label="Mở Trợ lý AI"
          title="Trợ lý AI"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 76px)" }}
          className="fixed right-4 z-[45] flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-[var(--border-ink)] bg-[var(--accent-blue)] text-white shadow-[2px_2px_0px_var(--border-ink)] transition-transform hover:brightness-105 active:translate-x-[1.5px] active:translate-y-[1.5px] active:shadow-none md:hidden"
        >
          <Sparkles size={22} strokeWidth={2.2} />
        </button>
      )}

      {/* 4. Mobile Bottom Dock (Ẩn khi ở chế độ Full Screen / Task Detail / Note Editor / AI Page) */}
      {!isFullScreenView && (
        <MobileNav
          activeTab={activeTab}
          activeTaskSubTab={activeTaskSubTab}
          onTabChange={onTabChange}
        />
      )}
    </div>
  );
};
