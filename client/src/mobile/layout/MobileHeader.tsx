import React, { useState, useEffect, useMemo, useRef } from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { useAppStore } from "../../shared/stores";
import { BrandLogo, DynamicIcon } from "../../shared/ui";
import { isNativePlatform } from "../../shared/services";
import {
  Search,
  Bell,
  ArrowLeft,
  FileText,
  BookOpen,
  ChevronDown,
  Calendar as CalendarIcon,
  Hourglass,
  Check,
  Settings,
} from "lucide-react";
import { getTaskTemporalState, isTaskDueToday, getLocalTodayStr, getTaskEffectiveDate, normalizeTaskTimeType } from "../../shared/utils";

const SETTINGS_SECTION_TITLES: Record<string, string> = {
  account: "Tài khoản & Đồng bộ",
  general: "Giao diện & Trải nghiệm",
  notifications: "Thông báo & Âm thanh",
  data: "Dữ liệu & Bộ nhớ",
  security: "Bảo mật",
  shortcuts: "Phím tắt bàn phím",
  about: "Trợ giúp & Giới thiệu",
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
  onOpenSearch,
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

  const [isScrollingDown, setIsScrollingDown] = useState(false);
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

  // Cuộn trang trên mobile: trượt lên ẩn đi khi cuộn xuống, xuất hiện khi cuộn lên
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

  return (
    <header
      className={`sticky top-0 z-30 bg-[#FBF9F4] border-b border-[#262626]/20 px-3.5 sm:px-5 ${
        isNativePlatform()
          ? "pt-11 pb-3"
          : "pt-[max(env(safe-area-inset-top),10px)] pb-2.5"
      } flex items-center justify-between transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform min-h-[56px] sm:min-h-[60px] ${
        isScrollingDown ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      {/* 1. Header Left: Dynamic Tab Title / Dropdown Switcher */}
      <div className="flex items-center gap-2 min-w-0">
        {activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today") ? (
          <div
            onClick={() => onTabChange("tasks")}
            className="cursor-pointer flex items-center gap-2 active:scale-95 transition-transform"
          >
            <BrandLogo size="md" />
          </div>
        ) : activeTab === "planner" || activeTab === "deadlines" ||
          (activeTab === "tasks" && (activeTaskSubTab === "planner" || activeTaskSubTab === "deadlines")) ? (
          /* Dropdown chọn đổi giữa Kế hoạch và Hạn định */
          <div ref={taskDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-[6px] hover:bg-black/5 active:translate-y-[0.5px] transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-lg text-[#1C1917] tracking-tight">
                  {activeTaskSubTab === "deadlines" ? "Hạn định" : "Kế hoạch"}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.6}
                  className={`text-[#78716C] transition-transform duration-150 ${
                    isTaskDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isTaskDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-52 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-1.5 shadow-[3.5px_3.5px_0px_#262626] z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTaskSubTab("planner");
                    setIsTaskDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-sm font-bold transition-all cursor-pointer ${
                    activeTaskSubTab !== "deadlines"
                      ? "bg-[#1C1917] text-white"
                      : "hover:bg-[#FAF8F3] text-[#57534E]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CalendarIcon size={16} strokeWidth={2.4} />
                    <span>Kế hoạch</span>
                  </div>
                  {activeTaskSubTab !== "deadlines" && <Check size={15} strokeWidth={2.6} />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTaskSubTab("deadlines");
                    setIsTaskDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-sm font-bold transition-all cursor-pointer ${
                    activeTaskSubTab === "deadlines"
                      ? "bg-[#1C1917] text-white"
                      : "hover:bg-[#FAF8F3] text-[#57534E]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Hourglass size={16} strokeWidth={2.4} />
                    <span>Hạn định</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {deadlineCount > 0 && (
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded-full font-bold ${
                          activeTaskSubTab === "deadlines"
                            ? "bg-white text-[#1C1917]"
                            : "bg-[#1C1917] text-white"
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
              onClick={() => setIsNoteDropdownOpen(!isNoteDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 -ml-2 rounded-[6px] hover:bg-black/5 active:translate-y-[0.5px] transition-all cursor-pointer select-none"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-black text-lg text-[#1C1917] tracking-tight">
                  {activeTab === "journal" ? "Nhật ký" : "Ghi chú"}
                </span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.6}
                  className={`text-[#78716C] transition-transform duration-150 ${
                    isNoteDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>

            {isNoteDropdownOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-1.5 shadow-[3.5px_3.5px_0px_#262626] z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onTabChange("notes");
                    setIsNoteDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "notes"
                      ? "bg-[#1C1917] text-white"
                      : "hover:bg-[#FAF8F3] text-[#57534E]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText size={16} strokeWidth={2.4} />
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
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[5px] text-sm font-bold transition-all cursor-pointer ${
                    activeTab === "journal"
                      ? "bg-[#1C1917] text-white"
                      : "hover:bg-[#FAF8F3] text-[#57534E]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} strokeWidth={2.4} />
                    <span>Nhật ký</span>
                  </div>
                  {activeTab === "journal" && <Check size={15} strokeWidth={2.6} />}
                </button>
              </div>
            )}
          </div>
        ) : activeTab === "notebooks" ? (
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg text-[#1C1917] tracking-tight">Sổ tay</span>
          </div>
        ) : activeTab === "review" ? (
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg text-[#1C1917] tracking-tight">Cá nhân</span>
          </div>
        ) : activeTab === "settings" ? (
          settingsMobileSubView ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSettingsMobileSubView(null)}
                className="w-9 h-9 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
                title="Quay lại cài đặt"
              >
                <ArrowLeft size={18} strokeWidth={2.4} />
              </button>
              <span className="font-black text-lg text-[#1C1917] tracking-tight truncate">
                {SETTINGS_SECTION_TITLES[settingsMobileSubView] || "Cài đặt"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onTabChange(previousTab || "today")}
                className="w-9 h-9 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] cursor-pointer shrink-0"
                title="Quay lại"
              >
                <ArrowLeft size={18} strokeWidth={2.4} />
              </button>
              <span className="font-black text-lg text-[#1C1917] tracking-tight">Cài đặt</span>
            </div>
          )
        ) : (
          <div
            onClick={() => onTabChange("tasks")}
            className="cursor-pointer flex items-center gap-2 active:scale-95 transition-transform"
          >
            <BrandLogo size="md" />
          </div>
        )}
      </div>

      {/* 2. Header Right: Tìm Kiếm, Chuông Thông Báo, Tài Khoản */}
      {activeTab !== "settings" && (
        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Tìm Kiếm */}
          <button
            type="button"
            onClick={onOpenSearch}
            title="Tìm kiếm"
            className="w-9 h-9 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
          >
            <Search size={17} strokeWidth={2.3} />
          </button>

          {/* Chuông Thông Báo Drawer Bottom Sheet */}
          <button
            type="button"
            onClick={onOpenNotifications}
            title="Thông báo & Nhắc việc"
            className="relative w-9 h-9 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] bg-white hover:bg-[#FAF8F3] transition-all select-none cursor-pointer active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
          >
            <Bell size={17} strokeWidth={2.3} />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[17px] h-4.5 px-1 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center border border-[#262626] shadow-[0.5px_0.5px_0px_#262626]">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>

          {/* Tài khoản & Cài đặt Dropdown */}
          <div ref={accountDropdownRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
              className={`w-9 h-9 rounded-[4px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer ${
                isAccountDropdownOpen
                  ? "bg-[#FEF08A] shadow-none translate-x-[0.5px] translate-y-[0.5px]"
                  : "bg-white hover:bg-[#FAF8F3] shadow-[1.5px_1.5px_0px_#262626]"
              }`}
              title="Tài khoản & Cài đặt"
            >
              <div
                className="w-6 h-6 rounded-[2px] border border-[#262626] flex items-center justify-center text-[#1C1917]"
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
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-1.5 shadow-[3.5px_3.5px_0px_#262626] z-50 space-y-1">
                {/* 1. Cài đặt */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-sm font-bold text-[#1C1917] hover:bg-[#FAF8F3] active:translate-y-[0.5px] transition-colors cursor-pointer text-left"
                >
                  <Settings size={16} strokeWidth={2.2} className="text-[#57534E]" />
                  <span>Cài đặt</span>
                </button>

                <div className="border-t border-[#E7E5E4] my-1" />

                {/* 2. Đăng nhập / Đăng ký hoặc Hồ sơ */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountDropdownOpen(false);
                    if (user.isSignedIn) onLogout();
                    else onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[4px] text-sm font-bold text-[#1C1917] hover:bg-[#FAF8F3] active:translate-y-[0.5px] transition-colors cursor-pointer text-left"
                >
                  <DynamicIcon
                    name={user.isSignedIn ? (user.avatar || "lucide:UserCheck") : "lucide:User"}
                    size={16}
                    strokeWidth={2.2}
                    className={user.isSignedIn ? "text-emerald-700" : "text-[#57534E]"}
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
    </header>
  );
};
