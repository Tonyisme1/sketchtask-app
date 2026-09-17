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
    <div className="relative w-full flex-1 flex min-h-0 overflow-hidden">
      {/* 1. Vùng Không Gian Chính (Căn giữa hoàn hảo, tự động co nhỏ khi mở chi tiết) */}
      <div className="flex-1 min-w-0 px-6 lg:px-8 xl:px-12 py-5 pb-8 overflow-y-auto transition-all duration-200 flex justify-center">
        <div className="w-full min-w-0 max-w-6xl xl:max-w-7xl 2xl:max-w-[1440px]">
          {renderMainTab()}
        </div>
      </div>

      {/* 2. Side Panel Chi Tiết Task: Hiển thị CÙNG CẤP bên phải (Đẩy danh sách co lại) */}
      {isTaskDetailOpen && (
        <aside
          role="region"
          aria-label="Chi tiết công việc"
          className="w-[450px] lg:w-[500px] xl:w-[540px] shrink-0 border-l-[1.5px] border-[#262626] bg-[#FAF8F3] dark:bg-[#1C1C1E] flex flex-col min-h-0 animate-in slide-in-from-right-3 duration-200 overflow-hidden z-20"
        >
          <TaskDetailPage
            taskId={activeDetailTaskId!}
            onBack={closeTaskDetail}
          />
        </aside>
      )}
    </div>
  );
};
