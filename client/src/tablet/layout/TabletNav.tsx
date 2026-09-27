import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckSquare,
  FilePenLine,
  LucideIcon,
  Sparkles,
} from "lucide-react";
import { TabKey } from "../../types";

export interface TabletNavProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}

const navItems: Array<{
  key: TabKey;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}> = [
  { key: "tasks", label: "Công việc", shortLabel: "Việc", icon: CheckSquare },
  { key: "events", label: "Sự kiện", shortLabel: "Sự kiện", icon: CalendarDays },
  { key: "notes", label: "Ghi chép", shortLabel: "Ghi chép", icon: FilePenLine },
  { key: "ai", label: "Trợ lý AI", shortLabel: "AI", icon: Sparkles },
];

const isNavItemActive = (
  activeTab: TabKey,
  key: TabKey,
) => {
  if (key === "tasks") {
    return activeTab === "tasks";
  }
  if (key === "notes") return activeTab === "notes" || activeTab === "journal";
  return activeTab === key;
};

export const TabletNav: React.FC<TabletNavProps> = ({
  activeTab,
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
      <div className="pointer-events-auto flex items-center gap-1 rounded-2xl border-[1.5px] border-[var(--border-ink-muted)] bg-[var(--bg-surface)] p-1.5">
        {navItems.map(({ key, label, shortLabel, icon: Icon }) => {
          const isActive = isNavItemActive(activeTab, key);
          return (
            <button
              key={key}
              type="button"
              data-onboarding={key === "tasks" ? "tablet-tasks" : undefined}
              onClick={() => onTabChange(key)}
              aria-label={label}
              title={label}
              className={`relative flex min-h-[44px] items-center gap-2 rounded-xl border-[1.5px] border-transparent px-4 py-2 transition-all duration-150 cursor-pointer ${
                isActive
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-[var(--text-on-accent)] font-bold"
                  : "bg-transparent text-[var(--text-muted)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-main)] font-semibold"
              } active:translate-x-[1.5px] active:translate-y-[1.5px]`}
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
