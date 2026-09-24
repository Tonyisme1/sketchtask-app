import React, { useEffect, useState, useMemo } from "react";
import {
  CheckSquare,
  CalendarDays,
  Hourglass,
  UserRound,
  Plus,
  LucideIcon,
} from "lucide-react";
import { TabKey, TaskSubTab } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { getDeadlineAttentionCount } from "../../utils/taskSemantics";

export interface MobileNavProps {
  activeTab: TabKey;
  activeTaskSubTab: TaskSubTab;
  onTabChange: (tab: TabKey) => void;
}

interface NavTabItem {
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

const leftNavItems: NavTabItem[] = [
  { key: "tasks", label: "Công việc", shortLabel: "Việc", icon: CheckSquare },
  { key: "events", label: "Sự kiện", shortLabel: "Sự kiện", icon: CalendarDays },
];

const isNavItemActive = (
  activeTab: TabKey,
  activeTaskSubTab: TaskSubTab,
  key: TabKey,
) => {
  if (key === "tasks") {
    return (
      (activeTab === "tasks" && activeTaskSubTab !== "deadlines") ||
      activeTab === "today" ||
      activeTab === "planner"
    );
  }
  if (key === "deadlines") {
    return (
      activeTab === "deadlines" ||
      (activeTab === "tasks" && activeTaskSubTab === "deadlines")
    );
  }
  if (key === "events") return activeTab === "events";
  if (key === "settings") return activeTab === "settings";
  return activeTab === key;
};

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  activeTaskSubTab,
  onTabChange,
}) => {
  const { tasks, openTaskDetail, setMobileDeadlineView } = useAppStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  const deadlineAttentionCount = useMemo(
    () => getDeadlineAttentionCount(tasks),
    [tasks],
  );

  useEffect(() => {
    const initialHeight = window.visualViewport?.height || window.innerHeight;
    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setIsKeyboardOpen(
        currentHeight < initialHeight - 100 ||
          currentHeight < window.innerHeight * 0.82,
      );
    };

    const handleFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      window.setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        const isTextTarget =
          active?.tagName === "INPUT" ||
          active?.tagName === "TEXTAREA" ||
          active?.isContentEditable;
        if (!isTextTarget) setIsKeyboardOpen(false);
      }, 150);
    };

    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.addEventListener("resize", handleViewportChange);
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      window.visualViewport?.removeEventListener(
        "resize",
        handleViewportChange,
      );
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

  const handleCreateCurrentItem = () => {
    const isEvent = activeTab === "events";
    openTaskDetail("new", {
      itemType: isEvent ? "event" : "task",
      timeType: isEvent ? "event" : "task",
      lockItemType: true,
    });
  };

  const shouldHideNav = isKeyboardOpen || isScrollingDown;

  return (
    <>
      {/* 1. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY TỐI GIẢN */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#F5F7FA] dark:bg-[#12161B] border-t border-transparent dark:border-transparent px-2.5 py-2 pb-[max(env(safe-area-inset-bottom),8px)] select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform shadow-[0_-1px_10px_rgba(0,0,0,0.03)] ${
          shouldHideNav
            ? "translate-y-full pointer-events-none"
            : "translate-y-0"
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {/* Nút 1: Việc, Nút 2: Sự kiện */}
          {leftNavItems.map(({ key, label, shortLabel, icon: Icon }) => {
            const isActive = isNavItemActive(activeTab, activeTaskSubTab, key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-label={label}
                title={label}
                className={`relative min-h-[52px] flex flex-col items-center justify-center gap-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "text-[#09090B] dark:text-white font-bold bg-black/[0.06] dark:bg-white/[0.10]"
                    : "text-[#71717A] hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:text-white"
                } active:scale-95`}
              >
                <Icon size={21} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="text-xs leading-tight whitespace-nowrap">
                  {shortLabel}
                </span>
              </button>
            );
          })}

          {/* Nút 3 (CHÍNH GIỮA): Nút [+] TẠO NHANH FLOATING FAB */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleCreateCurrentItem}
              aria-label={activeTab === "events" ? "Tạo sự kiện mới" : "Tạo công việc mới"}
              title="Tạo mới"
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#182230] dark:bg-[var(--accent-blue)] text-white border-none shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={23} strokeWidth={2.6} />
            </button>
          </div>

          {/* Nút 4: Hạn định là lối tắt duy nhất tới việc cần xử lý. */}
          <button
            type="button"
            onClick={() => {
              setMobileDeadlineView("upcoming");
              onTabChange("deadlines");
            }}
            aria-label="Hạn định"
            title="Hạn định"
            className={`relative min-h-[52px] flex flex-col items-center justify-center gap-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
              isNavItemActive(activeTab, activeTaskSubTab, "deadlines")
                ? "text-[#1C1C1E] dark:text-white font-bold bg-black/[0.05] dark:bg-white/[0.08]"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <div className="relative">
              <Hourglass
              size={21}
                strokeWidth={
                  isNavItemActive(activeTab, activeTaskSubTab, "deadlines")
                    ? 2.4
                    : 1.9
                }
              />
              {deadlineAttentionCount > 0 && (
                <span
                  aria-label={`${deadlineAttentionCount} việc cần chú ý`}
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--accent-blue)] ring-2 ring-[var(--bg-canvas)]"
                />
              )}
            </div>
            <span className="text-xs leading-tight whitespace-nowrap">
              Hạn
            </span>
          </button>

          {/* Nút 5: Cá nhân */}
          <button
            type="button"
            onClick={() => onTabChange("settings")}
            aria-label="Cá nhân"
            title="Cá nhân"
            className={`relative min-h-[52px] flex flex-col items-center justify-center gap-1 px-0.5 rounded-xl transition-all duration-150 cursor-pointer ${
              isNavItemActive(activeTab, activeTaskSubTab, "settings")
                ? "text-[#1C1C1E] dark:text-white font-bold bg-black/[0.05] dark:bg-white/[0.08]"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white"
            } active:scale-95`}
          >
            <UserRound
                size={21}
              strokeWidth={
                isNavItemActive(activeTab, activeTaskSubTab, "settings")
                  ? 2.4
                  : 1.9
              }
            />
            <span className="text-xs leading-tight whitespace-nowrap">
              Cá nhân
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
