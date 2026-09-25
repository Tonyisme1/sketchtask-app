import React, { useEffect, useRef, useState } from "react";
import { MobileEventSubTab, NavigationTarget, TabKey } from "../../types";
import { useAppStore } from "../../stores";
import { DynamicIcon } from "../../components/ui";
import { isNativePlatform } from "../../services";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  FileText,
  Search,
  Settings,
} from "lucide-react";

const SETTINGS_SECTION_TITLES: Record<string, string> = {
  account: "Tài khoản",
  general: "Giao diện",
  notifications: "Thông báo",
  data: "Dữ liệu",
  security: "Bảo mật",
  shortcuts: "Phím tắt",
  about: "Giới thiệu",
};

export interface MobileHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey, target?: NavigationTarget) => void;
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  previousTab?: TabKey;
  activeEventSubTab: MobileEventSubTab;
  onEventSubTabChange: (subTab: MobileEventSubTab) => void;
}

// === PHAN 1: HEADER CHI HIEN THI CAC WORKSPACE CO THE MO ===
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  previousTab,
}) => {
  const { user, settingsMobileSubView, setSettingsMobileSubView } = useAppStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotesMenuOpen, setIsNotesMenuOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const notesMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!notesMenuRef.current?.contains(event.target as Node)) {
        setIsNotesMenuOpen(false);
      }
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let frameId = 0;
    const handleScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setIsScrolled((window.scrollY || document.documentElement.scrollTop || 0) > 20);
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const isSettings = activeTab === "settings";
  const settingsTitle = settingsMobileSubView
    ? SETTINGS_SECTION_TITLES[settingsMobileSubView] || "Cài đặt"
    : "Cá nhân";
  const isTaskWorkspace = activeTab === "tasks" || activeTab === "today" || activeTab === "planner";

  const renderWorkspaceTitle = () => {
    if (isTaskWorkspace) {
      return <span className="px-2 py-1 font-black text-[20px] leading-none tracking-tight text-[var(--text-strong)] sm:text-[22px]">Công việc</span>;
    }
    if (activeTab === "events") {
      return <span className="px-2 py-1 font-black text-[20px] leading-none tracking-tight text-[var(--text-strong)] sm:text-[22px]">Sự kiện</span>;
    }
    if (activeTab === "notes" || activeTab === "journal") {
      return (
        <div ref={notesMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setIsNotesMenuOpen((open) => !open)}
            aria-expanded={isNotesMenuOpen}
            aria-haspopup="menu"
            className="flex cursor-pointer items-center gap-1.5 rounded-xl px-2 py-1 transition-all hover:bg-[var(--bg-interactive)] active:scale-95"
          >
            <span className="font-black text-[20px] leading-none tracking-tight text-[var(--text-strong)] sm:text-[22px]">
              {activeTab === "journal" ? "Nhật ký" : "Ghi chú"}
            </span>
            <ChevronDown
              size={18}
              strokeWidth={2.6}
              className={`w-4 text-[var(--text-main)] transition-transform duration-200 ${isNotesMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isNotesMenuOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-48 space-y-1 rounded-2xl bg-[var(--bg-surface)] p-1.5 shadow-[2px_2px_0px_var(--border-ink)]">
              <button
                type="button"
                onClick={() => {
                  onTabChange("notes");
                  setIsNotesMenuOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === "notes"
                    ? "bg-[var(--accent-blue)] text-[var(--text-on-accent)]"
                    : "text-[var(--text-main)] hover:bg-[var(--bg-interactive)]"
                }`}
              >
                <FileText size={16} strokeWidth={2.2} />
                <span>Ghi chú</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTabChange("journal");
                  setIsNotesMenuOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors ${
                  activeTab === "journal"
                    ? "bg-[var(--accent-blue)] text-[var(--text-on-accent)]"
                    : "text-[var(--text-main)] hover:bg-[var(--bg-interactive)]"
                }`}
              >
                <BookOpen size={16} strokeWidth={2.2} />
                <span>Nhật ký</span>
              </button>
            </div>
          )}
        </div>
      );
    }
    return <span className="px-2 py-1 font-black text-[20px] leading-none tracking-tight text-[var(--text-strong)] sm:text-[22px]">{settingsTitle}</span>;
  };

  return (
    <header
      className={`sticky top-0 z-30 bg-[var(--bg-canvas)] px-3.5 transition-colors duration-200 sm:px-5 ${
        isNativePlatform() ? "pt-11 pb-2.5" : "pt-[max(env(safe-area-inset-top),12px)] pb-2.5"
      }`}
    >
      <div className="relative flex min-h-[40px] w-full items-center justify-between">
        <div className="z-10 flex min-w-0 items-center gap-2">
          {isSettings && (
            <button
              type="button"
              onClick={() => {
                if (settingsMobileSubView) setSettingsMobileSubView(null);
                else onTabChange(previousTab || "tasks");
              }}
              className="mobile-back-button flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[var(--bg-surface-muted)] text-[var(--text-main)] transition-all active:scale-95"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          {activeTab === "ai" && (
            <button
              type="button"
              onClick={() => onTabChange(previousTab || "tasks")}
              className="mobile-back-button flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[var(--bg-surface-muted)] text-[var(--text-main)] transition-all active:scale-95"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}
          <div
            className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isScrolled ? "absolute left-1/2 max-w-[75vw] -translate-x-1/2 justify-center" : "relative min-w-0 justify-start"
            }`}
          >
            {activeTab === "ai" ? (
              <span className="px-2 py-1 font-black text-[20px] leading-none tracking-tight text-[var(--text-strong)] sm:text-[22px]">Trợ lý AI</span>
            ) : (
              renderWorkspaceTitle()
            )}
          </div>
        </div>

        {!isSettings && (
          <div
            className={`z-10 ml-auto flex shrink-0 items-center gap-2 transition-all duration-200 ${
              isScrolled ? "pointer-events-none translate-x-3 scale-95 opacity-0" : "pointer-events-auto translate-x-0 scale-100 opacity-100"
            }`}
          >
            <button
              type="button"
              onClick={onOpenSearch}
              title="Tìm kiếm"
              aria-label="Mở tìm kiếm"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] active:scale-95"
            >
              <Search size={18} strokeWidth={2.2} />
            </button>

            <div ref={accountMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAccountMenuOpen((open) => !open)}
                className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-white bg-[#09090B] text-white transition-all active:scale-95"
                title="Tài khoản và Cài đặt"
                aria-label="Tài khoản và Cài đặt"
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={18}
                  strokeWidth={2.2}
                  className="text-white"
                />
              </button>

              {isAccountMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-52 space-y-1 rounded-2xl bg-[var(--bg-surface)] p-1.5 shadow-[2px_2px_0px_var(--border-ink)]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      onOpenSettings();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--text-main)] transition-colors hover:bg-[var(--bg-interactive)]"
                  >
                    <Settings size={16} strokeWidth={2.2} className="text-[var(--text-muted)]" />
                    <span>Cài đặt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountMenuOpen(false);
                      if (user.isSignedIn) onLogout();
                      else onOpenLogin();
                    }}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--text-main)] transition-colors hover:bg-[var(--bg-interactive)]"
                  >
                    <DynamicIcon
                      name={user.isSignedIn ? "lucide:LogOut" : "lucide:LogIn"}
                      size={16}
                      strokeWidth={2.2}
                      className="text-[var(--accent-blue)]"
                    />
                    <span>{user.isSignedIn ? "Đăng xuất" : "Đăng nhập / Đăng ký"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
