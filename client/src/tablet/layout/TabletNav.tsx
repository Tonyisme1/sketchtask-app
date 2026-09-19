import React, { useEffect, useState } from "react";
import { CheckSquare, FilePenLine, Sun, LucideIcon } from "lucide-react";
import { TabKey, TaskSubTab } from "../../shared/types";

export interface TabletNavProps {
  activeTab: TabKey;
  activeTaskSubTab: TaskSubTab;
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
  { key: "notes", label: "Ghi chép", shortLabel: "Ghi", icon: FilePenLine, activeClass: "bg-[#1C1917] text-white border-[#1C1917]" },
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
      className={`fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4 select-none pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        shouldHideNav ? "translate-y-24" : "translate-y-0"
      }`}
      aria-label="Điều hướng chính Tablet"
    >
      <div className="pointer-events-auto bg-[#F2F2F7]/95 dark:bg-[#18181A]/95 backdrop-blur-2xl border border-[#E5E5EA] dark:border-[#262626] rounded-full p-1.5 shadow-2xl shadow-black/10 flex items-center gap-1">
        {navItems.map(({ key, label, shortLabel, icon: Icon }) => {
          const isActive = isNavItemActive(activeTab, activeTaskSubTab, key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-label={label}
              title={label}
              className={`relative min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-150 cursor-pointer ${
                isActive
                  ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] shadow-sm font-bold"
                  : "bg-transparent text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 font-semibold"
              } active:scale-95`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
              <span className="text-xs leading-tight whitespace-nowrap">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
