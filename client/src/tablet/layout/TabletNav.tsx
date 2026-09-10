import React, { useEffect, useState } from "react";
import { BookMarked, CheckSquare, NotebookPen, Sun, LucideIcon } from "lucide-react";
import { TabKey } from "../../shared/types";

export interface TabletNavProps {
  activeTab: TabKey;
  activeTaskSubTab: "today" | "planner" | "deadlines";
  onTabChange: (tab: TabKey) => void;
}

const navItems: Array<{
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  activeClass: string;
}> = [
  { key: "today", label: "Hôm nay", shortLabel: "Nay", icon: Sun, activeClass: "bg-[#1C1917] text-white border-[#1C1917]" },
  { key: "tasks", label: "Công việc", shortLabel: "Việc", icon: CheckSquare, activeClass: "bg-[#1C1917] text-white border-[#1C1917]" },
  { key: "notes", label: "Ghi chép", shortLabel: "Ghi", icon: NotebookPen, activeClass: "bg-[#1C1917] text-white border-[#1C1917]" },
  { key: "notebooks", label: "Sổ tay", shortLabel: "Sổ", icon: BookMarked, activeClass: "bg-[#1C1917] text-white border-[#1C1917]" },
];

const isNavItemActive = (
  activeTab: TabKey,
  activeTaskSubTab: TabletNavProps["activeTaskSubTab"],
  key: TabKey,
) => {
  if (key === "today") {
    return activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today");
  }
  if (key === "tasks") {
    return activeTab === "tasks" && activeTaskSubTab !== "today";
  }
  if (key === "notes") return activeTab === "notes" || activeTab === "journal";
  if (key === "notebooks") return activeTab === "notebooks";
  return activeTab === key;
};

export const TabletNav: React.FC<TabletNavProps> = ({
  activeTab,
  activeTaskSubTab,
  onTabChange,
}) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

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
        } else if (currentScrollY > lastScrollY + 8) {
          setIsScrollingDown(true);
        } else if (currentScrollY < lastScrollY - 3) {
          setIsScrollingDown(false);
        }
        lastScrollY = currentScrollY;
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldHideNav = isKeyboardOpen || isScrollingDown;

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F4] border-t-[1.5px] border-[#262626]/25 px-4 py-2 pb-[max(env(safe-area-inset-bottom),8px)] select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform shadow-[0px_-2px_0px_#262626] ${
        shouldHideNav ? "translate-y-full pointer-events-none" : "translate-y-0"
      }`}
      aria-label="Điều hướng chính Tablet"
    >
      <div className="grid grid-cols-4 gap-2 max-w-lg mx-auto items-center">
        {navItems.map(({ key, label, shortLabel, icon: Icon, activeClass }) => {
          const isActive = isNavItemActive(activeTab, activeTaskSubTab, key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-label={label}
              title={label}
              className={`relative min-h-[52px] flex flex-col items-center justify-center gap-1 px-2 rounded-[6px] border transition-all duration-150 cursor-pointer ${
                isActive
                  ? `${activeClass} border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[1px]`
                  : "bg-transparent border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-white/70"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              <span className={`text-xs leading-tight whitespace-nowrap ${isActive ? "font-black text-white" : "font-bold"}`}>
                {shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
