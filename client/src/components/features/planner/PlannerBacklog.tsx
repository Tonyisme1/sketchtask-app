import React, { useState } from "react";
import { createPortal } from "react-dom";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { DynamicIcon } from "../../ui/core/DynamicIcon";
import { getTagStyle } from "../../../utils/tagColors";
import { CalendarMonth } from "../../ui/pickers/time/CalendarMonth";
import { Package, Calendar as CalendarIcon, X, CheckCircle2, CalendarPlus } from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";

export interface PlannerBacklogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskDto[];
  onScheduleToDate: (taskId: string, targetDateStr: string) => void;
  onEdit: (task: TaskDto) => void;
}

export const PlannerBacklog: React.FC<PlannerBacklogProps> = ({
  isOpen,
  onClose,
  tasks,
  onScheduleToDate,
  onEdit,
}) => {
  const { notebooks } = useAppStore();

  // Task đang được mở mini calendar để chọn ngày
  const [schedulingTask, setSchedulingTask] = useState<TaskDto | null>(null);

  // Month navigation cho mini calendar
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  // Khóa cuộn khi mở modal chọn ngày
  useScrollLock(Boolean(schedulingTask));

  if (!isOpen) return null;

  const handleOpenDatePicker = (task: TaskDto) => {
    const d = new Date();
    setCalYear(d.getFullYear());
    setCalMonth(d.getMonth());
    setSchedulingTask(task);
  };

  const handleSelectDateForTask = (targetDateStr: string) => {
    if (schedulingTask) {
      onScheduleToDate(schedulingTask.id, targetDateStr);
      setSchedulingTask(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-3 animate-in slide-in-from-top-2 duration-150 select-none">
      {/* Header Hộp chờ */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-amber-800" strokeWidth={2.4} />
          <h4 className="font-bold text-xs sm:text-sm text-[#1C1917]">
            Hộp chờ (Việc chưa quyết định ngày - {tasks.length})
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-6 h-6 rounded-[4px] bg-white hover:bg-rose-50 border-[1.5px] border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all shadow-[1px_1px_0px_#262626]"
          aria-label="Đóng hộp chờ"
        >
          <X size={13} strokeWidth={2.4} />
        </button>
      </div>

      {/* Danh sách Task Trong Hộp Chờ */}
      {tasks.length === 0 ? (
        <div className="py-8 text-center space-y-1.5">
          <div className="inline-flex p-2 rounded-full bg-[#BBF7D0] border border-[#262626] text-emerald-900 mb-1">
            <CheckCircle2 size={20} strokeWidth={2.4} />
          </div>
          <p className="text-xs sm:text-sm font-bold text-[#1C1917]">
            Hộp chờ trống
          </p>
          <p className="text-xs text-[#78716C]">
            Tất cả công việc đã được quyết định ngày thực hiện!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar pr-0.5">
          {tasks.map((task) => {
            const nb = notebooks.find((n) => n.id === task.notebookId);
            return (
              <div
                key={task.id}
                className="p-2.5 sm:p-3 bg-white border-[1.5px] border-[#262626] rounded-[5px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between gap-2.5 transition-all hover:shadow-[2px_2px_0px_#262626]"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-xs sm:text-sm text-[#1C1917] truncate block">
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {nb && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.2 rounded border border-[#262626] flex items-center gap-0.5 truncate max-w-[120px]"
                        style={{ backgroundColor: nb.color || "#FEF08A" }}
                      >
                        <DynamicIcon name={nb.icon} size={10} strokeWidth={2.2} />
                        <span className="truncate">{nb.name}</span>
                      </span>
                    )}
                    {task.tag && (
                      <span
                        className={`${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} text-[10px] font-bold px-1.5 py-0.2 rounded border ${getTagStyle(task.tag).border}`}
                      >
                        #{task.tag}
                      </span>
                    )}
                    {task.priority === "high" && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Gấp
                        </span>
                      </span>
                    )}
                    {task.priority === "medium" && (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Vừa
                        </span>
                      </span>
                    )}
                    {task.priority === "low" && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Thấp
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Nút Chọn Ngày Duy Nhất */}
                <button
                  type="button"
                  onClick={() => handleOpenDatePicker(task)}
                  className="px-2.5 py-1.5 text-xs font-bold text-[#1C1917] bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] flex items-center gap-1 shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none shrink-0 transition-all"
                  title="Chọn ngày đưa vào lịch trình"
                >
                  <CalendarPlus size={13} strokeWidth={2.4} />
                  <span>Chọn ngày</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* MINI CALENDAR MODAL: CHỌN NGÀY CHO TASK CHỜ */}
      {schedulingTask && createPortal(
        <div
          onClick={() => setSchedulingTask(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000001,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Chọn ngày xếp lịch"
          className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[18px] sm:rounded-[8px] p-4 shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] space-y-3 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
              <div className="flex items-center gap-1.5 min-w-0">
                <CalendarIcon size={16} className="text-[#1C1917] shrink-0" />
                <h4 className="font-bold text-xs sm:text-sm text-[#1C1917] truncate">
                  Xếp lịch: {schedulingTask.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingTask(null)}
                className="w-6 h-6 rounded-[4px] bg-white hover:bg-rose-50 border-[1.5px] border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none shadow-[1px_1px_0px_#262626] shrink-0"
              >
                <X size={13} strokeWidth={2.4} />
              </button>
            </div>

            {/* Mini Calendar khóa toàn bộ ngày quá khứ */}
            <CalendarMonth
              selectedDate=""
              onSelectDate={handleSelectDateForTask}
              viewYear={calYear}
              viewMonth={calMonth}
              onPrevMonth={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear((y) => y - 1);
                } else {
                  setCalMonth((m) => m - 1);
                }
              }}
              onNextMonth={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear((y) => y + 1);
                } else {
                  setCalMonth((m) => m + 1);
                }
              }}
              disablePastDates={true}
            />

            <p className="text-[11px] text-[#78716C] text-center italic">
              * Chỉ cho phép chọn từ ngày hôm nay trở về sau. Ngày quá khứ đã được khóa.
            </p>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};
