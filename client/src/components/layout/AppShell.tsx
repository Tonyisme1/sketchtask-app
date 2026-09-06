import React, { useState, useRef, useEffect } from "react";
import { NavigationTarget, TabKey } from "../../types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ContextAwareFab } from "./ContextAwareFab";
import { useAppStore } from "../../stores/appStore";
import { AuthModal } from "../features/auth/AuthModal";
import { OnboardingModal } from "../features/today/onboarding/OnboardingModal";
import {
  BrandLogo,
  DynamicIcon,
} from "../ui";
import { isNativePlatform } from "../../services/notificationService";
import { PinLockModal } from "../features/auth/PinLockModal";
import { GlobalTaskCreateModal } from "../ui/overlays/GlobalTaskCreateModal";
import { GlobalSearchModal } from "../ui/overlays/GlobalSearchModal";
import { NotificationDrawer } from "../ui/overlays/NotificationDrawer";
import {
  User,
  Settings,
  PanelLeft,
  Search,
  Bell,
  ArrowLeft,
} from "lucide-react";
import { getLocalTodayStr } from "../../utils/date";
import { getTaskTemporalState, isTaskDueToday } from "../../utils/taskSemantics";

// ==========================================
// COMPONENT: AppShell (Topbar với BrandLogo & Menu Avatar Hiện Đại)
// ==========================================

interface AppShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  children,
}) => {
  const {
    user,
    logout,
    isTiltEnabled,
    isFirstVisit,
    dismissOnboarding,
    pinCode,
    isPinLocked,
    unlockWithPin,
    lockApp,
    paperStyle,
    completedTaskPrompt,
    dismissCompletedTaskPrompt,
    openJournalWithTask,
    isSidebarOpen,
    toggleSidebar,
    activeTaskSubTab,
    selectedPlannerDate,
    tasks,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
  } = useAppStore();
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isGlobalTaskCreateOpen, setIsGlobalTaskCreateOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Đếm thông báo / việc cần làm gấp
  const alertCount = React.useMemo(() => {
    const overdue = tasks.filter(
      (t) =>
        !t.completed &&
        (getTaskTemporalState(t) === "overdue" ||
          getTaskTemporalState(t) === "pastScheduled")
    ).length;
    const dueToday = tasks.filter((t) => !t.completed && isTaskDueToday(t)).length;
    return overdue + dueToday;
  }, [tasks]);

  const isPersonalOrSettingsTab = activeTab === "review" || activeTab === "settings";

  // Tự động cuộn lên đầu trang khi chuyển qua tab khác
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Phím tắt bàn phím toàn cục: Ctrl + B (Đóng/Mở Sidebar)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // Đóng khi click ngoài (dùng pointerdown để xử lý đồng bộ mượt mà không chặn sự kiện click trên mobile)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(e.target as Node)
      ) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [isScrollingDown, setIsScrollingDown] = useState(false);

  // Theo dõi cuộn trang: cuốn đi mượt mà khi vuốt xuống, xuất hiện tức thì khi vuốt nhẹ lên
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        // Ở đỉnh trang (top <= 15px): luôn khóa mở Header cố định
        if (currentScrollY <= 15) {
          setIsScrollingDown(false);
        } else if (currentScrollY > lastScrollY + 6) {
          // Vuốt xuống -> Header cuốn đi tự nhiên
          setIsScrollingDown(true);
          setIsAvatarMenuOpen(false);
        } else if (currentScrollY < lastScrollY - 2) {
          // Chỉ cần vuốt nhẹ lên -> Header trượt xuống xuất hiện ngay lập tức
          setIsScrollingDown(false);
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans flex selection:bg-[#FEF08A] selection:text-[#1C1917] ${
        !isTiltEnabled ? "no-tilt" : ""
      } ${paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""}`}
    >
      {/* 1. Desktop Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenIntro={() => setIsOnboardingOpen(true)}
        onOpenSettings={() => onTabChange("settings")}
      />

      {/* 2. Main Workspace (Canvas bên phải) */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen ${
          paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""
        }`}
      >
        {/* Topbar Header: Liền mạch với nền sổ tay, cuốn đi khi vuốt xuống & trượt xuống khi vuốt nhẹ lên */}
        <header
          className={`sticky top-0 z-30 bg-[#FBF9F4] border-b border-[#262626]/20 px-3 sm:px-5 md:px-8 lg:px-8 xl:px-10 ${
            isNativePlatform()
              ? "pt-11 pb-2.5"
              : "pt-[max(env(safe-area-inset-top),8px)] pb-2"
          } flex items-center justify-between transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform min-h-[50px] sm:min-h-[56px] ${
            isScrollingDown
              ? "-translate-y-full md:translate-y-0"
              : "translate-y-0"
          }`}
        >
          {/* Header Left: Logo ở các tab, Nút Quay lại ⬅ ở trang Cài Đặt (như YouTube) */}
          <div className="flex items-center gap-2 min-w-0">
            {!isSidebarOpen && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="hidden md:flex h-8 px-2.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] items-center gap-1.5 text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
                title="Mở thanh menu bên (Ctrl + B)"
                aria-label="Mở thanh menu bên"
              >
                <PanelLeft size={15} strokeWidth={2.4} />
                <span>Menu</span>
              </button>
            )}

            {activeTab === "settings" ? (
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => onTabChange("review")}
                  className="p-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
                  title="Quay lại Cá nhân"
                  aria-label="Quay lại Cá nhân"
                >
                  <ArrowLeft size={16} strokeWidth={2.4} />
                </button>
                <h1 className="text-base sm:text-lg font-black text-[#1C1917] tracking-tight truncate">
                  Cài đặt
                </h1>
              </div>
            ) : activeTab === "review" ? (
              <button
                type="button"
                onClick={openAuthModal}
                className="flex items-center gap-2 px-2.5 py-1 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer min-w-0 max-w-[200px] sm:max-w-[240px]"
                title="Chuyển đổi tài khoản / Đăng nhập"
              >
                <div
                  className="w-5 h-5 rounded-[4px] border border-[#262626] flex items-center justify-center shrink-0 text-[#1C1917]"
                  style={{ backgroundColor: user.avatarBg || "#DDD6FE" }}
                >
                  <DynamicIcon
                    name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                    size={13}
                    strokeWidth={2.2}
                  />
                </div>
                <span className="text-xs font-bold truncate">
                  {user.isSignedIn ? user.name : "Đăng nhập / Đổi Acc"}
                </span>
                <span className="text-[11px] text-[#78716C] font-mono shrink-0 ml-0.5">⇄</span>
              </button>
            ) : (
              <div className={isSidebarOpen ? "md:hidden" : "block"}>
                <BrandLogo size="md" />
              </div>
            )}
          </div>

          {/* Header Right: Actions (Thông Báo, Tìm Kiếm, Cài Đặt) - Ẩn hoàn toàn khi ở trang Cài Đặt */}
          {activeTab !== "settings" && (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* 1. Chuông Thông Báo */}
              <button
                type="button"
                onClick={() => setIsNotificationOpen(true)}
                title="Thông báo & Nhắc việc"
                className="relative w-8 h-8 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              >
                <Bell size={15} strokeWidth={2.2} />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-[#262626] shadow-[0.5px_0.5px_0px_#262626]">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>

              {/* 2. Nút Tìm Kiếm */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Tìm kiếm toàn bộ ứng dụng"
                className="w-8 h-8 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
              >
                <Search size={15} strokeWidth={2.2} />
              </button>

              {/* 3. Ở Tab Cá Nhân: Nút Cài Đặt (như icon bánh răng của YouTube You tab) */}
              {activeTab === "review" && (
                <button
                  type="button"
                  onClick={() => onTabChange("settings")}
                  title="Cài đặt hệ thống"
                  className="w-8 h-8 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FEF08A] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                >
                  <Settings size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          )}
        </header>

        {/* Modal Đăng nhập / Tạo tài khoản / Quản lý tài khoản */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={closeAuthModal}
          onBackToSettings={() => {
            closeAuthModal();
            onTabChange("settings");
          }}
        />

        {/* Onboarding Giới thiệu chỉ khi người dùng chủ động mở */}
        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={() => {
              setIsOnboardingOpen(false);
              dismissOnboarding();
            }}
          />
        )}

        {/* Màn Hình Khóa Mã PIN Bảo Vệ Sổ Tay */}
        {pinCode && isPinLocked && (
          <PinLockModal
            isOpen={true}
            mode="unlock"
            currentPinHash={pinCode}
            onSuccess={unlockWithPin}
          />
        )}

        <GlobalTaskCreateModal
          isOpen={isGlobalTaskCreateOpen}
          onClose={() => setIsGlobalTaskCreateOpen(false)}
          initialDate={
            (activeTab === "planner" || (activeTab === "tasks" && activeTaskSubTab === "planner"))
              ? selectedPlannerDate
              : undefined
          }
        />

        {/* Modal Tìm Kiếm Toàn Cục */}
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigateTab={onTabChange}
        />

        {/* Drawer / Popover Trung Tâm Thông Báo & Nhắc Việc */}
        <NotificationDrawer
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onNavigateTab={onTabChange}
        />

        {/* Main Content Area với hiệu ứng Lật Trang Êm Ái khi đổi Tab */}
        <main
          key={`${activeTab}-${activeTaskSubTab}`}
          className={`flex-1 min-w-0 px-3 sm:px-5 md:px-8 lg:px-8 xl:px-10 py-3.5 sm:py-5 pb-24 md:pb-10 w-full max-w-none ${activeTab === "settings" ? "" : "mobile-tab-enter motion-reduce:animate-none"}`}
        >
          {children}
        </main>
      </div>

      <ContextAwareFab
        activeTab={activeTab}
        activeTaskSubTab={activeTaskSubTab}
        onCreateTask={() => setIsGlobalTaskCreateOpen(true)}
      />

      {/* 3. Mobile Bottom Navigation Dock */}
      <MobileNav
        activeTab={activeTab}
        activeTaskSubTab={activeTaskSubTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};
