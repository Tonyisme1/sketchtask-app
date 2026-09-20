import { useState, useEffect } from "react";

export type LayoutMode = "mobile" | "tablet" | "desktop";

export interface ResponsiveLayoutState {
  layout: LayoutMode;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isTouchDevice: boolean;
}

const getSnapshot = (): ResponsiveLayoutState => {
  if (typeof window === "undefined") {
    return {
      layout: "desktop",
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1280,
      height: 800,
      isPortrait: false,
      isLandscape: true,
      isTouchDevice: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;
  const layout: LayoutMode = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  const isPortrait = height > width;
  const isLandscape = !isPortrait;
  const isTouchDevice = "ontouchstart" in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0);

  return {
    layout,
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    isPortrait,
    isLandscape,
    isTouchDevice,
  };
};

/**
 * Hook detecting responsive layout breakpoints:
 * - Mobile: < 768px
 * - Tablet: 768px <= width < 1024px
 * - Desktop: >= 1024px
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const [state, setState] = useState<ResponsiveLayoutState>(getSnapshot);

  useEffect(() => {
    let ticking = false;

    const handleResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setState(getSnapshot());
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return state;
}
