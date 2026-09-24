import { ReactNode } from "react";

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

// === PHẦN 1: Thanh tab Segmented Control tối giản dùng chung ===
export function SketchTabs<TKey extends string>({
  value,
  items,
  onChange,
  ariaLabel,
  size = "sm",
  className = "",
}: SketchTabsProps<TKey>) {
  const itemSize =
    size === "md" ? "px-4 py-2 text-[13px]" : "px-3 py-1.5 text-xs";

  return (
    <nav
      aria-label={ariaLabel}
      className={`inline-flex min-w-0 items-center gap-1 p-1 bg-black/[0.05] dark:bg-white/[0.08] rounded-xl overflow-x-auto no-scrollbar select-none ${className}`}
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
            className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer active:scale-[0.98] ${itemSize} ${
              isActive
                ? "bg-white dark:bg-[#3A3A3C] text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xs"
                : "text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
            }`}
          >
            {item.icon}
            <span className="whitespace-nowrap">{item.label}</span>
            {item.badge}
          </button>
        );
      })}
    </nav>
  );
}
