import React from "react";
import { useAppStore } from "../../../stores/appStore";
import { getTagStyle } from "../../../utils/tagColors";
import { DynamicIcon } from "../../ui/core/DynamicIcon";
import { CustomSelect } from "../../ui/pickers/select/CustomSelect";
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Hourglass,
} from "lucide-react";

// ==========================================
// COMPONENT: FilterBar (Bộ Lọc Phân Tầng Dùng Chung - Two-Tier Filter)
// ==========================================

export interface FilterBarProps {
  statusFilter: "all" | "active" | "completed";
  onStatusChange: (status: "all" | "active" | "completed") => void;
  timeTypeFilter?: "all" | "scheduled" | "deadline";
  onTimeTypeChange?: (timeType: "all" | "scheduled" | "deadline") => void;
  priorityFilter: "all" | "high" | "medium" | "low";
  onPriorityChange: (priority: "all" | "high" | "medium" | "low") => void;
  notebookFilter: string;
  onNotebookChange: (notebookId: string) => void;
  tagFilter: string;
  onTagChange: (tag: string) => void;
  isDrawerOpen: boolean;
  onToggleDrawer: () => void;
  onResetFilters: () => void;
  activeFilterCount: number;
  hideNotebookFilter?: boolean;
  extraAction?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  statusFilter,
  onStatusChange,
  timeTypeFilter = "all",
  onTimeTypeChange,
  priorityFilter,
  onPriorityChange,
  notebookFilter,
  onNotebookChange,
  tagFilter,
  onTagChange,
  isDrawerOpen,
  onToggleDrawer,
  onResetFilters,
  activeFilterCount,
  hideNotebookFilter = false,
  extraAction,
}) => {
  const { notebooks, tags } = useAppStore();

  return (
    <div className="space-y-2 select-none animate-in fade-in slide-in-from-bottom-1 duration-150">
      {/* Tầng 1: Filter Bar Cốt Lõi */}
      <div className="p-1.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-center justify-between gap-1.5 sm:gap-2 text-xs overflow-x-auto no-scrollbar">
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
              className={`h-8 px-3 rounded-[4px] border-[1.5px] text-[13px] font-semibold transition-all whitespace-nowrap shrink-0 flex items-center justify-center active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                statusFilter === f.key
                  ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                  : "bg-[#FBF9F4] text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Nút bên phải: Action phụ + Nút Lọc Nhỏ + Nút Xóa */}
        <div className="flex items-center gap-1 shrink-0">
          {extraAction}

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Xóa bộ lọc"
              className="h-8 px-2 rounded-[4px] bg-[#FAF8F3] border-[1.5px] border-[#262626] text-[#1C1917] text-xs font-semibold flex items-center gap-1 hover:bg-[#E7E5E4] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none whitespace-nowrap shrink-0"
            >
              <X size={12} strokeWidth={2.5} />
              <span className="hidden xs:inline">Xóa</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDrawer}
            className={`h-8 px-3 rounded-[4px] border-[1.5px] text-[13px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              isDrawerOpen || activeFilterCount > 0
                ? "bg-[#1C1917] border-[#1C1917] text-white shadow-none"
                : "bg-white border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917] hover:border-[#1C1917]"
            }`}
          >
            <SlidersHorizontal size={12} strokeWidth={2.2} />
            <span>Bộ lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#1C1917] text-[9px] flex items-center justify-center font-mono font-bold shrink-0">
                {activeFilterCount}
              </span>
            )}
            {isDrawerOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Tầng 2: Bộ Lọc Nâng Cao (Drawer Mở Rộng - Tối giản giấy mực) */}
      {isDrawerOpen && (
        <div className="p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-3 animate-in slide-in-from-top-1 duration-150 text-xs">
          {/* 1. Loại Thời Gian */}
          {onTimeTypeChange && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#78716C] w-16 shrink-0">Thời gian:</span>
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
                      className={`h-7 px-2.5 rounded-[4px] border text-xs font-semibold transition-all flex items-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                        isSelected
                          ? "bg-[#1C1917] text-white border-[#1C1917] shadow-none"
                          : "border-[#D4CEBF] bg-[#FAF8F3] text-[#78716C] hover:text-[#1C1917] hover:border-[#1C1917]"
                      }`}
                    >
                      {Icon && <Icon size={11} strokeWidth={2.2} />}
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Mức Độ Ưu Tiên */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#78716C] w-16 shrink-0">Ưu tiên:</span>
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
                    className={`h-7 px-2.5 rounded-[4px] border text-xs font-semibold transition-all flex items-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                      isSelected
                        ? "bg-[#1C1917] text-white border-[#1C1917] shadow-none"
                        : "border-[#D4CEBF] bg-[#FAF8F3] text-[#78716C] hover:text-[#1C1917] hover:border-[#1C1917]"
                    }`}
                  >
                    {p.dotClass && <span className={`w-1.5 h-1.5 rounded-full ${p.dotClass}`} />}
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Cuốn Sổ Tay (Custom Dropdown) */}
          {!hideNotebookFilter && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#78716C] w-16 shrink-0">Sổ tay:</span>
              <div className="min-w-[180px] flex-1 max-w-xs">
                <CustomSelect
                  options={[
                    { value: "all", label: "Tất cả sổ tay" },
                    { value: "none", label: "Không thuộc sổ tay" },
                    ...notebooks.map((nb) => ({
                      value: nb.id,
                      label: nb.name,
                      icon: nb.icon,
                      color: nb.color,
                    })),
                  ]}
                  value={notebookFilter}
                  onChange={onNotebookChange}
                  placeholder="Chọn sổ tay..."
                />
              </div>
            </div>
          )}

          {/* 4. Nhãn (#Tag) (Custom Dropdown) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[#78716C] w-16 shrink-0">Nhãn:</span>
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
