import { LocalNotifications } from "@capacitor/local-notifications";
import { TaskDto } from "../types";

// ==========================================
// SERVICE: System & Push Notification Engine (Android & Web Desktop)
// ==========================================

export const isNativePlatform = (): boolean => {
  return typeof (window as any).Capacitor !== "undefined" && (window as any).Capacitor.isNativePlatform();
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

export const notificationService = {
  /**
   * Kiểm tra quyền gửi thông báo hiện tại
   */
  async checkPermission(): Promise<boolean> {
    try {
      if (isNativePlatform()) {
        const perm = await LocalNotifications.checkPermissions();
        return perm.display === "granted";
      } else if ("Notification" in window) {
        return Notification.permission === "granted";
      }
      return false;
    } catch {
      return false;
    }
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
   * Gửi thông báo ngay lập tức (Instant Notification)
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
              smallIcon: "ic_launcher_foreground",
              iconColor: "#FFE066",
            },
          ],
        });
      } else if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, {
          body,
          icon: "/pwa-192x192.svg",
          badge: "/favicon.svg",
        });
      }
    } catch (e) {
      console.warn("Lỗi gửi thông báo tức thì:", e);
    }
  },

  /**
   * Lên lịch thông báo ngoài màn hình cho một công việc khi đến hạn
   */
  async scheduleTask(task: TaskDto): Promise<void> {
    if (task.completed || !task.dueDate) {
      await this.cancelTask(task.id);
      return;
    }

    const hasPerm = await this.checkPermission();
    if (!hasPerm) return;

    try {
      // Parse ngày và giờ của dueDate
      let targetDate: Date;
      if (task.dueDate.includes("T") || task.dueDate.includes(":")) {
        targetDate = new Date(task.dueDate);
      } else {
        // Nếu chỉ có ngày YYYY-MM-DD -> Mặc định nhắc lúc 09:00 sáng
        targetDate = new Date(`${task.dueDate}T09:00:00`);
      }

      const now = new Date();
      // Nếu thời gian hẹn đã qua thì không lên lịch
      if (targetDate.getTime() <= now.getTime()) {
        return;
      }

      const notifId = hashStringToIntegerId(task.id);

      if (isNativePlatform()) {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title: `⏰ Nhắc việc: ${task.title}`,
              body: task.description || "Đến giờ thực hiện công việc rồi, hãy kiểm tra danh sách của bạn nhé!",
              schedule: { at: targetDate },
              sound: "beep.wav",
              smallIcon: "ic_launcher_foreground",
              iconColor: "#FFE066",
              actionTypeId: "TASK_REMINDER",
              extra: { taskId: task.id },
            },
          ],
        });
      } else {
        // Trên Web: Nếu đang mở tab, dùng setTimeout nếu trong ngày
        const msUntil = targetDate.getTime() - now.getTime();
        if (msUntil > 0 && msUntil < 86400000) {
          setTimeout(() => {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(`⏰ Nhắc việc: ${task.title}`, {
                body: task.description || "Đến giờ thực hiện công việc của bạn rồi!",
                icon: "/pwa-192x192.svg",
              });
            }
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
          await LocalNotifications.cancel({ notifications: pending.notifications });
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

