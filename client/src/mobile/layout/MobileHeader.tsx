import React, { useState, useEffect, useMemo, useRef } from "react";
import { MobileEventSubTab, TabKey, NavigationTarget } from "../../types";
import { useAppStore } from "../../stores";
import { DynamicIcon } from "../../components/ui";
import { isNativePlatform } from "../../services";
import {
  ArrowLeft,
  Settings,
  FileText,
  BookOpen,
  ChevronDown,
  Hourglass,
  BellRing,
  Search,
} from "lucide-react";
import {
  getDeadlineAttentionSummary,
} from "../../utils";

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

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenSearch,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  previousTab,
}) => {
  const {
    user,
    activeTaskSubTab,
    mobileDeadlineView,
    setMobileDeadlineView,
    tasks,
    settingsMobileSubView,
    setSettingsMobileSubView,
  } = useAppStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);
  const [isNoteDropdownOpen, setIsNoteDropdownOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const taskDropdownRef = useRef<HTMLDivElement>(null);
  const noteDropdownRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (taskDropdownRef.current && !taskDropdownRef.current.contains(e.target as Node)) {
        setIsTaskDropdownOpen(false);
      }
      if (noteDropdownRef.current && !noteDropdownRef.current.contains(e.target as Node)) {
        setIsNoteDropdownOpen(false);
      }
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(e.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Theo dõi độ cuộn trang: Khi cuộn xuống quá 20px thì kích hoạt hiệu ứng di chuyển ra giữa
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        setIsScrolled(scrollY > 20);
        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const deadlineSummary = useMemo(() => {
    return getDeadlineAttentionSummary(tasks, new Date(now));
  }, [tasks, now]);
  const isDeadlineSection = activeTab === "deadlines" || activeTaskSubTab === "deadlines";

  const currentTitle = useMemo(() => {
    if (activeTab === "settings") {
      return "Cá nhân";
    }
    if (activeTab === "events") {
      return "Sự kiện";
    }
    if (isDeadlineSection) {
      return mobileDeadlineView === "overdue" ? "Hạn" : "Sắp đến";
    }
    if (activeTab === "today") {
      return "Hôm nay";
    }
    if (activeTab === "planner" || activeTab === "tasks") {
      return "Công việc";
    }
    if (activeTab === "notes") {
      return "Ghi chú";
    }
    if (activeTab === "journal") {
      return "Nhật ký";
    }
    if (activeTab === "ai") {
      return "Trợ lý AI";
    }
    return "Công việc";
  }, [activeTab, activeTaskSubTab, mobileDeadlineView, settingsMobileSubView, isDeadlineSection]);

  const isSettings = activeTab === "settings";

  return (
    <header
      className={`sticky top-0 z-30 bg-[#F5F7FA] dark:bg-[#12161B] border-b border-transparent dark:border-transparent px-3.5 sm:px-5 ${
        isNativePlatform()
          ? "pt-11 pb-2.5"
          : "pt-[max(env(safe-area-inset-top),12px)] pb-2.5"
      } transition-colors duration-200 select-none`}
    >
      <div className="relative flex items-center justify-between min-h-[40px] w-full">
        {/* 1. KHU VỰC NHÃN TAB */}
        <div className="flex items-center gap-2 min-w-0 z-10">
          {/* Nút Quay lại khi đang ở tab AI */}
          {activeTab === "ai" && (
            <button
              type="button"
              onClick={() => {
                if (activeTab === "ai") {
                  onTabChange(previousTab || "tasks");
                }
              }}
              className="mobile-back-button w-9 h-9 bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-2xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] active:scale-95 transition-all cursor-pointer shrink-0 shadow-2xs"
              title="Quay lại"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} strokeWidth={2.4} />
            </button>
          )}

          <div
            className={`flex items-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isScrolled
                ? "absolute left-1/2 -translate-x-1/2 justify-center max-w-[75vw]"
                : "relative justify-start min-w-0"
            }`}
          >
            {activeTab === "tasks" || activeTab === "today" || activeTab === "planner" || activeTab === "deadlines" ? (
              isDeadlineSection ? (
              <div ref={taskDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsTaskDropdownOpen((open) => !open)}
                  aria-expanded={isTaskDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="font-black text-[20px] sm:text-[22px] text-[#1C1917] dark:text-[#F2F2F7] tracking-tight leading-none">
                    {mobileDeadlineView === "overdue" ? "Hạn" : "Sắp đến"}
                  </span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2.6}
                    className={`w-4 text-[var(--text-main)] transition-transform duration-200 ${isTaskDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isTaskDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-52 bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-1.5 shadow-xl z-50 space-y-1 animate-in fade-in duration-150">
                    <>
                        <button
                          type="button"
                          onClick={() => {
                            setMobileDeadlineView("upcoming");
                            setIsTaskDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            mobileDeadlineView === "upcoming"
                              ? "bg-[var(--accent-blue)] text-[var(--text-on-accent)]"
                              : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <BellRing size={16} strokeWidth={2.2} />
                            <span>Sắp đến</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {deadlineSummary.upcoming > 0 && (
                              <span
                                aria-label={`${deadlineSummary.upcoming} việc sắp đến`}
                                className={`h-2 w-2 shrink-0 rounded-full ${mobileDeadlineView === "upcoming" ? "bg-[var(--accent-sky)]" : "bg-[var(--accent-blue)]"}`}
                              >
                              </span>
                            )}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setMobileDeadlineView("overdue");
                            setIsTaskDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                            mobileDeadlineView === "overdue"
                              ? "bg-[var(--accent-blue)] text-[var(--text-on-accent)]"
                              : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Hourglass size={16} strokeWidth={2.2} />
                            <span>Hạn</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {deadlineSummary.overdue > 0 && (
                              <span
                                aria-label={`${deadlineSummary.overdue} việc quá hạn`}
                                className={`h-2 w-2 shrink-0 rounded-full ${mobileDeadlineView === "overdue" ? "bg-[var(--accent-sky)]" : "bg-[var(--accent-blue)]"}`}
                              >
                              </span>
                            )}
                          </div>
                        </button>
                    </>
                  </div>
                )}
              </div>
              ) : (
                <span className="px-2 py-1 font-black text-[20px] sm:text-[22px] text-[#1C1917] dark:text-[#F2F2F7] tracking-tight leading-none">
                  Công việc
                </span>
              )
            ) : activeTab === "events" ? (
              <div className="relative">
                <span className="px-2 py-1 font-black text-[20px] sm:text-[22px] text-[#1C1917] dark:text-[#F2F2F7] tracking-tight leading-none">
                  Sự kiện
                </span>
              </div>
            ) : activeTab === "notes" || activeTab === "journal" ? (
              /* Dropdown chọn đổi giữa Ghi chú và Nhật ký */
              <div ref={noteDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsNoteDropdownOpen((open) => !open)}
                  aria-expanded={isNoteDropdownOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="font-black text-[20px] sm:text-[22px] text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight leading-none">
                    {activeTab === "journal" ? "Nhật ký" : "Ghi chú"}
                  </span>
                  <ChevronDown
                    size={18}
                    strokeWidth={2.6}
                    className={`w-4 text-[var(--text-main)] transition-transform duration-200 ${isNoteDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isNoteDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-1.5 shadow-xl z-50 space-y-1 animate-in fade-in duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        onTabChange("notes");
                        setIsNoteDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === "notes"
                          ? "bg-[#182230] dark:bg-white/[0.12] text-white"
                          : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText size={16} strokeWidth={2.2} />
                        <span>Ghi chú</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onTabChange("journal");
                        setIsNoteDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                        activeTab === "journal"
                          ? "bg-[#182230] dark:bg-white/[0.12] text-white"
                          : "hover:bg-black/5 dark:hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BookOpen size={16} strokeWidth={2.2} />
                        <span>Nhật ký</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : activeTab === "ai" ? (
              <button
                type="button"
                onClick={() => isScrolled && window.scrollTo({ top: 0, behavior: "smooth" })}
                className={`flex items-center gap-1.5 py-1 ${isScrolled ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="font-black text-[20px] sm:text-[22px] text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight leading-none">
                  Trợ lý AI
                </span>
              </button>
            ) : isSettings ? (
              <button
                type="button"
                onClick={() => isScrolled && window.scrollTo({ top: 0, behavior: "smooth" })}
                className={`flex items-center gap-1.5 py-1 min-w-0 ${isScrolled ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="font-black text-[20px] sm:text-[22px] text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight truncate leading-none">
                  {currentTitle}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => isScrolled && window.scrollTo({ top: 0, behavior: "smooth" })}
                className={`flex items-center gap-1.5 py-1 ${isScrolled ? "cursor-pointer" : "cursor-default"}`}
              >
                <span className="font-black text-[20px] sm:text-[22px] text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight leading-none">
                  Công việc
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 2. GÓC PHẢI: TÀI KHOẢN (Mờ dần và trượt ẩn đi khi cuộn xuống) */}
        <div
          className={`flex items-center gap-2 shrink-0 ml-auto z-10 transition-all duration-250 ease-out ${
            isScrolled
              ? "opacity-0 translate-x-3 pointer-events-none scale-95"
              : "opacity-100 translate-x-0 pointer-events-auto scale-100"
          }`}
        >
            <button
              type="button"
              onClick={() => {
                setIsAccountDropdownOpen(false);
                onOpenSearch();
              }}
              title="Tìm kiếm"
              aria-label="Mở tìm kiếm"
              className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--bg-surface)] text-[var(--text-main)] transition-colors hover:bg-[var(--bg-surface-muted)] active:scale-95 cursor-pointer"
            >
              <Search size={18} strokeWidth={2.2} />
            </button>

            {/* Tài khoản Dropdown */}
            <div ref={accountDropdownRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                style={{ backgroundColor: "#09090B" }}
                className="w-9 h-9 rounded-2xl border border-white flex items-center justify-center text-white shadow-2xs active:scale-95 transition-all cursor-pointer overflow-hidden"
                title="Tài khoản & Cài đặt"
                aria-label="Tài khoản & Cài đặt"
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={18}
                  strokeWidth={2.2}
                  className="text-white"
                />
              </button>

              {isAccountDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl p-1.5 shadow-xl z-50 space-y-1 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      onOpenSettings();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] transition-colors cursor-pointer text-left"
                  >
                    <Settings size={16} strokeWidth={2.2} className="text-[#8E8E93]" />
                    <span>Cài đặt</span>
                  </button>

                  <div className="border-t border-black/[0.04] dark:border-white/[0.06] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      if (user.isSignedIn) onLogout();
                      else onOpenLogin();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] transition-colors cursor-pointer text-left"
                  >
                    <DynamicIcon
                      name={user.isSignedIn ? "lucide:LogOut" : "lucide:LogIn"}
                      size={16}
                      strokeWidth={2.2}
                      className={user.isSignedIn ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]"}
                    />
                    <span className={`truncate ${user.isSignedIn ? "text-[var(--accent-blue)]" : "text-[var(--text-muted)]"}`}>
                      {user.isSignedIn ? "Đăng xuất" : "Đăng nhập / Đăng ký"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
      </div>
    </header>
  );
};
