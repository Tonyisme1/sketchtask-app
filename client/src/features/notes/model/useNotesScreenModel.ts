import { useState, useMemo, useCallback, useEffect } from "react";
import { NoteItem } from "../../../components/shared/notes/NoteTypes";
import { loadNotesFromStorage, saveNotesToStorage } from "../../../utils/noteStorage";
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
  const { isMobileNoteDetailOpen, setIsMobileNoteDetailOpen } = useAppStore();
  const { isMobile } = useResponsiveLayout();
  const [notes, setNotes] = useState<NoteItem[]>(() => loadNotesFromStorage());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeNoteId, setActiveNoteId] = useState<string | undefined>(options?.initialNoteId);
  const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);

  useEffect(() => {
    saveNotesToStorage(notes);
  }, [notes]);

  useEffect(() => {
    const reloadNotes = () => {
      const nextNotes = loadNotesFromStorage();
      setNotes((currentNotes) =>
        JSON.stringify(currentNotes) === JSON.stringify(nextNotes) ? currentNotes : nextNotes
      );
    };
    window.addEventListener("sketchtask_notes_changed", reloadNotes);
    return () => window.removeEventListener("sketchtask_notes_changed", reloadNotes);
  }, []);

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
    const now = new Date();
    const timestamp = `${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}, ${now.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}`;
    const newId = `note-${Date.now()}`;
    const newNote: NoteItem = {
      id: newId,
      title: "",
      content: "",
      createdAt: timestamp,
      updatedAt: timestamp,
      isPinned: false,
    };
    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newId);
    setIsMobileNoteDetailOpen(true);
    return newId;
  }, [setIsMobileNoteDetailOpen]);

  const updateNote = useCallback((updatedNote: NoteItem) => {
    setNotes((prev) => prev.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setActiveNoteId((prevId) => (prevId === id ? undefined : prevId));
  }, []);

  const togglePinNote = useCallback((id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n))
    );
  }, []);

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
