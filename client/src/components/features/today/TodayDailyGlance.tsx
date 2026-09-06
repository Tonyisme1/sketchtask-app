import React from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto } from "../../../types";
import { getLocalTodayStr } from "../../../utils/date";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import {
  Clock,
  Hourglass,
  Flame,
  Zap,
} from "lucide-react";

interface TodayDailyGlanceProps {
  todayTasks: TaskDto[];
  scheduledTasksCount: number;
  deadlineTasksCount: number;
  completedTasksCount: number;
  totalTasksCount: number;
  progressPercent: number;
  onOpenHabitManager?: () => void;
}

export const TodayDailyGlance: React.FC<TodayDailyGlanceProps> = ({
  scheduledTasksCount,
  deadlineTasksCount,
  completedTasksCount,
  totalTasksCount,
  progressPercent,
}) => {
  const {
    user,
    habits,
    toggleHabitDay,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);
  const hour = now.getHours();

  // Lời chào theo thời gian trong ngày
  const greetingTime =
    hour < 12
      ? "Chào buổi sáng"
      : hour < 18
      ? "Chào buổi chiều"
      : "Chào buổi tối";

  const displayName =
    user.isSignedIn && user.name && !user.name.includes("Khách")
      ? `, ${user.name}`
      : "";

  // Thống kê thói quen hôm nay
  const totalHabits = habits.length;
  const completedHabitsCount = habits.filter((h) =>
    h.completedDates?.includes(todayStr)
  ).length;

  // Lời báo tình hình hôm nay (Smart Daily Briefing)
  const getDailyBriefing = () => {
    const pendingCount = totalTasksCount - completedTasksCount;
    if (totalTasksCount === 0 && totalHabits === 0) {
      return "Ngày mới! Bắt đầu lên kế hoạch cho hôm nay.";
    }
    if (pendingCount === 0 && totalTasksCount > 0) {
      return "Xuất sắc! Đã hoàn thành toàn bộ việc hôm nay.";
    }
    if (deadlineTasksCount > 0 && scheduledTasksCount > 0) {
      return `Còn ${pendingCount} việc (${scheduledTasksCount} lịch hẹn, ${deadlineTasksCount} hạn chót).`;
    }
    if (deadlineTasksCount > 0) {
      return `Có ${deadlineTasksCount} việc có hạn chót hôm nay.`;
    }
    if (scheduledTasksCount > 0) {
      return `Có ${scheduledTasksCount} lịch hẹn hôm nay.`;
    }
    return `Còn ${pendingCount} việc cần làm hôm nay.`;
  };

  const dayOfWeekNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const currentDayName = dayOfWeekNames[now.getDay()];

  return (
    <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#262626] space-y-3.5 select-none animate-in fade-in duration-150">
      {/* 1. Tiêu đề Lời Chào & Thứ ngày đối diện */}
      <div className="flex items-center justify-between gap-2.5 pb-2.5 border-b border-[#262626]">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-black text-[#1C1917] truncate">
            {greetingTime}{displayName}!
          </h2>
          <p className="text-xs text-[#57534E] mt-0.5 font-medium leading-relaxed">
            {getDailyBriefing()}
          </p>
        </div>

        {/* Thứ & Ngày đặt đối diện phía bên phải */}
        <div className="shrink-0 flex items-center gap-1.5">
          <div className="font-bold text-xs sm:text-sm px-2.5 py-1 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] text-right">
            <span className="block text-[10px] text-amber-900 font-extrabold uppercase font-mono leading-tight">
              {currentDayName}
            </span>
            <span className="font-mono font-black text-xs sm:text-sm leading-tight">
              {now.getDate()}/{now.getMonth() + 1}/{now.getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Hàng 4 Thẻ Trực Quan Tóm Tắt Nhanh (Today Pulse Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Card 1: Công việc */}
        <div className="bg-[#FEF08A]/60 border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <Zap size={13} className="text-amber-800" strokeWidth={2.4} />
              <span>Công việc</span>
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-white border border-[#262626] rounded">
              {progressPercent}%
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono text-base sm:text-lg font-black text-[#1C1917]">
              {completedTasksCount}/{totalTasksCount}
            </span>
            <span className="text-[10px] text-[#78716C] ml-1 font-medium">xong</span>
          </div>
        </div>

        {/* Card 2: Khung giờ hẹn */}
        <div className="bg-[#BAE6FD]/60 border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-sky-800" strokeWidth={2.4} />
              <span>Lịch hẹn</span>
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono text-base sm:text-lg font-black text-[#1C1917]">
              {scheduledTasksCount}
            </span>
            <span className="text-[10px] text-[#78716C] ml-1 font-medium">hẹn</span>
          </div>
        </div>

        {/* Card 3: Hạn chót */}
        <div className="bg-[#FECDD3]/60 border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <Hourglass size={13} className="text-rose-800" strokeWidth={2.4} />
              <span>Hạn chót</span>
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono text-base sm:text-lg font-black text-[#1C1917]">
              {deadlineTasksCount}
            </span>
            <span className="text-[10px] text-[#78716C] ml-1 font-medium">deadline</span>
          </div>
        </div>

        {/* Card 4: Thói quen */}
        <div className="bg-[#BBF7D0]/60 border border-[#262626] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#262626] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <Flame size={13} className="text-emerald-800" strokeWidth={2.4} />
              <span>Thói quen</span>
            </span>
          </div>
          <div className="mt-1.5">
            <span className="font-mono text-base sm:text-lg font-black text-[#1C1917]">
              {completedHabitsCount}/{totalHabits}
            </span>
            <span className="text-[10px] text-[#78716C] ml-1 font-medium">đạt</span>
          </div>
        </div>
      </div>

      {/* 3. Điểm danh thói quen nhanh hôm nay (Today Habit Check-in Strip) */}
      {totalHabits > 0 && (
        <div className="pt-2.5 border-t border-[#262626]/20 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1917]">
            <span className="flex items-center gap-1">
              <Flame size={12} className="text-orange-600" />
              <span>Thói quen ({completedHabitsCount}/{totalHabits}):</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {habits.map((habit) => {
              const isDone = habit.completedDates?.includes(todayStr);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => toggleHabitDay(habit.id, todayStr)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] border-[1.5px] transition-all shrink-0 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer ${
                    isDone
                      ? "bg-[#BBF7D0] border-[#262626] text-emerald-950 shadow-[1px_1px_0px_#262626]"
                      : "bg-white border-[#262626] text-[#1C1917] hover:bg-[#FAF8F3] shadow-[1px_1px_0px_#262626]"
                  }`}
                >
                  <HandDrawnCheckbox
                    checked={isDone}
                    onChange={() => toggleHabitDay(habit.id, todayStr)}
                  />
                  <span className={`text-xs font-bold ${isDone ? "line-through opacity-80" : ""}`}>
                    {habit.name}
                  </span>
                  {habit.streak && habit.streak > 0 ? (
                    <span className="text-[9px] font-mono font-black text-orange-700 bg-orange-100 px-1 py-0.2 rounded border border-orange-300">
                      <span className="inline-flex items-center gap-0.5">
                        <Flame size={9} strokeWidth={2.4} />
                        {habit.streak}
                      </span>
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
