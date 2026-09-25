import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useAppStore } from "../../../../stores/appStore";
import { normalizeTagName } from "../../../../utils/taskSemantics";

export interface TagInputSelectorProps {
  selectedTag?: string;
  onChange: (tag?: string) => void;
  placeholder?: string;
  className?: string;
}

// === COMPONENT: TagInputSelector (Chọn một nhãn/danh sách duy nhất) ===
export const TagInputSelector: React.FC<TagInputSelectorProps> = ({
  selectedTag,
  onChange,
  placeholder = "Tạo nhãn mới...",
  className = "",
}) => {
  const { tags, addTag } = useAppStore();
  const [newTagInput, setNewTagInput] = useState("");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const currentTag = selectedTag ? normalizeTagName(selectedTag) : "";

  const handleSelectTag = (tag: string) => {
    const clean = normalizeTagName(tag);
    if (clean) onChange(clean);
  };

  const handleCreateNewTag = (event?: React.FormEvent) => {
    event?.preventDefault();
    const clean = normalizeTagName(newTagInput);
    if (!clean) return;

    addTag(clean);
    onChange(clean);
    setNewTagInput("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      handleCreateNewTag();
    }
  };

  const availableTags = Array.from(
    new Set(tags.map(normalizeTagName).filter(Boolean)),
  ).filter((tag) => tag !== currentTag);

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex min-h-[30px] items-center gap-1.5">
        {currentTag ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-blue)] px-3 py-1 text-xs font-bold text-[var(--text-on-accent)]">
            <span>#{currentTag}</span>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full hover:bg-white/20 active:scale-90 transition-transform cursor-pointer"
              title={`Gỡ #${currentTag}`}
              aria-label={`Gỡ nhãn ${currentTag}`}
            >
              <X size={10} strokeWidth={3} />
            </button>
          </span>
        ) : (
          <span className="font-mono text-xs italic text-[var(--text-muted)]">
            Chưa chọn nhãn
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div
          className={`flex flex-1 items-center gap-1.5 rounded-2xl bg-[var(--bg-surface-muted)] px-3 py-2 transition-all ${
            isInputFocused ? "ring-2 ring-[var(--accent-blue)]/30" : ""
          }`}
        >
          <span className="font-mono text-xs font-black text-[var(--text-muted)]">#</span>
          <input
            type="text"
            value={newTagInput}
            onChange={(event) => setNewTagInput(event.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder={placeholder}
            className="w-full bg-transparent text-xs font-bold text-[var(--text-main)] placeholder:font-normal placeholder:text-[var(--text-subtle)] focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => handleCreateNewTag()}
          disabled={!newTagInput.trim()}
          className="flex h-[36px] shrink-0 items-center gap-1 rounded-2xl bg-[var(--accent-blue)] px-3.5 text-xs font-bold text-[var(--text-on-accent)] transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
        >
          <Plus size={13} strokeWidth={2.5} />
          <span>Tạo</span>
        </button>
      </div>

      {availableTags.length > 0 && (
        <div className="pt-1">
          <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
            Nhãn có sẵn:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectTag(tag)}
                className="flex items-center gap-1 rounded-full bg-[var(--bg-surface-muted)] px-3 py-1 font-mono text-xs font-medium text-[var(--text-muted)] hover:bg-[var(--bg-interactive)] hover:text-[var(--text-main)] active:scale-95 transition-all cursor-pointer"
                title={`Chọn #${tag}`}
              >
                <span>#{tag}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
