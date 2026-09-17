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

export interface DesktopWorkspaceProps {
  activeTab: TabKey;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
}

export const DesktopWorkspace: React.FC<DesktopWorkspaceProps> = ({
  activeTab,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
  onNavigateRoute,
  previousTab,
}) => {
  const { activeDetailTaskId, closeTaskDetail } = useAppStore();

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

  return (
    <div className="relative w-full flex-1 flex min-h-0">
      {/* 1. Vùng Không Gian Chính */}
      <div className="flex-1 min-w-0 px-6 lg:px-8 xl:px-10 py-6 pb-16 overflow-y-auto">
        <div className="w-full max-w-6xl 2xl:max-w-[1480px] mx-auto min-w-0">
          {renderMainTab()}
        </div>
      </div>

      {/* 2. Side Panel Chi Tiết Task: Trượt từ phải sang trái góc màn hình */}
      {isTaskDetailOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop tối nhẹ */}
          <div
            onClick={closeTaskDetail}
            className="absolute inset-0 bg-black/30 backdrop-blur-xs animate-in fade-in duration-200"
            aria-hidden="true"
          />

          {/* Drawer trượt từ phải sang */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết công việc"
            className="absolute top-0 right-0 bottom-0 w-full sm:w-[500px] lg:w-[560px] max-w-[100vw] bg-[#FAF8F3] dark:bg-[#1C1C1E] border-l-[1.5px] border-[#262626] shadow-[-6px_0px_0px_rgba(0,0,0,0.08)] flex flex-col animate-in slide-in-from-right duration-200 ease-out"
          >
            <TaskDetailPage
              taskId={activeDetailTaskId!}
              onBack={closeTaskDetail}
            />
          </div>
        </div>
      )}
    </div>
  );
};
