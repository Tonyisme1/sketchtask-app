import React, { useEffect, useState } from "react";
import { CalendarDays, NotebookPen, Sun, UserCheck, LucideIcon } from "lucide-react";
import { TabKey } from "../../types";

interface MobileNavProps {
  activeTab: TabKey;
  activeTaskSubTab: "today" | "planner" | "deadlines";
  onTabChange: (tab: TabKey) => void;
}

const navItems: Array<{
  key: TabKey;
  label: string;
  icon: LucideIcon;
  activeClass: string;
}> = [
  { key: "today", label: "Hôm nay", icon: Sun, activeClass: "bg-[#FEF08A]" },
  { key: "planner", label: "Kế hoạch", icon: CalendarDays, activeClass: "bg-[#BAE6FD]" },
  { key: "notes", label: "Ghi chép", icon: NotebookPen, activeClass: "bg-[#BBF7D0]" },
  { key: "review", label: "Cá nhân", icon: UserCheck, activeClass: "bg-[#DDD6FE]" },
];

const isNavItemActive = (
  activeTab: TabKey,
  activeTaskSubTab: MobileNavProps["activeTaskSubTab"],
  key: TabKey,
) => {
  if (key === "today") {
    return activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today");
  }
  if (key === "planner") {
    return activeTab === "planner" || (activeTab === "tasks" && activeTaskSubTab === "planner");
  }
  if (key === "notes") return activeTab === "notes" || activeTab === "journal" || activeTab === "notebooks";
  if (key === "review") return activeTab === "review" || activeTab === "settings";
  return activeTab === key;
};

export const MobileNav: React.FC<MobileNavProps> = ({
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

  const shouldHideNav = isKeyboardOpen || isScrollingDown;

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F4] border-t border-[#262626]/20 px-1.5 py-1 pb-[max(env(safe-area-inset-bottom),4px)] select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
        shouldHideNav ? "translate-y-full pointer-events-none" : "translate-y-0"
      }`}
      aria-label="Điều hướng chính"
    >
      <div className="grid grid-cols-4 gap-1 max-w-md mx-auto items-center">
        {navItems.map(({ key, label, icon: Icon, activeClass }) => {
          const isActive = isNavItemActive(activeTab, activeTaskSubTab, key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-[4px] border transition-all duration-150 ${
                isActive
                  ? `${activeClass} border-[#262626] shadow-[1.5px_1.5px_0px_#262626] -translate-y-[1px] text-[#1C1917]`
                  : "bg-transparent border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-white/60"
              } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} />
              <span className={`text-[10px] leading-tight whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
