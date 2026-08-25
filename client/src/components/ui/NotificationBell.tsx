import React, { useState, useRef, useEffect, useMemo } from "react";
import { useAppStore } from "../../stores/appStore";
import {
  Bell,
  CheckCheck,
  Calendar,
  Flame,
  Sparkles,
  Trophy,
  AlertCircle,
  X,
  BellOff,
} from "lucide-react";

import { notificationService } from "../../services/notificationService";

// ==========================================
// COMPONENT: NotificationBell (Thông Báo Thực Từ Dữ Liệu Ứng Dụng)
// ==========================================

export interface AppNotification {
  id: string;
  type: "task" | "habit" | "streak" | "system" | "overdue";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// === Tạo timestamp dạng "X giờ trước / vừa xong"
const relativeTime = (minutesAgo: number) => {
  if (minutesAgo < 1) return "Vừa xong";
  if (minutesAgo < 60) return `${minutesAgo} phút trước`;
  const h = Math.floor(minutesAgo / 60);
  return `${h} giờ trước`;
};

export const NotificationBell: React.FC = () => {
  const { tasks, habits } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hasSystemPerm, setHasSystemPerm] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Kiểm tra quyền thông báo khi mở popover
  useEffect(() => {
    notificationService.checkPermission().then((granted) => {
      setHasSystemPerm(granted);
    });
  }, [isOpen]);

  const handleRequestSystemPermission = async () => {
    const granted = await notificationService.requestPermission();
    setHasSystemPerm(granted);
    if (granted) {
      notificationService.sendInstant(
        "🎉 SketchTask",
        "Đã bật thông báo thành công! Bạn sẽ nhận được nhắc nhở khi đến giờ hẹn."
      );
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];

  // === SINH THÔNG BÁO ĐỘNG TỪ DỮ LIỆU THẬT ===
  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    // 1. Việc hôm nay chưa xong
    const todayPending = tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate.startsWith(todayStr)
    );
    if (todayPending.length > 0) {
      list.push({
        id: "task-today",
        type: "task",
        title: `${todayPending.length} việc cần làm hôm nay`,
        message:
          todayPending.length === 1
            ? `"${todayPending[0].title}" đang chờ bạn hoàn thành.`
            : `Bao gồm: "${todayPending[0].title}"${todayPending.length > 1 ? ` và ${todayPending.length - 1} việc khác.` : "."}`,
        time: relativeTime(0),
        read: false,
      });
    }

    // 2. Việc trễ hạn (quá hôm nay mà chưa xong)
    const overdue = tasks.filter(
      (t) => !t.completed && t.dueDate && t.dueDate < todayStr
    );
    if (overdue.length > 0) {
      list.push({
        id: "task-overdue",
        type: "overdue",
        title: `${overdue.length} việc đã quá hạn`,
        message: `"${overdue[0].title}" đã quá hạn rồi — hãy hoàn thành hoặc dời ngày nhé!`,
        time: relativeTime(30),
        read: false,
      });
    }

    // 3. Thói quen có streak cao — khích lệ
    const longStreakHabits = habits.filter((h) => (h.streak ?? 0) >= 3);
    if (longStreakHabits.length > 0) {
      const best = longStreakHabits.sort(
        (a, b) => (b.streak ?? 0) - (a.streak ?? 0)
      )[0];
      list.push({
        id: `habit-streak-${best.id}`,
        type: "streak",
        title: `🔥 Chuỗi ${best.streak} ngày: "${best.name}"`,
        message: `Bạn đang duy trì thói quen "${best.name}" được ${best.streak} ngày liên tiếp — tuyệt vời!`,
        time: relativeTime(60),
        read: false,
      });
    }

    // 4. Thói quen chưa điểm danh hôm nay
    const habitsDueToday = habits.filter((h) => {
      const lastDone = h.completedDates?.[h.completedDates.length - 1] ?? "";
      return lastDone !== todayStr;
    });
    if (habitsDueToday.length > 0 && habitsDueToday.length <= habits.length) {
      list.push({
        id: "habit-due",
        type: "habit",
        title: `${habitsDueToday.length} thói quen chờ điểm danh`,
        message: `Đừng quên điểm danh "${habitsDueToday[0].name}" hôm nay để giữ chuỗi streak nhé!`,
        time: relativeTime(120),
        read: false,
      });
    }

    // 5. Chào mừng lần đầu (khi không có dữ liệu gì)
    if (tasks.length === 0 && habits.length === 0) {
      list.push({
        id: "welcome",
        type: "system",
        title: "Chào mừng đến SketchTask! ✍️",
        message:
          "Bắt đầu bằng cách thêm công việc đầu tiên hoặc thử dữ liệu mẫu trong Cài đặt → Đồng bộ.",
        time: "Hôm nay",
        read: false,
      });
    }

    // 6. Ứng dụng hoạt động offline
    list.push({
      id: "offline-ready",
      type: "system",
      title: "Sẵn sàng ngoại tuyến ☁️",
      message:
        "SketchTask chạy hoàn hảo ngay cả khi không có internet. Dữ liệu của bạn luôn an toàn trên thiết bị.",
      time: "Hôm nay",
      read: true,
    });

    // Lọc bỏ những cái đã bị dismiss
    return list.filter((n) => !dismissed.has(n.id));
  }, [tasks, habits, todayStr, dismissed]);

  // Cập nhật read từ readIds
  const displayNotifications = notifications.map((n) => ({
    ...n,
    read: n.read || readIds.has(n.id),
  }));

  const unreadCount = displayNotifications.filter((n) => !n.read).length;

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleMarkAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      return next;
    });
  };

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set([...prev, id]));
  };

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const getNotifIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "task":
        return <Calendar size={14} className="text-amber-700" />;
      case "overdue":
        return <AlertCircle size={14} className="text-red-600" />;
      case "habit":
        return <Flame size={14} className="text-orange-600" />;
      case "streak":
        return <Trophy size={14} className="text-amber-600" />;
      case "system":
        return <Sparkles size={14} className="text-emerald-700" />;
    }
  };

  const getNotifBg = (type: AppNotification["type"]) => {
    switch (type) {
      case "task":
        return "bg-[#FEF08A]";
      case "overdue":
        return "bg-[#FECDD3]";
      case "habit":
        return "bg-[#FED7AA]";
      case "streak":
        return "bg-[#FDE68A]";
      case "system":
        return "bg-[#BBF7D0]";
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={handleOpen}
        title="Thông báo"
        className="relative w-8 h-8 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-center text-[#1C1917] hover:-translate-y-[0.5px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none"
      >
        <Bell size={16} strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center border border-[#262626] shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Danh Sách Thông Báo */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[290px] max-w-[calc(100vw-24px)] bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 p-2.5 space-y-2 animate-in fade-in zoom-in-95 text-xs text-[#1C1917] select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
            <span className="font-bold text-xs flex items-center gap-1.5 text-[#1C1917]">
              <Bell size={13} strokeWidth={2.2} />
              <span>THÔNG BÁO</span>
              {displayNotifications.length > 0 && (
                <span className="font-mono text-[10px] text-[#78716C]">
                  ({displayNotifications.length})
                </span>
              )}
            </span>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  title="Đánh dấu tất cả đã đọc"
                  className="text-[10px] text-[#78716C] hover:text-[#1C1917] font-bold px-1.5 py-0.5 bg-white border border-[#D4CEBF] rounded flex items-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px]"
                >
                  <CheckCheck size={11} />
                  <span>Đã đọc</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#78716C] hover:text-[#1C1917] font-bold p-0.5"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Banner Bật Thông Báo Ngoài Màn Hình (Nếu chưa cấp quyền) */}
          {!hasSystemPerm && (
            <div className="p-2 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[#1C1917] leading-tight">
                  Nhận nhắc việc ra màn hình khóa
                </p>
                <p className="text-[9.5px] text-[#78716C] leading-tight mt-0.5">
                  Chuông & rung đúng giờ hẹn
                </p>
              </div>
              <button
                type="button"
                onClick={handleRequestSystemPermission}
                className="px-2 py-1 bg-white border border-[#262626] rounded text-[10px] font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none whitespace-nowrap"
              >
                Bật ngay
              </button>
            </div>
          )}

          {/* Danh Sách Thông Báo */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
            {displayNotifications.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-[#78716C]">
                <BellOff size={24} strokeWidth={1.5} className="opacity-40" />
                <p className="text-[11px] font-medium">Tất cả đã được đọc!</p>
                <p className="text-[10px]">Bạn đang rất ngăn nắp ✓</p>
              </div>
            ) : (
              displayNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-2 rounded-[4px] border transition-all flex items-start gap-2 ${
                    notif.read
                      ? "bg-white opacity-65 border-[#D4CEBF]"
                      : "bg-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-[3px] border border-[#262626] flex items-center justify-center shrink-0 mt-0.5 ${getNotifBg(
                      notif.type
                    )}`}
                  >
                    {getNotifIcon(notif.type)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`font-bold text-[11px] text-[#1C1917] truncate ${!notif.read ? "" : "font-medium"}`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] font-mono text-[#78716C] shrink-0">
                        {notif.time}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#78716C] leading-snug mt-0.5 line-clamp-2">
                      {notif.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDismiss(notif.id)}
                    title="Bỏ qua"
                    className="text-[#D4CEBF] hover:text-red-500 p-0.5 shrink-0"
                  >
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
