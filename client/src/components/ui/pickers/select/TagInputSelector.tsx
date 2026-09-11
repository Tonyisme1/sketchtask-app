import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAppStore } from "../../../../stores/appStore";
import { normalizeTagName } from "../../../../utils/taskSemantics";

export interface TagInputSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

// === COMPONENT: TagInputSelector (Bộ chọn nhiều nhãn & Tạo nhãn mới tại chỗ) ===
export const TagInputSelector: React.FC<TagInputSelectorProps> = ({
  selectedTags,
  onChange,
  placeholder = "Nhập tên nhãn mới...",
  className = "",
}) => {
  const { tags, addTag } = useAppStore();
  const [newTagInput, setNewTagInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Thêm một tag vào danh sách đã chọn
  const handleToggleTag = (tag: string) => {
    const clean = normalizeTagName(tag);
    if (!clean) return;
    if (selectedTags.includes(clean)) {
      onChange(selectedTags.filter((t) => t !== clean));
    } else {
      onChange([...selectedTags, clean]);
    }
  };

  // Tạo tag mới và tự động gán vào task
  const handleCreateNewTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = normalizeTagName(newTagInput);
    if (!clean) return;

    // Lưu vào store hệ thống
    addTag(clean);

    // Gán vào task nếu chưa có
    if (!selectedTags.includes(clean)) {
      onChange([...selectedTags, clean]);
    }

    setNewTagInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleCreateNewTag();
    }
  };

  // Các tag có sẵn trong hệ thống chưa được chọn
  const unselectedTags = tags.filter(
    (t) => !selectedTags.includes(normalizeTagName(t)),
  );

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* 1. Danh sách các Tag ĐANG ĐƯỢC CHỌN (Selected Tags Chips) */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[30px]">
        {selectedTags.length > 0 ? (
          selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-[4px] border-[1.5px] border-[#262626] bg-[#1C1917] px-2.5 py-1 text-xs font-bold text-white shadow-[1px_1px_0px_#262626] transition-all animate-in zoom-in-95 duration-100"
            >
              <span>#{tag}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleTag(tag);
                }}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
                title={`Gỡ bỏ #${tag}`}
                aria-label={`Gỡ bỏ nhãn ${tag}`}
              >
                <X size={10} strokeWidth={3} />
              </button>
            </span>
          ))
        ) : (
          <span className="font-mono text-xs italic text-[#78716C]">
            Chưa có nhãn nào được gắn
          </span>
        )}
      </div>

      {/* 2. Ô Nhập Để Tạo Tag Mới & Nút Thêm (Inline Input) */}
      <div className="flex items-center gap-1.5">
        <div
          className={`flex flex-1 items-center gap-1.5 rounded-[4px] border-[1.5px] bg-white px-2.5 py-1.5 shadow-[1px_1px_0px_#262626] transition-all ${
            isInputFocused ? "border-[#1C1917] ring-1 ring-[#1C1917]" : "border-[#262626]"
          }`}
        >
          <span className="font-mono text-xs font-black text-[#78716C]">#</span>
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs font-bold text-[#1C1917] placeholder:font-normal placeholder:text-[#A8A29E] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => handleCreateNewTag()}
          disabled={!newTagInput.trim()}
          className="flex h-[34px] shrink-0 items-center gap-1 rounded-[4px] border-[1.5px] border-[#262626] bg-[#FAF8F3] px-3 text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] transition-all hover:bg-white active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Tạo</span>
        </button>
      </div>

      {/* 3. Danh sách Tag Gợi Ý Có Sẵn (Click để chọn nhanh) */}
      {unselectedTags.length > 0 && (
        <div className="pt-1">
          <span className="block mb-1 text-xs font-medium text-[#57534E]">
            Nhãn có sẵn:
          </span>
          <div className="flex flex-wrap gap-1">
            {unselectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className="flex items-center gap-1 rounded-[4px] border border-[#262626]/40 bg-[#FAF8F3] px-2 py-0.5 font-mono text-xs font-medium text-[#57534E] hover:border-[#262626] hover:bg-white hover:text-[#1C1917] active:scale-95 transition-all cursor-pointer"
                title={`Gắn nhãn #${tag}`}
              >
                <Plus size={10} strokeWidth={2.5} />
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
