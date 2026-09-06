import { useEffect, useState } from "react";

// Keep a fixed mobile toolbar above the virtual keyboard when the visual viewport shrinks.
export const useMobileKeyboardOffset = () => {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    const viewport = window.visualViewport;
    const mediaQuery = window.matchMedia("(max-width: 767px)");

    const updateOffset = () => {
      if (!mediaQuery.matches || !viewport) {
        setKeyboardOffset(0);
        return;
      }

      const nextOffset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop
      );
      setKeyboardOffset(Math.round(nextOffset));
    };

    updateOffset();
    viewport?.addEventListener("resize", updateOffset);
    viewport?.addEventListener("scroll", updateOffset);
    mediaQuery.addEventListener("change", updateOffset);

    return () => {
      viewport?.removeEventListener("resize", updateOffset);
      viewport?.removeEventListener("scroll", updateOffset);
      mediaQuery.removeEventListener("change", updateOffset);
    };
  }, []);

  return keyboardOffset;
};
