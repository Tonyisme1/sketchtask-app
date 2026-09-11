import React, { useState, useEffect, useRef } from "react";
import { JournalEntryDto, TaskDto } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { JournalTaskLinkPopover } from "./JournalTaskLinkPopover";
import {
  Trash2,
  Link as LinkIcon,
  CheckSquare,
  Square,
  AlertCircle,
  X,
} from "lucide-react";

export interface JournalEntryCardProps {
  entry: JournalEntryDto;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
  isFocused?: boolean;
  showTime?: boolean;
  onAddNewAfter?: (currentEntryId: string) => void;
  onFocusPrev?: (currentEntryId: string) => void;
  onFocusNext?: (currentEntryId: string) => void;
}

export const JournalEntryCard: React.FC<JournalEntryCardProps> = ({
  entry,
  onDelete,
  autoFocus = false,
  isFocused = false,
  showTime = true,
  onAddNewAfter,
  onFocusPrev,
  onFocusNext,
}) => {
  const { tasks, updateJournalEntry, openTaskDetail } = useAppStore();
  const [content, setContent] = useState(entry.content);
  const [time, setTime] = useState(entry.time);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isTaskPickerOpen, setIsTaskPickerOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setContent(entry.content);
    setTime(entry.time);
  }, [entry.content, entry.time]);

  // Focus & đặt con trỏ ở cuối dòng
  useEffect(() => {
    if ((autoFocus || isFocused) && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [autoFocus, isFocused]);

  // Tự động điều chỉnh chiều cao textarea mượt mà theo nội dung
  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.max(26, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [content]);

  const triggerAutoSave = (newContent: string, newTime: string, newLinkedTaskId?: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateJournalEntry(entry.id, {
        content: newContent.trim(),
        time: newTime.trim() || entry.time,
        linkedTaskId: newLinkedTaskId,
      });
    }, 300);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutoSave(val, time, entry.linkedTaskId);
  };

  const handleContentBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    const trimmed = content.trim();
    if (!trimmed) {
      onDelete(entry.id);
    } else {
      updateJournalEntry(entry.id, {
        content: trimmed,
        time,
        linkedTaskId: entry.linkedTaskId,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 1. Enter (không Shift): Lưu tức thì & tạo dòng mới ngay phía dưới
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
      const trimmed = content.trim();
      if (trimmed) {
        updateJournalEntry(entry.id, {
          content: trimmed,
          time,
          linkedTaskId: entry.linkedTaskId,
        });
      }
      onAddNewAfter?.(entry.id);
      return;
    }

    // 2. Backspace khi dòng đang trống: Xóa dòng và focus về dòng trước
    if (e.key === "Backspace" && content === "") {
      e.preventDefault();
      onFocusPrev?.(entry.id);
      onDelete(entry.id);
      return;
    }

    // 3. ArrowUp: Chuyển focus lên dòng trước nếu con trỏ ở đầu
    if (e.key === "ArrowUp") {
      const el = textareaRef.current;
      if (el && el.selectionStart === 0 && el.selectionEnd === 0) {
        e.preventDefault();
        onFocusPrev?.(entry.id);
      }
    }

    // 4. ArrowDown: Chuyển focus xuống dòng kế tiếp nếu con trỏ ở cuối
    if (e.key === "ArrowDown") {
      const el = textareaRef.current;
      if (el && el.selectionStart === content.length && el.selectionEnd === content.length) {
        e.preventDefault();
        onFocusNext?.(entry.id);
      }
    }
  };

  const handleTimeBlur = () => {
    setIsEditingTime(false);
    let validTime = time.trim();
    const parts = validTime.split(":");
    if (parts.length === 2) {
      let hh = parseInt(parts[0], 10);
      let mm = parseInt(parts[1], 10);
      if (!isNaN(hh) && !isNaN(mm)) {
        hh = Math.max(0, Math.min(23, hh));
        mm = Math.max(0, Math.min(59, mm));
        validTime = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
      }
    } else {
      validTime = entry.time;
    }
    setTime(validTime);
    updateJournalEntry(entry.id, { time: validTime });
  };

  const handleSelectTask = (task: TaskDto | null) => {
    setIsTaskPickerOpen(false);
    updateJournalEntry(entry.id, {
      linkedTaskId: task ? task.id : undefined,
    });
  };

  const handleRemoveTaskLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateJournalEntry(entry.id, {
      linkedTaskId: undefined,
    });
  };

  // Tìm task liên kết
  const linkedTask = entry.linkedTaskId
    ? tasks.find((t) => t.id === entry.linkedTaskId)
    : null;
  const isLinkedTaskDeleted = Boolean(entry.linkedTaskId && !linkedTask);

  return (
    <>
      <div
        className={`group relative flex items-start gap-2 sm:gap-2.5 px-1 hover:bg-[#FAF8F3]/80 rounded-[4px] transition-colors ${
          showTime ? "pt-1.5 pb-0.5" : "py-0.5"
        }`}
      >
        {/* 1. CỘT TRÁI: Mốc Giờ (Tự động gộp ẩn khi chung 1 phút) */}
        <div className="w-11 sm:w-12 shrink-0 text-right pt-0.5">
          {isEditingTime ? (
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              onBlur={handleTimeBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTimeBlur()}
              autoFocus
              className="w-11 font-mono text-xs font-bold text-center bg-white border border-[#262626] rounded px-0.5 py-0 focus:outline-none focus:bg-[#FAF8F3]"
            />
          ) : showTime ? (
            <button
              type="button"
              onClick={() => setIsEditingTime(true)}
              className="font-mono text-xs font-bold text-[#1C1917] hover:text-[#262626] cursor-pointer"
              title="Nhấp để sửa mốc giờ"
            >
              {time}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTime(true)}
              className="font-mono text-[10px] text-[#A8A29E] opacity-0 group-hover:opacity-100 hover:text-[#1C1917] cursor-pointer transition-opacity"
              title={`Cùng mốc ${time} (nhấp để sửa)`}
            >
              {time}
            </button>
          )}
        </div>

        {/* 2. ĐƯỜNG GẠCH DỌC TIMELINE (Tự động giãn theo chiều cao dòng) */}
        <div className="w-[1.5px] self-stretch bg-[#262626] shrink-0 my-0.5 rounded-full" />

        {/* 3. CỘT PHẢI: Nội dung nhập trực tiếp + Link task + Chọn sổ + Nút xóa */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onBlur={handleContentBlur}
              onKeyDown={handleKeyDown}
              placeholder="Nhập nội dung nhật ký..."
              rows={1}
              className="w-full text-xs sm:text-sm text-[#1C1917] leading-relaxed font-sans bg-transparent border border-transparent hover:border-[#D4CEBF] focus:border-[#262626] focus:bg-white rounded px-1.5 py-0.5 resize-none overflow-hidden focus:outline-none placeholder:text-[#A8A29E] transition-all"
            />

            {/* Nút Xóa */}
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded hover:bg-[#FAF8F3] border border-transparent hover:border-[#262626] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-all shrink-0 cursor-pointer pt-0.5"
              title="Xóa dòng nhật ký"
            >
              <Trash2 size={11} strokeWidth={2.2} />
            </button>
          </div>

          {/* Hàng Metadata: Task Liên Kết */}
          <div className="flex items-center gap-1.5 flex-wrap px-1">
            {/* Task Liên Kết */}
            <div className="relative">
              {entry.linkedTaskId ? (
                linkedTask ? (
                  <div
                    onClick={() => openTaskDetail(linkedTask.id)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#FAF8F3] hover:bg-[#F5F5F4] border border-[#262626] rounded-[3px] shadow-[0.5px_0.5px_0px_#262626] cursor-pointer transition-all active:translate-y-[0.5px] max-w-full text-[10px]"
                    title="Bấm để xem công việc liên kết"
                  >
                    <LinkIcon size={9} strokeWidth={2.4} className="text-[#78716C] shrink-0" />
                    <span className="shrink-0">
                      {linkedTask.completed ? (
                        <CheckSquare size={10} className="text-[#1C1917]" />
                      ) : (
                        <Square size={10} className="text-[#78716C]" />
                      )}
                    </span>
                    <span className={`font-bold truncate max-w-[150px] ${linkedTask.completed ? "line-through text-[#78716C]" : "text-[#1C1917]"}`}>
                      {linkedTask.title}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveTaskLink}
                      className="hover:text-[#1C1917] text-[#78716C] ml-0.5 font-bold cursor-pointer"
                      title="Bỏ liên kết task"
                    >
                      <X size={10} strokeWidth={2.6} />
                    </button>
                  </div>
                ) : isLinkedTaskDeleted ? (
                  <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-100 border border-dashed border-[#A8A29E] rounded text-stone-500 text-[10px] italic">
                    <AlertCircle size={10} />
                    <span>Công việc đã bị xóa</span>
                    <button
                      type="button"
                      onClick={handleRemoveTaskLink}
                      className="hover:text-rose-700 text-[#78716C] ml-0.5 cursor-pointer"
                    >
                      <X size={10} strokeWidth={2.6} />
                    </button>
                  </div>
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTaskPickerOpen(!isTaskPickerOpen)}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[10px] font-bold text-[#78716C] hover:text-[#1C1917] hover:underline cursor-pointer transition-opacity"
                  title="Gắn công việc liên kết"
                >
                  <LinkIcon size={9} strokeWidth={2.4} />
                  <span>Gắn Task</span>
                </button>
              )}

              {/* Task Popover Inline */}
              {isTaskPickerOpen && (
                <JournalTaskLinkPopover
                  isOpen={isTaskPickerOpen}
                  selectedTaskId={entry.linkedTaskId}
                  onSelectTask={handleSelectTask}
                  onClose={() => setIsTaskPickerOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
