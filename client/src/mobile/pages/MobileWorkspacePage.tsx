import React, { useEffect } from "react";
import { TabKey, NavigationTarget } from "../../types";
import { MobileTasksPage } from "./MobileTasksPage";
import { MobileTodayView } from "../tabs/MobileTodayView";
import { MobileNotificationsView } from "../tabs/MobileNotificationsView";
import { MobileNotesPage } from "../tabs/MobileNotesPage";
import { MobileJournalPage } from "../tabs/MobileJournalPage";
import { MobileAIAssistantPage } from "../tabs/MobileAIAssistantPage";
import { MobileSettingsPage } from "../tabs/MobileSettingsPage";
import { MobileTaskDetailPage } from "../details/MobileTaskDetailPage";
import { useAppStore } from "../../stores";
import { getLocalTodayStr, getTaskEffectiveDate } from "../../utils";

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
    isMobileNoteDetailOpen,
    isJournalBookOpen,
  } = useAppStore();

  const isFullBleed =
    (activeTab === "notes" && Boolean(isMobileNoteDetailOpen)) ||
    (activeTab === "journal" && Boolean(isJournalBookOpen));

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
      <div className="w-full">
        <MobileTaskDetailPage
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
        <MobileTasksPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
    }

    // 3. Ghi chú (Ghi)
    if (activeTab === "notes") {
      return (
        <MobileNotesPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    }

    // 4. Nhật ký (thuộc nhóm Ghi)
    if (activeTab === "journal") {
      return (
        <MobileJournalPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    }

    // 5. Trợ lý AI (AI)
    if (activeTab === "ai") {
      return (
        <MobileAIAssistantPage
          onBack={() => onNavigateTab(previousTab || "tasks")}
          isStandalone
        />
      );
    }

    // 6. Thông báo (Notifications Full Page)
    if (activeTab === "notifications") {
      return <MobileNotificationsView onNavigateTab={onNavigateTab} />;
    }

    // 7. Cài đặt
    if (activeTab === "settings") {
      return (
        <MobileSettingsPage
          onNavigateTab={onNavigateTab}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
        />
      );
    }

    // Fallback: Mặc định hiển thị Tasks View
    return (
      <MobileTasksPage
        navigationTarget={navigationTarget}
        onClearNavigationTarget={onClearNavigationTarget}
      />
    );
  };

  return (
    <main
      className={`w-full min-w-0 select-none ${
        isFullBleed
          ? "p-0"
          : "px-3.5 py-3 sm:px-5 pb-28"
      }`}
    >
      {renderActiveView()}
    </main>
  );
};
