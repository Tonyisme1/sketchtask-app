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
import {
  ArrowRight,
  Clock,
  Tag as TagIcon,
  X,
  Plus,
} from "lucide-react";

import { getLocalTodayStr, isTaskForDate } from "../../../utils/date";

// ==========================================
// COMPONENT: TodayTab (Gọn Gàng - Icon Hiện Đại)
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
  const [selectedTag, setSelectedTag] = useState<string>(tags[0] || "Công việc");
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>("");
  const [inputError, setInputError] = useState(false);

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const handleAddTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTitle.trim()) {
      setInputError(true);
      return;
    }

    const finalDueDate = newDueTime ? `${todayStr} ${newDueTime}` : `${todayStr}`;

    addTask({
      title: newTitle.trim(),
      dueDate: finalDueDate,
      tag: selectedTag,
      notebookId: selectedNotebookId || undefined,
    });

    setNewTitle("");
    setNewDueTime(undefined);
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

  // Lọc task của Hôm nay: Bao gồm task có dueDate trùng ngày hôm nay HOẶC task không gán ngày
  const todayTasks = tasks.filter((task) => {
    return isTaskForDate(task.dueDate, todayStr);
  });

  const filteredTasks = todayTasks.filter((task) => {
    if (hideCompletedTasks && statusFilter === "all" && task.completed) return false;
    const matchStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? !task.completed
        : task.completed;

    const matchTag = tagFilter === "all" ? true : task.tag === tagFilter;
    return matchStatus && matchTag;
  });

  const completedCount = todayTasks.filter((t) => t.completed).length;
  const totalCount = todayTasks.length;
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-3.5">
      {/* 1. Header & Tiến độ */}
      <div className="pb-2 border-b border-[#262626] space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
              Hôm Nay
            </h2>
            <span className="text-[11px] font-mono font-bold bg-[#FEF08A] px-1.5 py-0.2 rounded border border-[#262626]">
              {now.getDate()}/{now.getMonth() + 1}
            </span>
          </div>

          <div className="font-mono text-xs font-bold bg-white px-2 py-0.5 border-[1.5px] border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
            {completedCount}/{totalCount} Xong
          </div>
        </div>

        {totalCount > 0 && (
          <div className="w-full h-1.5 bg-white border border-[#262626] rounded-[2px] overflow-hidden">
            <div
              className="h-full bg-[#BBF7D0] border-r border-[#262626] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* 2. Quick Add Bar */}
      <form onSubmit={handleAddTask}>
        <div className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[2px_2px_0px_#262626] space-y-2">
          <div className="flex gap-2">
            <TextInput
              placeholder="Thêm việc hôm nay..."
              value={newTitle}
              error={inputError}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (inputError) setInputError(false);
              }}
              className="flex-1 text-xs sm:text-sm"
            />
            <Button type="submit" variant="primary" size="md">
              + Thêm
            </Button>
          </div>

          {/* Dải Tag */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {tags.map((tag) => {
              const tagStyle = getTagStyle(tag);
              return (
                <div key={tag} className="group/tag relative inline-flex items-center">
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
                autoFocus
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
                className="w-18 px-1.5 py-0.5 text-[11px] border border-[#262626] rounded-[2px] outline-none bg-white font-sans"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="px-1.5 py-0.5 text-[11px] text-[#78716C] hover:text-[#1C1917] border border-dashed border-[#D4CEBF] rounded-[2px]"
              >
                + Tag
              </button>
            )}
          </div>

          {/* Sổ Tay & Giờ */}
          <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-[#D4CEBF]/60 text-xs">
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
        </div>
      </form>

      {/* 3. Filter Bar */}
      <div className="p-2 bg-white border border-[#D4CEBF] rounded-[4px] flex items-center justify-between gap-2 text-xs flex-wrap">
        <div className="flex items-center gap-1">
          {[
            { key: "all", label: "Tất cả" },
            { key: "active", label: "Cần làm" },
            { key: "completed", label: "Xong" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key as any)}
              className={`px-2 py-0.5 rounded-[3px] border text-xs transition-all ${
                statusFilter === f.key
                  ? "bg-[#262626] text-white border-[#262626] font-bold"
                  : "bg-[#FBF9F4] text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {["all", ...tags].map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`px-1.5 py-0.2 rounded border text-[11px] transition-all ${
                tagFilter === tag
                  ? "border-[#262626] bg-[#FEF08A] font-bold"
                  : "border-transparent text-[#78716C] hover:text-[#1C1917]"
              }`}
            >
              {tag === "all" ? "Tất cả tag" : `#${tag}`}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Task List */}
      <div className="space-y-2 pt-0.5">
        {filteredTasks.length === 0 ? (
          <EmptyStateDoodle
            icon="lucide:Sun"
            title="Hôm nay chưa có việc nào"
            message="Hãy thêm việc mới hoặc kéo việc từ Tab Kế hoạch về nhé."
          />
        ) : (
          filteredTasks.map((task, index) => {
            const assignedNotebook = notebooks.find((n) => n.id === task.notebookId);
            return (
              <div
                key={task.id}
                className={`group p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] transition-all ${getCardTilt(
                  index
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
                      <p
                        className={`text-xs sm:text-sm font-semibold text-[#1C1917] leading-snug break-all ${
                          task.completed ? "line-through text-[#78716C]" : ""
                        }`}
                      >
                        {task.title}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
                        {task.dueDate && (
                          <span className="font-mono text-[#78716C] bg-[#F3EFE6] px-1.5 py-0.2 rounded border border-[#D4CEBF] inline-flex items-center gap-1">
                            <Clock size={10} strokeWidth={2.2} />
                            <span>{task.dueDate.includes(" ") ? task.dueDate.split(" ")[1] : "Hôm nay"}</span>
                          </span>
                        )}

                        {task.tag && (
                          <span
                            className={`${getTagStyle(task.tag).bg} ${getTagStyle(task.tag).text} px-1.5 py-0.2 rounded border ${getTagStyle(task.tag).border} font-medium`}
                          >
                            #{task.tag}
                          </span>
                        )}

                        {assignedNotebook && (
                          <span
                            className="px-1.5 py-0.2 rounded border border-[#262626] max-w-[130px] truncate inline-flex items-center gap-1 font-medium text-[#1C1917]"
                            style={{ backgroundColor: assignedNotebook.color || "#FEF08A" }}
                          >
                            <DynamicIcon name={assignedNotebook.icon} size={11} strokeWidth={2.2} />
                            <span className="truncate">{assignedNotebook.name}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingTaskId(task.id)}
                    title="Xóa"
                    className="opacity-40 group-hover:opacity-100 text-[#78716C] hover:text-red-600 p-1 shrink-0"
                  >
                    <X size={13} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Hàng Dời Lịch */}
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
