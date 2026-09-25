import React from "react";
import { TabKey, NavigationTarget } from "../../types";
import { DesktopTasksPage } from "./DesktopTasksPage";
import { DesktopPlannerPage } from "../tabs/DesktopPlannerPage";
import { DesktopNotesPage } from "../tabs/DesktopNotesPage";
import { DesktopJournalPage } from "../tabs/DesktopJournalPage";
import { DesktopAIAssistantPage } from "../tabs/DesktopAIAssistantPage";
import { DesktopSettingsPage } from "../tabs/DesktopSettingsPage";
import { DesktopTaskDetailPage } from "../details/DesktopTaskDetailPage";
import {
  DesktopRightDock,
  DesktopUtilityPanel,
} from "../layout/DesktopRightDock";
import { useAppStore } from "../../stores";
import { GlobalSearchModal } from "../../components/ui";
import { NotesSectionTabs } from "../../components/shared/notes/NotesSectionTabs";
import type { DesktopPlannerSurface } from "../components/planner/DesktopPlannerHeader";

export interface DesktopWorkspaceProps {
  activeTab: TabKey;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  desktopPlannerSurface: DesktopPlannerSurface;
}

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  activeTab,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
  onNavigateRoute,
  previousTab,
  desktopPlannerSurface,
}) => {
  const { activeDetailTaskId, closeTaskDetail } = useAppStore();
  const [activeUtility, setActiveUtility] = React.useState<DesktopUtilityPanel | null>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  const renderMainTab = () => {
    switch (activeTab) {
      case "today":
        return (
          <DesktopTasksPage
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
          />
        );
      case "events":
        return (
          <DesktopPlannerPage
            workspaceKind="event"
            targetDateStr={navigationTarget?.date}
            targetTaskId={navigationTarget?.taskId}
            onClearTarget={onClearNavigationTarget}
            desktopSurface={desktopPlannerSurface}
          />
        );
      case "tasks":
        return (
          <DesktopTasksPage
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
          />
        );
      case "notes":
        return (
          <div className="w-full min-w-0">
            <NotesSectionTabs activeTab={activeTab} onTabChange={(tab) => onNavigateTab(tab)} />
            <DesktopNotesPage
              navigationTarget={navigationTarget}
              onClearNavigationTarget={onClearNavigationTarget}
              onNavigateTab={onNavigateTab}
            />
          </div>
        );
      case "journal":
        return (
          <div className="w-full min-w-0">
            <NotesSectionTabs activeTab={activeTab} onTabChange={(tab) => onNavigateTab(tab)} />
            <DesktopJournalPage
              navigationTarget={navigationTarget}
              onClearNavigationTarget={onClearNavigationTarget}
              onNavigateTab={onNavigateTab}
            />
          </div>
        );
      case "ai":
        return <DesktopAIAssistantPage />;
      case "settings":
        return (
          <DesktopSettingsPage
            onNavigateTab={onNavigateTab}
            onNavigateRoute={onNavigateRoute}
            previousTab={previousTab}
          />
        );
      default:
        return (
          <DesktopTasksPage
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
          />
        );
    }
  };

  const isTaskDetailOpen = Boolean(activeDetailTaskId);
  const isTaskDetailVisible = isTaskDetailOpen && !activeUtility;
  const [renderedTaskId, setRenderedTaskId] = React.useState<string | null>(activeDetailTaskId);

  React.useEffect(() => {
    if (activeDetailTaskId) {
      setRenderedTaskId(activeDetailTaskId);
      setActiveUtility(null);
    }
  }, [activeDetailTaskId]);

  React.useEffect(() => {
    if (!isTaskDetailVisible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeTaskDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTaskDetailVisible, closeTaskDetail]);

  // === PHAN 1: MOT TRENH TIM KIEM DUNG CHO CA BA GIAO DIEN ===
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInput = Boolean(
        target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable),
      );

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k" && !isInput) {
        event.preventDefault();
        setActiveUtility(null);
        setIsSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isPlannerView = activeTab === "events";

  return (
    <div className="relative w-full flex-1 flex min-h-0 overflow-hidden">
      {/* 1. Vùng Không Gian Chính (Khung hiển thị Planner bo góc hiện đại, Căn giữa thoáng đãng cho các tab khác) */}
      <div
        className={`flex-1 min-w-0 transition-all duration-200 ease-in-out ${
          isPlannerView
            ? "p-0 overflow-hidden flex flex-col h-full w-full"
            : "px-4 lg:px-6 xl:px-8 py-4 pb-6 overflow-y-auto flex justify-center"
        }`}
      >
        <div
          className={`w-full min-w-0 ${
            isPlannerView
              ? "max-w-none h-full flex flex-col min-h-0 w-full bg-transparent shadow-none overflow-hidden"
              : "max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px]"
          }`}
        >
          {renderMainTab()}
        </div>
      </div>

      {/* 2. Side Panel Chi Tiết Task: Hiển thị bên phải khi mở chỉnh sửa (áp dụng cho toàn app) với animation mượt mà đồng bộ */}
      <aside
        role="region"
        aria-label="Chi tiết công việc"
        className={`shrink-0 bg-white dark:bg-black flex flex-col min-h-0 overflow-hidden z-20 rounded-l-3xl shadow-lg transition-all duration-200 ease-in-out ${
          isTaskDetailVisible
            ? "w-[360px] lg:w-[400px] xl:w-[480px] 2xl:w-[520px] opacity-100 translate-x-0"
            : "w-0 opacity-0 translate-x-6 pointer-events-none"
        }`}
      >
        <div className="w-[360px] lg:w-[400px] xl:w-[480px] 2xl:w-[520px] h-full flex flex-col min-h-0 shrink-0">
          {renderedTaskId && (
            <DesktopTaskDetailPage
              taskId={renderedTaskId}
              onBack={closeTaskDetail}
            />
          )}
        </div>
      </aside>
      <DesktopRightDock
        activeUtility={activeUtility}
        onUtilityChange={setActiveUtility}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigateTab={onNavigateTab}
      />
    </div>
  );
};
