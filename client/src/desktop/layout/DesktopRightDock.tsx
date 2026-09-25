import React, { useEffect, useRef, useState } from "react";
import {
  FilePenLine,
  Search,
  X,
} from "lucide-react";
import { DesktopJournalTool } from "../tools/DesktopJournalTool";
import { DesktopNotesTool } from "../tools/DesktopNotesTool";
import { NotesSectionTabs } from "../../components/shared/notes/NotesSectionTabs";

export type DesktopUtilityPanel = "writing";

export interface DesktopRightDockProps {
  activeUtility: DesktopUtilityPanel | null;
  onUtilityChange: (utility: DesktopUtilityPanel | null) => void;
  onOpenSearch: () => void;
}

const utilityTitles: Record<DesktopUtilityPanel, string> = {
  writing: "Ghi chép",
};

// Keep every utility surface aligned with the Desktop task-detail sidebar.
const DESKTOP_UTILITY_PANEL_WIDTH = "w-[360px] lg:w-[400px] xl:w-[480px] 2xl:w-[520px]";
const DESKTOP_UTILITY_DOCK_WIDTH = "w-[416px] lg:w-[456px] xl:w-[536px] 2xl:w-[576px]";

export const DesktopRightDock: React.FC<DesktopRightDockProps> = ({
  activeUtility,
  onUtilityChange,
  onOpenSearch,
}) => {
  const dockRef = useRef<HTMLElement>(null);
  const [writingTab, setWritingTab] = useState<"notes" | "journal">("notes");

  useEffect(() => {
    if (!activeUtility) return;
    const closeWhenOutside = (event: MouseEvent) => {
      if (!dockRef.current?.contains(event.target as Node)) {
        onUtilityChange(null);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onUtilityChange(null);
    };
    document.addEventListener("mousedown", closeWhenOutside);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeWhenOutside);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeUtility, onUtilityChange]);

  const toggleUtility = (utility: DesktopUtilityPanel) => {
    onUtilityChange(activeUtility === utility ? null : utility);
  };
  const renderPanelContent = () =>
    writingTab === "journal" ? <DesktopJournalTool /> : <DesktopNotesTool />;

  const utilityButtons: Array<{ id: DesktopUtilityPanel; label: string; icon: React.ReactNode; count?: number }> = [
    { id: "writing", label: "Ghi chép", icon: <FilePenLine size={19} strokeWidth={2.2} /> },
  ];

  return (
    <aside
      ref={dockRef}
      aria-label="Công cụ Desktop"
      className={`z-30 flex h-full shrink-0 bg-[var(--bg-canvas)] transition-[width] duration-200 ease-out ${
        activeUtility ? DESKTOP_UTILITY_DOCK_WIDTH : "w-14"
      }`}
    >
      {activeUtility && (
        <section
          role="dialog"
          aria-label={utilityTitles[activeUtility]}
          className={`my-2 flex min-w-0 flex-col self-stretch overflow-hidden rounded-xl border border-[var(--border-ink-muted)] bg-[var(--bg-surface)] ${DESKTOP_UTILITY_PANEL_WIDTH}`}
        >
          <header className="flex h-12 shrink-0 items-center justify-between px-3">
            <h2 className="text-sm font-bold text-[var(--text-main)]">{utilityTitles[activeUtility]}</h2>
            <button
              type="button"
              onClick={() => onUtilityChange(null)}
              className="flex h-8 w-8 items-center justify-center rounded-2xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface-muted)] hover:text-[var(--text-main)] cursor-pointer"
              aria-label={`Đóng ${utilityTitles[activeUtility]}`}
            >
              <X size={17} strokeWidth={2.3} />
            </button>
          </header>
          <div className="px-3 pb-2">
            <NotesSectionTabs
              activeTab={writingTab}
              onTabChange={setWritingTab}
              className="mb-0"
            />
          </div>
          {renderPanelContent()}
        </section>
      )}

      <nav className="flex w-14 shrink-0 flex-col items-center gap-1 bg-[var(--bg-surface-muted)] px-1.5 py-2" aria-label="Thanh công cụ">
        <button
          type="button"
          onClick={() => {
            onUtilityChange(null);
            onOpenSearch();
          }}
          title="Tìm kiếm"
          aria-label="Mở tìm kiếm"
          className="flex h-9 w-9 items-center justify-center rounded-2xl text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)] cursor-pointer active:scale-95"
        >
          <Search size={19} strokeWidth={2.2} />
        </button>
        {utilityButtons.map((utility) => {
          const isActive = activeUtility === utility.id;
          return (
            <button
              key={utility.id}
              type="button"
              onClick={() => toggleUtility(utility.id)}
              title={utility.label}
              aria-label={utility.label}
              aria-pressed={isActive}
              className={`relative flex h-9 w-9 items-center justify-center rounded-2xl transition-colors cursor-pointer active:scale-95 ${
                isActive
                  ? "bg-[var(--text-strong)] text-[var(--bg-surface)]"
                  : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-main)]"
              }`}
            >
              {utility.icon}
              {utility.count && utility.count > 0 ? (
                <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-[var(--accent-coral)] px-1 font-mono text-[9px] font-bold leading-4 text-white">
                  {utility.count > 9 ? "9+" : utility.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
