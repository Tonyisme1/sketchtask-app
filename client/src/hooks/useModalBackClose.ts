import { useEffect, useRef } from "react";
import {
  registerBackHandler,
  skipNextPopStateHandling,
} from "../utils/backNavigation";

/**
 * Hook tự động liên kết phím Back (Android Back Button & Gesture / Web PopState) với việc đóng Modal.
 * Khi Modal mở: Đăng ký handler đóng và thêm 1 entry vào history để nút Back đóng modal thay vì thoát ứng dụng.
 */
export function useModalBackClose(isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    // 1. Push history state
    const stateId = `modal_${Date.now()}`;
    window.history.pushState({ modalId: stateId }, "");

    // 2. Register back handler cho Capacitor Android & Web PopState
    let isClosedByPopState = false;
    const unregister = registerBackHandler((source) => {
      isClosedByPopState = source === "popstate";
      onCloseRef.current();
      return true;
    });

    return () => {
      unregister();
      // Nếu modal được đóng bằng UI (click overlay, drag down, nút submit), dọn dẹp history entry
      // Native Back cũng cần dọn entry vì Capacitor không tự phát popstate.
      if (!isClosedByPopState && window.history.state?.modalId === stateId) {
        skipNextPopStateHandling();
        window.history.back();
      }
    };
  }, [isOpen]);
}
