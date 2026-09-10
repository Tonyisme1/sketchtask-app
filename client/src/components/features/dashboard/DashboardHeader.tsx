import React from "react";
import { Calendar, Plus, BookOpen, Sparkles } from "lucide-react";
import { UserProfile } from "../../../stores/appStore";
import { parseDateString, getLocalTodayStr } from "../../../utils/date";
import { TabKey } from "../../../types";

interface DashboardHeaderProps {
  user?: UserProfile;
  onNavigateTab?: (tab: TabKey) => void;
  onOpenQuickAdd?: () => void;
}

// Helper lấy thứ và ngày tháng tiếng Việt
const getFormattedVietnameseDate = (todayStr: string) => {
  const dateObj = parseDateString(todayStr);
  const weekdays = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];
  const dayName = weekdays[dateObj.getDay()];
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const yyyy = dateObj.getFullYear();
  return `${dayName}, ${dd}/${mm}/${yyyy}`;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onNavigateTab,
}) => {
  const now = new Date();
  const currentHour = now.getHours();
  const todayStr = getLocalTodayStr(now);
  const formattedDate = getFormattedVietnameseDate(todayStr);

  // Lời chào theo thời gian trong ngày
  let greeting = "Chào buổi sáng";
  if (currentHour >= 12 && currentHour < 18) {
    greeting = "Chào buổi chiều";
  } else if (currentHour >= 18) {
    greeting = "Chào buổi tối";
  }

  const displayName = user?.isSignedIn && user.name ? user.name : "";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#262626] select-none">
      {/* 1. Lời chào và mô tả ngắn */}
      <div className="min-w-0">
        <h1 className="font-black text-lg sm:text-xl md:text-2xl text-[#1C1917] tracking-tight truncate">
          {greeting}{displayName ? `, ${displayName}` : "!"}
        </h1>
        <p className="text-xs sm:text-sm text-[#78716C] truncate mt-0.5 font-medium flex items-center gap-1.5">
          <Sparkles size={12} className="text-[#1C1917] shrink-0" />
          <span>Vững vàng từng bước, hoàn thành trọn vẹn mục tiêu ngày mới</span>
        </p>
      </div>

      {/* 2. Cụm Phải: Phím Tắt Nhanh & Badge Ngày */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Nút Tạo Việc Nhanh */}
        <button
          type="button"
          onClick={() => onNavigateTab?.("tasks")}
          className="h-8 px-2.5 bg-[#1C1917] hover:bg-[#262626] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center gap-1 text-xs font-bold text-white active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          title="Tạo việc mới hôm nay"
        >
          <Plus size={13} strokeWidth={2.6} />
          <span>Việc mới</span>
        </button>

        {/* Nút Viết Nhật Ký Nhanh */}
        <button
          type="button"
          onClick={() => onNavigateTab?.("journal")}
          className="h-8 px-2.5 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center gap-1 text-xs font-bold text-[#1C1917] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          title="Mở nhật ký hôm nay"
        >
          <BookOpen size={13} strokeWidth={2.2} className="text-[#1C1917]" />
          <span className="hidden sm:inline">Nhật ký</span>
        </button>

        {/* Badge Ngày Hiện Tại */}
        <div className="flex items-center gap-1.5 px-2.5 h-8 bg-[#FAF8F3] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] shrink-0">
          <Calendar size={13} strokeWidth={2.4} className="text-[#78716C]" />
          <span className="text-xs font-mono font-bold text-[#1C1917]">
            {formattedDate}
          </span>
        </div>
      </div>
    </div>
  );
};
