import React, { useState, useEffect, useMemo, useRef } from "react";
import { NoteItem } from "./NoteTypes";
import { NoteMasterDetailView } from "./NoteMasterDetailView";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { NavigationTarget } from "../../../types";
import { loadNotesFromStorage, saveNotesToStorage } from "../../../utils/noteStorage";
import {
  X,
  ChevronDown,
  Filter,
} from "lucide-react";
import { TabKey } from "../../../types";

// Helper trích xuất văn bản thuần không chứa HTML để tìm kiếm
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

export interface NotesTabProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  navigationTarget,
  onClearNavigationTarget,
  onNavigateTab,
}) => {
  const { notebooks, isMobileNoteDetailOpen } = useAppStore();
  const { isMobile } = useResponsiveLayout();

  // ==========================================
  // STATE GHI CHÚ (NOTES)
  // ==========================================
  const [notes, setNotes] = useState<NoteItem[]>(() => loadNotesFromStorage());
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState<string>("all");
  const [noteTargetId, setNoteTargetId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!navigationTarget) return;
    if (navigationTarget.noteId) {
      setNoteTargetId(navigationTarget.noteId);
    }
    onClearNavigationTarget?.();
  }, [navigationTarget, onClearNavigationTarget]);

  // State cho Popover tìm kiếm Sổ tay mở rộng (khi có nhiều sổ)
  const [isNotebookPopoverOpen, setIsNotebookPopoverOpen] = useState(false);
  const [notebookPopoverSearch, setNotebookPopoverSearch] = useState("");
  const notebookPopoverRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        notebookPopoverRef.current &&
        !notebookPopoverRef.current.contains(e.target as Node)
      ) {
        setIsNotebookPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Lưu notes vào localStorage mỗi khi có thay đổi
  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  // Lọc ghi chú theo Sổ tay đã chọn
  const filteredNotes = useMemo(() => {
    let result = notes;

    // Lọc theo Sổ tay
    if (selectedNotebookFilter === "unassigned") {
      result = result.filter((n) => !n.notebookId);
    } else if (selectedNotebookFilter !== "all") {
      result = result.filter((n) => n.notebookId === selectedNotebookFilter);
    }

    return result;
  }, [notes, selectedNotebookFilter]);

  // Handler tạo nhanh một trang ghi chú mới
  const handleCreateNewNote = () => {
    const nowStr =
      new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      }) +
      ", " +
      new Date().toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

    const newId = "note-" + Date.now();
    const newNote: NoteItem = {
      id: newId,
      title: "",
      content: "",
      notebookId:
        selectedNotebookFilter !== "all" && selectedNotebookFilter !== "unassigned"
          ? selectedNotebookFilter
          : undefined,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewlyCreatedId(newId);
  };

  useEffect(() => {
    const handleCreateRequest = (event: Event) => {
      const type = (event as CustomEvent<{ type?: string }>).detail?.type;
      if (type === "note") handleCreateNewNote();
    };

    window.addEventListener("sketchtask:create", handleCreateRequest);
    return () => window.removeEventListener("sketchtask:create", handleCreateRequest);
  }, [selectedNotebookFilter]);

  // Handler cập nhật ghi chú khi chỉnh sửa
  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === updatedNote.id ? updatedNote : n))
    );
  };

  // Handler xóa ghi chú
  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (newlyCreatedId === id) {
      setNewlyCreatedId(null);
    }
  };

  // Lọc danh sách sổ tay trong popover tìm kiếm sổ tay
  const filteredNotebooksForPopover = useMemo(() => {
    if (!notebookPopoverSearch.trim()) return notebooks;
    const q = notebookPopoverSearch.toLowerCase();
    return notebooks.filter((nb) => nb.name.toLowerCase().includes(q));
  }, [notebooks, notebookPopoverSearch]);

  const activeNotebookObj = notebooks.find((nb) => nb.id === selectedNotebookFilter);

  return (
    <div className={`space-y-3.5 sm:space-y-4 pb-12 w-full min-w-0 select-none ${
      isMobile ? "" : "animate-in fade-in duration-150"
    }`}>
      {/* 1. Header: Bộ Lọc Sổ Tay */}
      <div className={`items-center justify-between gap-3 pb-3 border-b border-[#262626]/30 ${isMobileNoteDetailOpen ? "hidden" : "flex"}`}>
        <div ref={notebookPopoverRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setIsNotebookPopoverOpen(!isNotebookPopoverOpen)}
            aria-label="Lọc ghi chú theo sổ tay"
            title="Lọc ghi chú theo sổ tay"
            className={`h-9 px-3 rounded-[5px] border-[1.5px] border-[#262626] flex items-center gap-2 text-xs sm:text-sm font-bold transition-all shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer ${
              selectedNotebookFilter !== "all"
                ? "bg-[#FEF08A] text-[#1C1917]"
                : "bg-white text-[#57534E] hover:bg-[#FAF8F3]"
            }`}
          >
            <Filter size={14} strokeWidth={2.4} />
            <span className="max-w-[140px] sm:max-w-[200px] truncate">
              {selectedNotebookFilter === "all"
                ? `Tất cả (${notes.length})`
                : selectedNotebookFilter === "unassigned"
                ? `Chưa gán (${notes.filter((n) => !n.notebookId).length})`
                : `${activeNotebookObj?.name || "Sổ"} (${filteredNotes.length})`}
            </span>
            <ChevronDown size={13} strokeWidth={2.4} className="text-[#78716C]" />
          </button>

          {isNotebookPopoverOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-64 max-w-[calc(100vw-1.5rem)] bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-2.5 shadow-[3px_3px_0px_#262626] z-50 space-y-2 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between pb-1 border-b border-[#E7E5E4]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#78716C] font-mono">
                  Lọc ghi chú theo sổ
                </span>
                <button
                  type="button"
                  onClick={() => setIsNotebookPopoverOpen(false)}
                  className="text-[#78716C] hover:text-[#1C1917] cursor-pointer"
                >
                  <X size={12} strokeWidth={2.4} />
                </button>
              </div>

              <input
                type="text"
                value={notebookPopoverSearch}
                onChange={(e) => setNotebookPopoverSearch(e.target.value)}
                placeholder="Tìm sổ tay..."
                className="w-full h-7 px-2 bg-white border border-[#262626] rounded-[4px] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none"
              />

              <div className="max-h-48 overflow-y-auto space-y-1 no-scrollbar">
                {/* Tất cả */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotebookFilter("all");
                    setIsNotebookPopoverOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedNotebookFilter === "all"
                      ? "bg-[#FEF08A] font-bold border border-[#262626]"
                      : "hover:bg-[#FAF8F3] text-[#1C1917]"
                  }`}
                >
                  <span>Tất cả</span>
                  <span className="font-mono text-[10px] text-[#78716C]">({notes.length})</span>
                </button>

                {/* Chưa phân loại */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotebookFilter("unassigned");
                    setIsNotebookPopoverOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    selectedNotebookFilter === "unassigned"
                      ? "bg-[#E7E5E4] font-bold border border-[#262626]"
                      : "hover:bg-[#FAF8F3] text-[#1C1917]"
                  }`}
                >
                  <span>Không sổ</span>
                  <span className="font-mono text-[10px] text-[#78716C]">
                    ({notes.filter((n) => !n.notebookId).length})
                  </span>
                </button>

                {/* Danh sách các sổ tay */}
                {filteredNotebooksForPopover.map((nb) => {
                  const count = notes.filter((n) => n.notebookId === nb.id).length;
                  const isSelected = selectedNotebookFilter === nb.id;
                  return (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => {
                        setSelectedNotebookFilter(nb.id);
                        setIsNotebookPopoverOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? "font-bold border border-[#262626]"
                          : "hover:bg-[#FAF8F3] text-[#1C1917]"
                      }`}
                      style={{
                        backgroundColor: isSelected ? nb.color || "#BBF7D0" : undefined,
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-[2px] border border-[#262626] shrink-0"
                          style={{ backgroundColor: nb.color || "#BBF7D0" }}
                        />
                        <span className="truncate">{nb.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-[#78716C]">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Danh sách ghi chú; editor chỉ mở sau khi người dùng chọn một note */}
      <div className="pt-0.5">
        <NoteMasterDetailView
          notes={filteredNotes}
          notebooks={notebooks}
          newlyCreatedId={newlyCreatedId}
          initialNoteId={noteTargetId}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onCreateClick={handleCreateNewNote}
        />
      </div>

    </div>
  );
};
