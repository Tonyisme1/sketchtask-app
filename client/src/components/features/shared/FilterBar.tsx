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
    <div className="space-y-1.5 select-none animate-in fade-in slide-in-from-bottom-1 duration-150">
      {/* Tầng 1: Filter Bar Cốt Lõi */}
      <div className="p-1 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-center justify-between gap-1 sm:gap-2 text-xs overflow-x-auto no-scrollbar">
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
              className={`h-7 px-2.5 py-1 rounded-[3px] border text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center justify-center active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
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
              className="h-7 px-1.5 py-1 rounded-[3px] bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-bold flex items-center gap-0.5 hover:bg-rose-100 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none whitespace-nowrap shrink-0"
            >
              <X size={12} strokeWidth={2.5} />
              <span className="hidden xs:inline">Xóa</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleDrawer}
            className={`h-7 px-2 py-1 rounded-[3px] border-[1.5px] text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
              isDrawerOpen || activeFilterCount > 0
                ? "bg-[#FEF08A] border-[#262626] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                : "bg-white border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917]"
            }`}
          >
            <SlidersHorizontal size={12} strokeWidth={2.2} />
            <span>Lọc</span>
            {activeFilterCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-[#262626] text-white text-[9px] flex items-center justify-center font-mono font-bold shrink-0">
                {activeFilterCount}
              </span>
            )}
            {isDrawerOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {/* Tầng 2: Bộ Lọc Nâng Cao (Drawer Mở Rộng) */}
      {isDrawerOpen && (
        <div className="p-2.5 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2 animate-in slide-in-from-top-2 duration-150 text-xs">
          {/* 1. Loại Thời Gian */}
          {onTimeTypeChange && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Thời gian:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "all", label: "Tất cả" },
                  {
                    key: "scheduled",
                    label: "Lịch hẹn",
                    icon: Clock,
                    activeClass: "bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]",
                  },
                  {
                    key: "deadline",
                    label: "Hạn chót",
                    icon: Hourglass,
                    activeClass: "bg-rose-100 text-rose-900 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]",
                  },
                ].map((t) => {
                  const isSelected = timeTypeFilter === t.key;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => onTimeTypeChange(t.key as any)}
                      className={`h-6 px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                        isSelected
                          ? t.activeClass || "bg-[#262626] text-white border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
                          : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
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
            <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Ưu tiên:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: "all", label: "Tất cả" },
                { key: "high", label: "Gấp", dotClass: "bg-rose-500", activeClass: "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]" },
                { key: "medium", label: "Vừa", dotClass: "bg-amber-400", activeClass: "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]" },
                { key: "low", label: "Thấp", dotClass: "bg-emerald-500", activeClass: "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1px_1px_0px_#262626]" },
              ].map((p) => {
                const isSelected = priorityFilter === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => onPriorityChange(p.key as any)}
                    className={`h-6 px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                      isSelected
                        ? p.activeClass || "bg-[#262626] text-white border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
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
              <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Sổ tay:</span>
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
            <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Nhãn:</span>
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
