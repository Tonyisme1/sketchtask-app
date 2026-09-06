import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { registerBackHandler } from "../../../utils/backNavigation";
import { getTagStyle } from "../../../utils/tagColors";
import { DynamicIcon } from "../core/DynamicIcon";
import { Button } from "../core/Button";
import {
  Edit3,
  Clock,
  Hourglass,
  Calendar,
  Tag,
  CheckCircle2,
  Circle,
  AlertCircle,
  CalendarDays,
  Layers,
} from "lucide-react";
import { formatFullDate, getLocalTodayStr } from "../../../utils/date";
import {
  getTaskEffectiveDate,
  getTaskEffectiveTime,
  getTaskTemporalState,
  normalizeTaskTimeType,
} from "../../../utils/taskSemantics";

// ==========================================
// COMPONENT: TaskDetailModal (Canonical Task View Dùng Chung)
// Chuẩn Visual Hierarchy:
// 1. Header trạng thái task
// 2. Nội dung task nổi bật (KHÔNG gạch ngang khi xong)
// 3. Thông tin thời gian (Scheduled / Deadline / Chỉ có ngày / Chưa ngày)
// 4. Metadata: Sổ, Nhãn, Task cha, Ưu tiên
// 5. Ngày tạo/cập nhật ở cuối
// 6. Footer: Nút Đóng & Chỉnh sửa
// ==========================================

export interface TaskDetailModalProps {
  task: TaskDto | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (task: TaskDto) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
  onEdit,
}) => {
  useScrollLock(isOpen);
  const { notebooks, tasks } = useAppStore();
  const todayStr = getLocalTodayStr();

  useEffect(() => {
    if (isOpen) {
      const unregister = registerBackHandler(() => {
        onClose();
        return true;
      });
      return () => unregister();
    }
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const assignedNotebook = notebooks.find((n) => n.id === task.notebookId);
  const parentTask = task.parentTaskId ? tasks.find((t) => t.id === task.parentTaskId) : null;

  const normalizedTimeType = normalizeTaskTimeType(task);
  const isScheduled = normalizedTimeType === "scheduled";
  const isDeadline = normalizedTimeType === "deadline";
  const rawDate = getTaskEffectiveDate(task);
  const effectiveTime = getTaskEffectiveTime(task);
  const temporalState = getTaskTemporalState(task);
  const isOverdue = temporalState === "overdue";
  const isPastScheduled = temporalState === "pastScheduled";

  // Helper format ngày tạo/cập nhật
  const formatDateTimeVN = (isoStr?: string) => {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return "";
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${hours}:${minutes} ngày ${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chi tiết công việc"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        touchAction: "none",
      }}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none mobile-scrim-enter pointer-events-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[20px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden mobile-bottom-sheet-enter max-h-[88dvh] sm:max-h-[90vh]"
      >
        {/* Grab handle cho mobile */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Đóng chi tiết công việc"
          onClick={onClose}
          className="w-full pt-1 pb-2 flex items-center justify-center cursor-pointer sm:hidden min-h-[32px] active:opacity-70 transition-opacity focus:outline-none"
        >
          <div className="w-12 h-1.5 bg-[#D4CEBF] rounded-full pointer-events-none" />
        </div>

        {/* 1. Header Trạng Thái Task */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626] shrink-0">
          <div className="flex items-center gap-2">
            {task.completed ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-emerald-400 bg-[#BBF7D0] text-emerald-950 font-bold text-xs shadow-[1px_1px_0px_#262626]">
                <CheckCircle2 size={13} className="text-emerald-700" />
                <span>Đã hoàn thành</span>
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-rose-400 bg-[#FECDD3] text-rose-950 font-bold text-xs shadow-[1px_1px_0px_#262626]">
                <AlertCircle size={13} className="text-rose-700" />
                <span>Đã quá hạn</span>
              </span>
            ) : isPastScheduled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[#262626] bg-[#F3EFE6] text-[#78716C] font-bold text-xs shadow-[1px_1px_0px_#262626]">
                <CalendarDays size={13} />
                <span>Lịch hẹn đã qua</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border border-[#262626] bg-white text-[#1C1917] font-bold text-xs shadow-[1px_1px_0px_#262626]">
                <Circle size={13} className="text-amber-500" />
                <span>Cần làm</span>
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-[#78716C] font-semibold">
            Chi tiết công việc
          </span>
        </div>

        {/* Thân Nội Dung Chi Tiết (Cuộn nội bộ) */}
        <div className="space-y-3.5 text-xs overflow-y-auto no-scrollbar py-3.5 flex-1">
          {/* 2. Tiêu Đề Công Việc: Phần Nổi Bật Nhất (Không gạch ngang khi hoàn thành) */}
          <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626]">
            <p className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider mb-1">
              Nội dung công việc
            </p>
            <h3
              className={`text-sm sm:text-base font-bold text-[#1C1917] leading-relaxed break-words whitespace-pre-wrap ${
                task.completed ? "text-[#57534E]" : ""
              }`}
            >
              {task.title}
            </h3>
          </div>

          {/* 3. Thông Tin Thời Gian */}
          <div className="p-3 bg-[#FCFBF9] border border-[#262626] rounded-[6px] space-y-2">
            <p className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">
              Thời gian thực hiện
            </p>

            {rawDate ? (
              <div className="space-y-1.5">
                {/* Ngày */}
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-[#FEF08A] border border-[#262626] flex items-center justify-center text-[#1C1917] shrink-0">
                    <Calendar size={13} strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-[#1C1917]">
                      {formatFullDate(rawDate)}
                    </span>
                    {rawDate === todayStr && (
                      <span className="ml-1.5 text-[9px] font-bold bg-[#FEF08A] text-[#1C1917] px-1.5 py-0.2 rounded border border-[#262626]">
                        Hôm nay
                      </span>
                    )}
                  </div>
                </div>

                {/* Giờ */}
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded border border-[#262626] flex items-center justify-center shrink-0 ${
                      isDeadline ? "bg-[#FECDD3] text-rose-900" : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {isDeadline ? (
                      <Hourglass size={13} strokeWidth={2.4} />
                    ) : (
                      <Clock size={13} strokeWidth={2.4} />
                    )}
                  </span>
                  <div>
                    {isScheduled && (effectiveTime || task.endTime) ? (
                      <span className="font-bold text-xs text-[#1C1917] font-mono">
                        Lịch hẹn: {effectiveTime || ""}{task.endTime ? ` - ${task.endTime}` : ""}
                      </span>
                    ) : isDeadline && effectiveTime ? (
                      <span className="font-bold text-xs text-rose-950 font-mono">
                        Hạn chót: {effectiveTime}
                      </span>
                    ) : (
                      <span className="font-medium text-xs text-[#78716C] italic">
                        Chưa chọn giờ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 py-1 text-[#78716C] italic text-xs">
                <CalendarDays size={14} />
                <span>Chưa thiết lập ngày (Nằm trong Hộp chờ)</span>
              </div>
            )}
          </div>

          {/* 4. Metadata: Sổ, Nhãn, Task Cha, Mức Độ Ưu Tiên */}
          <div className="grid grid-cols-2 gap-2">
            {/* Thuộc Sổ Tay */}
            <div className="p-2.5 bg-white border border-[#262626] rounded-[5px]">
              <p className="text-[9px] font-bold text-[#78716C] mb-1">Cuốn sổ:</p>
              {assignedNotebook ? (
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#1C1917] truncate">
                  <DynamicIcon name={assignedNotebook.icon} size={12} strokeWidth={2.4} />
                  <span className="truncate">{assignedNotebook.name}</span>
                </div>
              ) : (
                <span className="text-xs text-[#78716C] italic">Không gán sổ</span>
              )}
            </div>

            {/* Nhãn / Tag */}
            <div className="p-2.5 bg-white border border-[#262626] rounded-[5px]">
              <p className="text-[9px] font-bold text-[#78716C] mb-1">Nhãn phân loại:</p>
              {task.tag ? (
                <span
                  className={`inline-block px-1.5 py-0.5 rounded-[3px] border text-[11px] font-bold ${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).border} ${getTagStyle(task.tag).text}`}
                >
                  #{task.tag}
                </span>
              ) : (
                <span className="text-xs text-[#78716C] italic">Không có nhãn</span>
              )}
            </div>

            {/* Mức Độ Ưu Tiên */}
            <div className="p-2.5 bg-white border border-[#262626] rounded-[5px]">
              <p className="text-[9px] font-bold text-[#78716C] mb-1">Mức độ ưu tiên:</p>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                {task.priority === "high" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    <span className="text-rose-900">Gấp</span>
                  </>
                ) : task.priority === "low" ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span className="text-emerald-900">Thấp</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-amber-900">Vừa</span>
                  </>
                )}
              </div>
            </div>

            {/* Công Việc Cha (Subtask relation) */}
            <div className="p-2.5 bg-white border border-[#262626] rounded-[5px]">
              <p className="text-[9px] font-bold text-[#78716C] mb-1">Công việc cha:</p>
              {parentTask ? (
                <div className="flex items-center gap-1 font-bold text-xs text-[#1C1917] truncate">
                  <Layers size={11} className="shrink-0 text-[#78716C]" />
                  <span className="truncate">{parentTask.title}</span>
                </div>
              ) : (
                <span className="text-xs text-[#78716C] italic">Không liên kết</span>
              )}
            </div>
          </div>

          {/* 5. Thời Điểm Tạo Đặt Ở Cuối (Giảm nhấn mạnh) */}
          <div className="pt-2 border-t border-[#D4CEBF]/60 text-[10px] font-mono text-[#78716C] space-y-0.5">
            {task.createdAt && (
              <p>Tạo lúc: {formatDateTimeVN(task.createdAt)}</p>
            )}
            {task.updatedAt && task.updatedAt !== task.createdAt && (
              <p>Cập nhật lần cuối: {formatDateTimeVN(task.updatedAt)}</p>
            )}
          </div>
        </div>

        {/* 6. Footer: Nút Đóng & Nút Chỉnh Sửa */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#262626] shrink-0">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="px-4 text-xs font-bold"
          >
            Đóng
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              onEdit(task);
            }}
            className="px-5 text-xs font-bold shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5"
          >
            <Edit3 size={13} strokeWidth={2.4} />
            <span>Chỉnh sửa</span>
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
