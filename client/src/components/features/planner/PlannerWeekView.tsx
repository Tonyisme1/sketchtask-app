import React, { useState, useEffect } from "react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { formatFullDate, formatShortDayMonth } from "../../../utils/date";
import {
  normalizeTaskTimeType,
  getTaskTemporalState,
} from "../../../utils/taskSemantics";
import { TaskList } from "../shared/TaskList";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  Lock,
} from "lucide-react";

interface DayColumn {
  dateStr: string;
  dayName: string;
  dayNum: number;
  isToday: boolean;
}

interface PlannerWeekViewProps {
  weekDays: DayColumn[];
  todayStr: string;
  getTasksForDate: (dateStr: string) => TaskDto[];
  onSelectDate: (dateStr: string) => void;
  onSelectTask: (task: TaskDto) => void;
  onToggleTask: (taskId: string) => void;
  onQuickAddForDate: (dateStr: string) => void;
}

export const PlannerWeekView: React.FC<PlannerWeekViewProps> = ({
  weekDays,
  todayStr,
  getTasksForDate,
  onSelectDate,
  onSelectTask,
  onToggleTask,
  onQuickAddForDate,
}) => {
  const { setSelectedPlannerDate } = useAppStore();

  // Ngày đang được chọn active trên thanh Weekly Strip (mặc định là hôm nay nếu nằm trong tuần)
  const defaultSelected =
    weekDays.find((d) => d.isToday)?.dateStr || weekDays[0]?.dateStr || todayStr;
  const [activeDateStr, setActiveDateStr] = useState<string>(defaultSelected);

  useEffect(() => {
    const hasToday = weekDays.find((d) => d.isToday);
    if (hasToday) {
      setActiveDateStr(hasToday.dateStr);
      setSelectedPlannerDate(hasToday.dateStr);
    } else if (weekDays[0]) {
      setActiveDateStr(weekDays[0].dateStr);
      setSelectedPlannerDate(weekDays[0].dateStr);
    }
  }, [weekDays, setSelectedPlannerDate]);

  useEffect(() => {
    setSelectedPlannerDate(activeDateStr);
  }, [activeDateStr, setSelectedPlannerDate]);

  const activeDayTasks = getTasksForDate(activeDateStr);
  const activeDayObj = weekDays.find((d) => d.dateStr === activeDateStr);
  const isToday = activeDateStr === todayStr;
  const isPastDate = activeDateStr < todayStr;

  const completedCount = activeDayTasks.filter((t) => t.completed).length;
  const totalCount = activeDayTasks.length;

  return (
    <div className="w-full space-y-3.5 select-none animate-in fade-in duration-150">
      {/* 1. THANH 7 NGÀY TRONG TUẦN (WEEKLY DATE STRIP - CỰC KỲ THOÁNG ĐÃNG) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 p-1.5 sm:p-2 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[8px] shadow-[2px_2px_0px_#262626]">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDate(day.dateStr);
          const hasTasks = dayTasks.length > 0;
          const pendingCount = dayTasks.filter((t) => !t.completed).length;
          const isSelected = day.dateStr === activeDateStr;

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => {
                setActiveDateStr(day.dateStr);
              }}
              className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 rounded-[6px] border-[1.5px] transition-all relative ${
                isSelected
                  ? "bg-[#FEF08A] border-[#262626] shadow-[2px_2px_0px_#262626] -translate-y-[1px]"
                  : day.isToday
                  ? "bg-[#FFFDEB] border-[#262626] shadow-[1px_1px_0px_#262626] hover:bg-[#FEF9C3]"
                  : "bg-white border-[#D4CEBF] hover:border-[#262626] hover:bg-[#F3EFE6]"
              } active:translate-x-[0.5px] active:translate-y-[0.5px]`}
            >
              {/* Thứ */}
              <span
                className={`text-[10px] sm:text-xs font-bold ${
                  isSelected
                    ? "text-[#1C1917]"
                    : day.isToday
                    ? "text-amber-900 font-extrabold"
                    : "text-[#78716C]"
                }`}
              >
                {day.dayName}
              </span>

              {/* Số ngày */}
              <span
                className={`font-mono text-sm sm:text-lg font-bold leading-tight my-0.5 ${
                  isSelected
                    ? "text-[#1C1917] font-black"
                    : day.isToday
                    ? "text-amber-950"
                    : "text-[#1C1917]"
                }`}
              >
                {day.dayNum}
              </span>

              {/* Badge số việc hoặc chấm trạng thái */}
              <div className="flex items-center gap-1 min-h-[14px]">
                {hasTasks ? (
                  <span
                    className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none border ${
                      isSelected
                        ? "bg-[#262626] text-white border-[#262626]"
                        : pendingCount > 0
                        ? "bg-amber-100 text-amber-900 border-amber-800/40"
                        : "bg-emerald-100 text-emerald-900 border-emerald-800/40"
                    }`}
                  >
                    {dayTasks.length}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4CEBF]" />
                )}
              </div>

              {/* Chip Hôm nay */}
              {day.isToday && (
                <span className="absolute -top-1.5 right-1 text-[8px] font-bold px-1 bg-amber-400 border border-[#262626] rounded-full text-[#1C1917] leading-none">
                  Nay
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 2. KHUNG HIỂN THỊ CÔNG VIỆC CỦA NGÀY ĐANG CHỌN (RỘNG RÃI, THOÁNG ĐÃNG) */}
      <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#262626] space-y-3">
        {/* Header Ngày */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626] flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-[4px] bg-[#FEF08A] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626]">
              <CalendarIcon size={14} strokeWidth={2.4} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
                  {activeDayObj ? `${activeDayObj.dayName}, ngày ${activeDayObj.dayNum}` : activeDateStr}
                </h3>
                {isToday && (
                  <span className="text-[10px] font-bold px-2 py-0.2 bg-[#FEF08A] border border-[#262626] rounded-full text-[#1C1917]">
                    Hôm nay
                  </span>
                )}
                {isPastDate && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F3EFE6] border border-[#D4CEBF] rounded-full text-[#78716C] flex items-center gap-1">
                    <Lock size={10} strokeWidth={2.4} />
                    <span>Quá khứ</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#78716C] font-mono">
                {totalCount > 0 ? `Đã xong ${completedCount}/${totalCount} công việc` : "Chưa có công việc nào"}
              </p>
            </div>
          </div>

          {/* Nút Thao Tác Cho Ngày Này */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onSelectDate(activeDateStr)}
              className="px-2.5 py-1.5 bg-[#FAF8F3] hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[5px] text-xs font-bold text-[#1C1917] flex items-center gap-1 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
              title="Mở toàn màn hình ngày này"
            >
              <span>Xem chi tiết ngày</span>
              <ChevronRight size={13} />
            </button>
          </div>
        </div>

        {/* Banner thông báo ngày quá khứ */}
        {isPastDate && activeDayTasks.length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border-[1.5px] border-amber-300 rounded-[6px] text-xs text-amber-950 font-medium shadow-[1px_1px_0px_#262626]">
            <Lock size={13} className="text-amber-800 shrink-0" strokeWidth={2.4} />
            <span>Ngày đã qua, không thể tạo việc mới. Bạn vẫn có thể xem, hoàn thành hoặc dời ngày cho các việc cũ.</span>
          </div>
        )}

        {/* Danh Sách Công Việc Của Ngày Đang Chọn */}
        <div className="pt-1">
          <TaskList
            tasks={activeDayTasks}
            emptyMessage={isPastDate ? "Ngày trong quá khứ không có việc nào" : "Ngày này đang trống kế hoạch"}
            emptySubMessage={isPastDate ? "Ngày đã qua, không thể tạo việc mới." : "Hãy lên lịch làm việc trước để luôn chủ động."}
            onToggle={onToggleTask}
            onEdit={(task) => onSelectTask(task)}
            onDelete={() => {}}
            onClick={(task) => onSelectTask(task)}
            variant="planner"
            hideDate={true}
            baseDateStr={activeDateStr}
          />
        </div>
      </div>
    </div>
  );
};
