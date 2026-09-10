import React, { useState, useEffect, useMemo } from "react";
import { NavigationTarget, NotebookDto, TaskDto, TabKey } from "../../../types";
import { NoteItem } from "../notes/NoteTypes";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { NotebookEditor } from "./NotebookEditor";
import { NotebookList } from "./NotebookList";
import { NotebookDetail } from "./NotebookDetail";
import { loadNotesFromStorage, saveNotesToStorage } from "../../../utils/noteStorage";
import { getLocalTodayStr } from "../../../utils/date";
import { useScrollLock } from "../../../hooks/useScrollLock";

// ==========================================
// COMPONENT: NotebooksTab (Kệ Sách & Quản Lý Sổ Tay Tái Cấu Trúc)
// Quản lý độc lập: Sổ tay, Công việc trong sổ, Ghi chú trong sổ, Nhật ký trong sổ
// ==========================================

const getNowTimeStr = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

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
    journalEntries,
    isTiltEnabled,
    addNotebook,
    updateNotebook,
    deleteNotebook,
    toggleTask,
    deleteTask,
    moveTaskToTomorrow,
    addJournalEntry,
    deleteJournalEntry,
    openTaskDetail,
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

  // State nạp và đồng bộ danh sách Ghi chú
  const [notes, setNotes] = useState<NoteItem[]>(() => loadNotesFromStorage());

  // Lắng nghe sự kiện đồng bộ ghi chú
  useEffect(() => {
    const handleNotesChanged = () => {
      setNotes(loadNotesFromStorage());
    };
    window.addEventListener("sketchtask_notes_changed", handleNotesChanged);
    return () => {
      window.removeEventListener("sketchtask_notes_changed", handleNotesChanged);
    };
  }, []);

  // State tạo mới sổ tay inline
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newNbName, setNewNbName] = useState("");
  const [newNbDesc, setNewNbDesc] = useState("");
  const [newNbColor, setNewNbColor] = useState("#FEF08A");
  const [newNbIcon, setNewNbIcon] = useState("lucide:BookMarked");
  const [nameError, setNameError] = useState(false);

  // State chỉnh sửa sổ tay
  const [editingNotebook, setEditingNotebook] = useState<NotebookDto | null>(null);
  useScrollLock(Boolean(editingNotebook));

  // Cuốn sổ hiện tại đang chọn
  const currentNotebook = useMemo(() => {
    return notebooks.find((n) => n.id === selectedNotebookId) || null;
  }, [notebooks, selectedNotebookId]);

  // Dữ liệu thuộc riêng cuốn sổ đang chọn (Đảm bảo cách ly 100%)
  const notebookTasks = useMemo(() => {
    if (!selectedNotebookId) return [];
    return tasks.filter((t) => t.notebookId === selectedNotebookId);
  }, [tasks, selectedNotebookId]);

  const notebookNotes = useMemo(() => {
    if (!selectedNotebookId) return [];
    return notes.filter((n) => n.notebookId === selectedNotebookId);
  }, [notes, selectedNotebookId]);

  const notebookJournals = useMemo(() => {
    if (!selectedNotebookId) return [];
    return journalEntries.filter((j) => j.notebookId === selectedNotebookId);
  }, [journalEntries, selectedNotebookId]);

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

  const handleSaveEditNotebook = (e: React.FormEvent) => {
    e.preventDefault();
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
    if (window.confirm("Bạn có chắc muốn xóa cuốn sổ này không? Dữ liệu công việc và ghi chú sẽ được giữ lại.")) {
      deleteNotebook(id);
      if (selectedNotebookId === id) {
        setSelectedNotebookId(null);
      }
    }
  };

  // CRUD Ghi chú trong sổ
  const handleCreateNoteInNotebook = (title: string, content: string) => {
    if (!selectedNotebookId) return;
    const nowIso = new Date().toISOString();
    const newNote: NoteItem = {
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      content,
      notebookId: selectedNotebookId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  const handleDeleteNoteInNotebook = (noteId: string) => {
    const updatedNotes = notes.filter((n) => n.id !== noteId);
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  const handleUpdateNoteInNotebook = (updatedNote: NoteItem) => {
    const updatedNotes = notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
    setNotes(updatedNotes);
    saveNotesToStorage(updatedNotes);
  };

  // Thêm nhật ký trong sổ
  const handleAddJournalInNotebook = (content: string) => {
    if (!selectedNotebookId) return;
    addJournalEntry({
      date: getLocalTodayStr(),
      time: getNowTimeStr(),
      content,
      notebookId: selectedNotebookId,
    });
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
          notes={notebookNotes}
          journalEntries={notebookJournals}
          onBack={() => setSelectedNotebookId(null)}
          onEditNotebook={() => handleStartEditNotebook(currentNotebook)}
          onRequestDeleteNotebook={(id) => handleDeleteNotebook(id)}
          onToggleTask={toggleTask}
          onEditTask={(task) => openTaskDetail(task.id)}
          onDeleteTask={deleteTask}
          onMoveTomorrow={moveTaskToTomorrow}
          onClickTask={(task) => openTaskDetail(task.id)}
          onCreateNote={handleCreateNoteInNotebook}
          onDeleteNote={handleDeleteNoteInNotebook}
          onUpdateNote={handleUpdateNoteInNotebook}
          onAddJournalEntry={handleAddJournalInNotebook}
          onDeleteJournalEntry={deleteJournalEntry}
        />

        {/* Modal Sửa Sổ Tay */}
        {editingNotebook && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Chỉnh sửa sổ tay"
            className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 select-none"
          >
            <div className="w-full max-w-xl">
              <NotebookEditor
                name={newNbName}
                description={newNbDesc}
                color={newNbColor}
                icon={newNbIcon}
                nameError={nameError}
                isEditing={true}
                onNameChange={(val) => {
                  setNewNbName(val);
                  if (val.trim()) setNameError(false);
                }}
                onDescriptionChange={setNewNbDesc}
                onColorChange={setNewNbColor}
                onIconChange={setNewNbIcon}
                onSave={handleSaveEditNotebook}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        )}
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
          isEditing={false}
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

      {/* Form sửa sổ tay trên kệ */}
      {editingNotebook && (
        <NotebookEditor
          name={newNbName}
          description={newNbDesc}
          color={newNbColor}
          icon={newNbIcon}
          nameError={nameError}
          isEditing={true}
          onNameChange={(val) => {
            setNewNbName(val);
            if (val.trim()) setNameError(false);
          }}
          onDescriptionChange={setNewNbDesc}
          onColorChange={setNewNbColor}
          onIconChange={setNewNbIcon}
          onSave={handleSaveEditNotebook}
          onCancel={handleCancelEdit}
        />
      )}

      {/* Danh sách sổ tay trên kệ */}
      <NotebookList
        notebooks={filteredNotebooks}
        tasks={tasks}
        notes={notes}
        journalEntries={journalEntries}
        isTiltEnabled={isTiltEnabled}
        onSelectNotebook={(id) => setSelectedNotebookId(id)}
        onRequestDeleteNotebook={handleDeleteNotebook}
      />
    </div>
  );
};
