import React, { useState } from "react";
import { TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { HandDrawnCheckbox } from "../../ui/core/HandDrawnCheckbox";
import {
  Clock,
  Plus,
  Edit3,
  Trash2,
  Layers,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Eye,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import {
  getTaskEffectiveTime,
  getTaskTemporalState,
} from "../../../utils/taskSemantics";
import { getTagStyle } from "../../../utils/tagColors";

interface TodayScheduleNotesProps {
  scheduledTasks: TaskDto[];
  onToggle: (taskId: string) => void;
  onEdit: (task: TaskDto) => void;
  onDelete: (taskId: string) => void;
  onAddSubtask?: (parentTask: TaskDto) => void;
  onClick: (task: TaskDto) => void;
  activeTaskId?: string | null;
  title?: string;
  hideNotebookBadge?: boolean;
}

export const TodayScheduleNotes: React.FC<TodayScheduleNotesProps> = ({
  scheduledTasks,
  onToggle,
  onEdit,
  onDelete,
  onAddSubtask,
  onClick,
  activeTaskId,
  hideNotebookBadge = false,
  title = "Lịch hẹn",
}) => {
  const { notebooks, tasks } = useAppStore();
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);

  if (scheduledTasks.length === 0) {
    return null;
  }

  // Sắp xếp các task lịch hẹn theo giờ (sáng -> tối)
  const sortedTasks = [...scheduledTasks].sort((a, b) => {
    const timeA = getTaskEffectiveTime(a) || "99:99";
    const timeB = getTaskEffectiveTime(b) || "99:99";
    return timeA.localeCompare(timeB);
  });

  const toggleSubtasks = (taskId: string) => {
    setExpandedSubtasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  return (
    <section className="space-y-2 animate-in fade-in duration-150 select-none">
      {/* Tiêu đề nhóm Lịch Hẹn Tinh Gọn */}
      <div className="flex items-center justify-between pb-1 border-b border-[#262626]/20 gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917] min-w-0">
          <Clock size={14} className="text-amber-800 shrink-0" strokeWidth={2.4} />
          <span className="truncate">{title}</span>
          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold shrink-0">
            {sortedTasks.length}
          </span>
        </div>
        <span className="hidden sm:inline text-[10px] font-mono text-[#78716C] shrink-0">
          <span className="inline-flex items-center gap-1">
            Theo dòng thời gian
            <ArrowRight size={11} strokeWidth={2.4} />
          </span>
        </span>
      </div>

      {/* Lưới các thẻ Note Lịch Hẹn Gọn Gàng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {sortedTasks.map((task, idx) => {
          const notebook = notebooks.find((n) => n.id === task.notebookId);
          const temporal = getTaskTemporalState(task);
          const isPast = temporal === "pastScheduled";
          const isSelected = Boolean(activeTaskId && task.id === activeTaskId);

          // Tìm danh sách việc con trực thuộc của lịch hẹn này
          const childTasks = tasks.filter((t) => t.parentTaskId === task.id);
          const hasChildren = childTasks.length > 0;
          const completedChildCount = childTasks.filter((c) => c.completed).length;
          const isExpanded = Boolean(expandedSubtasks[task.id]);

          // Góc nghiêng nhẹ tự nhiên của Note
          const tiltClass =
            idx % 3 === 0
              ? "-rotate-[0.5deg]"
              : idx % 3 === 1
              ? "rotate-[0.5deg]"
              : "rotate-0";

          // Nền và viền Note
          let cardBg = isSelected ? "bg-[#FFFDEB]" : "bg-[#FEF9C3]/80"; // Vàng nhạt note hẹn
          let badgeBg = "bg-[#FEF08A] text-amber-950 border-[#262626]";

          if (task.completed) {
            cardBg = isSelected ? "bg-[#DCFCE7]" : "bg-[#DCFCE7]/70 opacity-80";
            badgeBg = "bg-[#BBF7D0] text-emerald-950 border-[#262626]";
          } else if (isPast && !isSelected) {
            cardBg = "bg-[#FFFBF5]";
            badgeBg = "bg-[#FED7AA] text-[#7C2D12] border-[#262626]";
          }

          const effectiveTime = getTaskEffectiveTime(task);
          const timeLabel = effectiveTime
            ? `${effectiveTime}${task.endTime ? ` - ${task.endTime}` : ""}`
            : "Chưa đặt giờ";

          return (
            <div
              key={task.id}
              data-task-card="true"
              data-task-id={task.id}
              onClick={() => onClick(task)}
              className={`${cardBg} ${tiltClass} border-[1.5px] border-[#262626] rounded-[6px] p-2.5 transition-all cursor-pointer flex flex-col justify-between group min-h-[92px] ${
                isSelected
                  ? "ring-2 ring-[#262626] shadow-[4px_4px_0px_#262626] -translate-y-[1px] z-20"
                  : "shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] hover:-translate-y-[0.5px]"
              }`}
            >
              <div className="space-y-1.5">
                {/* Dòng 1: Mốc giờ hẹn, Badge Lịch hẹn đã qua, Badge việc con & Checkbox */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1 flex-wrap">
                    <div
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border-[1.5px] font-mono text-[11px] font-black ${badgeBg} shadow-[1px_1px_0px_#262626]`}
                    >
                      <Clock size={11} strokeWidth={2.6} className={isPast && !task.completed ? "text-[#9A3412]" : "text-amber-900"} />
                      <span>{timeLabel}</span>
                    </div>

                    {/* Badge Trạng thái Lịch Hẹn Đã Qua */}
                    {isPast && !task.completed && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[3px] border-[1.5px] border-[#262626] bg-[#FED7AA] text-[#7C2D12] font-bold text-[10px] shadow-[1px_1px_0px_#262626]">
                        <AlertCircle size={10} strokeWidth={2.4} className="text-[#9A3412]" />
                        <span>Đã qua</span>
                      </span>
                    )}

                    {/* Badge số lượng việc con */}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubtasks(task.id);
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[3px] bg-white border-[1.5px] border-[#262626] text-[10px] font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] hover:bg-amber-50 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                        title="Xem danh sách việc con"
                      >
                        <Layers size={10} className="text-amber-800" />
                        <span>{completedChildCount}/{childTasks.length}</span>
                        {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    )}
                  </div>

                  <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <HandDrawnCheckbox
                      checked={task.completed}
                      onChange={() => onToggle(task.id)}
                    />
                  </div>
                </div>

                {/* Dòng 2: Tiêu đề Note */}
                <h4
                  className={`font-bold text-xs text-[#1C1917] leading-snug break-words line-clamp-2 ${
                    task.completed ? "text-[#78716C]" : ""
                  }`}
                >
                  {task.title}
                </h4>

                {/* Dòng 2.1: Mini Checklist việc con (nếu có và đang mở) */}
                {hasChildren && isExpanded && (
                  <div
                    className="mt-1.5 pt-1.5 border-t border-[#262626]/20 space-y-1 animate-in fade-in duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="text-[10px] font-bold text-[#78716C] block uppercase tracking-wider">
                      Việc con trực thuộc:
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto pr-0.5">
                      {childTasks.map((child) => (
                        <div
                          key={child.id}
                          className="flex items-center gap-1.5 p-1 bg-white/90 border-[1.5px] border-[#262626] rounded-[4px] text-[10px] shadow-[0.5px_0.5px_0px_#262626]"
                        >
                          <HandDrawnCheckbox
                            checked={child.completed}
                            onChange={() => onToggle(child.id)}
                          />
                          <span
                            className={`truncate flex-1 ${
                              child.completed
                                ? "text-[#78716C]"
                                : "font-medium text-[#1C1917]"
                            }`}
                          >
                            {child.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dòng 3: Metadata chân note & Actions */}
              <div className="mt-2 pt-1.5 border-t border-[#262626]/20 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1 overflow-hidden min-w-0 pr-1">
                  {notebook && !hideNotebookBadge && (
                    <span className="px-1 py-0.2 bg-white/90 border border-[#262626] rounded-[2px] font-bold text-[#57534E] truncate">
                      {notebook.name}
                    </span>
                  )}
                  {task.tag && (
                    <span
                      style={getTagStyle(task.tag)}
                      className="px-1 py-0.2 border border-[#262626] rounded-[2px] font-bold truncate"
                    >
                      #{task.tag}
                    </span>
                  )}
                </div>

                <div
                  className="relative shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setOpenMenuTaskId(openMenuTaskId === task.id ? null : task.id)}
                    className="w-5 h-5 rounded-[3px] bg-white hover:bg-[#F3EFE6] border-[1.5px] border-[#262626] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                    title="Tùy chọn"
                  >
                    <MoreVertical size={11} strokeWidth={2.4} />
                  </button>

                  {openMenuTaskId === task.id && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] z-50 p-1 space-y-0.5 animate-in fade-in zoom-in-95 text-xs text-left">
                      {/* 1. Thêm con */}
                      {onAddSubtask && !task.completed && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuTaskId(null);
                            onAddSubtask(task);
                          }}
                          className="w-full px-2 py-1 text-left font-bold text-[#1C1917] hover:bg-[#BBF7D0] rounded-[3px] flex items-center gap-1.5 transition-colors"
                        >
                          <Plus size={12} strokeWidth={2.4} />
                          <span>Thêm con</span>
                        </button>
                      )}

                      {/* 2. Xem chi tiết */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuTaskId(null);
                          onClick(task);
                        }}
                        className="w-full px-2 py-1 text-left font-bold text-[#1C1917] hover:bg-[#BAE6FD] rounded-[3px] flex items-center gap-1.5 transition-colors"
                      >
                        <Eye size={12} strokeWidth={2.2} />
                        <span>Xem chi tiết</span>
                      </button>

                      {/* 3. Sửa việc */}
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuTaskId(null);
                          onEdit(task);
                        }}
                        className="w-full px-2 py-1 text-left font-bold text-[#1C1917] hover:bg-[#FEF08A] rounded-[3px] flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 size={11} strokeWidth={2.2} />
                        <span>Chỉnh sửa</span>
                      </button>
                      <div className="border-t border-[#262626]/20 my-0.5" />
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenuTaskId(null);
                          onDelete(task.id);
                        }}
                        className="w-full px-2 py-1 text-left font-bold text-rose-700 hover:bg-rose-50 rounded-[3px] flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={11} strokeWidth={2.2} />
                        <span>Xóa việc</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
