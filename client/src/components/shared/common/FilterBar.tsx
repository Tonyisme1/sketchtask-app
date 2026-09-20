import React from "react";
import { useAppStore } from "../../../stores/appStore";
import { CustomSelect } from "../../ui/pickers/select/CustomSelect";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Hourglass,
  Search,
} from "lucide-react";

// ==========================================
// COMPONENT: FilterBar (Bộ Lọc Phân Tầng Dùng Chung - Two-Tier Filter)
// ==========================================

export interface FilterBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  statusFilter: "all" | "active" | "completed";
  onStatusChange: (status: "all" | "active" | "completed") => void;
  timeTypeFilter?: "all" | "scheduled" | "deadline";
  onTimeTypeChange?: (timeType: "all" | "scheduled" | "deadline") => void;
  priorityFilter: "all" | "high" | "medium" | "low";
  onPriorityChange: (priority: "all" | "high" | "medium" | "low") => void;
  tagFilter: string;
  onTagChange: (tag: string) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  extraAction?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  timeTypeFilter = "all",
  onTimeTypeChange,
  priorityFilter,
  onPriorityChange,
  tagFilter,
  onTagChange,
  isDrawerOpen,
  onToggleDrawer,
  onResetFilters,
  activeFilterCount,
  extraAction,
}) => {
  const { tags } = useAppStore();
  const [isSearchOpen, setIsSearchOpen] = React.useState(Boolean(searchQuery));

  return (
    <div className="space-y-2 select-none animate-in fade-in slide-in-from-bottom-1 duration-150">
      {/* Tầng 1: Filter Bar Cốt Lõi */}
      <div className="p-1.5 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xs flex items-center justify-between gap-1.5 text-xs overflow-x-auto no-scrollbar">
        {/* 3 Nút lọc trạng thái cốt lõi */}
        <div className="flex items-center gap-1 shrink-0">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Cần làm" },
            { key: "completed", label: "Đã xong" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onStatusChange(f.key as any)}
              className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 flex items-center justify-center cursor-pointer ${
                statusFilter === f.key
                  ? "bg-[#007AFF] dark:bg-[#0A84FF] text-white shadow-2xs"
                  : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Nút bên phải: Tìm kiếm trong trang + Action phụ + Nút Lọc Nhỏ + Nút Xóa */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onSearchChange && (
            isSearchOpen || Boolean(searchQuery) ? (
              <div className="flex items-center gap-2 h-8 px-2.5 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-xs shadow-2xs">
                <Search size={13} className="text-[#8E8E93] dark:text-[#A1A1AA] shrink-0" strokeWidth={2.2} />
                <input
                  type="text"
                  value={searchQuery || ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Tìm việc..."
                  className="bg-transparent pl-0.5 text-xs text-[#1C1C1E] dark:text-[#ECECF1] placeholder:text-[#8E8E93] dark:placeholder:text-[#71717A] focus:outline-none w-20 sm:w-28 font-sans"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white cursor-pointer"
                  >
                    <X size={11} strokeWidth={2.4} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    onSearchChange("");
                  }}
                  className="text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white text-xs font-bold cursor-pointer"
                  title="Đóng"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="h-8 px-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Tìm kiếm trong danh sách này"
              >
                <Search size={13} strokeWidth={2.2} />
                <span className="hidden sm:inline">Tìm</span>
              </button>
            )
          )}

          {extraAction}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Xóa bộ lọc"
              className="h-8 px-2.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#8E8E93] hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs transition-all"
            >
              <X size={12} strokeWidth={2.4} />
              <span className="hidden xs:inline">Xóa</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDrawer}
            className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-2xs ${
              isDrawerOpen || activeFilterCount > 0
                ? "bg-[#007AFF] text-white"
                : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
            }`}
          >
            <SlidersHorizontal size={13} strokeWidth={2.2} />
            <span>Lọc</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-white text-[#007AFF]">
                {activeFilterCount}
              </span>
            )}
            {isDrawerOpen ? (
              <ChevronUp size={13} strokeWidth={2.2} />
            ) : (
              <ChevronDown size={13} strokeWidth={2.2} />
            )}
          </button>
        </div>
      </div>

      {/* Tầng 2: Bộ Lọc Nâng Cao (Drawer Mở Rộng) */}
      {isDrawerOpen && (
        <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-xs space-y-3.5 animate-in slide-in-from-top-1 duration-150 text-xs">
          {/* 1. Loại Thời Gian */}
          {onTimeTypeChange && (
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] w-16 shrink-0">Thời gian:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "scheduled", label: "Lịch hẹn", icon: Clock },
                  { key: "deadline", label: "Hạn chót", icon: Hourglass },
                ].map((t) => {
                  const isSelected = timeTypeFilter === t.key;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => onTimeTypeChange(t.key as any)}
                      className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-[#007AFF] text-white shadow-2xs"
                          : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
                      }`}
                    >
                      {Icon && <Icon size={12} strokeWidth={2.2} />}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Mức Độ Ưu Tiên */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] w-16 shrink-0">Ưu tiên:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "all", label: "Tất cả" },
                { key: "high", label: "Gấp", dotClass: "bg-[#EF4444]" },
                { key: "medium", label: "Vừa", dotClass: "bg-[#0284C7]" },
                { key: "low", label: "Thấp", dotClass: "bg-[#10B981]" },
              ].map((p) => {
                const isSelected = priorityFilter === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onPriorityChange(p.key as any)}
                    className={`h-8 px-3 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#007AFF] text-white shadow-2xs"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#8E8E93] dark:text-[#A1A1A6] hover:text-[#1C1C1E] dark:hover:text-[#F2F2F7]"
                    }`}
                  >
                    {p.dotClass && <span className={`w-1.5 h-1.5 rounded-full ${p.dotClass}`} />}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Nhãn (#Tag) (Custom Dropdown) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold text-[#8E8E93] dark:text-[#A1A1A6] w-16 shrink-0">Nhãn:</span>
            <div className="min-w-[180px] flex-1 max-w-xs">
              <CustomSelect
                options={[
                  { value: "all", label: "Tất cả nhãn" },
                  { value: "none", label: "Không gắn nhãn" },
                  ...tags.map((tag) => ({
                    value: tag,
                    label: `#${tag}`,
                  })),
                ]}
                value={tagFilter}
                onChange={onTagChange}
                placeholder="Chọn nhãn..."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
