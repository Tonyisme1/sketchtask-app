import { LocalNotifications } from "@capacitor/local-notifications";
import { TaskDto } from "../types";

// ==========================================
// SERVICE: System & Push Notification Engine (Android & Web Desktop)
// ==========================================

export const isNativePlatform = (): boolean => {
  return (
    typeof (window as any).Capacitor !== "undefined" &&
    (window as any).Capacitor.isNativePlatform()
  );
};

/**
 * Chuyển đổi String ID (UUID) sang số nguyên 32-bit cho Capacitor LocalNotifications ID
 */
const hashStringToIntegerId = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Hiển thị thông báo trên Web / PWA qua Service Worker (Chuẩn 100% Android Chrome & iOS Safari)
 */
const showWebNotification = async (
  title: string,
  options: NotificationOptions = {},
): Promise<void> => {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  // 1. Chuẩn hiện đại trên Android Chrome & iOS Safari PWA
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg) {
        await (reg as any).showNotification(title, {
          icon: "/pwa-192x192.png",
          badge: "/favicon.svg",
          vibrate: [200, 100, 200],
          ...options,
        });
        return;
      }
    }
  } catch (err) {
    console.warn("ServiceWorker showNotification failed:", err);
  }

  // 2. Fallback cho máy tính Desktop
  try {
    new Notification(title, {
      icon: "/pwa-192x192.png",
      badge: "/favicon.svg",
      ...options,
    });
  } catch (err) {
    console.warn("Window Notification constructor error:", err);
  }
};

export const notificationService = {
  /**
   * Lấy chi tiết trạng thái quyền gửi thông báo hiện tại (granted / denied / default)
   */
  async getPermissionStatus(): Promise<"granted" | "denied" | "default"> {
    try {
      if (isNativePlatform()) {
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display === "granted") return "granted";
        if (perm.display === "denied") return "denied";
        return "default";
      } else if ("Notification" in window) {
        return Notification.permission as "granted" | "denied" | "default";
      }
      return "default";
    } catch {
      return "default";
    }
  },

  /**
   * Kiểm tra quyền gửi thông báo hiện tại
   */
  async checkPermission(): Promise<boolean> {
    const status = await this.getPermissionStatus();
    return status === "granted";
  },

  /**
   * Yêu cầu người dùng cấp quyền gửi thông báo
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (isNativePlatform()) {
        const perm = await LocalNotifications.requestPermissions();
        return perm.display === "granted";
      } else if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        return perm === "granted";
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Gửi thông báo ngay lập tức (Instant Notification / Test)
   */
  async sendInstant(title: string, body: string): Promise<void> {
    const hasPerm = await this.checkPermission();
    if (!hasPerm) return;

    try {
      if (isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              title,
              body,
              id: Date.now() % 100000,
              schedule: { at: new Date(Date.now() + 500) },
              sound: "beep.wav",
              smallIcon: "ic_stat_sketchtask",
              iconColor: "#FEF08A",
            },
          ],
        });
      } else {
        await showWebNotification(title, {
          body,
          tag: `instant-${Date.now()}`,
        });
      }
    } catch (e) {
      console.warn("Lỗi gửi thông báo tức thì:", e);
    }
  },

  /**
   * Lên lịch thông báo ngoài màn hình cho một công việc khi đến hạn hoặc đến lịch làm
   */
  async scheduleTask(task: TaskDto): Promise<void> {
    if (task.completed || (!task.dueDate && !task.deadlineDate && !task.startTime)) {
      await this.cancelTask(task.id);
      return;
    }

    const hasPerm = await this.checkPermission();
    if (!hasPerm) return;

    try {
      const now = new Date();
      let targetDate: Date | null = null;
      let notifTitle = `⏰ Nhắc việc: ${task.title}`;
      let notifBody = task.description || "Đến giờ thực hiện công việc của bạn rồi!";

      // 1. Phân loại theo Hạn chót (Deadline)
      if (task.timeType === "deadline" || task.deadlineDate) {
        const dateStr = task.deadlineDate || (task.dueDate?.includes("-") ? task.dueDate.split(" ")[0] : null);
        const timeStr = task.deadlineTime || (task.dueDate?.includes(":") ? (task.dueDate.includes(" ") ? task.dueDate.split(" ")[1] : task.dueDate) : "17:00");

        if (dateStr) {
          targetDate = new Date(`${dateStr}T${timeStr}:00`);
          notifTitle = `⏳ Hạn chót: ${task.title}`;
          notifBody = `Công việc sắp hết hạn lúc ${timeStr}! Hãy hoàn tất ngay nhé.`;
        }
      } else {
        // 2. Phân loại theo Lịch làm việc (Scheduled Time Blocking)
        const dateStr = task.dueDate?.includes("-") ? task.dueDate.split(" ")[0] : null;
        const timeStr = task.startTime || (task.dueDate?.includes(":") ? (task.dueDate.includes(" ") ? task.dueDate.split(" ")[1] : task.dueDate) : "09:00");

        if (dateStr) {
          targetDate = new Date(`${dateStr}T${timeStr}:00`);
          const timeRange = task.endTime ? `${timeStr} - ${task.endTime}` : timeStr;
          notifTitle = `🕒 Lịch làm việc: ${task.title}`;
          notifBody = `Khung giờ thực hiện: ${timeRange}. Bắt đầu làm ngay nào!`;
        } else if (task.startTime) {
          // Lên lịch trong ngày hôm nay
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          targetDate = new Date(`${todayStr}T${task.startTime}:00`);
          notifTitle = `🕒 Lịch làm việc: ${task.title}`;
          notifBody = `Đến giờ thực hiện lúc ${task.startTime}!`;
        }
      }

      if (!targetDate || targetDate.getTime() <= now.getTime()) {
        return;
      }

      const notifId = hashStringToIntegerId(task.id);

      if (isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: notifTitle,
              body: notifBody,
              schedule: { at: targetDate },
              sound: "beep.wav",
              smallIcon: "ic_stat_sketchtask",
              iconColor: "#FEF08A",
              actionTypeId: "TASK_REMINDER",
              extra: { taskId: task.id },
            },
          ],
        });
      } else {
        // Trên Web PWA: Đặt timer gọi ServiceWorker showNotification
        const msUntil = targetDate.getTime() - now.getTime();
        if (msUntil > 0 && msUntil < 86400000) {
          setTimeout(async () => {
            await showWebNotification(notifTitle, {
              body: notifBody,
              tag: `task-${task.id}`,
            });
          }, msUntil);
        }
      }
    } catch (e) {
      console.warn("Lỗi lên lịch thông báo task:", e);
    }
  },

  /**
   * Hủy lịch thông báo của một công việc
   */
  async cancelTask(taskId: string): Promise<void> {
    if (!isNativePlatform()) return;
    try {
      const notifId = hashStringToIntegerId(taskId);
      await LocalNotifications.cancel({
        notifications: [{ id: notifId }],
      });
    } catch (e) {
      console.warn("Lỗi hủy thông báo task:", e);
    }
  },

  /**
   * Hủy toàn bộ thông báo
   */
  async cancelAll(): Promise<void> {
    if (isNativePlatform()) {
      try {
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length > 0) {
          await LocalNotifications.cancel({
            notifications: pending.notifications,
          });
        }
      } catch (e) {
        console.warn("Lỗi hủy toàn bộ thông báo:", e);
      }
    }
  },

  /**
   * Đồng bộ toàn bộ lịch thông báo của các công việc chưa hoàn thành
   */
  async syncAllTasks(tasks: TaskDto[]): Promise<void> {
    const hasPerm = await this.checkPermission();
    if (!hasPerm) return;

    for (const task of tasks) {
      if (!task.completed && task.dueDate) {
        await this.scheduleTask(task);
      }
    }
  },
};
