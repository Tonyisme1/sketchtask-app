import React, { useState, useEffect, useMemo } from "react";
import { NavigationTarget, NotebookDto, TaskDto, TabKey } from "../../../types";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { NotebookEditor } from "./NotebookEditor";
import { NotebookList } from "./NotebookList";
import { NotebookDetail } from "./NotebookDetail";

// ==========================================
// COMPONENT: NotebooksTab (Kệ Sách & Quản Lý Sổ Tay Tái Cấu Trúc)
// Quản lý độc lập: Sổ tay và Công việc trong sổ
// ==========================================

interface NotebooksTabProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const NotebooksTab: React.FC<NotebooksTabProps> = ({
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const { isMobile } = useResponsiveLayout();
  const {
    notebooks,
    tasks,
    isTiltEnabled,
    addNotebook,
    updateNotebook,
    deleteNotebook,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    selectedNotebookId,
    setSelectedNotebookId,
  } = useAppStore();

  useEffect(() => {
    if (!navigationTarget?.notebookId) return;
    if (notebooks.some((notebook) => notebook.id === navigationTarget.notebookId)) {
      setSelectedNotebookId(navigationTarget.notebookId);
    }
    onClearNavigationTarget?.();
  }, [navigationTarget, notebooks, onClearNavigationTarget, setSelectedNotebookId]);

  // State tạo mới sổ tay inline
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newNbName, setNewNbName] = useState("");
  const [newNbDesc, setNewNbDesc] = useState("");
  const [newNbColor, setNewNbColor] = useState("#FEF08A");
  const [newNbIcon, setNewNbIcon] = useState("lucide:BookMarked");
  const [nameError, setNameError] = useState(false);

  // State chỉnh sửa sổ tay
  const [editingNotebook, setEditingNotebook] = useState<NotebookDto | null>(null);

  // Cuốn sổ hiện tại đang chọn
  const currentNotebook = useMemo(() => {
    return notebooks.find((n) => n.id === selectedNotebookId) || null;
  }, [notebooks, selectedNotebookId]);

  // Dữ liệu thuộc riêng cuốn sổ đang chọn (Đảm bảo cách ly 100%)
  const notebookTasks = useMemo(() => {
    if (!selectedNotebookId) return [];
    return tasks.filter((t) => t.notebookId === selectedNotebookId);
  }, [tasks, selectedNotebookId]);

  // Xử lý tạo sổ mới
  const handleSaveInlineNotebook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNbName.trim()) {
      setNameError(true);
      return;
    }
    const createdNb = addNotebook({
      name: newNbName.trim(),
      description: newNbDesc.trim(),
      color: newNbColor,
      icon: newNbIcon,
    });
    setNewNbName("");
    setNewNbDesc("");
    setNewNbColor("#FEF08A");
    setNewNbIcon("lucide:BookMarked");
    setIsCreatingInline(false);
    setNameError(false);
    if (createdNb) setSelectedNotebookId(createdNb.id);
  };

  const handleCancelInline = () => {
    setIsCreatingInline(false);
    setNameError(false);
    setNewNbName("");
    setNewNbDesc("");
  };

  useEffect(() => {
    const handleCreateRequest = (event: Event) => {
      const type = (event as CustomEvent<{ type?: string }>).detail?.type;
      if (type !== "notebook") return;

      setSelectedNotebookId(null);
      setEditingNotebook(null);
      setNewNbName("");
      setNewNbDesc("");
      setNewNbColor("#FEF08A");
      setNewNbIcon("lucide:BookMarked");
      setNameError(false);
      setIsCreatingInline(true);
    };

    window.addEventListener("sketchtask:create", handleCreateRequest);
    return () => window.removeEventListener("sketchtask:create", handleCreateRequest);
  }, []);

  // Xử lý sửa sổ tay
  const handleStartEditNotebook = (nb: NotebookDto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingNotebook(nb);
    setNewNbName(nb.name);
    setNewNbDesc(nb.description || "");
    setNewNbColor(nb.color || "#FEF08A");
    setNewNbIcon(nb.icon || "lucide:BookMarked");
    setNameError(false);
  };

  const handleSaveEditNotebook = () => {
    if (!editingNotebook) return;
    if (!newNbName.trim()) {
      setNameError(true);
      return;
    }
    updateNotebook(editingNotebook.id, {
      name: newNbName.trim(),
      description: newNbDesc.trim(),
      color: newNbColor,
      icon: newNbIcon,
    });
    setEditingNotebook(null);
    setNewNbName("");
    setNewNbDesc("");
    setNameError(false);
  };

  const handleCancelEdit = () => {
    setEditingNotebook(null);
    setNameError(false);
    setNewNbName("");
    setNewNbDesc("");
  };

  // Xóa sổ tay
  const handleDeleteNotebook = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (window.confirm("Bạn có chắc muốn xóa cuốn sổ này không? Công việc sẽ được giữ lại.")) {
      deleteNotebook(id);
      if (selectedNotebookId === id) {
        setSelectedNotebookId(null);
      }
    }
  };

  // State tìm kiếm trên Kệ Sổ
  const [searchQuery, setSearchQuery] = useState("");

  // Lọc sổ tay theo từ khóa
  const filteredNotebooks = useMemo(() => {
    if (!searchQuery.trim()) return notebooks;
    const q = searchQuery.toLowerCase().trim();
    return notebooks.filter(
      (nb) =>
        nb.name.toLowerCase().includes(q) ||
        (nb.description && nb.description.toLowerCase().includes(q))
    );
  }, [notebooks, searchQuery]);

  // ==========================================
  // VIEW: CHI TIẾT CUỐN SỔ ĐÃ CHỌN
  // ==========================================
  if (currentNotebook) {
    return (
      <>
        <NotebookDetail
          notebook={currentNotebook}
          tasks={notebookTasks}
          onBack={() => {
            handleCancelEdit();
            setSelectedNotebookId(null);
          }}
          onEditNotebook={() => handleStartEditNotebook(currentNotebook)}
          onRequestDeleteNotebook={(id) => handleDeleteNotebook(id)}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onMoveTomorrow={moveTaskToTomorrow}
          isEditing={Boolean(editingNotebook)}
          editName={newNbName}
          editDescription={newNbDesc}
          editColor={newNbColor}
          editIcon={newNbIcon}
          nameError={nameError}
          onEditNameChange={(value) => {
            setNewNbName(value);
            if (value.trim()) setNameError(false);
          }}
          onEditDescriptionChange={setNewNbDesc}
          onEditColorChange={setNewNbColor}
          onEditIconChange={setNewNbIcon}
          onSaveEdit={handleSaveEditNotebook}
          onCancelEdit={handleCancelEdit}
        />
      </>
    );
  }

  // ==========================================
  // VIEW: KỆ SỔ TAY (Danh sách sổ)
  // ==========================================
  return (
    <div className={`w-full min-w-0 space-y-4 pb-8 select-none ${isMobile ? "mobile-tab-enter" : ""}`}>
      {/* Form tạo nhanh sổ mới */}
      {isCreatingInline && (
        <NotebookEditor
          name={newNbName}
          description={newNbDesc}
          color={newNbColor}
          icon={newNbIcon}
          nameError={nameError}
          onNameChange={(val) => {
            setNewNbName(val);
            if (val.trim()) setNameError(false);
          }}
          onDescriptionChange={setNewNbDesc}
          onColorChange={setNewNbColor}
          onIconChange={setNewNbIcon}
          onSave={handleSaveInlineNotebook}
          onCancel={handleCancelInline}
        />
      )}

      {/* Danh sách sổ tay trên kệ */}
      <NotebookList
        notebooks={filteredNotebooks}
        tasks={tasks}
        isTiltEnabled={isTiltEnabled}
        onSelectNotebook={(id) => setSelectedNotebookId(id)}
        onRequestDeleteNotebook={handleDeleteNotebook}
      />
    </div>
  );
};
