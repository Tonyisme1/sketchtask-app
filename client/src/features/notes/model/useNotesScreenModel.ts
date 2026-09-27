import { useState, useMemo, useCallback, useEffect } from "react";
import { NoteItem } from "../../../components/shared/notes/NoteTypes";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../hooks";
import { NotesScreenModel } from "./types";

const stripHtml = (html: string) => {
  if (typeof document === "undefined") return html;
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

const isNoteNeedsReview = (note: NoteItem) => {
  const title = note.title.trim().toLocaleLowerCase();
  return !title || title === "ghi chú không tiêu đề" || !stripHtml(note.content || "");
};

export interface UseNotesScreenModelOptions {
  initialNoteId?: string;
  onClearTarget?: () => void;
}

export const useNotesScreenModel = (
  options?: UseNotesScreenModelOptions
): NotesScreenModel => {
  const {
    stickyNotes,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    togglePinStickyNote,
    isMobileNoteDetailOpen,
    setIsMobileNoteDetailOpen,
  } = useAppStore();
  const { isMobile } = useResponsiveLayout();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | undefined>(options?.initialNoteId);
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);

  const notes = useMemo<NoteItem[]>(
    () => stickyNotes.map((note) => ({
      id: note.id,
      title: note.title || "",
      content: note.content,
      isPinned: note.isPinned,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt || note.createdAt,
    })),
    [stickyNotes],
  );

  useEffect(() => {
    if (options?.initialNoteId) {
      setActiveNoteId(options.initialNoteId);
      options.onClearTarget?.();
    }
  }, [options]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (
          query &&
          !note.title.toLowerCase().includes(query) &&
          !stripHtml(note.content || "").toLowerCase().includes(query)
        ) {
          return false;
        }
        return !showNeedsReviewOnly || isNoteNeedsReview(note);
      })
      .sort((a, b) => Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned)));
  }, [notes, searchQuery, showNeedsReviewOnly]);

  const needsReviewCount = useMemo(() => notes.filter(isNoteNeedsReview).length, [notes]);

  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  const createNote = useCallback(() => {
    const newNote = addStickyNote("", "sky");
    setActiveNoteId(newNote.id);
    setIsMobileNoteDetailOpen(true);
    return newNote.id;
  }, [addStickyNote, setIsMobileNoteDetailOpen]);

  const updateNote = useCallback((updatedNote: NoteItem) => {
    updateStickyNote(updatedNote.id, {
      title: updatedNote.title,
      content: updatedNote.content,
      isPinned: Boolean(updatedNote.isPinned),
      updatedAt: updatedNote.updatedAt,
    });
  }, [updateStickyNote]);

  const deleteNote = useCallback((id: string) => {
    deleteStickyNote(id);
    setActiveNoteId((prevId) => (prevId === id ? undefined : prevId));
  }, [deleteStickyNote]);

  const togglePinNote = useCallback((id: string) => {
    togglePinStickyNote(id);
  }, [togglePinStickyNote]);

  const selectNote = useCallback((id: string | undefined) => {
    setActiveNoteId(id);
    if (id) {
      setIsMobileNoteDetailOpen(true);
    }
  }, [setIsMobileNoteDetailOpen]);

  const closeEditor = useCallback(() => {
    setActiveNoteId(undefined);
    setIsMobileNoteDetailOpen(false);
  }, [setIsMobileNoteDetailOpen]);

  return {
    notes,
    filteredNotes,
    searchQuery,
    activeNote,
    needsReviewCount,
    isEditorOpen: isMobileNoteDetailOpen,
    isMobile,

    actions: {
      setSearchQuery,
      selectNote,
      createNote,
      updateNote,
      deleteNote,
      togglePinNote,
      closeEditor,
      setEditorOpen: setIsMobileNoteDetailOpen,
    },
  };
};
