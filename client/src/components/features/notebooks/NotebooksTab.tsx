import React, { useState } from "react";
import { useAppStore } from "../../../stores/appStore";
import { Button } from "../../ui/Button";
import { TextInput } from "../../ui/TextInput";
import { HandDrawnCheckbox } from "../../ui/HandDrawnCheckbox";
import { EmptyStateDoodle } from "../../ui/EmptyStateDoodle";
import { ConfirmModal } from "../../ui/ConfirmModal";
import { CustomEmojiPicker } from "../../ui/CustomEmojiPicker";
import { CustomColorPicker, DEFAULT_PALETTE } from "../../ui/CustomColorPicker";
import { DynamicIcon } from "../../ui/DynamicIcon";
import { getCardTilt } from "../../../utils/tilt";

// ==========================================
// COMPONENT: NotebooksTab (Kệ Sách với Icon Hiện Đại Sắc Nét)
// ==========================================

export const NotebooksTab: React.FC = () => {
  const {
    notebooks,
    addNotebook,
    deleteNotebook,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
  } = useAppStore();

  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);

  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newNbName, setNewNbName] = useState("");
  const [newNbDesc, setNewNbDesc] = useState("");
  const [newNbColor, setNewNbColor] = useState("#FEF08A");
  const [newNbIcon, setNewNbIcon] = useState("lucide:BookMarked");
  const [nameError, setNameError] = useState(false);

  const [drillTaskTitle, setDrillTaskTitle] = useState("");
  const [confirmDeleteNbId, setConfirmDeleteNbId] = useState<string | null>(null);
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

  const activeNotebook = notebooks.find((n) => n.id === selectedNotebookId);
  const activeNotebookTasks = tasks.filter(
    (t) => t.notebookId === selectedNotebookId
  );
  const nbCompletedCount = activeNotebookTasks.filter((t) => t.completed).length;
  const nbTotalCount = activeNotebookTasks.length;
  const nbPercent = nbTotalCount > 0 ? Math.round((nbCompletedCount / nbTotalCount) * 100) : 0;

  // VIEW: CHI TIẾT CUỐN SỔ
  if (activeNotebook) {
    return (
      <div className="space-y-4 max-w-2xl lg:max-w-6xl mx-auto">
        <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
          <button
            onClick={() => setSelectedNotebookId(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
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
                  <DynamicIcon name={activeNotebook.icon} size={24} strokeWidth={2.2} />
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
                <span className="font-bold text-[#1C1917]">Tiến độ hoàn thành:</span>
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

          {/* CỘT PHẢI (8 Cột): Quick Add & Danh Sách Việc */}
          <div className="lg:col-span-8 space-y-3">
            {/* Quick Add Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!drillTaskTitle.trim()) return;
                addTask({
                  title: drillTaskTitle,
                  notebookId: activeNotebook.id,
                  tag: "Công việc",
                });
                setDrillTaskTitle("");
              }}
              className="flex gap-2"
            >
              <TextInput
                placeholder={`Thêm việc vào sổ "${activeNotebook.name}"...`}
                value={drillTaskTitle}
                onChange={(e) => setDrillTaskTitle(e.target.value)}
                className="flex-1 text-xs sm:text-sm bg-white"
              />
              <Button type="submit" variant="primary">
                + Thêm
              </Button>
            </form>

            {/* Task List */}
            <div className="space-y-2">
              {activeNotebookTasks.length === 0 ? (
                <EmptyStateDoodle
                  icon="lucide:BookOpen"
                  title="Sổ này chưa có việc nào"
                  message="Hãy ghi việc đầu tiên vào cuốn sổ này nhé."
                />
              ) : (
                activeNotebookTasks.map((t, idx) => (
                  <div
                    key={t.id}
                    className={`p-3 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[2px_2px_0px_#262626] flex items-center justify-between gap-3 ${getCardTilt(
                      idx
                    )}`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <HandDrawnCheckbox
                        checked={t.completed}
                        onChange={() => toggleTask(t.id)}
                      />
                      <span
                        className={`text-xs sm:text-sm break-words ${
                          t.completed ? "line-through text-[#78716C]" : "text-[#1C1917]"
                        }`}
                      >
                        {t.title}
                      </span>
                    </div>
                    <button
                      onClick={() => setDeletingTaskId(t.id)}
                      className="text-xs text-[#78716C] hover:text-red-600 p-1"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
          message="Bạn có chắc muốn xóa việc này không?"
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
                      nameError ? "border-red-500 bg-red-50" : "border-[#262626]"
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
              <DynamicIcon name="lucide:BookMarked" size={20} strokeWidth={2.2} />
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
