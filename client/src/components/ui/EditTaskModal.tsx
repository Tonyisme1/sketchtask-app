import React, { useState, useEffect } from "react";
import { Task } from "../../types";
import { useAppStore } from "../../stores/appStore";
import { TextInput } from "./TextInput";
import { Button } from "./Button";
import { CustomSelect } from "./CustomSelect";
import { CustomDuePicker } from "./CustomDuePicker";
import { Edit3, X, Check, Tag as TagIcon, Plus } from "lucide-react";
import { getTagStyle } from "../../utils/tagColors";

// ==========================================
// COMPONENT: EditTaskModal (Chuẩn Bottom Sheet Mobile & Dialog Desktop)
// ==========================================

interface EditTaskModalProps {
  task: Task | null;
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999999,
        backgroundColor: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(14px)",
      }}
      className="flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[20px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[4px_4px_0px_#262626] p-4 sm:p-5 space-y-3.5 max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-200"
      >
        {/* Grab Handle trên Mobile */}
        <div className="w-10 h-1.5 bg-[#262626]/20 rounded-full mx-auto sm:hidden mb-1" />

        {/* Header Modal */}
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
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
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        {/* Form Chỉnh Sửa */}
        <form onSubmit={handleSave} className="space-y-3.5 text-xs">
          {/* 1. Tiêu Đề Công Việc */}
          <div>
            <label className="font-bold text-[#1C1917] block mb-1 text-[11px]">
              Tiêu đề công việc:
            </label>
            <TextInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề việc cần làm..."
              className="w-full bg-white text-xs sm:text-sm font-medium"
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
                Hạn chót & Giờ:
              </label>
              <CustomDuePicker
                value={dueDate}
                onChange={setDueDate}
                mode="datetime"
                className="w-full"
              />
            </div>
          </div>

          {/* 3. Mức Độ Ưu Tiên */}
          <div className="p-2.5 bg-white border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] space-y-1.5">
            <span className="text-[11px] font-bold text-[#1C1917] block">
              Mức độ ưu tiên:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  key: "high",
                  label: "Gấp",
                  dotClass: "bg-rose-500",
                  activeClass:
                    "bg-rose-100 text-rose-800 border-rose-400 font-bold shadow-[1.5px_1.5px_0px_#262626]",
                },
                {
                  key: "medium",
                  label: "Vừa",
                  dotClass: "bg-amber-400",
                  activeClass:
                    "bg-amber-100 text-amber-800 border-amber-400 font-bold shadow-[1.5px_1.5px_0px_#262626]",
                },
                {
                  key: "low",
                  label: "Thấp",
                  dotClass: "bg-emerald-500",
                  activeClass:
                    "bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-[1.5px_1.5px_0px_#262626]",
                },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPriority(p.key as any)}
                  className={`py-1.5 px-2 rounded-[4px] border text-xs transition-all flex items-center justify-center gap-1.5 ${
                    priority === p.key
                      ? p.activeClass
                      : "border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                  } active:translate-y-[0.5px]`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.dotClass}`} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Nhãn Phân Loại (#Tag) */}
          <div className="p-2.5 bg-white border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#1C1917] flex items-center gap-1">
                <TagIcon size={12} />
                <span>Nhãn (#tag):</span>
              </span>
              {selectedTag && (
                <button
                  type="button"
                  onClick={() => setSelectedTag("")}
                  className="text-[10px] text-rose-600 font-bold hover:underline"
                >
                  Bỏ chọn tag
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => {
                const tagStyle = getTagStyle(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setSelectedTag(selectedTag === tag ? "" : tag)
                    }
                    className={`px-2 py-0.5 rounded-[3px] border text-[11px] font-medium transition-all ${
                      selectedTag === tag
                        ? `${tagStyle.bg} ${tagStyle.border} text-[#1C1917] shadow-[1px_1px_0px_#262626] -translate-y-[0.5px] font-bold`
                        : "border-[#D4CEBF] bg-[#FBF9F4] text-[#78716C] hover:text-[#1C1917]"
                    } active:translate-y-[0.5px]`}
                  >
                    #{tag}
                  </button>
                );
              })}

              {isAddingTag ? (
                <input
                  type="text"
                  placeholder="Tag mới..."
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
                  className="w-20 px-1.5 py-0.5 text-[11px] border border-[#262626] rounded-[3px] outline-none bg-[#FBF9F4]"
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
          <div className="pt-2 border-t border-[#D4CEBF] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
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
    </div>
  );
};
