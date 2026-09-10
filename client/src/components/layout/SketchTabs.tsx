import React, { ReactNode } from "react";

export interface SketchTabItem<TKey extends string> {
  key: TKey;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

export interface SketchTabsProps<TKey extends string> {
  value: TKey;
  items: Array<SketchTabItem<TKey>>;
  onChange: (value: TKey) => void;
  ariaLabel: string;
  size?: "sm" | "md";
  className?: string;
}

// === PHẦN 1: Thanh tab nét mực dùng chung cho các workspace ===
export function SketchTabs<TKey extends string>({
  value,
  items,
  onChange,
  ariaLabel,
  size = "sm",
  className = "",
}: SketchTabsProps<TKey>) {
  const itemSize =
    size === "md" ? "px-3.5 py-2 text-[13px]" : "px-3 py-1.5 text-xs";

  return (
    <nav
      aria-label={ariaLabel}
      className={`flex min-w-0 items-center gap-1 overflow-x-auto border-b-[1.5px] border-[#262626] pb-2 no-scrollbar ${className}`}
    >
      {items.map((item) => {
        const isActive = item.key === value;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.key)}
            className={`inline-flex shrink-0 items-center gap-1.5 border-[1.5px] border-[#262626] font-bold transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${itemSize} ${
              isActive
                ? "bg-[#1C1917] text-white shadow-none"
                : "bg-white text-[#57534E] shadow-[1.5px_1.5px_0px_#262626] hover:bg-[#FAF8F3] hover:text-[#1C1917]"
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </nav>
  );
}
