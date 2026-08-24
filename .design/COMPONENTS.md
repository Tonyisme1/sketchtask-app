# COMPONENTS.md

Source of truth đặc tả cấu trúc UI, trạng thái tương tác và mã nguồn mẫu cho các thành phần giao diện.
Tất cả component phải kế thừa tokens từ `TOKENS.md` và tuân thủ `DESIGN-PRINCIPLES.md`.

---

## 1. Interactive Rule: Tactile Press (Hiệu ứng nhấn vật lý)

Mọi thành phần có thể click (Button, Checkbox, Card bấm được) phải có phản hồi hạ độ cao:

- **Default:** Có viền nét mực (`border-[1.5px] border-[#262626]`) và hard shadow (`shadow-[2px_2px_0px_#262626]`).
- **Hover:** Dịch chuyển nhẹ `-translate-x-[0.5px] -translate-y-[0.5px]` và tăng bóng thành `shadow-[2.5px_2.5px_0px_#262626]`.
- **Active / Pressed:** Nhấn chìm xuống `translate-x-[2px] translate-y-[2px]` và triệt tiêu bóng `shadow-none`.

---

## 2. Component Specifications

### 2.1. Button Component

Dùng cho mọi hành động chính/phụ. Không dùng bo tròn hoàn toàn (pill) trừ khi là tag nhỏ.

```tsx
// ==========================================
// 1. COMPONENT: Button
// ==========================================
import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  // Base classes: Viền mực, hard shadow, tactile press
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-100 " +
    "border-[1.5px] border-[#262626] rounded-[4px] " +
    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none";

  // Kích thước
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs shadow-[1px_1px_0px_#262626]",
    md: "px-4 py-2 text-sm shadow-[2px_2px_0px_#262626] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]",
  };

  // Màu sắc theo Token
  const variantClasses = {
    primary: "bg-[#FEF08A] text-[#1C1917] hover:bg-[#FDE047]", // Accent Yellow
    secondary: "bg-[#FFFFFF] text-[#1C1917] hover:bg-[#F3EFE6]", // Canvas Surface
    danger: "bg-[#FECDD3] text-[#1C1917] hover:bg-[#FDA4AF]", // Coral Accent
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
// ==========================================
// 2. COMPONENT: Hand-Drawn Checkbox
// ==========================================
import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
}) => {
  return (
    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
      {/* Box */}
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 border-[1.5px] border-[#262626] rounded-[3px] flex items-center justify-center transition-all duration-100 ${
          checked
            ? "bg-[#BBF7D0] shadow-none translate-x-[1px] translate-y-[1px]"
            : "bg-white shadow-[1.5px_1.5px_0px_#262626] group-hover:-translate-x-[0.5px] group-hover:-translate-y-[0.5px]"
        }`}
      >
        {checked && (
          <svg
            className="w-3.5 h-3.5 text-[#1C1917]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Label */}
      {label && (
        <span
          className={`text-sm text-[#1C1917] transition-all duration-150 ${checked ? "line-through text-[#78716C]" : ""}`}
        >
          {label}
        </span>
      )}
    </label>
  );
};
// ==========================================
// 3. COMPONENT: TaskCard
// ==========================================
import React from "react";

interface TaskCardProps {
  title: string;
  dueDate?: string;
  tag?: string;
  completed?: boolean;
  tilt?: "flat" | "left" | "right";
  onToggle?: () => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  title,
  dueDate,
  tag,
  completed = false,
  tilt = "flat",
  onToggle,
}) => {
  // Giới hạn góc xoay cố định
  const rotationClasses = {
    flat: "rotate-0",
    left: "-rotate-[0.5deg]",
    right: "rotate-[0.5deg]",
  };

  return (
    <div
      className={`p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[2px_2px_0px_#262626] transition-all duration-150 ${rotationClasses[tilt]} ${
        completed
          ? "opacity-60 bg-[#FBF9F4]"
          : "hover:shadow-[3px_3px_0px_#262626]"
      }`}
    >
      {/* Top: Checkbox & Primary Title */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={completed}
          onChange={onToggle}
          className="mt-1 cursor-pointer accent-[#262626]"
        />
        <div className="flex-1">
          <p
            className={`text-sm font-semibold text-[#1C1917] leading-snug ${completed ? "line-through text-[#78716C]" : ""}`}
          >
            {title}
          </p>

          {/* Bottom: Secondary Info & Metadata */}
          {(dueDate || tag) && (
            <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs">
              {dueDate && (
                <span className="font-mono text-[#78716C] bg-[#F3EFE6] px-1.5 py-0.5 rounded-[2px] border border-[#D4CEBF]">
                  {dueDate}
                </span>
              )}
              {tag && (
                <span className="bg-[#DDD6FE] text-[#1C1917] px-1.5 py-0.5 rounded-[2px] border border-[#262626] font-medium">
                  {tag}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
// ==========================================
// 4. COMPONENT: StickyNote
// ==========================================
import React from "react";

interface StickyNoteProps {
  content: string;
  color?: "yellow" | "coral" | "mint" | "sky";
  tilt?: "left" | "right";
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  content,
  color = "yellow",
  tilt = "left",
}) => {
  const colorMap = {
    yellow: "bg-[#FEF08A]",
    coral: "bg-[#FECDD3]",
    mint: "bg-[#BBF7D0]",
    sky: "bg-[#BAE6FD]",
  };

  const rotation = tilt === "left" ? "-rotate-1" : "rotate-1";

  return (
    <div
      className={`relative p-4 border-[1.5px] border-[#262626] shadow-[3px_3px_0px_#262626] rounded-[2px] ${colorMap[color]} ${rotation}`}
    >
      {/* Tape Effect (Trang trí băng dính ở mép trên) */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-4 bg-white/60 border-t border-b border-black/10 backdrop-blur-[0.5px]" />

      {/* Nội dung dạng viết tay */}
      <p className="font-serif italic text-base text-[#1C1917] leading-relaxed select-text">
        {content}
      </p>
    </div>
  );
};
// ==========================================
// 5. COMPONENT: TextInput
// ==========================================
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const TextInput: React.FC<InputProps> = ({
  error,
  className = "",
  ...props
}) => {
  return (
    <input
      className={`w-full px-3 py-2 text-sm text-[#1C1917] bg-white border-[1.5px] rounded-[4px] outline-none transition-all duration-100 ${
        error ? "border-[#FECDD3] bg-rose-50" : "border-[#262626]"
      } focus:shadow-[2px_2px_0px_#262626] focus:-translate-y-[1px] placeholder:text-[#78716C] ${className}`}
      {...props}
    />
  );
};
```
