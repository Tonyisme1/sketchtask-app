import React, { useState, useEffect } from "react";
import { NavigationTarget, TabKey } from "../../types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ContextAwareFab } from "./ContextAwareFab";
import { DesktopSearchAutocomplete } from "./DesktopSearchAutocomplete";
import { DesktopNotificationDropdown } from "./DesktopNotificationDropdown";
import { useAppStore } from "../../stores/appStore";
import { AuthModal } from "../features/auth/AuthModal";
import {
  BrandLogo,
  DynamicIcon,
} from "../ui";
import { isNativePlatform } from "../../services/notificationService";
import { PinLockModal } from "../features/auth/PinLockModal";
import { GlobalSearchModal } from "../ui/overlays/GlobalSearchModal";
import { NotificationDrawer } from "../ui/overlays/NotificationDrawer";
import {
  Menu,
  Search,
  Bell,
  ArrowLeft,
  FileText,
  BookOpen,
  BookMarked,
  UserCheck,
  CheckSquare,
} from "lucide-react";
import { getTaskTemporalState, isTaskDueToday } from "../../utils/taskSemantics";

// ==========================================
// COMPONENT: AppShell (Khung Ứng Dụng với Tìm Kiếm Ở Chính Giữa)
// ==========================================

const SETTINGS_SECTION_TITLES: Record<string, string> = {
  account: "Tài khoản & Đồng bộ",
  general: "Giao diện & Trải nghiệm",
  notifications: "Thông báo & Âm thanh",
  data: "Dữ liệu & Bộ nhớ",
  security: "Bảo mật",
  shortcuts: "Phím tắt bàn phím",
  about: "Trợ giúp & Giới thiệu",
};

interface AppShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onNavigateRoute?: (path: string) => void;
  previousTab?: TabKey;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  onNavigateRoute,
  previousTab,
  children,
}) => {
  const {
    user,
    isTiltEnabled,
    pinCode,
    isPinLocked,
    unlockWithPin,
    paperStyle,
    toggleSidebar,
    activeTaskSubTab,
    selectedPlannerDate,
    tasks,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    settingsMobileSubView,
    setSettingsMobileSubView,
    openTaskDetail,
  } = useAppStore();

  const [isGlobalTaskCreateOpen, setIsGlobalTaskCreateOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isDesktopNotificationOpen, setIsDesktopNotificationOpen] = useState(false);

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

  // Tự động cuộn lên đầu trang khi chuyển qua tab khác
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [activeTab]);

  // Phím tắt bàn phím toàn cục: Ctrl + B (Đóng/Mở Sidebar), Ctrl + K (Tìm kiếm)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const [isScrollingDown, setIsScrollingDown] = useState(false);

  // Theo dõi cuộn trang trên mobile: cuốn đi khi vuốt xuống, xuất hiện khi vuốt nhẹ lên
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (currentScrollY <= 15) {
          setIsScrollingDown(false);
        } else if (currentScrollY > lastScrollY + 6) {
          setIsScrollingDown(true);
        } else if (currentScrollY < lastScrollY - 2) {
          setIsScrollingDown(false);
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenAccount = () => {
    onTabChange("settings");
    setSettingsMobileSubView("account");
  };

  return (
    <div
      className={`min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans flex flex-col selection:bg-[#FEF08A] selection:text-[#1C1917] ${
        !isTiltEnabled ? "no-tilt" : ""
      } ${paperStyle && paperStyle !== "blank" ? `paper-${paperStyle}` : ""}`}
    >
      {/* ========================================================================= */}
      {/* TOPBAR HEADER VỚI THANH TÌM KIẾM Ở CHÍNH GIỮA                            */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TOPBAR HEADER VỚI THANH TÌM KIẾM Ở CHÍNH GIỮA                            */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* TOPBAR HEADER VỚI THANH TÌM KIẾM Ở CHÍNH GIỮA                            */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 z-30 bg-[#FBF9F4] border-b border-[#262626]/20 px-3 sm:px-5 md:px-0 md:pr-6 lg:pr-8 xl:pr-10 ${
          isNativePlatform()
            ? "pt-11 pb-2.5"
            : "pt-[max(env(safe-area-inset-top),8px)] pb-2"
        } flex items-center justify-between transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform min-h-[50px] sm:min-h-[54px] ${
          isScrollingDown
            ? "-translate-y-full md:translate-y-0"
            : "translate-y-0"
        }`}
      >
        {/* 1. Header Left: Nút Menu Hamburger (Desktop) + Brand Logo / Dynamic Tab Title (Mobile) */}
        <div className="flex items-center min-w-0 shrink-0">
          {/* Box chứa Hamburger căn giữa chính xác 72px trên Desktop để khớp trục dọc Sidebar */}
          <div className="hidden md:flex w-[72px] items-center justify-center shrink-0">
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-9 h-9 flex items-center justify-center rounded-[4px] bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              title="Mở / Thu gọn menu bên (Ctrl + B)"
              aria-label="Thanh menu"
            >
              <Menu size={18} strokeWidth={2.4} />
            </button>
          </div>

          {/* Desktop Logo (Luôn hiển thị trên Desktop) */}
          <div
            onClick={() => onTabChange("tasks")}
            className="hidden md:flex cursor-pointer items-center gap-1.5 pl-0"
          >
            <BrandLogo size="md" />
          </div>

          {/* Mobile Context-Aware Header Left: Logo CHỈ xuất hiện tại Tab Hôm nay */}
          <div className="md:hidden flex items-center gap-2 min-w-0">
            {activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today") ? (
              /* Logo App chỉ xuất hiện tại tab Hôm nay */
              <div
                onClick={() => onTabChange("tasks")}
                className="cursor-pointer flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <BrandLogo size="md" />
              </div>
            ) : activeTab === "planner" || activeTab === "deadlines" ||
              (activeTab === "tasks" && (activeTaskSubTab === "planner" || activeTaskSubTab === "deadlines")) ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[4px] bg-[#BAE6FD] text-[#075985] border-[1.5px] border-[#262626] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626]">
                  <CheckSquare size={16} strokeWidth={2.4} />
                </div>
                <span className="font-black text-base text-[#1C1917] tracking-tight">Công việc</span>
              </div>
            ) : activeTab === "notes" ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[4px] bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626]">
                  <FileText size={16} strokeWidth={2.4} />
                </div>
                <span className="font-black text-base text-[#1C1917] tracking-tight">Ghi chú</span>
              </div>
            ) : activeTab === "journal" ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[4px] bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626]">
                  <BookOpen size={16} strokeWidth={2.4} />
                </div>
                <span className="font-black text-base text-[#1C1917] tracking-tight">Nhật ký</span>
              </div>
            ) : activeTab === "notebooks" ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[4px] bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626]">
                  <BookMarked size={16} strokeWidth={2.4} />
                </div>
                <span className="font-black text-base text-[#1C1917] tracking-tight">Sổ tay</span>
              </div>
            ) : activeTab === "review" ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-[4px] bg-[#1C1917] text-white border-[1.5px] border-[#1C1917] flex items-center justify-center shadow-[1.5px_1.5px_0px_#262626]">
                  <UserCheck size={16} strokeWidth={2.4} />
                </div>
                <span className="font-black text-base text-[#1C1917] tracking-tight">Cá nhân</span>
              </div>
            ) : activeTab === "settings" ? (
              settingsMobileSubView ? (
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setSettingsMobileSubView(null)}
                    className="w-8 h-8 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
                    title="Quay lại cài đặt"
                  >
                    <ArrowLeft size={16} strokeWidth={2.4} />
                  </button>
                  <span className="font-black text-base text-[#1C1917] tracking-tight truncate">
                    {SETTINGS_SECTION_TITLES[settingsMobileSubView] || "Cài đặt"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onTabChange(previousTab || "today")}
                    className="w-8 h-8 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
                    title="Quay lại"
                  >
                    <ArrowLeft size={16} strokeWidth={2.4} />
                  </button>
                  <span className="font-black text-base text-[#1C1917] tracking-tight">Cài đặt</span>
                </div>
              )
            ) : (
              <div
                onClick={() => onTabChange("tasks")}
                className="cursor-pointer flex items-center gap-1.5 active:scale-95 transition-transform"
              >
                <BrandLogo size="md" />
              </div>
            )}
          </div>
        </div>

        {/* 2. Header Center: THANH TÌM KIẾM SỔ XUỐNG Ở CHÍNH GIỮA (Desktop & Tablet) */}
        {activeTab !== "settings" && (
          <div className="hidden md:flex flex-1 max-w-md lg:max-w-lg mx-3 justify-center">
            <DesktopSearchAutocomplete onNavigateTab={onTabChange} />
          </div>
        )}

        {/* 3. Header Right: Đăng nhập / Tài Khoản, Chuông Thông Báo, Kính lúp (Mobile only) */}
        {activeTab !== "settings" && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Nút Tìm Kiếm trên Mobile */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              title="Tìm kiếm"
              className="md:hidden w-8 h-8 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              <Search size={15} strokeWidth={2.2} />
            </button>

            {/* 3.1 Chuông Thông Báo trên DESKTOP (Dropdown Popover kiểu YouTube) */}
            <div className="hidden md:block relative">
              <button
                type="button"
                onClick={() => setIsDesktopNotificationOpen((prev) => !prev)}
                title="Thông báo & Nhắc việc"
                className={`w-9 h-9 border-[1.5px] border-[#262626] rounded-[4px] flex items-center justify-center text-[#1C1917] transition-all select-none cursor-pointer ${
                  isDesktopNotificationOpen
                    ? "bg-[#FEF08A] shadow-none translate-x-[0.5px] translate-y-[0.5px]"
                    : "bg-white hover:bg-[#FEF08A] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                }`}
              >
                <Bell size={16} strokeWidth={2.2} />
                {alertCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-[#262626] shadow-[0.5px_0.5px_0px_#262626]">
                    {alertCount > 9 ? "9+" : alertCount}
                  </span>
                )}
              </button>

              {/* Popover thông báo Desktop */}
              <DesktopNotificationDropdown
                isOpen={isDesktopNotificationOpen}
                onClose={() => setIsDesktopNotificationOpen(false)}
                onNavigateTab={onTabChange}
              />
            </div>

            {/* 3.2 Chuông Thông Báo trên MOBILE (Drawer Bottom Sheet) */}
            <button
              type="button"
              onClick={() => setIsNotificationOpen(true)}
              title="Thông báo & Nhắc việc"
              className="md:hidden relative w-8 h-8 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            >
              <Bell size={15} strokeWidth={2.2} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-[#262626] shadow-[0.5px_0.5px_0px_#262626]">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </button>

            {/* 3.3 Tài khoản trên DESKTOP (Icon Avatar gọn gàng khi đã đăng nhập, hoặc Nút Đăng nhập Fullscreen) */}
            {user.isSignedIn ? (
              <button
                type="button"
                onClick={() => {
                  onTabChange("settings");
                  setSettingsMobileSubView("account");
                }}
                className="hidden md:flex w-9 h-9 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
                title={`Tài khoản: ${user.name} (Bấm để xem hồ sơ)`}
                aria-label="Tài khoản cá nhân"
              >
                <div
                  className="w-6 h-6 rounded-[2px] border border-[#262626] flex items-center justify-center text-[#1C1917]"
                  style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
                >
                  <DynamicIcon
                    name={user.avatar || "lucide:UserCheck"}
                    size={14}
                    strokeWidth={2.2}
                  />
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (onNavigateRoute) onNavigateRoute("/login");
                  else window.location.href = "/login";
                }}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
                title="Đăng nhập (Toàn màn hình)"
              >
                <DynamicIcon name="lucide:User" size={14} strokeWidth={2.4} />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* 3.4 Tài khoản trên MOBILE (Mở Sheet/Modal) */}
            <button
              type="button"
              onClick={handleOpenAccount}
              className="md:hidden w-8 h-8 rounded-[4px] border-[1.5px] border-[#262626] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
              title={user.isSignedIn ? `Tài khoản: ${user.name}` : "Đăng nhập"}
            >
              <div
                className="w-5 h-5 rounded-[2px] border border-[#262626] flex items-center justify-center text-[#1C1917]"
                style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={12}
                  strokeWidth={2.2}
                />
              </div>
            </button>
          </div>
        )}
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex min-h-0 w-full">
        {/* 1. Desktop Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={onTabChange}
          onOpenSettings={() => onTabChange("settings")}
        />

        {/* 2. Main Content Area */}
        <main
          key={`${activeTab}-${activeTaskSubTab}`}
          className={`flex-1 min-w-0 p-3 sm:p-5 md:p-6 lg:p-8 pb-24 md:pb-8 w-full max-w-none overflow-x-hidden ${
            activeTab === "settings" ? "" : "mobile-tab-enter motion-reduce:animate-none"
          }`}
        >
        {children}
      </main>
    </div>

    {/* Modal Đăng nhập / Tạo tài khoản */}
    <AuthModal
      isOpen={isAuthModalOpen}
      onClose={closeAuthModal}
    />

      {/* Màn Hình Khóa Mã PIN */}
      {pinCode && isPinLocked && (
        <PinLockModal
          isOpen={true}
          mode="unlock"
          currentPinHash={pinCode}
          onSuccess={unlockWithPin}
        />
      )}

      {/* Modal Tìm Kiếm Toàn Cục */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={onTabChange}
      />

      {/* Drawer Thông Báo */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        onNavigateTab={onTabChange}
      />

      {/* Mobile Only: Floating Action Button */}
      <ContextAwareFab
        activeTab={activeTab}
        activeTaskSubTab={activeTaskSubTab}
        onCreateTask={() => openTaskDetail("new")}
      />

      {/* Mobile Only: Bottom Navigation Dock */}
      <MobileNav
        activeTab={activeTab}
        activeTaskSubTab={activeTaskSubTab}
        onTabChange={onTabChange}
      />
    </div>
  );
};
