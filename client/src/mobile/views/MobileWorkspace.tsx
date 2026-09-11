import React, { useEffect } from "react";
import { TabKey, NavigationTarget } from "../../shared/types";
import { MobileTasksView } from "./MobileTasksView";
import { MobileTodayView } from "./MobileTodayView";
import {
  NotesTab,
  JournalTab,
  AIAssistantTab,
  SettingsTab,
  TaskDetailPage,
} from "../../features";
import { useAppStore } from "../../shared/stores";
import { getLocalTodayStr, getTaskEffectiveDate } from "../../shared/utils";

export interface MobileWorkspaceProps {
  activeTab: TabKey;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
}

export const MobileWorkspace: React.FC<MobileWorkspaceProps> = ({
  activeTab,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
  onNavigateRoute,
  previousTab,
}) => {
  const {
    activeDetailTaskId,
    closeTaskDetail,
    activeTaskSubTab,
    setActiveTaskSubTab,
    tasks,
  } = useAppStore();

  const todayStr = getLocalTodayStr(new Date());

  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = tasks.find((item) => item.id === navigationTarget.taskId);
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    const taskDate = navigationTarget.date || getTaskEffectiveDate(task);
    if (taskDate === todayStr) {
      setActiveTaskSubTab("today");
    } else {
      setActiveTaskSubTab("planner");
    }
    onClearNavigationTarget?.();
  }, [navigationTarget, tasks, todayStr, setActiveTaskSubTab, onClearNavigationTarget]);

  // Nếu đang mở trang chi tiết task thì hiển thị panel chi tiết
  if (activeDetailTaskId) {
    return (
      <div className="w-full mobile-panel-enter">
        <TaskDetailPage
          taskId={activeDetailTaskId}
          onBack={closeTaskDetail}
        />
      </div>
    );
  }

  const renderActiveView = () => {
    // 1. Hôm nay (Nay)
    if (activeTab === "today" || (activeTab === "tasks" && activeTaskSubTab === "today")) {
      return <MobileTodayView />;
    }

    // 2. Công việc (Việc - Kế hoạch & Hạn định)
    if (activeTab === "tasks" || activeTab === "planner" || activeTab === "deadlines") {
      return (
        <MobileTasksView
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
    }

    // 3. Ghi chú (Ghi)
    if (activeTab === "notes") {
      return (
        <NotesTab
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    }

    // 4. Nhật ký (thuộc nhóm Ghi)
    if (activeTab === "journal") {
      return (
        <JournalTab
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    }

    // 5. Trợ lý AI (AI)
    if (activeTab === "ai") {
      return <AIAssistantTab />;
    }

    // 7. Cài đặt
    if (activeTab === "settings") {
      return (
        <SettingsTab
          onNavigateTab={onNavigateTab}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
          hideMobileDetailHeader
          platform="mobile"
        />
      );
    }

    // Fallback: Mặc định hiển thị Tasks View
    return (
      <MobileTasksView
        navigationTarget={navigationTarget}
        onClearNavigationTarget={onClearNavigationTarget}
      />
    );
  };

  return (
    <main
      className={`w-full min-w-0 select-none animate-in fade-in duration-150 ${
        activeTab === "ai"
          ? "px-3 py-2 sm:px-5 pb-16"
          : "px-3.5 py-3 sm:px-5 pb-28"
      }`}
    >
      {renderActiveView()}
    </main>
  );
};
