import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  CheckSquare,
  FilePenLine,
  Bell,
  UserRound,
  Plus,
  FileText,
  X,
  LucideIcon,
} from "lucide-react";
import { TabKey } from "../../types";
import { useAppStore } from "../../stores/appStore";
import {
  getTaskTemporalState,
  isTaskDueToday,
} from "../../utils/taskSemantics";

export interface MobileNavProps {
  activeTab: TabKey;
  activeTaskSubTab: "today" | "planner" | "deadlines";
  onTabChange: (tab: TabKey) => void;
  onOpenNotifications?: () => void;
  isNotificationOpen?: boolean;
}

interface NavTabItem {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const leftNavItems: NavTabItem[] = [
  { key: "tasks", label: "Công việc", shortLabel: "Việc", icon: CheckSquare },
  { key: "notes", label: "Ghi chép", shortLabel: "Ghi", icon: FilePenLine },
];

const isNavItemActive = (
  activeTab: TabKey,
  key: TabKey,
) => {
  if (key === "tasks") {
    return activeTab === "tasks" || activeTab === "today" || activeTab === "planner" || activeTab === "deadlines";
  }
  if (key === "notes") return activeTab === "notes" || activeTab === "journal";
  if (key === "settings") return activeTab === "settings" || activeTab === "review";
  return activeTab === key;
};

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNotifications,
  isNotificationOpen = false,
}) => {
  const { tasks, openTaskDetail } = useAppStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const createSheetRef = useRef<HTMLDivElement>(null);

  const alertCount = useMemo(() => {
    const overdue = tasks.filter((t) => {
      if (t.completed) return false;
      const state = getTaskTemporalState(t);
      return state === "overdue" || state === "pastScheduled";
    }).length;

    const todayDue = tasks.filter((t) => {
      if (t.completed) return false;
      if (!isTaskDueToday(t)) return false;
      const state = getTaskTemporalState(t);
      return state !== "overdue" && state !== "pastScheduled";
    }).length;

    return overdue + todayDue;
  }, [tasks]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (createSheetRef.current && !createSheetRef.current.contains(e.target as Node)) {
        setIsCreateSheetOpen(false);
      }
    };
    if (isCreateSheetOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isCreateSheetOpen]);

  useEffect(() => {
    const initialHeight = window.visualViewport?.height || window.innerHeight;
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setIsKeyboardOpen(currentHeight < initialHeight - 100 || currentHeight < window.innerHeight * 0.82);
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        const isTextTarget = active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || active?.isContentEditable;
        if (!isTextTarget) setIsKeyboardOpen(false);
      }, 150);
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

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

  const handleCreateTask = () => {
    setIsCreateSheetOpen(false);
    openTaskDetail("new");
  };

  const handleCreateNote = () => {
    setIsCreateSheetOpen(false);
    onTabChange("notes");
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("sketchtask:create", {
          detail: { type: "note" },
        })
      );
    }, 80);
  };

  const shouldHideNav = isKeyboardOpen || isScrollingDown;

  return (
    <>
      {/* 1. NATIVE-LIKE BOTTOM SHEET CHỌN TẠO NHANH KHI BẤM [+] */}
      {isCreateSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-end justify-center animate-in fade-in duration-200 select-none">
          <div
            ref={createSheetRef}
            className="w-full max-w-md bg-white dark:bg-[#1C1C1E] border-t border-[#E5E5EA] dark:border-[#2C2C2E] rounded-t-[24px] p-4 sm:p-5 pb-[max(env(safe-area-inset-bottom),24px)] shadow-2xl space-y-3.5 animate-in slide-in-from-bottom-6 duration-250"
          >
            {/* Grab Handle */}
            <div className="w-10 h-1.2 rounded-full bg-[#D1D1D6] dark:bg-[#3A3A3C] mx-auto mb-1" />

            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5EA] dark:border-[#2C2C2E]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E93] dark:text-[#aeaeb2]">
                Tạo mới
              </span>
              <button
                type="button"
                onClick={() => setIsCreateSheetOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white bg-[#F2F2F7] dark:bg-[#2C2C2E] transition-colors cursor-pointer"
                title="Đóng"
                aria-label="Đóng"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={handleCreateTask}
                className="flex flex-col items-center justify-center gap-2 p-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-2xl border border-transparent transition-all cursor-pointer group text-left active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <CheckSquare size={18} strokeWidth={2.2} />
                </div>
                <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Công việc</p>
              </button>

              <button
                type="button"
                onClick={handleCreateNote}
                className="flex flex-col items-center justify-center gap-2 p-3.5 bg-[#F2F2F7] dark:bg-[#2C2C2E] hover:bg-[#E5E5EA] dark:hover:bg-[#3A3A3C] rounded-2xl border border-transparent transition-all cursor-pointer group text-left active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-white border border-[#E5E5EA] dark:border-[#48484A] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileText size={18} strokeWidth={2.2} />
                </div>
                <p className="text-xs font-bold text-[#1C1C1E] dark:text-[#F2F2F7]">Ghi chú</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY TỐI GIẢN */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 dark:bg-[#1C1C1E]/92 backdrop-blur-xl border-t border-[#E5E5EA] dark:border-[#2C2C2E] px-2 py-1 pb-[max(env(safe-area-inset-bottom),6px)] select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform shadow-[0_-1px_10px_rgba(0,0,0,0.03)] ${
          shouldHideNav ? "translate-y-full pointer-events-none" : "translate-y-0"
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {/* Nút 1: Việc, Nút 2: Ghi */}
          {leftNavItems.map(({ key, label, shortLabel, icon: Icon }) => {
            const isActive = isNavItemActive(activeTab, key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-label={label}
                title={label}
                className={`relative min-h-[46px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "text-[#1C1C1E] dark:text-white font-bold bg-black/[0.05] dark:bg-white/[0.08]"
                    : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
                } active:scale-95`}
              >
                <Icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="text-[11px] leading-tight whitespace-nowrap">
                  {shortLabel}
                </span>
              </button>
            );
          })}

          {/* Nút 3 (CHÍNH GIỮA): Nút [+] TẠO NHANH FLOATING FAB */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsCreateSheetOpen(true)}
              aria-label="Tạo mới công việc hoặc ghi chú"
              title="Tạo mới"
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-md shadow-black/15 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={22} strokeWidth={2.6} />
            </button>
          </div>

          {/* Nút 4: Thông báo (Có huy hiệu cảnh báo thời gian thực) */}
          <button
            type="button"
            onClick={() => onTabChange("notifications")}
            aria-label="Thông báo"
            title="Thông báo"
            className={`relative min-h-[46px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
              isNavItemActive(activeTab, "notifications")
                ? "text-[#1C1C1E] dark:text-white font-bold bg-black/[0.05] dark:bg-white/[0.08]"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="relative">
              <Bell size={19} strokeWidth={isNavItemActive(activeTab, "notifications") ? 2.4 : 1.9} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-rose-500 text-white font-mono text-[9px] font-bold flex items-center justify-center border border-white dark:border-[#1C1C1E]">
                  {alertCount > 9 ? "9+" : alertCount}
                </span>
              )}
            </div>
            <span className="text-[11px] leading-tight whitespace-nowrap">
              Báo
            </span>
          </button>

          {/* Nút 5: Cá nhân */}
          <button
            type="button"
            onClick={() => onTabChange("settings")}
            aria-label="Cá nhân"
            title="Cá nhân"
            className={`relative min-h-[46px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
              isNavItemActive(activeTab, "settings")
                ? "text-[#1C1C1E] dark:text-white font-bold bg-black/[0.05] dark:bg-white/[0.08]"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <UserRound size={19} strokeWidth={isNavItemActive(activeTab, "settings") ? 2.4 : 1.9} />
            <span className="text-[11px] leading-tight whitespace-nowrap">
              Cá nhân
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
