import { useCallback, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { NavigationTarget, TabKey } from "./types";
import { AppProvider, useAppStore } from "./stores";
import { useResponsiveLayout } from "./hooks";

// 3 Dedicated Platform Shells & Workspaces
import { DesktopShell, DesktopWorkspace } from "./desktop";
import type { DesktopPlannerSurface } from "./desktop/components/planner/DesktopPlannerHeader";
import { TabletShell, TabletWorkspace } from "./tablet";
import { MobileShell, MobileWorkspace } from "./mobile";

// Standalone Feature Pages
import { AuthPage } from "./components/shared/auth/AuthPage";
import { ToastViewport } from "./components/ui/feedback/ToastViewport";
import { UpdateModal } from "./components/ui/overlays/UpdateModal";
import { AppOnboardingTour } from "./components/shared/onboarding/AppOnboardingTour";
import { checkForAppUpdates, type UpdateInfo } from "./services/updateService";
import {
  consumeSkippedPopState,
  registerTabNavigateBack,
  triggerBackAction,
} from "./utils/backNavigation";

// ==========================================
// MAIN APP CONTENT (Dispatch theo 3 nền tảng: Desktop, Tablet, Mobile)
// ==========================================

interface MainAppContentProps {
  onNavigateRoute: (path: string) => void;
}

interface AppLocation {
  tab: TabKey;
}

const getLocationKey = (location: AppLocation) =>
  location.tab;

// Legacy tabs may still arrive from old links or callbacks. They are aliases,
// never destinations in the application navigation state.
const normalizeWorkspaceTab = (tab: TabKey | string): TabKey => {
  if (tab === "today" || tab === "planner" || tab === "deadlines") return "tasks";
  return tab as TabKey;
};

const getInitialWorkspaceTab = (): TabKey => {
  if (typeof window === "undefined") return "tasks";
  const requestedTab = new URLSearchParams(window.location.search).get("tab");
  const normalizedTab = normalizeWorkspaceTab(requestedTab || "tasks");
  return ["tasks", "events", "notes", "journal", "ai", "settings"].includes(normalizedTab)
    ? normalizedTab
    : "tasks";
};

function MainAppContent({ onNavigateRoute }: MainAppContentProps) {
  const [activeTab, setActiveTab] = useState<TabKey>(getInitialWorkspaceTab);
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | undefined>();
  const {
    activeDetailTaskId,
    closeTaskDetail,
    setIsMobileNoteDetailOpen,
    isMobileNoteDetailOpen,
    setIsJournalBookOpen,
    isJournalBookOpen,
    setSettingsMobileSubView,
    settingsMobileSubView,
    openQuickTaskModal,
  } = useAppStore();
  const { isDesktop, isTablet } = useResponsiveLayout();

  const [previousTab, setPreviousTab] = useState<TabKey>("tasks");
  const [desktopPlannerSurface, setDesktopPlannerSurface] = useState<DesktopPlannerSurface>("calendar");
  const appNavigationStackRef = useRef<AppLocation[]>([]);
  const handledPwaQuickCreateRef = useRef(false);

  // PWA shortcut is an explicit create intent, never a hidden Today route.
  useEffect(() => {
    if (handledPwaQuickCreateRef.current) return;
    if (new URLSearchParams(window.location.search).get("create") !== "1") return;
    handledPwaQuickCreateRef.current = true;
    openQuickTaskModal({ itemType: "task" });
    window.history.replaceState(window.history.state, "", window.location.pathname);
  }, [openQuickTaskModal]);

  const handleDesktopPlannerSurfaceChange = useCallback((surface: DesktopPlannerSurface) => {
    setDesktopPlannerSurface(surface);
  }, []);

  const handleTabChange = useCallback((tab: TabKey | string, target?: NavigationTarget) => {
    const currentLocation: AppLocation = {
      tab: activeTab,
    };
    const nextLocation: AppLocation = { tab: normalizeWorkspaceTab(tab) };

    // Mỗi workspace/sub-tab là một entry trong stack để Back luôn quay về
    // đúng nơi người dùng vừa đứng, không chỉ quay về một tab cố định.
    if (getLocationKey(currentLocation) !== getLocationKey(nextLocation)) {
      const stack = appNavigationStackRef.current;
      const lastLocation = stack[stack.length - 1];
      if (!lastLocation || getLocationKey(lastLocation) !== getLocationKey(currentLocation)) {
        stack.push(currentLocation);
      }
      setPreviousTab(currentLocation.tab);
    }

    // Đóng panel task detail & các mục con khi chuyển tab hoặc chuyển không gian
    closeTaskDetail();
    setIsMobileNoteDetailOpen(false);
    setIsJournalBookOpen(false);
    setSettingsMobileSubView(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }

    setNavigationTarget(target);
    setActiveTab(nextLocation.tab);
  }, [activeTab, closeTaskDetail, setIsJournalBookOpen, setIsMobileNoteDetailOpen, setSettingsMobileSubView]);

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
    if (isJournalBookOpen) {
      setIsJournalBookOpen(false);
      return true;
    }
    const previousLocation = appNavigationStackRef.current.pop();
    if (previousLocation) {
      closeTaskDetail();
      setNavigationTarget(undefined);
      setActiveTab(previousLocation.tab);
      setPreviousTab(previousLocation.tab);
      return true;
    }

    if (activeTab !== "tasks") {
      setNavigationTarget(undefined);
      setActiveTab("tasks");
      return true;
    }

    return false;
  }, [
    activeTab,
    activeDetailTaskId,
    closeTaskDetail,
    isJournalBookOpen,
    isMobileNoteDetailOpen,
    setActiveTab,
    setIsJournalBookOpen,
    setIsMobileNoteDetailOpen,
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
        desktopPlannerSurface={desktopPlannerSurface}
        onDesktopPlannerSurfaceChange={handleDesktopPlannerSurfaceChange}
      >
        <DesktopWorkspace
          activeTab={activeTab}
          navigationTarget={navigationTarget}
          onClearNavigationTarget={handleClearNavigationTarget}
          onNavigateTab={handleTabChange}
          onNavigateRoute={onNavigateRoute}
          previousTab={previousTab}
          desktopPlannerSurface={desktopPlannerSurface}
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
  const isStandaloneWebApp =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

  if ((Capacitor.isNativePlatform() || isStandaloneWebApp) && pathname === "/") {
    return { kind: "app" };
  }
  if (pathname === "/app" || pathname.startsWith("/app/")) {
    return { kind: "app" };
  }
  return { kind: "auth" };
};

function AppRouter() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkUpdate = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      void checkForAppUpdates().then((info) => {
        if (!cancelled && info?.hasUpdate) setUpdateInfo(info);
      });
    };

    checkUpdate();
    window.addEventListener("online", checkUpdate);
    const intervalId = window.setInterval(checkUpdate, 30 * 60 * 1000);

    return () => {
      cancelled = true;
      window.removeEventListener("online", checkUpdate);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (resolveRoute(pathname).kind === "app") {
      document.title = "SketchTask";
    }
  }, [pathname]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (consumeSkippedPopState()) {
        return;
      }

      const isAppRoute = resolveRoute(window.location.pathname).kind === "app";
      const isAppEntry = Boolean(event.state?.__sketchTaskAppEntry);
      const handled = triggerBackAction("popstate");

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
      if (!triggerBackAction("native")) {
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
    return (
      <>
        <MainAppContent onNavigateRoute={navigate} />
        <UpdateModal updateInfo={updateInfo} onClose={() => setUpdateInfo(null)} />
      </>
    );
  }
  return (
    <>
      <AuthPage onNavigate={navigate} />
      <UpdateModal updateInfo={updateInfo} onClose={() => setUpdateInfo(null)} />
    </>
  );
}

// ==========================================
// ROOT APP (Bao bọc AppProvider LocalStorage)
// ==========================================

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <AppOnboardingTour />
      <ToastViewport />
    </AppProvider>
  );
}
