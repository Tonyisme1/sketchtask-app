import React, { useState, useRef, useEffect } from "react";
import { TabKey } from "../../types";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { useAppStore } from "../../stores/appStore";
import { AuthModal } from "../features/auth/AuthModal";
import { SettingsModal } from "../features/settings/SettingsModal";
import { OnboardingModal } from "../features/onboarding/OnboardingModal";
import { GlobalSearchModal } from "../ui/GlobalSearchModal";
import { UpdateModal } from "../ui/UpdateModal";
import { checkForAppUpdates, UpdateInfo } from "../../services/updateService";
import { isNativePlatform } from "../../services/notificationService";
import { BrandLogo } from "../ui/BrandLogo";
import { DynamicIcon } from "../ui/DynamicIcon";
import { NotificationBell } from "../ui/NotificationBell";
import { User, Settings, KeyRound, LogOut, Search } from "lucide-react";

// ==========================================
// COMPONENT: AppShell (Topbar với BrandLogo & Menu Avatar Hiện Đại)
// ==========================================

interface AppShellProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  onTabChange,
  children,
}) => {
  const { user, logout, isTiltEnabled, isFirstVisit } = useAppStore();
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const avatarMenuRef = useRef<HTMLDivElement>(null);

  // Tự động kiểm tra cập nhật ngầm trong background khi mở app
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForAppUpdates().then((info) => {
        if (info && info.hasUpdate) {
          setUpdateInfo(info);
        }
      });
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Phím tắt bàn phím toàn cục Ctrl + K / Cmd + K để mở tìm kiếm
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Đóng khi click ngoài
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
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-[#FBF9F4] text-[#1C1917] font-sans flex selection:bg-[#FEF08A] selection:text-[#1C1917] ${
        !isTiltEnabled ? "no-tilt" : ""
      }`}
    >
      {/* 1. Desktop Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* 2. Main Workspace (Canvas bên phải) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Topbar Header với Native Status Bar Inset */}
        <header
          className={`sticky top-0 z-30 bg-[#FBF9F4] border-b-[1.5px] border-[#262626] px-3.5 sm:px-4 ${
            isNativePlatform()
              ? "pt-11 pb-2.5"
              : "pt-[max(env(safe-area-inset-top),10px)] pb-2.5"
          } shadow-[0px_2px_0px_#262626] flex items-center justify-between transition-all`}
        >
          {/* Brand Logo */}
          <BrandLogo size="md" />

          {/* Right: Search Button + Notification Bell + Avatar Button with Menu Popover */}
          <div className="flex items-center gap-2">
            {/* Nút Tìm Kiếm Toàn Cục Ctrl + K */}
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              title="Tìm kiếm nhanh (Ctrl + K)"
              className="h-8 px-2 sm:px-2.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center gap-1.5 text-xs font-bold text-[#1C1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none"
            >
              <Search size={14} strokeWidth={2.4} />
              <span className="hidden sm:inline">Tìm kiếm</span>
              <kbd className="hidden sm:inline text-[9px] font-mono px-1 py-0.2 bg-[#F3EFE6] border border-[#D4CEBF] rounded text-[#78716C]">
                Ctrl K
              </kbd>
            </button>

            <NotificationBell />

            <div ref={avatarMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                title="Hồ sơ & Cài đặt"
                className="w-8 h-8 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none"
                style={{ backgroundColor: user.avatarBg || "#BBF7D0" }}
              >
                <DynamicIcon
                  name={user.avatar || "lucide:User"}
                  size={17}
                  strokeWidth={2.2}
                />
              </button>

              {/* Avatar Dropdown Popover */}
              {isAvatarMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] select-none">
                  {/* User Info Header */}
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#D4CEBF]">
                    <div
                      className="w-8 h-8 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917]"
                      style={{ backgroundColor: user.avatarBg || "#BBF7D0" }}
                    >
                      <DynamicIcon
                        name={user.avatar || "lucide:User"}
                        size={17}
                        strokeWidth={2.2}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-[#1C1917] truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-[#78716C] truncate font-mono">
                        {user.isSignedIn
                          ? user.email
                          : "Khách (Chưa đăng nhập)"}
                      </p>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-1">
                    {/* Mục Mở Cài Đặt Hệ Thống */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        setIsSettingsModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] bg-white hover:bg-[#F3EFE6] border border-[#D4CEBF] text-left transition-colors font-bold shadow-[1px_1px_0px_#262626]"
                    >
                      <Settings size={14} strokeWidth={2.2} />
                      <span>Cài đặt hệ thống</span>
                    </button>

                    {/* Nút Mở Đăng Nhập / Tạo Tài Khoản */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAvatarMenuOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] text-[#1C1917] bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] text-left transition-colors font-bold shadow-[1px_1px_0px_#262626]"
                    >
                      <KeyRound size={14} strokeWidth={2.2} />
                      <span>
                        {user.isSignedIn
                          ? "Quản lý tài khoản"
                          : "Đăng nhập / Đăng ký"}
                      </span>
                    </button>

                    {/* Mục Đăng xuất khi đã đăng nhập */}
                    {user.isSignedIn && (
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          setIsAvatarMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[3px] text-red-600 hover:bg-[#FECDD3]/50 text-left transition-colors font-bold pt-1.5 border-t border-[#D4CEBF]/60"
                      >
                        <LogOut size={14} strokeWidth={2.2} />
                        <span>Đăng xuất</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Modal Tìm Kiếm Toàn Cục Ctrl + K */}
        <GlobalSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onNavigate={onTabChange}
        />

        {/* Modal Cài Đặt Hệ Thống */}
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Modal Đăng nhập / Tạo tài khoản / Quản lý tài khoản */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onBackToSettings={() => {
            setIsAuthModalOpen(false);
            setIsSettingsModalOpen(true);
          }}
        />

        {/* Modal Tự Động Báo Cập Nhật Mới */}
        <UpdateModal
          updateInfo={updateInfo}
          onClose={() => setUpdateInfo(null)}
        />

        {/* Onboarding chào mừng lần đầu vào app */}
        <OnboardingModal isOpen={isFirstVisit} />

        {/* Main Content Area với hiệu ứng Lật Trang Êm Ái khi đổi Tab */}
        <main
          key={activeTab}
          className="flex-1 px-3 sm:px-6 md:px-10 py-4 sm:py-8 pb-24 md:pb-10 max-w-5xl w-full mx-auto animate-page-flip"
        >
          {children}
        </main>
      </div>

      {/* 3. Mobile Bottom Navigation Dock */}
      <MobileNav activeTab={activeTab} onTabChange={onTabChange} />
    </div>
  );
};
