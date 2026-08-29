import React, { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { TaskDto, TaskPriority } from "../../../types";
import { Button } from "../../ui/Button";
import { TextInput } from "../../ui/TextInput";
import { HandDrawnCheckbox } from "../../ui/HandDrawnCheckbox";
import { EmptyStateDoodle } from "../../ui/EmptyStateDoodle";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { EditTaskModal } from "../../ui/EditTaskModal";
import { CustomEmojiPicker } from "../../ui/CustomEmojiPicker";
import { CustomColorPicker, DEFAULT_PALETTE } from "../../ui/CustomColorPicker";
import { CustomDuePicker } from "../../ui/CustomDuePicker";
import { CustomSelect, SelectOption } from "../../ui/CustomSelect";
import { DynamicIcon } from "../../ui/DynamicIcon";
import { getCardTilt } from "../../../utils/tilt";
import { getTagStyle } from "../../../utils/tagColors";
import { getTaskDueInfo } from "../../../utils/taskDueStatus";
import { getLocalTodayStr } from "../../../utils/date";
import {
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  Edit3,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  BookOpen,
  ArrowRight,
} from "lucide-react";

// ==========================================
// COMPONENT: NotebooksTab (Kệ Sách & Quản Lý Dự Án Chuyên Nghiệp)
// ==========================================

export const NotebooksTab: React.FC = () => {
  const {
    notebooks,
    addNotebook,
    deleteNotebook,
    tasks,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    tags,
    addTag,
  } = useAppStore();

  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(
    null,
  );

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newNbName, setNewNbName] = useState("");
  const [newNbDesc, setNewNbDesc] = useState("");
  const [newNbColor, setNewNbColor] = useState("#FEF08A");
  const [newNbIcon, setNewNbIcon] = useState("lucide:BookMarked");
  const [nameError, setNameError] = useState(false);

  // Form tạo task nâng cao trong sổ
  const [drillTaskTitle, setDrillTaskTitle] = useState("");
  const [drillTaskDueDate, setDrillTaskDueDate] = useState<string | undefined>(
    undefined,
  );
  const [drillTaskDueTime, setDrillTaskDueTime] = useState<string | undefined>(
    undefined,
  );
  const [drillTaskPriority, setDrillTaskPriority] =
    useState<TaskPriority>("medium");
  const [drillTaskTag, setDrillTaskTag] = useState<string>(
    tags[0] || "Công việc",
  );
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [isExpandForm, setIsExpandForm] = useState(false);

  // Bộ lọc bên trong sổ tay
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "completed"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "high" | "medium" | "low"
  >("all");

  // State chỉnh sửa task (Edit Task Modal)
  const [editingTask, setEditingTask] = useState<TaskDto | null>(null);

  const [confirmDeleteNbId, setConfirmDeleteNbId] = useState<string | null>(
    null,
  );
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const handleSaveInlineNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNbName.trim()) {
      setNameError(true);
      return;
    }

    addNotebook({
      name: newNbName.trim(),
      description: newNbDesc.trim(),
      color: newNbColor,
      icon: newNbIcon.trim() || "lucide:BookMarked",
    });

    setNewNbName("");
    setNewNbDesc("");
    setNewNbColor("#FEF08A");
    setNewNbIcon("lucide:BookMarked");
    setNameError(false);
    setIsCreatingInline(false);
  };

  const handleCancelInline = () => {
    setNewNbName("");
    setNewNbDesc("");
    setNameError(false);
    setIsCreatingInline(false);
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) {
      setIsAddingTag(false);
      return;
    }
    addTag(newTagInput.trim());
    setDrillTaskTag(newTagInput.trim());
    setNewTagInput("");
    setIsAddingTag(false);
  };

  const handleOpenEditModal = (task: TaskDto) => {
    setEditingTask(task);
  };

  const activeNotebook = notebooks.find((n) => n.id === selectedNotebookId);
  const activeNotebookTasks = tasks.filter(
    (t) => t.notebookId === selectedNotebookId,
  );
  const nbCompletedCount = activeNotebookTasks.filter(
    (t) => t.completed,
  ).length;
  const nbTotalCount = activeNotebookTasks.length;
  const nbPercent =
    nbTotalCount > 0 ? Math.round((nbCompletedCount / nbTotalCount) * 100) : 0;

  // Lọc task trong sổ
  const filteredTasks = activeNotebookTasks.filter((t) => {
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
          ? !t.completed
          : t.completed;

    const matchPriority =
      priorityFilter === "all"
        ? true
        : (t.priority || "medium") === priorityFilter;

    return matchStatus && matchPriority;
  });

  // VIEW: CHI TIẾT CUỐN SỔ
  if (activeNotebook) {
    return (
      <div className="space-y-4 max-w-2xl lg:max-w-6xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <button
            onClick={() => setSelectedNotebookId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            ← Quay lại kệ sổ tay
          </button>

          <button
            onClick={() => setConfirmDeleteNbId(activeNotebook.id)}
            className="text-xs text-[#78716C] hover:text-red-600 hover:underline font-medium"
          >
            Xóa cuốn sổ này
          </button>
        </div>

        {/* Bố Cục 2 Cột Desktop: Trái = Thông tin Sổ | Phải = Danh Sách Việc */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
          {/* CỘT TRÁI (4 Cột): Banner, Tiến Độ & Thống Kê Sổ */}
          <div className="lg:col-span-4 space-y-3.5">
            {/* Notebook Banner */}
            <div
              className="p-4 rounded-[6px] border-[1.5px] border-[#262626] shadow-[2.5px_2.5px_0px_#262626] space-y-3"
              style={{ backgroundColor: activeNotebook.color }}
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] shrink-0 flex items-center justify-center">
                  <DynamicIcon
                    name={activeNotebook.icon}
                    size={24}
                    strokeWidth={2.2}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-[#1C1917] truncate">
                    {activeNotebook.name}
                  </h2>
                  <span className="font-mono text-[10px] font-bold text-[#1C1917] bg-white/70 px-1.5 py-0.2 rounded border border-[#262626]">
                    {nbTotalCount} công việc
                  </span>
                </div>
              </div>

              {activeNotebook.description && (
                <p className="text-xs text-[#1C1917]/90 leading-relaxed bg-white/40 p-2.5 rounded border border-[#262626]/20">
                  {activeNotebook.description}
                </p>
              )}
            </div>

            {/* Thẻ Thống Kê Tiến Độ Của Cuốn Sổ */}
            <div className="p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1C1917]">
                  Tiến độ hoàn thành:
                </span>
                <span className="font-mono font-bold text-emerald-900 bg-[#BBF7D0] px-1.5 py-0.2 rounded border border-[#262626]">
                  {nbPercent}%
                </span>
              </div>

              <div className="w-full h-2 bg-[#F3EFE6] border border-[#262626] rounded-[2px] overflow-hidden">
                <div
                  className="h-full bg-[#BBF7D0] border-r border-[#262626] transition-all duration-300"
                  style={{ width: `${nbPercent}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1 text-xs">
                <div className="p-2 bg-[#FBF9F4] border border-[#D4CEBF] rounded">
                  <p className="text-[10px] text-[#78716C]">Cần làm</p>
                  <p className="text-sm font-bold font-mono text-[#1C1917]">
                    {nbTotalCount - nbCompletedCount}
                  </p>
                </div>
                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                  <p className="text-[10px] text-emerald-800">Đã xong</p>
                  <p className="text-sm font-bold font-mono text-emerald-900">
                    {nbCompletedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (8 Cột): Quick Add Nâng Cao & Danh Sách Việc */}
          <div className="lg:col-span-8 space-y-3">
            {/* Form Thêm Việc Nâng Cao Vào Sổ */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!drillTaskTitle.trim()) return;

                let finalDueDate: string | undefined = undefined;
                if (drillTaskDueDate) {
                  finalDueDate = drillTaskDueTime
                    ? `${drillTaskDueDate} ${drillTaskDueTime}`
                    : drillTaskDueDate;
                }

                addTask({
                  title: drillTaskTitle.trim(),
                  notebookId: activeNotebook.id,
                  dueDate: finalDueDate,
                  tag: drillTaskTag,
                  priority: drillTaskPriority,
                });

                setDrillTaskTitle("");
                setDrillTaskDueDate(undefined);
                setDrillTaskDueTime(undefined);
                setDrillTaskPriority("medium");
              }}
              className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] space-y-2.5"
            >
              <div className="flex gap-2">
                <TextInput
                  placeholder={`Thêm việc vào sổ "${activeNotebook.name}"...`}
                  value={drillTaskTitle}
                  onChange={(e) => setDrillTaskTitle(e.target.value)}
                  className="flex-1 text-xs sm:text-sm bg-[#FBF9F4]"
                />
                <button
                  type="button"
                  onClick={() => setIsExpandForm(!isExpandForm)}
                  className={`px-2 py-1 border border-[#262626] rounded-[4px] text-xs font-bold transition-all flex items-center gap-0.5 shrink-0 ${
                    isExpandForm ||
                    drillTaskDueDate ||
                    drillTaskPriority !== "medium"
                      ? "bg-[#FEF08A] text-[#1C1917] shadow-[1px_1px_0px_#262626]"
                      : "bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                  }`}
                >
                  <span>{isExpandForm ? "Thu gọn" : "+ Tùy chọn"}</span>
                  {isExpandForm ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
                <Button type="submit" variant="primary">
                  + Thêm
                </Button>
              </div>

              {/* Tùy Chọn Mở Rộng: Hạn Chót, Ưu Tiên, Tag (Chỉ bung ra khi bấm + Tùy chọn) */}
              {isExpandForm && (
                <div className="pt-2 border-t border-[#D4CEBF]/60 space-y-2 text-xs animate-in slide-in-from-top-1">
                  {/* 1. Chọn Hạn Chót */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#78716C] shrink-0 w-16">
                      Hạn chót:
                    </span>
                    <div className="w-auto min-w-[120px] max-w-[180px]">
                      <CustomDuePicker
                        value={drillTaskDueDate}
                        onChange={setDrillTaskDueDate}
                        mode="datetime"
                      />
                    </div>
                  </div>

                  {/* 2. Chọn Độ Ưu Tiên */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#78716C] shrink-0 w-16">
                      Ưu tiên:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        {
                          key: "high",
                          label: "Gấp",
                          dotClass: "bg-rose-500",
                          activeClass:
                            "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1px_1px_0px_#262626]",
                        },
                        {
                          key: "medium",
                          label: "Vừa",
                          dotClass: "bg-amber-400",
                          activeClass:
                            "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1px_1px_0px_#262626]",
                        },
                        {
                          key: "low",
                          label: "Thấp",
                          dotClass: "bg-emerald-500",
                          activeClass:
                            "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1px_1px_0px_#262626]",
                        },
                      ].map((p) => (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => setDrillTaskPriority(p.key as any)}
                          className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all flex items-center gap-1 whitespace-nowrap ${
                            drillTaskPriority === p.key
                              ? p.activeClass
                              : "border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${p.dotClass}`}
                          />
                          <span>{p.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Chọn Nhãn #Tag */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#78716C] shrink-0 w-16">
                      Nhãn tag:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap flex-1">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setDrillTaskTag(tag)}
                          className={`px-2 py-0.5 rounded-[3px] border text-[11px] transition-all whitespace-nowrap ${
                            drillTaskTag === tag
                              ? "bg-[#262626] text-white border-[#262626] font-bold shadow-[1px_1px_0px_#262626]"
                              : "border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}

                      {isAddingTag ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Tag mới..."
                            value={newTagInput}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleCreateNewTag(e)
                            }
                            className="w-20 px-1.5 py-0.5 text-[11px] bg-white border border-[#262626] rounded outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleCreateNewTag}
                            className="px-1.5 py-0.5 bg-[#FEF08A] border border-[#262626] rounded text-[10px] font-bold"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsAddingTag(false)}
                            className="text-[11px] text-[#78716C]"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsAddingTag(true)}
                          className="px-1.5 py-0.5 text-[11px] text-[#78716C] hover:text-[#1C1917] hover:underline"
                        >
                          + Tag
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {/* Filter Bar Cốt Lõi Bên Trong Sổ */}
            <div className="p-1 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626] flex items-center justify-between gap-1 text-xs select-none flex-wrap">
              <div className="flex items-center gap-1">
                {[
                  { key: "all", label: `Tất cả (${nbTotalCount})` },
                  {
                    key: "active",
                    label: `Cần làm (${nbTotalCount - nbCompletedCount})`,
                  },
                  { key: "completed", label: `Đã xong (${nbCompletedCount})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setStatusFilter(f.key as any)}
                    className={`px-2 sm:px-2.5 py-1 rounded-[3px] border text-xs font-bold transition-all whitespace-nowrap ${
                      statusFilter === f.key
                        ? "bg-[#262626] text-white border-[#262626] shadow-[1px_1px_0px_#262626]"
                        : "bg-[#FBF9F4] text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Lọc Ưu Tiên Chuẩn SketchTask (Không Dính Lỗi Blue Native) */}
              <div className="flex items-center gap-1">
                {priorityFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setPriorityFilter("all")}
                    className="text-[10px] text-rose-600 font-bold hover:underline px-1"
                  >
                    ✕ Xóa lọc
                  </button>
                )}
                <div className="w-28 sm:w-32">
                  <CustomSelect
                    value={priorityFilter}
                    onChange={(val) => setPriorityFilter(val as any)}
                    align="right"
                    placeholder="Mức ưu tiên"
                    options={[
                      {
                        value: "all",
                        label: "Tất cả",
                        icon: "lucide:SlidersHorizontal",
                      },
                      {
                        value: "high",
                        label: "🔴 Gấp",
                        icon: "lucide:AlertCircle",
                      },
                      {
                        value: "medium",
                        label: "🟡 Vừa",
                        icon: "lucide:Clock",
                      },
                      {
                        value: "low",
                        label: "🟢 Thấp",
                        icon: "lucide:CheckCheck",
                      },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Task List Với Đầy Đủ Badge & Nút Sửa Task */}
            <div className="space-y-2 pt-0.5">
              {filteredTasks.length === 0 ? (
                <EmptyStateDoodle
                  icon="lucide:BookOpen"
                  title="Không có việc nào phù hợp"
                  message="Hãy thêm việc mới hoặc đổi bộ lọc phía trên nhé."
                />
              ) : (
                filteredTasks.map((t, idx) => {
                  const dueInfo = getTaskDueInfo(t);
                  return (
                    <div
                      key={t.id}
                      className={`group p-2.5 sm:p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] flex items-start justify-between gap-2.5 transition-all ${getCardTilt(
                        idx,
                      )} ${
                        t.completed
                          ? "opacity-65 bg-[#FBF9F4]"
                          : "hover:shadow-[3px_3px_0px_#262626]"
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <div className="pt-0.5 shrink-0">
                          <HandDrawnCheckbox
                            checked={t.completed}
                            onChange={() => toggleTask(t.id)}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="relative inline-block max-w-full">
                            <p
                              className={`text-xs sm:text-sm font-semibold text-[#1C1917] leading-snug break-all ${
                                t.completed ? "line-through text-[#78716C]" : ""
                              }`}
                            >
                              {t.title}
                            </p>
                          </div>

                          {/* Badges: Lịch làm / Hạn Chót, Ưu Tiên, Tag */}
                          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                            {/* 1. Badge Lịch làm / Hạn Chót */}
                            {dueInfo && !t.completed && (
                              <span
                                className={`px-1.5 py-0.5 rounded border inline-flex items-center gap-1 font-mono ${dueInfo.badgeClass}`}
                              >
                                {dueInfo.iconName === "alert" ? (
                                  <AlertCircle
                                    size={10}
                                    strokeWidth={2.5}
                                    className="text-rose-700"
                                  />
                                ) : dueInfo.iconName === "hourglass" ? (
                                  <Clock
                                    size={10}
                                    strokeWidth={2.2}
                                    className="text-amber-800"
                                  />
                                ) : dueInfo.iconName === "clock" ? (
                                  <Clock
                                    size={10}
                                    strokeWidth={2.2}
                                    className="text-[#1C1917]"
                                  />
                                ) : (
                                  <CalendarIcon
                                    size={10}
                                    strokeWidth={2.2}
                                    className="text-emerald-700"
                                  />
                                )}
                                <span>{dueInfo.label}</span>
                              </span>
                            )}

                            {/* 2. Badge Mức Độ Ưu Tiên */}
                            {t.priority && (
                              <span
                                className={`px-1.5 py-0.5 rounded border font-medium inline-flex items-center gap-1 ${
                                  t.priority === "high"
                                    ? "bg-rose-50 text-rose-700 border-rose-300"
                                    : t.priority === "low"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                                      : "bg-amber-50 text-amber-700 border-amber-300"
                                }`}
                              >
                                <span
                                  className={`w-1 h-1 rounded-full ${
                                    t.priority === "high"
                                      ? "bg-rose-600"
                                      : t.priority === "low"
                                        ? "bg-emerald-600"
                                        : "bg-amber-500"
                                  }`}
                                />
                                <span>
                                  {t.priority === "high"
                                    ? "Gấp"
                                    : t.priority === "low"
                                      ? "Thấp"
                                      : "Vừa"}
                                </span>
                              </span>
                            )}

                            {/* 3. Badge #Tag */}
                            {t.tag && (
                              <span
                                className={`${getTagStyle(t.tag).bg} ${getTagStyle(t.tag).text} px-1.5 py-0.5 rounded border ${getTagStyle(t.tag).border} font-medium`}
                              >
                                #{t.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nút Sửa & Xóa */}
                      <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(t)}
                          title="Chỉnh sửa việc"
                          className="p-1 hover:bg-[#FEF08A] rounded border border-transparent hover:border-[#262626] text-[#78716C] hover:text-[#1C1917] active:translate-y-[0.5px]"
                        >
                          <Edit3 size={13} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingTaskId(t.id)}
                          title="Xóa việc"
                          className="p-1 hover:bg-rose-100 rounded border border-transparent hover:border-[#262626] text-[#78716C] hover:text-red-600 active:translate-y-[0.5px]"
                        >
                          <Trash2 size={13} strokeWidth={2.2} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Chỉnh Sửa Chi Tiết Task (Edit Task Modal) */}
        <EditTaskModal
          task={editingTask}
          isOpen={editingTask !== null}
          onClose={() => setEditingTask(null)}
        />

        <ConfirmModal
          isOpen={confirmDeleteNbId !== null}
          title="Xóa cuốn sổ tay"
          message="Bạn có chắc muốn xóa cuốn sổ này không? Các việc bên trong sẽ được giữ lại."
          onConfirm={() => {
            if (confirmDeleteNbId) deleteNotebook(confirmDeleteNbId);
            setConfirmDeleteNbId(null);
            setSelectedNotebookId(null);
          }}
          onCancel={() => setConfirmDeleteNbId(null)}
        />

        <ConfirmModal
          isOpen={deletingTaskId !== null}
          title="Gỡ bỏ công việc"
          message="Bạn có chắc muốn xóa công việc này khỏi sổ không?"
          onConfirm={() => {
            if (deletingTaskId) deleteTask(deletingTaskId);
            setDeletingTaskId(null);
          }}
          onCancel={() => setDeletingTaskId(null)}
        />
      </div>
    );
  }

  // VIEW: KỆ SỔ TAY
  return (
    <div className="space-y-4 max-w-2xl lg:max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
            Kệ Sổ Tay
          </h2>
          <p className="text-xs text-[#78716C] mt-0.5">
            Quản lý công việc theo từng dự án và chủ đề riêng biệt
          </p>
        </div>

        {!isCreatingInline && (
          <Button
            onClick={() => setIsCreatingInline(true)}
            variant="primary"
            size="sm"
          >
            + Cuốn sổ mới
          </Button>
        )}
      </div>

      {/* Grid Kệ Sách Đa Cột Desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Form Tạo Sổ Inline */}
        {isCreatingInline ? (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 p-4 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <span
                  className="w-7 h-7 rounded border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
                  style={{ backgroundColor: newNbColor }}
                >
                  <DynamicIcon name={newNbIcon} size={15} strokeWidth={2.2} />
                </span>
                <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
                  Phác thảo sổ mới
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelInline}
                title="Đóng"
                className="text-xs text-[#78716C] hover:text-[#1C1917] font-bold p-1 bg-white border border-[#D4CEBF] rounded flex items-center justify-center active:translate-y-[0.5px]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveInlineNotebook} className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#1C1917] mb-0.5">
                    Tên cuốn sổ:
                  </label>
                  <input
                    type="text"
                    placeholder="vd: Dự Án Web, Học Tiếng Anh..."
                    value={newNbName}
                    maxLength={30}
                    onChange={(e) => {
                      setNewNbName(e.target.value);
                      if (nameError) setNameError(false);
                    }}
                    className={`w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border ${
                      nameError
                        ? "border-red-500 bg-red-50"
                        : "border-[#262626]"
                    } rounded-[4px] outline-none font-sans`}
                  />
                  {nameError && (
                    <p className="text-[10px] text-red-600 mt-0.5">
                      ⚠️ Vui lòng nhập tên sổ
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#1C1917] mb-0.5">
                    Mô tả ngắn:
                  </label>
                  <input
                    type="text"
                    placeholder="Ghi chú mục tiêu..."
                    value={newNbDesc}
                    maxLength={80}
                    onChange={(e) => setNewNbDesc(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#262626] rounded-[4px] outline-none font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#D4CEBF]/60">
                <div className="flex items-center gap-2">
                  <CustomEmojiPicker
                    value={newNbIcon}
                    onChange={setNewNbIcon}
                    align="left"
                  />
                  <CustomColorPicker
                    value={newNbColor}
                    onChange={setNewNbColor}
                    label="Màu bìa"
                    align="right"
                  />
                </div>

                <div className="flex items-center">
                  <Button type="submit" variant="primary" size="md">
                    ✓ Tạo sổ ngay
                  </Button>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingInline(true)}
            className="p-4 bg-white/70 hover:bg-white border-[1.5px] border-dashed border-[#262626] hover:border-solid rounded-[6px] shadow-[2px_2px_0px_#262626] hover:shadow-[3px_3px_0px_#262626] transition-all flex flex-col items-center justify-center min-h-[145px] text-center group"
          >
            <span className="w-10 h-10 rounded-[4px] border border-dashed border-[#262626] bg-[#FEF08A] flex items-center justify-center shadow-[1px_1px_0px_#262626] group-hover:rotate-6 transition-transform">
              <DynamicIcon
                name="lucide:BookMarked"
                size={20}
                strokeWidth={2.2}
              />
            </span>
            <span className="font-bold text-xs sm:text-sm text-[#1C1917] mt-2">
              + Phác thảo cuốn sổ mới
            </span>
          </button>
        )}

        {/* Các Cuốn Sổ Hiện Có Với Thanh Tiến Độ */}
        {notebooks.map((nb, idx) => {
          const nbTasks = tasks.filter((t) => t.notebookId === nb.id);
          const total = nbTasks.length;
          const done = nbTasks.filter((t) => t.completed).length;
          const percent = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div
              key={nb.id}
              onClick={() => setSelectedNotebookId(nb.id)}
              className={`p-3.5 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] hover:shadow-[4px_4px_0px_#262626] hover:-translate-y-[1px] transition-all cursor-pointer flex flex-col justify-between min-h-[145px] ${
                idx % 2 === 0 ? "-rotate-[0.5deg]" : "rotate-[0.5deg]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="w-8 h-8 rounded-[4px] border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
                    style={{ backgroundColor: nb.color }}
                  >
                    <DynamicIcon name={nb.icon} size={16} strokeWidth={2.2} />
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#1C1917] bg-[#F3EFE6] px-2 py-0.5 rounded border border-[#D4CEBF]">
                    {done}/{total} Xong
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-[#1C1917] truncate">
                  {nb.name}
                </h3>
                {nb.description && (
                  <p className="text-xs text-[#78716C] mt-1 line-clamp-2 leading-relaxed">
                    {nb.description}
                  </p>
                )}
              </div>

              <div className="pt-2.5 space-y-1.5">
                {total > 0 && (
                  <div className="w-full h-1.5 bg-[#F3EFE6] border border-[#262626] rounded-[1px] overflow-hidden">
                    <div
                      className="h-full bg-[#BBF7D0] border-r border-[#262626] transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                )}
                <div className="border-t border-[#D4CEBF]/60 pt-1 text-[11px] text-[#78716C] flex justify-between items-center font-medium">
                  <span>Mở sổ tay</span>
                  <span>➔</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
