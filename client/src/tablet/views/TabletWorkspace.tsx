import React from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { TabletTasksView } from "./TabletTasksView";
import {
  NotesTab,
  JournalTab,
  NotebooksTab,
  SettingsTab,
  TaskDetailPage,
} from "../../features";
import { useAppStore } from "../../shared/stores";

export interface TabletWorkspaceProps {
  activeTab: TabKey;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
}

export const TabletWorkspace: React.FC<TabletWorkspaceProps> = ({
  activeTab,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
  onNavigateRoute,
  previousTab,
}) => {
  const { activeDetailTaskId, closeTaskDetail } = useAppStore();

  if (activeDetailTaskId) {
    return (
      <div className="w-full animate-detail-slide-in">
        <TaskDetailPage
          taskId={activeDetailTaskId}
          onBack={closeTaskDetail}
        />
      </div>
    );
  }

  switch (activeTab) {
    case "tasks":
      return (
        <TabletTasksView
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
    case "notebooks":
      return (
        <NotebooksTab
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    case "settings":
      return (
        <SettingsTab
          onNavigateTab={onNavigateTab}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
          hideMobileDetailHeader
          platform="tablet"
        />
      );
    default:
      return (
        <TabletTasksView
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
  }
};
