import { useState, useEffect } from "react";
import { TabKey } from "./types";
import { AppProvider } from "./stores/appStore";
import { AppShell } from "./components/layout/AppShell";
import { TodayTab } from "./components/features/today/TodayTab";
import { PlannerTab } from "./components/features/planner/PlannerTab";
import { NotebooksTab } from "./components/features/notebooks/NotebooksTab";
import { BraindumpTab } from "./components/features/braindump/BraindumpTab";
import { ReviewTab } from "./components/features/review/ReviewTab";
import {
  initBackNavigationListener,
  registerTabNavigateBack,
} from "./utils/backNavigation";

// ==========================================
// MAIN APP CONTENT (Chuyển đổi 5 Tab & Nhớ Lịch Sử Back)
// ==========================================

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("today");
  const [tabHistory, setTabHistory] = useState<TabKey[]>(["today"]);

  // Khởi tạo listener phím Back 1 lần
  useEffect(() => {
    initBackNavigationListener();
  }, []);

  // Đăng ký hành động Back chuyển tab trước đó
  useEffect(() => {
    const unregister = registerTabNavigateBack(() => {
      if (tabHistory.length > 1) {
        const newHistory = [...tabHistory];
        newHistory.pop(); // Bỏ tab hiện tại
        const prevTab = newHistory[newHistory.length - 1];
        setTabHistory(newHistory);
        setActiveTab(prevTab);
        return true;
      }
      if (activeTab !== "today") {
        setActiveTab("today");
        setTabHistory(["today"]);
        return true;
      }
      return false;
    });
    return unregister;
  }, [tabHistory, activeTab]);

  const handleTabChange = (nextTab: TabKey) => {
    if (nextTab !== activeTab) {
      setTabHistory((prev) => [...prev, nextTab]);
      setActiveTab(nextTab);
    }
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "today":
        return <TodayTab />;
      case "planner":
        return <PlannerTab />;
      case "notebooks":
        return <NotebooksTab />;
      case "braindump":
        return <BraindumpTab />;
      case "review":
        return <ReviewTab />;
      default:
        return <TodayTab />;
    }
  };

  return (
    <AppShell activeTab={activeTab} onTabChange={handleTabChange}>
      {renderActiveTabContent()}
    </AppShell>
  );
}

// ==========================================
// ROOT APP (Bao bọc AppProvider LocalStorage)
// ==========================================

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
