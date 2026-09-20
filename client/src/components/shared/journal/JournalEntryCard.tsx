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
        className={`group relative flex items-start gap-2 sm:gap-3 px-2 py-1 hover:bg-black/[0.02] dark:hover:bg-white/[0.04] rounded-2xl transition-colors ${
          showTime ? "pt-2 pb-1" : "py-1"
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
              className="w-11 font-mono text-xs font-bold text-center bg-black/[0.04] dark:bg-white/[0.08] text-[#1C1C1E] dark:text-[#F2F2F7] rounded-xl px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#007AFF] shadow-2xs"
            />
          ) : showTime ? (
            <button
              type="button"
              onClick={() => setIsEditingTime(true)}
              className="font-mono text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] hover:text-[#007AFF] cursor-pointer"
              title="Nhấp để sửa mốc giờ"
            >
              {time}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTime(true)}
              className="font-mono text-[10px] text-[#8E8E93] dark:text-[#A1A1A6] opacity-0 group-hover:opacity-100 hover:text-[#007AFF] cursor-pointer transition-opacity"
              title={`Cùng mốc ${time} (nhấp để sửa)`}
            >
              {time}
            </button>
          )}
        </div>

        {/* 2. ĐƯỜNG GẠCH DỌC TIMELINE (Tự động giãn theo chiều cao dòng) */}
        <div className="w-1 self-stretch bg-black/[0.06] dark:bg-white/[0.1] shrink-0 my-0.5 rounded-full" />

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
              className="w-full text-xs sm:text-sm text-[#1C1C1E] dark:text-[#F2F2F7] leading-relaxed font-sans bg-transparent hover:bg-black/[0.02] focus:bg-black/[0.04] dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.06] rounded-xl px-2 py-1 resize-none overflow-hidden focus:outline-none placeholder:text-[#8E8E93] dark:placeholder:text-[#A1A1A6] transition-all"
            />

            {/* Nút Xóa */}
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center text-[#8E8E93] hover:text-rose-600 dark:hover:text-rose-400 transition-all shrink-0 cursor-pointer pt-0.5"
              title="Xóa dòng nhật ký"
            >
              <Trash2 size={12} strokeWidth={2.2} />
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
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 rounded-full shadow-2xs cursor-pointer transition-all max-w-full text-[11px] font-semibold"
                    title="Bấm để xem công việc liên kết"
                  >
                    <LinkIcon size={10} strokeWidth={2.4} className="shrink-0" />
                    <span className="shrink-0">
                      {linkedTask.completed ? (
                        <CheckSquare size={11} />
                      ) : (
                        <Square size={11} />
                      )}
                    </span>
                    <span className={`truncate max-w-[160px] ${linkedTask.completed ? "line-through opacity-70" : ""}`}>
                      {linkedTask.title}
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveTaskLink}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer"
                      title="Bỏ liên kết task"
                    >
                      <X size={11} strokeWidth={2.6} />
                    </button>
                  </div>
                ) : isLinkedTaskDeleted ? (
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-full text-[#8E8E93] text-[10px] italic">
                    <AlertCircle size={10} />
                    <span>Công việc đã bị xóa</span>
                    <button
                      type="button"
                      onClick={handleRemoveTaskLink}
                      className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    >
                      <X size={11} strokeWidth={2.6} />
                    </button>
                  </div>
                ) : null
              ) : (
                <button
                  type="button"
                  onClick={() => setIsTaskPickerOpen(!isTaskPickerOpen)}
                  className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] font-semibold text-[#8E8E93] hover:text-[#007AFF] hover:underline cursor-pointer transition-opacity"
                  title="Gắn công việc liên kết"
                >
                  <LinkIcon size={10} strokeWidth={2.2} />
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
