import React from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { DesktopTasksView } from "./DesktopTasksView";
import { DesktopTodayView } from "./DesktopTodayView";
import {
  PlannerTab,
  DeadlinesTab,
  NotesTab,
  JournalTab,
  AIAssistantTab,
  SettingsTab,
  TaskDetailPage,
} from "../../features";
import { useAppStore } from "../../shared/stores";
import type { DesktopPlannerSurface } from "../../components/features/planner/DesktopPlannerHeader";

export interface DesktopWorkspaceProps {
  activeTab: TabKey;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  desktopPlannerSurface: DesktopPlannerSurface;
  desktopPlannerSurfaceRevision: number;
}

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  activeTab,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
  onNavigateRoute,
  previousTab,
  desktopPlannerSurface,
  desktopPlannerSurfaceRevision,
}) => {
  const { activeDetailTaskId, closeTaskDetail, activeTaskSubTab } = useAppStore();

  const renderMainTab = () => {
    switch (activeTab) {
      case "today":
        return (
          <DesktopTodayView
            targetTaskId={navigationTarget?.taskId}
            onClearTarget={onClearNavigationTarget}
          />
        );
      case "planner":
        return (
          <PlannerTab
            targetDateStr={navigationTarget?.date}
            targetTaskId={navigationTarget?.taskId}
            onClearTarget={onClearNavigationTarget}
            desktopSurface={desktopPlannerSurface}
            desktopSurfaceRevision={desktopPlannerSurfaceRevision}
          />
        );
      case "deadlines":
        return (
          <DeadlinesTab
            onNavigateToTaskDate={(dateStr, taskId) => {
              onNavigateTab("planner", { date: dateStr, taskId });
            }}
          />
        );
      case "tasks":
        return (
          <DesktopTasksView
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
            desktopPlannerSurface={desktopPlannerSurface}
            desktopPlannerSurfaceRevision={desktopPlannerSurfaceRevision}
          />
        );
      case "notes":
        return (
          <NotesTab
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
            onNavigateTab={onNavigateTab}
          />
        );
      case "journal":
        return (
          <JournalTab
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
            onNavigateTab={onNavigateTab}
          />
        );
      case "ai":
        return <AIAssistantTab />;
      case "settings":
        return (
          <SettingsTab
            onNavigateTab={onNavigateTab}
            onNavigateRoute={onNavigateRoute}
            previousTab={previousTab}
            platform="desktop"
          />
        );
      default:
        return (
          <DesktopTodayView
            targetTaskId={navigationTarget?.taskId}
            onClearTarget={onClearNavigationTarget}
          />
        );
    }
  };

  const isTaskDetailOpen = Boolean(activeDetailTaskId);
  const [renderedTaskId, setRenderedTaskId] = React.useState<string | null>(activeDetailTaskId);

  React.useEffect(() => {
    if (activeDetailTaskId) {
      setRenderedTaskId(activeDetailTaskId);
    }
  }, [activeDetailTaskId]);

  React.useEffect(() => {
    if (!isTaskDetailOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeTaskDetail();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isTaskDetailOpen, closeTaskDetail]);

  const isPlannerView =
    activeTab === "planner" ||
    (activeTab === "tasks" && activeTaskSubTab === "planner");

  return (
    <div className="relative w-full flex-1 flex min-h-0 overflow-hidden">
      {/* 1. Vùng Không Gian Chính (Khung hiển thị Planner bo góc hiện đại, Căn giữa thoáng đãng cho các tab khác) */}
      <div
        className={`flex-1 min-w-0 transition-all duration-200 ease-in-out ${
          isPlannerView
            ? "p-3 lg:p-4 overflow-hidden flex flex-col h-full w-full"
            : "px-6 lg:px-8 xl:px-12 py-5 pb-8 overflow-y-auto flex justify-center"
        }`}
      >
        <div
          className={`w-full min-w-0 ${
            isPlannerView
              ? "max-w-none h-full flex flex-col min-h-0 w-full rounded-2xl border border-[#E5E5EA] dark:border-[#262626] bg-white dark:bg-black shadow-sm overflow-hidden"
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
        className={`shrink-0 border-[#E5E5EA] dark:border-[#262626] bg-white dark:bg-black flex flex-col min-h-0 overflow-hidden z-20 transition-all duration-200 ease-in-out ${
          isTaskDetailOpen
            ? "w-[360px] lg:w-[400px] xl:w-[480px] 2xl:w-[520px] border-l opacity-100 translate-x-0"
            : "w-0 border-l-0 opacity-0 translate-x-6 pointer-events-none"
        }`}
      >
        <div className="w-[360px] lg:w-[400px] xl:w-[480px] 2xl:w-[520px] h-full flex flex-col min-h-0 shrink-0">
          {renderedTaskId && (
            <TaskDetailPage
              taskId={renderedTaskId}
              onBack={closeTaskDetail}
            />
          )}
        </div>
      </aside>
    </div>
  );
};
