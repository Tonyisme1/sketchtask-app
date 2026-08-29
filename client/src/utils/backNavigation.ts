import { App as CapacitorApp } from "@capacitor/app";
import { isNativePlatform } from "../services/notificationService";

// ==========================================
// UTILITY: Back Navigation Manager (Xử Lý Phím Quay Lại Toàn Cục)
// ==========================================

type BackHandler = () => boolean; // return true nếu đã xử lý, false nếu nhường cho tầng dưới

const backHandlers: BackHandler[] = [];
let onTabNavigateBack: (() => boolean) | null = null;
let lastBackPressTime = 0;

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
export const registerTabNavigateBack = (callback: () => boolean): (() => void) => {
  onTabNavigateBack = callback;
  return () => {
    onTabNavigateBack = null;
  };
};

/**
 * Kích hoạt xử lý hành động Back
 */
export const triggerBackAction = (): boolean => {
  // 1. Ưu tiên cao nhất: Đóng Modal / Popup / Drawer đang mở
  if (backHandlers.length > 0) {
    const topHandler = backHandlers[backHandlers.length - 1];
    if (topHandler()) {
      return true;
    }
  }

  // 2. Ưu tiên nhì: Quay lại Tab trước đó trong lịch sử duyệt
  if (onTabNavigateBack && onTabNavigateBack()) {
    return true;
  }

  // 3. Nếu đang ở Tab chính và không còn gì để back
  if (isNativePlatform()) {
    const now = Date.now();
    if (now - lastBackPressTime < 2000) {
      CapacitorApp.exitApp();
    } else {
      lastBackPressTime = now;
    }
  }

  return false;
};

// Khởi tạo lắng nghe sự kiện phím Back trên Android Capacitor & Web Browser
export const initBackNavigationListener = () => {
  if (typeof window === "undefined") return;

  // A. Lắng nghe phím Back vật lý trên Android qua Capacitor
  if (isNativePlatform()) {
    try {
      CapacitorApp.addListener("backButton", () => {
        triggerBackAction();
      });
    } catch (e) {
      console.warn("Capacitor backButton listener error:", e);
    }
  }

  // B. Lắng nghe sự kiện popstate của trình duyệt web
  window.addEventListener("popstate", () => {
    triggerBackAction();
  });
};
