import React, { useState, useRef } from "react";
import { Plus, CornerDownLeft } from "lucide-react";
import { useAppStore } from "../../../stores/appStore";
import { getLocalTodayStr } from "../../../utils/date";

export interface InlineQuickAddRowProps {
  parentTaskId?: string;
  defaultDueDate?: string;
  placeholder?: string;
  onCreated?: () => void;
}

export const InlineQuickAddRow: React.FC<InlineQuickAddRowProps> = ({
  parentTaskId,
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
      className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all duration-150 ${
        isFocused
          ? "bg-white dark:bg-[#1C1C1E] shadow-xs ring-2 ring-[var(--accent-blue)]/30"
          : "bg-black/[0.03] dark:bg-white/[0.04] hover:bg-white dark:hover:bg-[#1C1C1E] shadow-2xs"
      }`}
    >
      {/* Vòng tròn dấu cộng */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          isFocused
            ? "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] shadow-2xs"
            : "text-[#8E8E93] bg-black/[0.05] dark:bg-white/[0.08]"
        }`}
      >
        <Plus size={13} strokeWidth={2.6} />
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
        className="flex-1 bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none min-w-0"
      />

      {/* Phím gợi ý Enter */}
      {title.trim().length > 0 && (
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] text-xs font-semibold shadow-2xs active:scale-95 cursor-pointer shrink-0 animate-in fade-in transition-all"
        >
          <span>Lưu</span>
          <CornerDownLeft size={12} strokeWidth={2.4} />
        </button>
      )}
    </form>
  );
};
