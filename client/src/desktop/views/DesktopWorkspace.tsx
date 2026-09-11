import React from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { DesktopTasksView } from "./DesktopTasksView";
import {
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
          <DesktopTasksView
            navigationTarget={navigationTarget}
            onClearNavigationTarget={onClearNavigationTarget}
          />
        );
    }
  };

  const isTaskDetailOpen = Boolean(activeDetailTaskId);

  return (
    <div className="relative w-full flex-1 flex min-h-0">
      {/* 1. Vùng Tab Chính (Gọn gàng, dễ nhìn, tự động chừa lề cho panel chi tiết cố định khi ở tab tasks) */}
      <div
        className={`flex-1 min-w-0 px-6 lg:px-8 xl:px-10 py-6 pb-16 overflow-y-auto ${
          isTaskDetailOpen ? "mr-[380px] lg:mr-[410px] xl:mr-[430px]" : ""
        }`}
      >
        <div className="w-full max-w-6xl 2xl:max-w-[1480px] mx-auto min-w-0">
          {renderMainTab()}
        </div>
      </div>

      {/* 2. Panel Chi Tiết Task Cố Định (Chỉ xuất hiện khi đang ở tab Công việc/Hôm nay) */}
      {isTaskDetailOpen && (
        <aside
          key={activeDetailTaskId}
          className="fixed right-0 top-[54px] bottom-0 w-[380px] lg:w-[410px] xl:w-[430px] z-20 bg-[#FBF9F4] border-l-[1.5px] border-[#262626] flex flex-col overflow-hidden animate-detail-slide-in shadow-[-2px_0px_0px_#262626]"
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
