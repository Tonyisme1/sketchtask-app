import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { NavigationTarget, TabKey } from "./types";
import { AppProvider, useAppStore } from "./stores/appStore";
import { AppShell } from "./components/layout/AppShell";
import { TasksTab } from "./components/features/tasks/TasksTab";
import { NotesTab } from "./components/features/notes/NotesTab";
import { JournalTab } from "./components/features/journal/JournalTab";
import { NotebooksTab } from "./components/features/notebooks/NotebooksTab";
import { SettingsTab } from "./components/features/settings/SettingsTab";
import { ReviewTab } from "./components/features/review/ReviewTab";
import { AuthPage } from "./components/features/auth/AuthPage";
import { AdminPage } from "./components/features/admin/AdminPage";
import {
  LandingPage,
  MarketingRoute,
} from "./components/features/marketing/LandingPage";

// ==========================================
// MAIN APP CONTENT (4 luồng chính + các mục phụ trong menu)
// ==========================================

interface MainAppContentProps {
  onNavigateRoute: (path: string) => void;
}

function MainAppContent({ onNavigateRoute }: MainAppContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | undefined>();
  const { activeTaskSubTab, setActiveTaskSubTab } = useAppStore();

  const [previousTab, setPreviousTab] = useState<TabKey>("today");

  const handleTabChange = (tab: TabKey | string, target?: NavigationTarget) => {
    // Lưu tab trước đó nếu không phải là settings/notebooks
    if (activeTab !== "settings" && activeTab !== "notebooks") {
      if (activeTab === "tasks") {
        setPreviousTab(activeTaskSubTab === "planner" ? "planner" : "today");
      } else {
        setPreviousTab(activeTab);
      }
    }

    setNavigationTarget(target);
    // Chuẩn hóa mapping sub-tab vào đúng parent workspace và cập nhật sub-tab state
    if (tab === "today") {
      setActiveTaskSubTab("today");
      setActiveTab("tasks");
      return;
    }
    if (tab === "planner") {
      setActiveTaskSubTab("planner");
      setActiveTab("tasks");
      return;
    }
    if (tab === "deadlines") {
      setActiveTaskSubTab("deadlines");
      setActiveTab("tasks");
      return;
    }
    if (tab === "journal") {
      setActiveTab("journal");
      return;
    }
    if (
      tab === "notes" ||
      tab === "tasks" ||
      tab === "review" ||
      tab === "notebooks" ||
      tab === "settings"
    ) {
      setActiveTab(tab as TabKey);
      return;
    }
    setActiveTab(tab as TabKey);
  };

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case "tasks":
        return (
          <TasksTab
            navigationTarget={navigationTarget}
            onClearNavigationTarget={() => setNavigationTarget(undefined)}
          />
        );
      case "notes":
        return (
          <NotesTab
            navigationTarget={navigationTarget}
            onClearNavigationTarget={() => setNavigationTarget(undefined)}
            onNavigateTab={handleTabChange}
          />
        );
      case "journal":
        return (
          <JournalTab
            navigationTarget={navigationTarget}
            onClearNavigationTarget={() => setNavigationTarget(undefined)}
            onNavigateTab={handleTabChange}
          />
        );
      case "notebooks":
        return (
          <NotebooksTab
            navigationTarget={navigationTarget}
            onClearNavigationTarget={() => setNavigationTarget(undefined)}
            onNavigateTab={handleTabChange}
          />
        );
      case "settings":
        return (
          <SettingsTab
            onNavigateTab={handleTabChange}
            onNavigateRoute={onNavigateRoute}
            previousTab={previousTab}
          />
        );
      case "review":
        return <ReviewTab onNavigateTab={handleTabChange} />;
      default:
        return <TasksTab />;
    }
  };

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onNavigateRoute={onNavigateRoute}
    >
      {renderActiveTabContent()}
    </AppShell>
  );
}

type AppRoute =
  | { kind: "app" }
  | { kind: "auth"; mode: "signin" | "signup" }
  | { kind: "admin" }
  | { kind: "marketing"; route: MarketingRoute };

const resolveRoute = (pathname: string): AppRoute => {
  // The native shell must open the bundled workspace directly. The marketing
  // landing page remains the default entry point for the public web app.
  if (Capacitor.isNativePlatform() && pathname === "/") {
    return { kind: "app" };
  }
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return { kind: "app" };
  }
  if (pathname === "/login") return { kind: "auth", mode: "signin" };
  if (pathname === "/register") return { kind: "auth", mode: "signup" };
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return { kind: "admin" };
  if (pathname === "/features") {
    return { kind: "marketing", route: "features" };
  }
  if (pathname === "/how-it-works") {
    return { kind: "marketing", route: "how-it-works" };
  }
  if (pathname === "/pricing") {
    return { kind: "marketing", route: "pricing" };
  }
  return { kind: "marketing", route: "home" };
};

function AppRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((path: string, replace = false) => {
    const target = new URL(path, window.location.origin);
    const targetUrl = `${target.pathname}${target.search}${target.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl !== targetUrl) {
      const historyState = { ...(window.history.state || {}), from: window.location.pathname };
      if (replace) window.history.replaceState(historyState, "", targetUrl);
      else window.history.pushState(historyState, "", targetUrl);
      setPathname(target.pathname);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const route = resolveRoute(pathname);
  if (route.kind === "app") {
    return <MainAppContent onNavigateRoute={navigate} />;
  }
  if (route.kind === "auth") {
    return <AuthPage mode={route.mode} onNavigate={navigate} />;
  }
  if (route.kind === "admin") {
    return <AdminPage onNavigate={navigate} />;
  }
  return <LandingPage route={route.route} onNavigate={navigate} />;
}

// ==========================================
// ROOT APP (Bao bọc AppProvider LocalStorage)
// ==========================================

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
