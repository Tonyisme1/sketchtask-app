import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TaskDto, TaskPriority } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";
import { CustomDuePicker, TaskTimeValue } from "./CustomDuePicker";
import { Edit3, X, Check, Tag as TagIcon, Plus } from "lucide-react";
import { getTagStyle } from "../../utils/tagColors";
import { registerBackHandler } from "../../utils/backNavigation";

// ==========================================
// COMPONENT: EditTaskModal (Modal Toàn Màn Hình Chuẩn SettingsModal & Nền Mờ Sâu)
// Tích hợp AutoResizeTextarea và Bộ Chọn Thời Gian Kép Chuẩn
// ==========================================

interface EditTaskModalProps {
  task: TaskDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { notebooks, tags, updateTask, addTag } = useAppStore();

  const [title, setTitle] = useState("");
  const [notebookId, setNotebookId] = useState("");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [timeData, setTimeData] = useState<TaskTimeValue | undefined>(undefined);
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [selectedTag, setSelectedTag] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");

  // Nạp dữ liệu khi mở task
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setNotebookId(task.notebookId || "");
      setDueDate(task.dueDate || undefined);
      setTimeData({
        timeType: task.timeType,
        date: task.dueDate ? task.dueDate.split(" ")[0] : undefined,
        startTime: task.startTime,
        endTime: task.endTime,
        deadlineDate: task.deadlineDate,
        deadlineTime: task.deadlineTime,
      });
      setPriority((task.priority as any) || "medium");
      setSelectedTag(task.tag || "");
      setIsAddingTag(false);
      setNewTagInput("");
    }
  }, [task, isOpen]);

  // Đăng ký phím Back phần cứng
  useEffect(() => {
    if (!isOpen) return;
    return registerBackHandler(() => {
      onClose();
      return true;
    });
  }, [isOpen, onClose]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    updateTask(task.id, {
      title: title.trim(),
      notebookId: notebookId || undefined,
      dueDate: dueDate || undefined,
      timeType: timeData?.timeType,
      startTime: timeData?.startTime,
      endTime: timeData?.endTime,
      deadlineDate: timeData?.deadlineDate,
      deadlineTime: timeData?.deadlineTime,
      priority,
      tag: selectedTag || undefined,
    });

    onClose();
  };

  const handleCreateNewTag = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      const cleanTag = newTagInput.trim().replace(/^#/, "");
      addTag(cleanTag);
      setSelectedTag(cleanTag);
      setNewTagInput("");
    }
    setIsAddingTag(false);
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0, 0, 0, 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        touchAction: "none",
      }}
      className="flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[8px] shadow-[6px_6px_0px_#262626] p-4 sm:p-5 flex flex-col justify-between overflow-hidden animate-in zoom-in-95 duration-200 z-[1000000] max-h-[92vh]"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#262626] shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#FEF08A] border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626]">
              <Edit3 size={15} strokeWidth={2.4} className="text-[#1C1917]" />
            </span>
            <h3 className="font-bold text-sm sm:text-base text-[#1C1917]">
              Chỉnh sửa công việc
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 active:translate-y-[0.5px] transition-all"
            title="Đóng cửa sổ"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        {/* Form Chỉnh Sửa Cuộn Mượt */}
        <form
          onSubmit={handleSave}
          className="space-y-3.5 text-xs overflow-y-auto no-scrollbar py-3 flex-1"
        >
          {/* 1. Tiêu Đề Công Việc: Tự Co Giãn Theo Chuỗi Ký Tự */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#1C1917] text-[11px]">
                Nội dung công việc:
              </label>
              <span className="text-[10px] font-mono text-[#78716C]">
                {title.length}/250
              </span>
            </div>
            <AutoResizeTextarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề việc cần làm..."
              minRows={2}
              maxRows={6}
              maxLength={250}
              autoFocus
            />
          </div>

          {/* 2. Thuộc Cuốn Sổ & Bộ Chọn Thời Gian Kép */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
                Thuộc cuốn sổ:
              </label>
              <CustomSelect
                value={notebookId}
                onChange={(val) => setNotebookId(val)}
                options={[
                  { value: "", label: "Không gán sổ" },
                  ...notebooks.map((nb) => ({
                    value: nb.id,
                    label: nb.name,
                    icon: nb.icon,
                  })),
                ]}
                className="w-full"
              />
            </div>

            <div>
              <label className="font-bold text-[#1C1917] text-[11px] block mb-1">
                Lịch hẹn & Hạn chót:
              </label>
              <CustomDuePicker
                value={dueDate}
                timeData={timeData}
                onChange={(val, tData) => {
                  setDueDate(val);
                  setTimeData(tData);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* 3. Mức Độ Ưu Tiên */}
          <div>
            <label className="font-bold text-[#1C1917] text-[11px] block mb-1.5">
              Mức độ ưu tiên:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPriority("high")}
                className={`py-1.5 px-2 rounded-[5px] border-[1.5px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  priority === "high"
                    ? "bg-[#FECDD3] text-rose-900 border-[#262626] shadow-[2px_2px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Gấp</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("medium")}
                className={`py-1.5 px-2 rounded-[5px] border-[1.5px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  priority === "medium"
                    ? "bg-[#FEF08A] text-amber-900 border-[#262626] shadow-[2px_2px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Vừa</span>
              </button>

              <button
                type="button"
                onClick={() => setPriority("low")}
                className={`py-1.5 px-2 rounded-[5px] border-[1.5px] font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                  priority === "low"
                    ? "bg-[#BBF7D0] text-emerald-900 border-[#262626] shadow-[2px_2px_0px_#262626]"
                    : "bg-white text-[#78716C] border-[#D4CEBF] hover:border-[#262626]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Thấp</span>
              </button>
            </div>
          </div>

          {/* 4. Gán Nhãn Phân Loại (#Tag) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-[#1C1917] text-[11px] flex items-center gap-1">
                <TagIcon size={12} strokeWidth={2.2} />
                <span>Gán nhãn phân loại:</span>
              </label>
            </div>
            <div className="p-2 bg-white border border-[#262626] rounded-[5px] flex flex-wrap gap-1.5 max-h-28 overflow-y-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedTag("")}
                className={`px-2 py-0.5 rounded-[4px] border text-[11px] font-medium transition-all ${
                  !selectedTag
                    ? "bg-[#262626] text-white border-[#262626]"
                    : "bg-gray-100 text-[#78716C] border-[#D4CEBF]"
                }`}
              >
                Không nhãn
              </button>
              {tags.map((tg) => {
                const isSelected = selectedTag === tg;
                const style = getTagStyle(tg);
                return (
                  <button
                    key={tg}
                    type="button"
                    onClick={() => setSelectedTag(tg)}
                    style={{
                      backgroundColor: isSelected ? style.bg : style.lightBg,
                      color: style.text,
                      borderColor: isSelected ? style.border : "#D4CEBF",
                      fontWeight: isSelected ? "bold" : "normal",
                    }}
                    className={`px-2 py-0.5 rounded-[4px] border text-[11px] flex items-center gap-1 transition-all ${
                      isSelected ? "shadow-[1px_1px_0px_#262626]" : ""
                    }`}
                  >
                    <span>#{tg}</span>
                    {isSelected && <Check size={11} strokeWidth={2.5} />}
                  </button>
                );
              })}

              {/* Thêm nhanh tag mới */}
              {isAddingTag ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Tên tag..."
                    className="w-20 px-1.5 py-0.5 text-[11px] border border-[#262626] rounded focus:outline-none bg-[#FCFBF9]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateNewTag(e);
                      if (e.key === "Escape") setIsAddingTag(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateNewTag}
                    className="p-1 bg-[#BBF7D0] border border-[#262626] rounded text-[10px] font-bold"
                  >
                    <Check size={10} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="p-1 bg-white border border-[#262626] rounded text-[10px]"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="px-2 py-0.5 border border-dashed border-[#78716C] rounded-[4px] text-[11px] text-[#78716C] hover:text-[#1C1917] hover:border-[#262626] flex items-center gap-1 bg-white"
                >
                  <Plus size={11} />
                  <span>Tag mới</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer Form: Nút Hủy & Nút Lưu Thay Đổi */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626] shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="px-4 text-xs font-bold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="px-5 text-xs font-bold shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none flex items-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.4} />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
