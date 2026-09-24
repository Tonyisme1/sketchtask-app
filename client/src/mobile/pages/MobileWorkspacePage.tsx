import React, { useEffect } from "react";
import { MobileEventSubTab, TabKey, NavigationTarget } from "../../types";
import { MobileTasksPage } from "./MobileTasksPage";
import { MobileTodayView } from "../tabs/MobileTodayView";
import { MobileNotesPage } from "../tabs/MobileNotesPage";
import { MobileJournalPage } from "../tabs/MobileJournalPage";
import { MobileAIAssistantPage } from "../tabs/MobileAIAssistantPage";
import { MobileEventsPage } from "../tabs/MobileEventsPage";
import { MobileSettingsPage } from "../tabs/MobileSettingsPage";
import { MobileTaskDetailPage } from "../details/MobileTaskDetailPage";
import { useAppStore } from "../../stores";
import { getTaskEffectiveDate } from "../../utils";

export interface MobileWorkspaceProps {
  activeTab: TabKey;
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget: () => void;
  onNavigateTab: (tab: TabKey | string, target?: NavigationTarget) => void;
  onNavigateRoute: (path: string) => void;
  previousTab?: TabKey;
  activeEventSubTab: MobileEventSubTab;
  onEventSubTabChange: (subTab: MobileEventSubTab) => void;
}

export const MobileWorkspace: React.FC<MobileWorkspaceProps> = ({
  activeTab,
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
  onNavigateRoute,
  previousTab,
  activeEventSubTab,
  onEventSubTabChange,
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

  useEffect(() => {
    if (!navigationTarget?.taskId) return;

    const task = tasks.find((item) => item.id === navigationTarget.taskId);
    if (!task) {
      onClearNavigationTarget?.();
      return;
    }

    const taskDate = navigationTarget.date || getTaskEffectiveDate(task);
    setActiveTaskSubTab("planner");
    onClearNavigationTarget?.();
  }, [navigationTarget, tasks, setActiveTaskSubTab, onClearNavigationTarget]);

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
    // 1. Hôm nay vẫn là điểm đến độc lập nếu app mở từ một route cũ.
    if (activeTab === "today") {
      return <MobileTodayView />;
    }

    // 2. Công việc (Danh sách, lịch công việc và hạn định)
    if (activeTab === "tasks" || activeTab === "planner" || activeTab === "deadlines") {
      return (
        <MobileTasksPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
    }

    // 3. Sự kiện: không trộn vào luồng công việc trên Mobile
    if (activeTab === "events") {
      return (
        <MobileEventsPage
          activeSubTab={activeEventSubTab}
          onSubTabChange={onEventSubTabChange}
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
        />
      );
    }

    // 4. Ghi chú (Ghi)
    if (activeTab === "notes") {
      return (
        <MobileNotesPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    }

    // 5. Nhật ký (thuộc nhóm Ghi)
    if (activeTab === "journal") {
      return (
        <MobileJournalPage
          navigationTarget={navigationTarget}
          onClearNavigationTarget={onClearNavigationTarget}
          onNavigateTab={onNavigateTab}
        />
      );
    }

    // 6. Trợ lý AI (AI)
    if (activeTab === "ai") {
      return (
        <MobileAIAssistantPage
          onBack={() => onNavigateTab(previousTab || "tasks")}
          isStandalone
        />
      );
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
