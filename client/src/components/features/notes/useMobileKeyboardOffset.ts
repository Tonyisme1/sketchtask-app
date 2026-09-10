import { useEffect, useRef, useState } from "react";

export interface MobileKeyboardState {
  offset: number;
  isVisible: boolean;
}

const KEYBOARD_HEIGHT_THRESHOLD = 120;
const KEYBOARD_OFFSET_THRESHOLD = 80;

// Keep the mobile/tablet toolbar above the virtual keyboard and track its close action.
export const useMobileKeyboardOffset = (): MobileKeyboardState => {
  const [state, setState] = useState<MobileKeyboardState>({
    offset: 0,
    isVisible: false,
  });
  const baselineHeightRef = useRef<number | null>(null);

  useEffect(() => {
    const viewport = window.visualViewport;
    const mediaQuery = window.matchMedia("(max-width: 1023px)");

    if (!viewport) {
      setState({ offset: 0, isVisible: false });
      return;
    }

    baselineHeightRef.current = viewport.height;
    let frameId: number | null = null;

    const updateOffset = () => {
      if (frameId !== null) return;

      frameId = window.requestAnimationFrame(() => {
        frameId = null;

        if (!mediaQuery.matches) {
          setState((previous) =>
            previous.offset === 0 && !previous.isVisible
              ? previous
              : { offset: 0, isVisible: false },
          );
          return;
        }

        const layoutHeight = document.documentElement.clientHeight || window.innerHeight;
        const visualViewportBottom = viewport.offsetTop + viewport.height;
        const nextOffset = Math.max(0, layoutHeight - visualViewportBottom);
        const baselineHeight = baselineHeightRef.current ?? viewport.height;
        const heightDrop = baselineHeight - viewport.height;
        const isVisible =
          nextOffset > KEYBOARD_OFFSET_THRESHOLD ||
          heightDrop > KEYBOARD_HEIGHT_THRESHOLD;

        // Browser chrome can change the viewport while the keyboard is closed.
        if (!isVisible) {
          baselineHeightRef.current = Math.max(baselineHeight, viewport.height);
        }

        const normalizedState = {
          offset: isVisible ? Math.round(nextOffset) : 0,
          isVisible,
        };

        setState((previous) =>
          previous.offset === normalizedState.offset &&
          previous.isVisible === normalizedState.isVisible
            ? previous
            : normalizedState,
        );
      });
    };

    updateOffset();
    viewport.addEventListener("resize", updateOffset);
    viewport.addEventListener("scroll", updateOffset);
    window.addEventListener("resize", updateOffset);
    document.addEventListener("focusin", updateOffset);
    document.addEventListener("focusout", updateOffset);
    mediaQuery.addEventListener("change", updateOffset);

    return () => {
      viewport.removeEventListener("resize", updateOffset);
      viewport.removeEventListener("scroll", updateOffset);
      window.removeEventListener("resize", updateOffset);
      document.removeEventListener("focusin", updateOffset);
      document.removeEventListener("focusout", updateOffset);
      mediaQuery.removeEventListener("change", updateOffset);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, []);

  return state;
};
