import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Search, X } from "lucide-react";
import { NoteItem } from "./NoteTypes";
import { NoteMasterDetailView } from "./NoteMasterDetailView";
import { useAppStore } from "../../../stores/appStore";
import { NavigationTarget, TabKey } from "../../../types";
import { loadNotesFromStorage, saveNotesToStorage } from "../../../utils/noteStorage";

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

const isNoteNeedsReview = (note: NoteItem) => {
  const title = note.title.trim().toLocaleLowerCase();
  return !title || title === "ghi chú không tiêu đề" || !stripHtml(note.content || "");
};

export interface NotesTabProps {
  navigationTarget?: NavigationTarget;
  onClearNavigationTarget?: () => void;
  onNavigateTab?: (tab: TabKey) => void;
}

export const NotesTab: React.FC<NotesTabProps> = ({
  navigationTarget,
  onClearNavigationTarget,
}) => {
  const { isMobileNoteDetailOpen } = useAppStore();
  const [notes, setNotes] = useState<NoteItem[]>(() => loadNotesFromStorage());
  const [searchQuery, setSearchQuery] = useState("");
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);
  const [noteTargetId, setNoteTargetId] = useState<string | undefined>();

  useEffect(() => {
    if (navigationTarget?.noteId) setNoteTargetId(navigationTarget.noteId);
    onClearNavigationTarget?.();
  }, [navigationTarget, onClearNavigationTarget]);

  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (query && !note.title.toLowerCase().includes(query) && !stripHtml(note.content || "").toLowerCase().includes(query)) {
          return false;
        }
        return !showNeedsReviewOnly || isNoteNeedsReview(note);
      })
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  }, [notes, searchQuery, showNeedsReviewOnly]);

  const needsReviewCount = useMemo(() => notes.filter(isNoteNeedsReview).length, [notes]);

  const handleCreateNewNote = () => {
    const now = new Date();
    const timestamp = `${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}, ${now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
    const newId = `note-${Date.now()}`;
    setNotes((previous) => [
      {
        id: newId,
        title: "",
        content: "",
        createdAt: timestamp,
        updatedAt: timestamp,
        isPinned: false,
      },
      ...previous,
    ]);
    setNewlyCreatedId(newId);
  };

  useEffect(() => {
    const handleCreateRequest = (event: Event) => {
      if ((event as CustomEvent<{ type?: string }>).detail?.type === "note") {
        handleCreateNewNote();
      }
    };
    window.addEventListener("sketchtask:create", handleCreateRequest);
    return () => window.removeEventListener("sketchtask:create", handleCreateRequest);
  }, []);

  const handleUpdateNote = (updatedNote: NoteItem) => {
    setNotes((previous) => previous.map((note) => (note.id === updatedNote.id ? updatedNote : note)));
  };

  const handleDeleteNote = (id: string) => {
    setNotes((previous) => previous.filter((note) => note.id !== id));
    if (newlyCreatedId === id) setNewlyCreatedId(null);
  };

  const handleTogglePinNote = (id: string) => {
    setNotes((previous) => previous.map((note) => (note.id === id ? { ...note, isPinned: !note.isPinned } : note)));
  };

  return (
    <div className={`w-full min-w-0 select-none ${isMobileNoteDetailOpen ? "p-0" : "space-y-3.5 pb-12"}`}>
      <div className={`items-center gap-2.5 border-b border-[#262626]/30 pb-3 ${isMobileNoteDetailOpen ? "hidden" : "flex"}`}>
        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[5px] border-[1.5px] border-[#262626] bg-white px-2.5 shadow-[1.5px_1.5px_0px_#262626]">
          <Search size={14} strokeWidth={2.4} className="shrink-0 text-[#78716C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm ghi chú..."
            className="w-full bg-transparent py-2 text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none sm:text-sm"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery("")} className="shrink-0 text-[#78716C]" title="Xóa tìm kiếm">
              <X size={13} strokeWidth={2.4} />
            </button>
          )}
        </div>
      </div>

      {needsReviewCount > 0 && !isMobileNoteDetailOpen && (
        <div className="flex items-center justify-between gap-3 border-[1.5px] border-[#D4CEBF] bg-[#FAF8F3] px-3 py-2.5 text-xs">
          <div className="flex min-w-0 items-start gap-2 text-[#57534E]">
            <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#9F1239]" strokeWidth={2.2} />
            <p className="leading-relaxed">Có {needsReviewCount} note chưa có tiêu đề rõ ràng hoặc chưa có nội dung.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowNeedsReviewOnly((current) => !current)}
            className="shrink-0 border-[1.5px] border-[#262626] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
          >
            {showNeedsReviewOnly ? "Hiện tất cả" : "Xem note cần dọn"}
          </button>
        </div>
      )}

      <div className={isMobileNoteDetailOpen ? "p-0" : "pt-0.5"}>
        <NoteMasterDetailView
          notes={filteredNotes}
          newlyCreatedId={newlyCreatedId}
          initialNoteId={noteTargetId}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onTogglePinNote={handleTogglePinNote}
          onCreateClick={handleCreateNewNote}
        />
      </div>
    </div>
  );
};
