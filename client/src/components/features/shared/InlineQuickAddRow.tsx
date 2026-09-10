import React, { useState, useRef } from "react";
import { Plus, CornerDownLeft } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { getLocalTodayStr } from "../../../utils/date";

export interface InlineQuickAddRowProps {
  parentTaskId?: string;
  notebookId?: string;
  defaultDueDate?: string;
  placeholder?: string;
  onCreated?: () => void;
}

export const InlineQuickAddRow: React.FC<InlineQuickAddRowProps> = ({
  parentTaskId,
  notebookId,
  defaultDueDate,
  placeholder = "Thêm công việc mới...",
  onCreated,
}) => {
  const { addTask } = useAppStore();
  const [title, setTitle] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const todayStr = getLocalTodayStr(new Date());
    const effectiveDueDate = defaultDueDate || todayStr;

    addTask({
      title: trimmedTitle,
      dueDate: effectiveDueDate,
      parentTaskId: parentTaskId || undefined,
      notebookId: notebookId || undefined,
      priority: "medium",
      timeType: "deadline",
    });

    setTitle("");
    onCreated?.();
    // Giữ focus để người dùng có thể gõ liên tục các task tiếp theo
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-[5px] border-[1.5px] transition-all duration-150 ${
        isFocused
          ? "bg-white border-[#1C1917] shadow-[2px_2px_0px_#1C1917]"
          : "bg-[#FAF8F3]/60 border-dashed border-[#262626]/40 hover:bg-white hover:border-[#262626]"
      }`}
    >
      {/* Vòng tròn dấu cộng */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          isFocused
            ? "border-[#1C1917] bg-[#1C1917] text-white"
            : "border-dashed border-[#262626] text-[#78716C] bg-white"
        }`}
      >
        <Plus size={12} strokeWidth={2.6} />
      </div>

      {/* Input gõ tên việc inline */}
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-[#1C1917] placeholder:text-[#78716C]/70 focus:outline-none min-w-0"
      />

      {/* Phím gợi ý Enter */}
      {title.trim().length > 0 && (
        <button
          type="submit"
          className="flex items-center gap-1 px-2 py-0.5 rounded-[3px] bg-[#1C1917] text-white text-[11px] font-bold shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer shrink-0 animate-in fade-in"
        >
          <span>Lưu</span>
          <CornerDownLeft size={11} strokeWidth={2.4} />
        </button>
      )}
    </form>
  );
};
