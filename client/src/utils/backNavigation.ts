// ==========================================
// UTILITY: Back Navigation Manager (Xử Lý Phím Quay Lại Toàn Cục)
// ==========================================

export type BackActionSource = "popstate" | "native" | "unknown";
type BackHandler = (source?: BackActionSource) => boolean; // return true nếu đã xử lý, false nếu nhường cho tầng dưới

const backHandlers: BackHandler[] = [];
let onTabNavigateBack: ((source?: BackActionSource) => boolean) | null = null;
let skipNextPopState = false;

// Ignore the popstate emitted while removing a UI-opened modal history entry.
export const skipNextPopStateHandling = () => {
  skipNextPopState = true;
};

export const consumeSkippedPopState = (): boolean => {
  const shouldSkip = skipNextPopState;
  skipNextPopState = false;
  return shouldSkip;
};

/**
 * Đăng ký một hành động khi bấm phím Back (ví dụ đóng Modal, đóng Drawer)
 * Ưu tiên xử lý từ Modal mở gần nhất (LIFO)
 */
export const registerBackHandler = (handler: BackHandler): (() => void) => {
  backHandlers.push(handler);
  return () => {
    const index = backHandlers.indexOf(handler);
    if (index !== -1) {
      backHandlers.splice(index, 1);
    }
  };
};

/**
 * Đăng ký callback điều hướng quay lại Tab trước đó
 */
export const registerTabNavigateBack = (
  callback: (source?: BackActionSource) => boolean,
): (() => void) => {
  onTabNavigateBack = callback;
  return () => {
    onTabNavigateBack = null;
  };
};

/**
 * Kích hoạt xử lý hành động Back
 */
export const triggerBackAction = (source: BackActionSource = "unknown"): boolean => {
  // 1. Ưu tiên cao nhất: Đóng Modal / Popup / Drawer đang mở
  if (backHandlers.length > 0) {
    const topHandler = backHandlers[backHandlers.length - 1];
    if (topHandler(source)) {
      return true;
    }
  }

  // 2. Ưu tiên nhì: Quay lại Tab trước đó trong lịch sử duyệt
  if (onTabNavigateBack && onTabNavigateBack(source)) {
    return true;
  }

  return false;
};
