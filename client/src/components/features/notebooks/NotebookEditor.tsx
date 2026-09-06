import React from "react";
import { Button, DynamicIcon, CustomEmojiPicker, CustomColorPicker } from "../../ui";
import { X } from "lucide-react";

export interface NotebookEditorProps {
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  color: string;
  onColorChange: (val: string) => void;
  icon: string;
  onIconChange: (val: string) => void;
  nameError: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export const NotebookEditor: React.FC<NotebookEditorProps> = ({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  color,
  onColorChange,
  icon,
  onIconChange,
  nameError,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  return (
    <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 p-4 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] space-y-3 animate-in fade-in select-none">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded border border-[#262626] flex items-center justify-center shadow-[1px_1px_0px_#262626]"
            style={{ backgroundColor: color }}
          >
            <DynamicIcon name={icon} size={15} strokeWidth={2.2} />
          </span>
          <span className="font-bold text-xs sm:text-sm text-[#1C1917]">
            {isEditing ? "Chỉnh sửa thông tin sổ tay" : "Phác thảo sổ tay mới"}
          </span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          title="Đóng"
          className="text-xs text-[#78716C] hover:text-[#1C1917] font-bold p-1 bg-white border border-[#D4CEBF] rounded flex items-center justify-center active:translate-y-[0.5px] cursor-pointer"
        >
          <X size={13} strokeWidth={2.5} />
        </button>
      </div>

      <form onSubmit={onSave} className="space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-[#1C1917] mb-0.5">
              Tên cuốn sổ:
            </label>
            <input
              type="text"
              placeholder="vd: Dự Án Web, Học Tiếng Anh..."
              value={name}
              maxLength={30}
              onChange={(e) => onNameChange(e.target.value)}
              className={`w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border ${
                nameError
                  ? "border-rose-500 bg-rose-50/50"
                  : "border-[#262626]"
              } rounded-[4px] outline-none shadow-inner`}
              autoFocus
            />
            {nameError && (
              <p className="text-[10px] text-rose-600 font-bold mt-0.5">
                Vui lòng nhập tên cuốn sổ!
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#1C1917] mb-0.5">
              Mô tả ngắn:
            </label>
            <input
              type="text"
              placeholder="vd: Mục tiêu và các đầu việc cần làm..."
              value={description}
              maxLength={80}
              onChange={(e) => onDescriptionChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-[#262626] rounded-[4px] outline-none shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#D4CEBF]">
          <div>
            <label className="block text-[11px] font-bold text-[#1C1917] mb-1">
              Biểu tượng:
            </label>
            <CustomEmojiPicker value={icon} onChange={onIconChange} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-[#1C1917] mb-1">
              Màu bìa sổ:
            </label>
            <CustomColorPicker value={color} onChange={onColorChange} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
          >
            {isEditing ? "Lưu thay đổi" : "Tạo cuốn sổ"}
          </Button>
        </div>
      </form>
    </div>
  );
};
