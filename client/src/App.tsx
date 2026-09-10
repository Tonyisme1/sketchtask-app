import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { NavigationTarget, TabKey } from "./shared/types";
import { AppProvider, useAppStore } from "./shared/stores";
import { useResponsiveLayout } from "./shared/hooks";

// 3 Dedicated Platform Shells & Workspaces
import { DesktopShell, DesktopWorkspace } from "./desktop";
import { TabletShell, TabletWorkspace } from "./tablet";
import { MobileShell, MobileWorkspace } from "./mobile";

// Standalone Feature Pages
import { AuthPage } from "./features";
import { ToastViewport } from "./components/ui/feedback/ToastViewport";
import { registerTabNavigateBack, triggerBackAction } from "./utils/backNavigation";

// ==========================================
// MAIN APP CONTENT (Dispatch theo 3 nền tảng: Desktop, Tablet, Mobile)
// ==========================================

interface MainAppContentProps {
  onNavigateRoute: (path: string) => void;
}

function MainAppContent({ onNavigateRoute }: MainAppContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("tasks");
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | undefined>();
  const {
    activeTaskSubTab,
    setActiveTaskSubTab,
    activeDetailTaskId,
    closeTaskDetail,
    setSelectedNotebookId,
    selectedNotebookId,
    setIsMobileNoteDetailOpen,
    isMobileNoteDetailOpen,
    setSettingsMobileSubView,
    settingsMobileSubView,
  } = useAppStore();
  const { isDesktop, isTablet } = useResponsiveLayout();

  const [previousTab, setPreviousTab] = useState<TabKey>("today");

  const handleTabChange = useCallback((tab: TabKey | string, target?: NavigationTarget) => {
    // Đóng panel task detail & các mục con khi chuyển tab hoặc chuyển không gian
    closeTaskDetail();
    setSelectedNotebookId(null);
    setIsMobileNoteDetailOpen(false);
    setSettingsMobileSubView(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    // Lưu tab trước đó nếu không phải là settings/notebooks
    if (activeTab !== "settings" && activeTab !== "notebooks") {
      if (activeTab === "tasks") {
        setPreviousTab(
          activeTaskSubTab === "planner"
            ? "planner"
            : activeTaskSubTab === "deadlines"
              ? "deadlines"
              : "today",
        );
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
    if (tab === "tasks") {
      // Hôm nay là workspace riêng; khi vào Công việc, mở chế độ lịch gần nhất.
      if (activeTaskSubTab === "today") {
        setActiveTaskSubTab("planner");
      }
      setActiveTab("tasks");
      return;
    }
    if (
      tab === "notes" ||
      tab === "review" ||
      tab === "notebooks" ||
      tab === "settings"
    ) {
      setActiveTab(tab as TabKey);
      return;
    }
    setActiveTab(tab as TabKey);
  }, [activeTab, activeTaskSubTab, closeTaskDetail, setActiveTaskSubTab, setIsMobileNoteDetailOpen, setSelectedNotebookId, setSettingsMobileSubView]);

  const handleClearNavigationTarget = () => {
    setNavigationTarget(undefined);
  };

  const handleInAppBack = useCallback(() => {
    if (activeDetailTaskId) {
      closeTaskDetail();
      return true;
    }
    if (settingsMobileSubView) {
      setSettingsMobileSubView(null);
      return true;
    }
    if (isMobileNoteDetailOpen) {
      setIsMobileNoteDetailOpen(false);
      return true;
    }
    if (selectedNotebookId) {
      setSelectedNotebookId(null);
      return true;
    }
    if (activeTab === "settings") {
      handleTabChange(previousTab);
      return true;
    }
    if (activeTab === "tasks" && activeTaskSubTab !== "today") {
      handleTabChange("today");
      return true;
    }
    return false;
  }, [
    activeDetailTaskId,
    activeTab,
    activeTaskSubTab,
    closeTaskDetail,
    handleTabChange,
    isMobileNoteDetailOpen,
    previousTab,
    selectedNotebookId,
    setIsMobileNoteDetailOpen,
    setSelectedNotebookId,
    setSettingsMobileSubView,
    settingsMobileSubView,
  ]);

  // Hardware/browser Back first unwinds the active in-app surface.
  useEffect(() => {
    return registerTabNavigateBack(handleInAppBack);
  }, [handleInAppBack]);

  // 1. Desktop Shell (width >= 1024px)
  if (isDesktop) {
    return (
      <DesktopShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigateRoute={onNavigateRoute}
        previousTab={previousTab}
      >
        <DesktopWorkspace
          activeTab={activeTab}
          navigationTarget={navigationTarget}
          onClearNavigationTarget={handleClearNavigationTarget}
          onNavigateTab={handleTabChange}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
        />
      </DesktopShell>
    );
  }

  // 2. Tablet Shell (768px <= width < 1024px)
  if (isTablet) {
    return (
      <TabletShell
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onNavigateRoute={onNavigateRoute}
        previousTab={previousTab}
      >
        <TabletWorkspace
          activeTab={activeTab}
          navigationTarget={navigationTarget}
          onClearNavigationTarget={handleClearNavigationTarget}
          onNavigateTab={handleTabChange}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
        />
      </TabletShell>
    );
  }

  // 3. Mobile Shell (width < 768px)
  return (
    <MobileShell
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onNavigateRoute={onNavigateRoute}
      previousTab={previousTab}
    >
      <MobileWorkspace
        activeTab={activeTab}
        navigationTarget={navigationTarget}
        onClearNavigationTarget={handleClearNavigationTarget}
        onNavigateTab={handleTabChange}
        onNavigateRoute={onNavigateRoute}
        previousTab={previousTab}
      />
    </MobileShell>
  );
}

type AppRoute =
  | { kind: "app" }
  | { kind: "auth" };

const resolveRoute = (pathname: string): AppRoute => {
  // The native shell must open the bundled workspace directly. The public web
  // entry point is intentionally limited to the login screen.
  if (Capacitor.isNativePlatform() && pathname === "/") {
    return { kind: "app" };
  }
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return { kind: "app" };
  }
  return { kind: "auth" };
};

function AppRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const isAppRoute = resolveRoute(window.location.pathname).kind === "app";
      const isAppEntry = Boolean(event.state?.__sketchTaskAppEntry);
      const handled = triggerBackAction();

      if (isAppRoute && isAppEntry) {
        if (handled) {
          const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
          window.history.pushState(
            { ...(event.state || {}), __sketchTaskAppGuard: true },
            "",
            currentUrl,
          );
          return;
        }

        // No internal surface remains: continue to the page that opened the app.
        window.history.go(-1);
        return;
      }

      if (handled) return;
      setPathname(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (resolveRoute(pathname).kind !== "app") return;

    const currentState = window.history.state || {};
    if (currentState.__sketchTaskAppEntry || currentState.__sketchTaskAppGuard) return;

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.history.replaceState(
      { ...currentState, __sketchTaskAppEntry: true },
      "",
      currentUrl,
    );
    window.history.pushState(
      { ...currentState, __sketchTaskAppGuard: true },
      "",
      currentUrl,
    );
  }, [pathname]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => Promise<void> } | undefined;
    void CapacitorApp.addListener("backButton", () => {
      if (!triggerBackAction()) {
        void CapacitorApp.exitApp();
      }
    }).then((registeredListener) => {
      listener = registeredListener;
    });

    return () => {
      void listener?.remove();
    };
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
  return <AuthPage onNavigate={navigate} />;
}

// ==========================================
// ROOT APP (Bao bọc AppProvider LocalStorage)
// ==========================================

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <ToastViewport />
    </AppProvider>
  );
}
