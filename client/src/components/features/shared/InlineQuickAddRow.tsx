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
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-150 ${
        isFocused
          ? "bg-white dark:bg-[#1C1C1E] border-[#1C1C1E] dark:border-white shadow-xs ring-1 ring-black/5 dark:ring-white/10"
          : "bg-black/[0.02] dark:bg-white/[0.04] border-dashed border-[#D1D1D6] dark:border-[#3A3A3C] hover:bg-white dark:hover:bg-[#1C1C1E] hover:border-[#8E8E93]"
      }`}
    >
      {/* Vòng tròn dấu cộng */}
      <div
        onClick={() => inputRef.current?.focus()}
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
          isFocused
            ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E]"
            : "border border-dashed border-[#8E8E93] text-[#8E8E93] bg-transparent"
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
        className="flex-1 bg-transparent px-1 text-xs sm:text-sm font-semibold text-[#1C1C1E] dark:text-[#F2F2F7] placeholder:text-[#8E8E93] focus:outline-none min-w-0 rounded-xl"
      />

      {/* Phím gợi ý Enter */}
      {title.trim().length > 0 && (
        <button
          type="submit"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1C1C1E] dark:bg-white text-white dark:text-[#1C1C1E] text-xs font-semibold shadow-xs active:scale-95 cursor-pointer shrink-0 animate-in fade-in transition-all"
        >
          <span>Lưu</span>
          <CornerDownLeft size={12} strokeWidth={2.4} />
        </button>
      )}
    </form>
  );
};
