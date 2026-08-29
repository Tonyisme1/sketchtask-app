import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { TaskDto, TaskPriority } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { TextInput } from "./TextInput";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";
import { CustomDuePicker } from "./CustomDuePicker";
import { Edit3, X, Check, Tag as TagIcon, Plus } from "lucide-react";
import { getTagStyle } from "../../utils/tagColors";

// ==========================================
// COMPONENT: EditTaskModal (Modal Toàn Màn Hình Chuẩn SettingsModal & Nền Mờ Sâu)
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
      setPriority((task.priority as any) || "medium");
      setSelectedTag(task.tag || "");
      setIsAddingTag(false);
      setNewTagInput("");
    }
  }, [task, isOpen]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
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
          {/* 1. Tiêu Đề Công Việc (Khung Nhiều Dòng Dễ Đọc & Sửa Trọn Vẹn) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-[#1C1917] text-[11px]">
                Nội dung công việc:
              </label>
              <span className="text-[10px] font-mono text-[#78716C]">
                {title.length}/250
              </span>
            </div>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề việc cần làm..."
              rows={3}
              maxLength={250}
              className="w-full bg-white text-xs sm:text-sm font-medium border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] p-2.5 outline-none resize-none focus:ring-1 focus:ring-[#262626] leading-relaxed text-[#1C1917] placeholder:text-[#A8A29E]"
            />
          </div>

          {/* 2. Cuốn Sổ & Hạn Chót */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="font-bold text-[#1C1917] block mb-1 text-[11px]">
                Thuộc cuốn sổ:
              </label>
              <CustomSelect
                value={notebookId}
                onChange={setNotebookId}
                placeholder="Chọn cuốn sổ..."
                options={[
                  { value: "", label: "Không gán sổ", icon: "lucide:FileText" },
                  ...notebooks.map((nb) => ({
                    value: nb.id,
                    label: nb.name,
                    icon: nb.icon || "lucide:BookMarked",
                  })),
                ]}
              />
            </div>

            <div>
              <label className="font-bold text-[#1C1917] block mb-1 text-[11px]">
                Hạn chót & Giờ hẹn:
              </label>
              <CustomDuePicker
                value={dueDate}
                onChange={setDueDate}
                mode="datetime"
              />
            </div>
          </div>

          {/* 3. Mức Độ Ưu Tiên */}
          <div>
            <label className="font-bold text-[#1C1917] block mb-1 text-[11px]">
              Mức độ ưu tiên:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  key: "high",
                  label: "Gấp",
                  iconBg: "bg-rose-500",
                  activeBorder: "border-rose-600 bg-rose-50 text-rose-800",
                },
                {
                  key: "medium",
                  label: "Vừa",
                  iconBg: "bg-amber-500",
                  activeBorder: "border-amber-600 bg-amber-50 text-amber-800",
                },
                {
                  key: "low",
                  label: "Thấp",
                  iconBg: "bg-emerald-500",
                  activeBorder:
                    "border-emerald-600 bg-emerald-50 text-emerald-800",
                },
              ].map((p) => {
                const isSelected = priority === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setPriority(p.key as TaskPriority)}
                    className={`py-1.5 px-2 rounded-[5px] border-[1.5px] flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                      isSelected
                        ? `${p.activeBorder} shadow-[1.5px_1.5px_0px_#262626]`
                        : "border-[#D4CEBF] bg-white text-[#78716C] hover:border-[#262626]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${p.iconBg}`} />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Gán Nhãn #Tag */}
          <div>
            <label className="font-bold text-[#1C1917] block mb-1 text-[11px] flex items-center gap-1">
              <TagIcon size={12} />
              <span>Gán nhãn phân loại:</span>
            </label>

            <div className="flex flex-wrap gap-1.5 items-center p-2 bg-white border border-[#D4CEBF] rounded-[6px]">
              <button
                type="button"
                onClick={() => setSelectedTag("")}
                className={`px-2 py-0.5 text-[11px] rounded-[3px] border transition-all ${
                  !selectedTag
                    ? "bg-[#262626] text-white border-[#262626] font-bold"
                    : "bg-stone-50 text-[#78716C] border-[#E7E2D8] hover:border-[#262626]"
                }`}
              >
                Không nhãn
              </button>

              {tags.map((t) => {
                const isSelected = selectedTag === t;
                const style = getTagStyle(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTag(t)}
                    className={`px-2 py-0.5 text-[11px] rounded-[3px] border transition-all flex items-center gap-1 ${
                      isSelected
                        ? "border-[#262626] shadow-[1px_1px_0px_#262626] font-bold ring-1 ring-[#262626]"
                        : "border-[#D4CEBF] hover:border-[#262626]"
                    } ${style.bg} ${style.text}`}
                  >
                    <span>#{t}</span>
                    {isSelected && <Check size={10} strokeWidth={2.5} />}
                  </button>
                );
              })}

              {isAddingTag ? (
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onBlur={handleCreateNewTag}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateNewTag(e);
                    if (e.key === "Escape") setIsAddingTag(false);
                  }}
                  placeholder="Tên tag mới..."
                  className="px-1.5 py-0.5 text-[11px] border border-[#262626] rounded-[3px] bg-white outline-none w-24"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  className="px-2 py-0.5 text-[11px] text-[#78716C] hover:text-[#1C1917] border border-dashed border-[#D4CEBF] rounded-[3px] flex items-center gap-0.5"
                >
                  <Plus size={11} />
                  <span>Tag mới</span>
                </button>
              )}
            </div>
          </div>

          {/* 5. Nút Hành Động Ở Đáy Modal */}
          <div className="pt-3 border-t border-[#262626] flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
              className="flex-1 sm:flex-none justify-center"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!title.trim()}
              className="flex-1 sm:flex-none justify-center gap-1"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
};
