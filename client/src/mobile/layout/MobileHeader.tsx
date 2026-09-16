import React, { useState, useEffect, useMemo, useRef } from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { DynamicIcon } from "../../shared/ui";
import { isNativePlatform } from "../../shared/services";
import {
  Bell,
  ArrowLeft,
  Settings,
  FileText,
  BookOpen,
  ChevronDown,
  Calendar as CalendarIcon,
  Hourglass,
  Sun,
  Check,
} from "lucide-react";
import {
  getTaskTemporalState,
  isTaskDueToday,
  getLocalTodayStr,
  getTaskEffectiveDate,
  normalizeTaskTimeType,
} from "../../shared/utils";

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
  onOpenNotifications: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  previousTab?: TabKey;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNotifications,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  previousTab,
}) => {
  const {
    user,
    activeTaskSubTab,
    setActiveTaskSubTab,
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

  const alertCount = useMemo(() => {
    const overdue = tasks.filter(
      (t) =>
        !t.completed &&
        (getTaskTemporalState(t) === "overdue" ||
          getTaskTemporalState(t) === "pastScheduled")
    ).length;
    const dueToday = tasks.filter((t) => {
      if (t.completed || !isTaskDueToday(t)) return false;
      const temporal = getTaskTemporalState(t);
      return temporal !== "overdue" && temporal !== "pastScheduled";
    }).length;
    return overdue + dueToday;
  }, [tasks, now]);

  const deadlineCount = useMemo(() => {
    const overdue = tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      return temporal === "overdue" || temporal === "pastScheduled";
    }).length;
    const tomorrowStr = getLocalTodayStr(new Date(Date.now() + 86400000));
    const todayStr = getLocalTodayStr(new Date());
    const dueSoon = tasks.filter((t) => {
      if (t.completed) return false;
      const temporal = getTaskTemporalState(t);
      if (temporal === "overdue" || temporal === "pastScheduled") return false;
      const normTime = normalizeTaskTimeType(t);
      const isDeadline = normTime === "deadline" || Boolean(t.deadlineTime);
      const effectiveDate = getTaskEffectiveDate(t);
      return isDeadline && (effectiveDate === todayStr || effectiveDate === tomorrowStr);
    }).length;
    return overdue + dueSoon;
  }, [tasks]);

  const currentTitle = useMemo(() => {
    if (activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today")) {
      return "Hôm nay";
    }
    if (activeTab === "planner" || (activeTab === "tasks" && activeTaskSubTab === "planner")) {
      return "Kế hoạch";
    }
    if (activeTab === "deadlines" || (activeTab === "tasks" && activeTaskSubTab === "deadlines")) {
      return "Hạn định";
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
    if (activeTab === "settings") {
      return settingsMobileSubView ? SETTINGS_SECTION_TITLES[settingsMobileSubView] || "Cài đặt" : "Cá nhân";
    }
    return "Công việc";
  }, [activeTab, activeTaskSubTab, settingsMobileSubView]);

  const isSettings = activeTab === "settings";

  return (
    <header
      className={`sticky top-0 z-30 bg-white/92 dark:bg-[#1C1C1E]/92 backdrop-blur-xl border-b border-[#E5E5EA] dark:border-[#2C2C2E] px-3.5 sm:px-5 ${
        isNativePlatform()
          ? "pt-11 pb-2.5"
          : "pt-[max(env(safe-area-inset-top),12px)] pb-2.5"
      } transition-colors duration-200 select-none`}
    >
      <div className="relative flex items-center justify-between min-h-[40px] w-full">
        {/* 1. KHU VỰC NHÃN TAB: CĂN THẲNG HÀNG CHUẨN XÁC VỚI CÁC NÚT BÊN PHẢI */}
        <div className="flex items-center gap-2 min-w-0 z-10">
          {/* Nút Quay lại khi đang ở màn hình con của Cài đặt hoặc tab AI */}
          {((isSettings && settingsMobileSubView) || activeTab === "ai") && (
            <button
              type="button"
              onClick={() => {
                if (activeTab === "ai") {
                  onTabChange(previousTab || "tasks");
                } else {
                  setSettingsMobileSubView(null);
                }
              }}
              className="w-9 h-9 bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-xl flex items-center justify-center text-[#1C1C1E] dark:text-[#F2F2F7] active:scale-95 transition-all cursor-pointer shrink-0"
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
          /* Dropdown chọn đổi giữa Hôm nay, Kế hoạch và Hạn định */
          <div ref={taskDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (isScrolled) {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setIsTaskDropdownOpen(!isTaskDropdownOpen);
                }
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <span className="font-black text-[20px] sm:text-[22px] text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight leading-none">
                {activeTaskSubTab === "today" ? "Hôm nay" : activeTaskSubTab === "deadlines" ? "Hạn định" : "Kế hoạch"}
              </span>
              <ChevronDown
                size={18}
                strokeWidth={2.6}
                className={`text-[#8E8E93] transition-all duration-200 ${
                  isScrolled
                    ? "opacity-0 w-0 -mr-1 scale-0 pointer-events-none"
                    : `opacity-100 w-4.5 ${isTaskDropdownOpen ? "rotate-180" : ""}`
                }`}
              />
            </button>

            {!isScrolled && isTaskDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {/* 1. Hôm nay */}
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("tasks");
                    setActiveTaskSubTab("today");
                    setIsTaskDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTaskSubTab === "today"
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-[#57534E] dark:text-[#aeaeb2]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sun size={16} strokeWidth={2.2} />
                    <span>Hôm nay</span>
                  </div>
                  {activeTaskSubTab === "today" && <Check size={15} strokeWidth={2.6} />}
                </button>

                {/* 2. Kế hoạch */}
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("tasks");
                    setActiveTaskSubTab("planner");
                    setIsTaskDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTaskSubTab === "planner"
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-[#57534E] dark:text-[#aeaeb2]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CalendarIcon size={16} strokeWidth={2.2} />
                    <span>Kế hoạch</span>
                  </div>
                  {activeTaskSubTab === "planner" && <Check size={15} strokeWidth={2.6} />}
                </button>

                {/* 3. Hạn định */}
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("tasks");
                    setActiveTaskSubTab("deadlines");
                    setIsTaskDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTaskSubTab === "deadlines"
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-[#57534E] dark:text-[#aeaeb2]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Hourglass size={16} strokeWidth={2.2} />
                    <span>Hạn định</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {deadlineCount > 0 && (
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeTaskSubTab === "deadlines"
                            ? "bg-white text-[#1C1C1E]"
                            : "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
                        }`}
                      >
                        {deadlineCount}
                      </span>
                    )}
                    {activeTaskSubTab === "deadlines" && <Check size={15} strokeWidth={2.6} />}
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : activeTab === "notes" || activeTab === "journal" ? (
          /* Dropdown chọn đổi giữa Ghi chú và Nhật ký */
          <div ref={noteDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => {
                if (isScrolled) {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  setIsNoteDropdownOpen(!isNoteDropdownOpen);
                }
              }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              <span className="font-black text-[20px] sm:text-[22px] text-[#1C1C1E] dark:text-[#F2F2F7] tracking-tight leading-none">
                {activeTab === "journal" ? "Nhật ký" : "Ghi chú"}
              </span>
              <ChevronDown
                size={18}
                strokeWidth={2.6}
                className={`text-[#8E8E93] transition-all duration-200 ${
                  isScrolled
                    ? "opacity-0 w-0 -mr-1 scale-0 pointer-events-none"
                    : `opacity-100 w-4.5 ${isNoteDropdownOpen ? "rotate-180" : ""}`
                }`}
              />
            </button>

            {!isScrolled && isNoteDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("notes");
                    setIsNoteDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "notes"
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-[#57534E] dark:text-[#aeaeb2]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} strokeWidth={2.2} />
                    <span>Ghi chú</span>
                  </div>
                  {activeTab === "notes" && <Check size={15} strokeWidth={2.6} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onTabChange("journal");
                    setIsNoteDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    activeTab === "journal"
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
                      : "hover:bg-black/5 dark:hover:bg-white/10 text-[#57534E] dark:text-[#aeaeb2]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <BookOpen size={16} strokeWidth={2.2} />
                    <span>Nhật ký</span>
                  </div>
                  {activeTab === "journal" && <Check size={15} strokeWidth={2.6} />}
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
        {!settingsMobileSubView && (
          <div
            className={`flex items-center gap-2 shrink-0 ml-auto z-10 transition-all duration-250 ease-out ${
              isScrolled
                ? "opacity-0 translate-x-3 pointer-events-none scale-95"
                : "opacity-100 translate-x-0 pointer-events-auto scale-100"
            }`}
          >
          {/* Tài khoản Dropdown */}
          <div ref={accountDropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
              className="w-9 h-9 rounded-xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white dark:bg-[#2C2C2E] flex items-center justify-center text-[#1C1C1E] dark:text-white shadow-sm active:scale-95 transition-all cursor-pointer"
              title="Tài khoản & Cài đặt"
              aria-label="Tài khoản & Cài đặt"
            >
              <div
                className="w-6.5 h-6.5 rounded-lg flex items-center justify-center text-[#1C1C1E]"
                style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={14}
                  strokeWidth={2.2}
                />
              </div>
            </button>

            {isAccountDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl border border-[#E5E5EA] dark:border-[#2C2C2E] rounded-2xl p-2 shadow-2xl z-50 space-y-1 animate-in fade-in zoom-in-95 duration-150">
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

                <div className="border-t border-[#E5E5EA] dark:border-[#2C2C2E] my-1" />

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
                    name={user.isSignedIn ? (user.avatar || "lucide:UserCheck") : "lucide:User"}
                    size={16}
                    strokeWidth={2.2}
                    className={user.isSignedIn ? "text-emerald-500" : "text-[#8E8E93]"}
                  />
                  <span className="truncate">
                    {user.isSignedIn ? "Đăng xuất" : "Đăng nhập / Đăng ký"}
                  </span>
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
