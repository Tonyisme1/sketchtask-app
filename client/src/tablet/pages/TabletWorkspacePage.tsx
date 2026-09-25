import React from "react";
import { TabKey, NavigationTarget } from "../../types";
import { TabletTasksPage } from "./TabletTasksPage";
import { TabletNotesPage } from "../tabs/TabletNotesPage";
import { TabletJournalPage } from "../tabs/TabletJournalPage";
import { TabletAIAssistantPage } from "../tabs/TabletAIAssistantPage";
import { TabletSettingsPage } from "../tabs/TabletSettingsPage";
import { TabletTaskDetailPage } from "../details/TabletTaskDetailPage";
import { MobileEventsPage } from "../../mobile/tabs/MobileEventsPage";
import { useAppStore } from "../../stores";

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
      <div className="w-full">
        <TabletTaskDetailPage
          taskId={activeDetailTaskId}
          onBack={closeTaskDetail}
        />
      </div>
    );
  }

  switch (activeTab) {
    case "tasks":
      return (
        <TabletTasksPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
    case "events":
      return (
        <MobileEventsPage
          activeSubTab="calendar"
          onSubTabChange={() => undefined}
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
    case "notes":
      return (
        <TabletNotesPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    case "journal":
      return (
        <TabletJournalPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    case "ai":
      return <TabletAIAssistantPage />;
    case "settings":
      return (
        <TabletSettingsPage
          onNavigateTab={onNavigateTab}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
        />
      );
    default:
      return (
        <TabletTasksPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
  }
};
