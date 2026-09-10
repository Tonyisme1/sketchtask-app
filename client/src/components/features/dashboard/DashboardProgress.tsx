import React from "react";
import { TrendingUp } from "lucide-react";
import { TaskDto } from "../../../types";
import { isTaskDueToday } from "../../../utils/taskSemantics";

interface DashboardProgressProps {
  tasks: TaskDto[];
}

export const DashboardProgress: React.FC<DashboardProgressProps> = ({ tasks }) => {
  const now = new Date();

  // 1. Phân loại tiến độ của công việc hôm nay
  const todayTasks = tasks.filter((t) => isTaskDueToday(t, now));
  const todayTotal = todayTasks.length;
  const todayCompleted = todayTasks.filter((t) => t.completed).length;
  const todayPending = todayTotal - todayCompleted;

  // Tính phần trăm hoàn thành trong ngày
  const completionPercentage =
    todayTotal > 0
      ? Math.round((todayCompleted / todayTotal) * 100)
      : todayTasks.length === 0 && tasks.length > 0
      ? 100
      : 0;

  return (
    <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2px_2px_0px_#262626] select-none space-y-3">
      {/* Header Tiến độ Hôm Nay */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#262626]">
        <div className="flex items-center gap-1.5">
          <TrendingUp size={15} className="text-[#1C1917]" strokeWidth={2.4} />
          <h2 className="text-xs sm:text-sm font-bold text-[#1C1917] uppercase tracking-wider font-mono">
            Tiến Độ Hôm Nay
          </h2>
        </div>

        <span className="text-xs font-mono font-black text-white px-2 py-0.5 bg-[#1C1917] border border-[#262626] rounded-[4px] shadow-[0.5px_0.5px_0px_#262626]">
          {todayTotal === 0 ? "0 VIỆC" : `${completionPercentage}% XONG`}
        </span>
      </div>

      {/* Progress Bar Nhỏ Gọn Nét Mực */}
      <div className="space-y-1">
        <div className="w-full h-3 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] overflow-hidden p-0.5 shadow-[1px_1px_0px_#262626]">
          <div
            className="h-full bg-[#1C1917] border-r border-[#262626] rounded-[2px] transition-all duration-300"
            style={{ width: `${todayTotal === 0 ? 0 : completionPercentage}%` }}
          />
        </div>
      </div>

      {/* 3 Chỉ số chi tiết */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        {/* Cần làm */}
        <div className="p-2 bg-[#FAF8F3] border border-[#262626] rounded-[4px] shadow-[0.5px_0.5px_0px_#262626] text-center">
          <span className="block text-[10px] font-bold text-[#78716C] mb-0.5 uppercase tracking-wider">
            Cần làm
          </span>
          <p className="font-mono text-base font-black text-[#1C1917]">
            {todayPending}
          </p>
        </div>

        {/* Đã xong */}
        <div className="p-2 bg-[#FAF8F3] border border-[#262626] rounded-[4px] shadow-[0.5px_0.5px_0px_#262626] text-center">
          <span className="block text-[10px] font-bold text-[#78716C] mb-0.5 uppercase tracking-wider">
            Đã xong
          </span>
          <p className="font-mono text-base font-black text-[#1C1917]">
            {todayCompleted}
          </p>
        </div>

      </div>
    </div>
  );
};
