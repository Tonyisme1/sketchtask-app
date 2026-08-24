import { useState } from "react";
import { TabKey } from "./types";
import { AppProvider } from "./stores/appStore";
import { AppShell } from "./components/layout/AppShell";
import { TodayTab } from "./components/features/today/TodayTab";
import { PlannerTab } from "./components/features/planner/PlannerTab";
import { NotebooksTab } from "./components/features/notebooks/NotebooksTab";
import { BraindumpTab } from "./components/features/braindump/BraindumpTab";
import { ReviewTab } from "./components/features/review/ReviewTab";

// ==========================================
// MAIN APP CONTENT (Chuyển đổi 5 Tab)
// ==========================================

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<TabKey>("today");

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
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
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
