import React, { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../ui/Button";
import { HandDrawnCheckbox } from "../../ui/HandDrawnCheckbox";
import { TextInput } from "../../ui/TextInput";
import { EmptyStateDoodle } from "../../ui/EmptyStateDoodle";
import { CustomSelect, SelectOption } from "../../ui/CustomSelect";
import { CustomDuePicker } from "../../ui/CustomDuePicker";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { DynamicIcon } from "../../ui/DynamicIcon";
import { getCardTilt } from "../../../utils/tilt";
import { getTagStyle } from "../../../utils/tagColors";
import { getTaskDueInfo } from "../../../utils/taskDueStatus";
import {
  ArrowRight,
  Clock,
  Tag as TagIcon,
  X,
  Plus,
  AlertCircle,
  Calendar,
  BookOpen,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Filter,
  Sun,
} from "lucide-react";

import { getLocalTodayStr, isTaskForDate } from "../../../utils/date";

// ==========================================
// COMPONENT: TodayTab (Gọn Gàng - Thoáng Đãng - Icon Hiện Đại)
// ==========================================

export const TodayTab: React.FC = () => {
  const {
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    notebooks,
    tags,
    addTag,
    deleteTag,
    hideCompletedTasks,
  } = useAppStore();

  const now = new Date();
  const todayStr = getLocalTodayStr(now);

  const [newTitle, setNewTitle] = useState("");
  const [newDueTime, setNewDueTime] = useState<string | undefined>(undefined);
  const [selectedPriority, setSelectedPriority] = useState<
    "high" | "medium" | "low"
  >("medium");
  const [selectedTag, setSelectedTag] = useState<string>(
    tags[0] || "Công việc",
  );
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>("");
  const [inputError, setInputError] = useState(false);
  const [isExpandedOptions, setIsExpandedOptions] = useState(false);

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [dueFilter, setDueFilter] = useState<
    "all" | "overdue" | "today" | "upcoming"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) {
      setInputError(true);
      return;
    }

    const finalDueDate = newDueTime
      ? `${todayStr} ${newDueTime}`
      : `${todayStr}`;

    addTask({
      title: newTitle.trim(),
      dueDate: finalDueDate,
      tag: selectedTag,
      notebookId: selectedNotebookId || undefined,
      priority: selectedPriority,
    });

    setNewTitle("");
    setNewDueTime(undefined);
    setSelectedPriority("medium");
    setInputError(false);
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) {
      setIsAddingTag(false);
      return;
    }
    addTag(newTagInput.trim());
    setSelectedTag(newTagInput.trim());
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const notebookOptions: SelectOption[] = [
    { value: "", label: "Không gán sổ", icon: "lucide:FileText" },
    ...notebooks.map((nb) => ({
      value: nb.id,
      label: nb.name,
      icon: nb.icon || "lucide:BookMarked",
    })),
  ];

  // Lọc task của Hôm nay và các task quá hạn
  const todayTasks = tasks.filter((task) => {
    if (isTaskForDate(task.dueDate, todayStr)) return true;
    // Kèm cả task quá hạn chưa làm nếu người dùng lọc
    if (!task.completed && task.dueDate && task.dueDate < todayStr) return true;
    return false;
  });

  // Đếm số lượng theo hạn chót
  const overdueCount = tasks.filter(
    (t) => !t.completed && t.dueDate && t.dueDate.split(" ")[0] < todayStr,
  ).length;

  const filteredTasks = todayTasks.filter((task) => {
    if (hideCompletedTasks && statusFilter === "all" && task.completed)
      return false;
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? !task.completed
          : task.completed;

    const dueInfo = getTaskDueInfo(task.dueDate);
    const matchDue =
      dueFilter === "all"
        ? true
        : dueFilter === "overdue"
          ? dueInfo?.type === "overdue"
          : dueFilter === "today"
            ? dueInfo?.type === "today"
            : dueInfo?.type === "upcoming";

    const matchPriority =
      priorityFilter === "all"
        ? true
        : (task.priority || "medium") === priorityFilter;

    const matchTag = tagFilter === "all" ? true : task.tag === tagFilter;
    return matchStatus && matchDue && matchPriority && matchTag;
  });

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const selectedNotebook = notebooks.find((n) => n.id === selectedNotebookId);

  return (
    <div className="max-w-2xl mx-auto space-y-3">
      {/* 1. Header & Tiến độ */}
      <div className="pb-2 border-b border-[#262626] space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
              Hôm Nay
            </h2>
            <span className="text-[11px] font-mono font-bold bg-[#FEF08A] px-2 py-0.5 rounded border border-[#262626] shadow-[1px_1px_0px_#262626]">
              {now.getDate()}/{now.getMonth() + 1}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 && completedCount === totalCount ? (
              <div className="px-2.5 py-1 border-2 border-red-600 bg-red-50 rounded-[4px] text-red-600 font-mono font-black text-xs -rotate-6 shadow-[1.5px_1.5px_0px_#DC2626] uppercase tracking-wider animate-stamp select-none flex items-center gap-1">
                <span>HOÀN TẤT ★ 100%</span>
              </div>
            ) : (
              <div className="font-mono text-xs font-bold bg-white px-2.5 py-1 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626]">
                {completedCount}/{totalCount} Xong
              </div>
            )}
          </div>
        </div>

        {totalCount > 0 && (
          <div className="w-full h-1.5 bg-white border border-[#262626] rounded-[2px] overflow-hidden shadow-sm">
            <div
              className="h-full bg-[#BBF7D0] border-r border-[#262626] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. Quick Add Bar Tinh Gọn (Chống Ngộp Mobile) */}
      <form onSubmit={handleAddTask}>
        <div className="p-2.5 sm:p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2">
          {/* Hàng Nhập Liệu Chính */}
          <div className="flex gap-2">
            <TextInput
              placeholder="Thêm việc mới..."
              value={newTitle}
              error={inputError}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (inputError) setInputError(false);
              }}
              className="flex-1 text-xs sm:text-sm"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="shrink-0"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Thêm</span>
            </Button>
          </div>

          {/* Hàng Tùy Chọn Tinh Gọn */}
          <div className="flex items-center justify-between gap-1 text-xs pt-1 border-t border-[#D4CEBF]/50">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Nút Tag Nhanh */}
              <div className="relative inline-flex items-center">
                <span className="text-[10px] font-bold text-[#1C1917] bg-[#FEF08A] px-1.5 py-0.5 rounded border border-[#262626] inline-flex items-center gap-1">
                  <TagIcon size={10} strokeWidth={2.2} />
                  <span>#{selectedTag}</span>
                </span>
              </div>

              {/* Nút Giờ Nhanh (Nếu có) */}
              {newDueTime && (
                <span className="text-[10px] font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                  <Clock size={10} strokeWidth={2.2} />
                  <span>{newDueTime}</span>
                </span>
              )}

              {/* Nút Sổ Tay Nhanh (Nếu có) */}
              {selectedNotebook && (
                <span
                  className="text-[10px] font-bold text-[#1C1917] px-1.5 py-0.5 rounded border border-[#262626] inline-flex items-center gap-1"
                  style={{
                    backgroundColor: selectedNotebook.color || "#FEF08A",
                  }}
                >
                  <DynamicIcon
                    name={selectedNotebook.icon}
                    size={10}
                    strokeWidth={2.2}
                  />
                  <span className="truncate max-w-[80px]">
                    {selectedNotebook.name}
                  </span>
                </span>
              )}
            </div>

            {/* Nút Bật/Tắt Tùy Chọn Nâng Cao */}
            <button
              type="button"
              onClick={() => setIsExpandedOptions(!isExpandedOptions)}
              className="text-[11px] font-bold text-[#78716C] hover:text-[#1C1917] px-2 py-0.5 rounded border border-dashed border-[#D4CEBF] inline-flex items-center gap-1 active:translate-y-[0.5px]"
            >
              <span>{isExpandedOptions ? "Thu gọn" : "Tùy chọn"}</span>
              {isExpandedOptions ? (
                <ChevronUp size={12} />
              ) : (
                <ChevronDown size={12} />
              )}
            </button>
          </div>

          {/* Khung Tùy Chọn Mở Rộng (Chỉ hiện khi bấm) */}
          {isExpandedOptions && (
            <div className="pt-2 border-t border-[#D4CEBF]/60 space-y-2 animate-in fade-in duration-150">
              {/* Dải Tag */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag) => {
                  const tagStyle = getTagStyle(tag);
                  return (
                    <div
                      key={tag}
                      className="group/tag relative inline-flex items-center"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`px-2 py-0.5 rounded-[2px] border text-[11px] font-medium transition-all ${
                          selectedTag === tag
                            ? `${tagStyle.bg} ${tagStyle.border} text-[#1C1917] shadow-[1px_1px_0px_#262626] -translate-y-[0.5px] font-bold`
                            : "border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                        }`}
                      >
                        #{tag}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTag(tag);
                          if (selectedTag === tag && tags.length > 1) {
                            setSelectedTag(tags.find((t) => t !== tag) || "");
                          }
                        }}
                        title={`Xóa #${tag}`}
                        className="opacity-0 group-hover/tag:opacity-100 text-[9px] text-[#78716C] hover:text-red-500 ml-0.5 p-0.5"
                      >
                        <X size={10} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}

                {isAddingTag ? (
                  <input
                    type="text"
                    placeholder="Tên tag..."
                    value={newTagInput}
                    maxLength={15}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCreateNewTag(e);
                      } else if (e.key === "Escape") {
                        setIsAddingTag(false);
                      }
                    }}
                    onBlur={handleCreateNewTag}
                    className="w-20 px-1.5 py-0.5 text-[11px] border border-[#262626] rounded-[2px] outline-none bg-white font-sans"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="px-1.5 py-0.5 text-[11px] text-[#78716C] hover:text-[#1C1917] border border-dashed border-[#D4CEBF] rounded-[2px]"
                  >
                    + Tag mới
                  </button>
                )}
              </div>

              {/* Sổ Tay & Giờ */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <CustomSelect
                  options={notebookOptions}
                  value={selectedNotebookId}
                  onChange={setSelectedNotebookId}
                  placeholder="Gán sổ tay"
                  className="w-full"
                />

                <CustomDuePicker
                  value={newDueTime}
                  onChange={setNewDueTime}
                  mode="time-only"
                  className="w-full"
                />
              </div>

              {/* Chọn Mức Độ Ưu Tiên Khi Tạo Task */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#D4CEBF]/40">
                <span className="text-[11px] font-bold text-[#78716C] shrink-0">
                  Ưu tiên:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    {
                      key: "high",
                      label: "🔴 Gấp",
                      activeClass:
                        "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]",
                    },
                    {
                      key: "medium",
                      label: "🟡 Vừa",
                      activeClass:
                        "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]",
                    },
                    {
                      key: "low",
                      label: "🟢 Thấp",
                      activeClass:
                        "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1px_1px_0px_#262626]",
                    },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setSelectedPriority(p.key as any)}
                      className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all ${
                        selectedPriority === p.key
                          ? p.activeClass
                          : "border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* 3. Filter Bar Khoa Học & Không Bao Giờ Rớt Dòng */}
      <div className="space-y-1.5 select-none">
        <div className="p-1 bg-white border border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-center justify-between gap-1 sm:gap-2 text-xs overflow-x-auto no-scrollbar">
          {/* Nhóm lọc trạng thái chính (Cốt lõi - Segmented Control) */}
          <div className="flex items-center gap-1 shrink-0">
            {[
              { key: "all", label: "Tất cả" },
              { key: "active", label: "Cần làm" },
              { key: "completed", label: "Đã xong" },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key as any)}
                className={`px-2 sm:px-2.5 py-1 rounded-[3px] border text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === f.key
                    ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                    : "bg-[#FBF9F4] text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Nhóm nút bên phải: Bộ Lọc Nâng Cao & Xóa Lọc */}
          <div className="flex items-center gap-1 shrink-0">
            {(statusFilter !== "all" || dueFilter !== "all" || priorityFilter !== "all" || tagFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setDueFilter("all");
                  setPriorityFilter("all");
                  setTagFilter("all");
                }}
                title="Xóa toàn bộ lọc"
                className="px-1.5 sm:px-2 py-1 rounded-[3px] bg-rose-50 border border-rose-300 text-rose-700 text-[11px] font-bold flex items-center gap-0.5 hover:bg-rose-100 active:translate-y-[0.5px] whitespace-nowrap shrink-0"
              >
                <X size={12} strokeWidth={2.5} />
                <span className="hidden xs:inline sm:inline">Xóa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
              className={`px-2 sm:px-2.5 py-1 rounded-[3px] border-[1.5px] text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                isFilterDrawerOpen || (dueFilter !== "all" || priorityFilter !== "all" || tagFilter !== "all")
                  ? "bg-[#FEF08A] border-[#262626] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                  : "bg-white border-[#D4CEBF] text-[#78716C] hover:text-[#1C1917]"
              }`}
            >
              <SlidersHorizontal size={13} strokeWidth={2.2} />
              <span>Lọc</span>
              {((dueFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0)) > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#262626] text-white text-[10px] flex items-center justify-center font-mono font-bold shrink-0">
                  {(dueFilter !== "all" ? 1 : 0) + (priorityFilter !== "all" ? 1 : 0) + (tagFilter !== "all" ? 1 : 0)}
                </span>
              )}
              {isFilterDrawerOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
        </div>

        {/* Khung Bộ Lọc Nâng Cao Mở Rộng */}
        {isFilterDrawerOpen && (
          <div className="p-3 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2.5 animate-in slide-in-from-top-2 duration-150 text-xs">
            {/* 1. Mức Độ Ưu Tiên */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Ưu tiên:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "high", label: "🔴 Gấp", activeClass: "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]" },
                  { key: "medium", label: "🟡 Vừa", activeClass: "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]" },
                  { key: "low", label: "🟢 Thấp", activeClass: "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1px_1px_0px_#262626]" },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriorityFilter(p.key as any)}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all ${
                      priorityFilter === p.key
                        ? p.activeClass || "bg-[#262626] text-white border-[#262626] font-bold"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Hạn Chót */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#D4CEBF]/60">
              <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Hạn chót:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setDueFilter("all")}
                  className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                    dueFilter === "all"
                      ? "bg-[#262626] text-white border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
                      : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  Tất cả
                </button>

                {overdueCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDueFilter(dueFilter === "overdue" ? "all" : "overdue")}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 whitespace-nowrap ${
                      dueFilter === "overdue"
                        ? "bg-rose-600 text-white border-rose-700 font-bold shadow-[1px_1px_0px_#262626]"
                        : "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                    }`}
                  >
                    <AlertCircle size={12} strokeWidth={2.5} />
                    <span>Quá hạn ({overdueCount})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDueFilter(dueFilter === "today" ? "all" : "today")}
                  className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 whitespace-nowrap ${
                    dueFilter === "today"
                      ? "bg-amber-500 text-white border-amber-600 font-bold shadow-[1px_1px_0px_#262626]"
                      : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
                  }`}
                >
                  <Sun size={12} strokeWidth={2.2} />
                  <span>Hôm nay</span>
                </button>
              </div>
            </div>

            {/* 3. Nhãn Phân Loại (#Tag) */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#D4CEBF]/60">
              <span className="text-[11px] font-bold text-[#78716C] w-16 shrink-0">Nhãn tag:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setTagFilter("all")}
                  className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all ${
                    tagFilter === "all"
                      ? "bg-[#262626] text-white border-[#262626] font-bold"
                      : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  Tất cả tag
                </button>
                {tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter(tagFilter === tag ? "all" : tag)}
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all ${
                      tagFilter === tag
                        ? "border-[#262626] bg-[#FEF08A] font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:text-[#1C1917]"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Task List với Badge Hạn Chót Sắc Nét */}
      <div className="space-y-2 pt-0.5">
        {filteredTasks.length === 0 ? (
          <EmptyStateDoodle
            icon="lucide:Sun"
            title="Không có việc nào"
            message="Hãy thêm việc mới hoặc kéo việc từ Tab Kế hoạch về nhé."
          />
        ) : (
          filteredTasks.map((task, index) => {
            const assignedNotebook = notebooks.find(
              (n) => n.id === task.notebookId,
            );
            const dueInfo = getTaskDueInfo(task.dueDate);

            return (
              <div
                key={task.id}
                className={`group p-2.5 sm:p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] transition-all animate-task-pop ${getCardTilt(
                  index,
                )} ${
                  task.completed
                    ? "opacity-65 bg-[#FBF9F4]"
                    : "hover:shadow-[3px_3px_0px_#262626]"
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      <HandDrawnCheckbox
                        checked={task.completed}
                        onChange={() => toggleTask(task.id)}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="relative inline-block max-w-full">
                        <p
                          className={`text-xs sm:text-sm font-semibold text-[#1C1917] leading-snug break-all ${
                            task.completed ? "text-[#78716C]" : ""
                          }`}
                        >
                          {task.title}
                        </p>
                        {task.completed && (
                          <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#78716C] animate-ink-strike -translate-y-1/2 pointer-events-none" />
                        )}
                      </div>

                      <div className="mt-1.5 flex items-center gap-1.5 flex-wrap text-[10px]">
                        {/* 1. Badge Hạn Chót Phân Cấp (Đỏ / Cam / Xanh) */}
                        {dueInfo && !task.completed && (
                          <span
                            className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-1 font-mono ${dueInfo.badgeClass}`}
                          >
                            {dueInfo.type === "overdue" ? (
                              <AlertCircle
                                size={10}
                                strokeWidth={2.5}
                                className="text-rose-700"
                              />
                            ) : dueInfo.type === "today" ? (
                              <Clock
                                size={10}
                                strokeWidth={2.2}
                                className="text-amber-800"
                              />
                            ) : (
                              <Calendar
                                size={10}
                                strokeWidth={2.2}
                                className="text-emerald-700"
                              />
                            )}
                            <span>{dueInfo.label}</span>
                          </span>
                        )}

                        {/* Badge Mức Độ Ưu Tiên */}
                        {task.priority === "high" && !task.completed && (
                          <span className="px-1.5 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 font-bold font-mono">
                            🔴 Gấp
                          </span>
                        )}
                        {task.priority === "low" && !task.completed && (
                          <span className="px-1.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 font-mono">
                            🟢 Thấp
                          </span>
                        )}

                        {/* 2. Tag */}
                        {task.tag && (
                          <span
                            className={`${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} px-1.5 py-0.5 rounded border ${getTagStyle(task.tag).border} font-medium`}
                          >
                            #{task.tag}
                          </span>
                        )}

                        {/* 3. Sổ Tay Gán */}
                        {assignedNotebook && (
                          <span
                            className="px-1.5 py-0.5 rounded border border-[#262626] max-w-[130px] truncate inline-flex items-center gap-1 font-medium text-[#1C1917]"
                            style={{
                              backgroundColor:
                                assignedNotebook.color || "#FEF08A",
                            }}
                          >
                            <DynamicIcon
                              name={assignedNotebook.icon}
                              size={11}
                              strokeWidth={2.2}
                            />
                            <span className="truncate">
                              {assignedNotebook.name}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingTaskId(task.id)}
                    title="Xóa"
                    className="opacity-40 group-hover:opacity-100 text-[#78716C] hover:text-red-600 p-1 shrink-0 active:translate-y-[0.5px]"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Hàng Dời Lịch Sang Ngày Mai */}
                {!task.completed && (
                  <div className="mt-2 pt-1.5 border-t border-[#D4CEBF]/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => moveTaskToTomorrow(task.id)}
                      title="Dời sang ngày mai"
                      className="flex items-center gap-1 px-2.5 py-0.5 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all select-none"
                    >
                      <ArrowRight size={12} strokeWidth={2.4} />
                      <span>Ngày mai</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deletingTaskId !== null}
        title="Gỡ bỏ công việc"
        message="Bạn có chắc muốn xóa việc này không?"
        onConfirm={() => {
          if (deletingTaskId) deleteTask(deletingTaskId);
          setDeletingTaskId(null);
        }}
        onCancel={() => setDeletingTaskId(null)}
      />
    </div>
  );
};
