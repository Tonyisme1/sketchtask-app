import React, { useEffect, useState, useRef } from "react";
import {
  CheckSquare,
  FilePenLine,
  Sparkles,
  UserRound,
  Plus,
  FileText,
  CheckCircle2,
  X,
  LucideIcon,
} from "lucide-react";
import { TabKey } from "../../types";
import { useAppStore } from "../../stores/appStore";

export interface MobileNavProps {
  activeTab: TabKey;
  activeTaskSubTab: "today" | "planner" | "deadlines";
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
  { key: "notes", label: "Ghi chép", shortLabel: "Ghi", icon: FilePenLine },
];

const rightNavItems: NavTabItem[] = [
  { key: "ai", label: "Trợ lý AI", shortLabel: "AI", icon: Sparkles },
  { key: "settings", label: "Cá nhân", shortLabel: "Cá nhân", icon: UserRound },
];

const isNavItemActive = (
  activeTab: TabKey,
  key: TabKey,
) => {
  if (key === "tasks") {
    return activeTab === "tasks" || activeTab === "today" || activeTab === "planner" || activeTab === "deadlines";
  }
  if (key === "notes") return activeTab === "notes" || activeTab === "journal";
  if (key === "ai") return activeTab === "ai";
  if (key === "settings") return activeTab === "settings" || activeTab === "review";
  return activeTab === key;
};

export const MobileNav: React.FC<MobileNavProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { openTaskDetail, openQuickTaskModal } = useAppStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const createSheetRef = useRef<HTMLDivElement>(null);

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
      {/* 1. BOTTOM SHEET / POPUP CHỌN TẠO NHANH KHI BẤM [+] */}
      {isCreateSheetOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] flex items-end justify-center pb-20 px-4 animate-in fade-in duration-150 select-none">
          <div
            ref={createSheetRef}
            className="w-full max-w-sm bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[12px] p-3.5 shadow-[4px_4px_0px_#262626] space-y-2 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]/15">
              <span className="text-xs font-black uppercase tracking-wider text-[#78716C] font-mono">
                Tạo mới
              </span>
              <button
                type="button"
                onClick={() => setIsCreateSheetOpen(false)}
                className="w-6 h-6 rounded flex items-center justify-center text-[#78716C] hover:text-[#1C1917] cursor-pointer"
              >
                <X size={15} strokeWidth={2.4} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCreateTask}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-[#FFFDF8] hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group text-left"
              >
                <div className="w-10 h-10 rounded-[6px] bg-[#1C1917] text-white border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CheckSquare size={20} strokeWidth={2.4} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-[#1C1917]">Công việc</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">Lịch & Hạn chót</p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleCreateNote}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-[#FFFDF8] hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer group text-left"
              >
                <div className="w-10 h-10 rounded-[6px] bg-white text-[#1C1917] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText size={20} strokeWidth={2.4} />
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-[#1C1917]">Ghi chú</p>
                  <p className="text-[10px] font-mono text-[#78716C] mt-0.5">Ý tưởng & Bản thảo</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. THANH ĐIỀU HƯỚNG DƯỚI ĐÁY (5 MỤC VỚI NÚT [+] CHÍNH GIỮA) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBF9F4] border-t border-[#262626]/20 px-2 py-1 pb-[max(env(safe-area-inset-bottom),4px)] select-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          shouldHideNav ? "translate-y-full pointer-events-none" : "translate-y-0"
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="grid grid-cols-5 gap-1 max-w-md mx-auto items-center">
          {/* Nút 1: Việc */}
          {leftNavItems.map(({ key, label, shortLabel, icon: Icon }) => {
            const isActive = isNavItemActive(activeTab, key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-label={label}
                title={label}
                className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-[4px] border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] -translate-y-[1px]"
                    : "bg-transparent border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-white/60"
                } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className={`text-[11px] leading-tight whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}>
                  {shortLabel}
                </span>
              </button>
            );
          })}

          {/* Nút 3 (CHÍNH GIỮA): Nút [+] TẠO NHANH */}
          <button
            type="button"
            onClick={() => setIsCreateSheetOpen(true)}
            aria-label="Tạo mới công việc hoặc ghi chú"
            title="Tạo mới"
            className="relative min-h-[44px] flex items-center justify-center rounded-[8px] bg-[#1C1917] text-white border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] hover:bg-black active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer mx-1"
          >
            <Plus size={22} strokeWidth={2.8} />
          </button>

          {/* Nút 4: AI & Nút 5: Cá nhân */}
          {rightNavItems.map(({ key, label, shortLabel, icon: Icon }) => {
            const isActive = isNavItemActive(activeTab, key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTabChange(key)}
                aria-label={label}
                title={label}
                className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 px-0.5 rounded-[4px] border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] -translate-y-[1px]"
                    : "bg-transparent border-transparent text-[#78716C] hover:text-[#1C1917] hover:bg-white/60"
                } active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className={`text-[11px] leading-tight whitespace-nowrap ${isActive ? "font-bold" : "font-medium"}`}>
                  {shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
