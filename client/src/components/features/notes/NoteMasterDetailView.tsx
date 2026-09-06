import React, { useState, useEffect, useRef } from "react";
import { NoteItem } from "./NoteTypes";
import { NotebookDto } from "../../../types";
import { NoteToolbar } from "./NoteToolbar";
import { useMobileKeyboardOffset } from "./useMobileKeyboardOffset";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  Check,
  BookMarked,
  ChevronDown,
  Search,
  X,
  ArrowLeft,
} from "lucide-react";

export interface NoteMasterDetailViewProps {
  notes: NoteItem[];
  notebooks: NotebookDto[];
  newlyCreatedId?: string | null;
  initialNoteId?: string;
  onUpdateNote: (updatedNote: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onCreateClick: () => void;
}

// Helper trích xuất văn bản thuần không chứa thẻ HTML
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

export const NoteMasterDetailView: React.FC<NoteMasterDetailViewProps> = ({
  notes,
  notebooks,
  newlyCreatedId,
  initialNoteId,
  onUpdateNote,
  onDeleteNote,
  onCreateClick,
}) => {
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );

  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    if (initialNoteId && notes.some((n) => n.id === initialNoteId)) {
      return initialNoteId;
    }
    if (newlyCreatedId && notes.some((n) => n.id === newlyCreatedId)) {
      return newlyCreatedId;
    }
    return isMobileViewport ? null : notes.length > 0 ? notes[0].id : null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const mobileKeyboardOffset = useMobileKeyboardOffset();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const handleViewportChange = () => setIsMobileViewport(mediaQuery.matches);

    handleViewportChange();
    mediaQuery.addEventListener("change", handleViewportChange);
    return () => mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  // Tự động chuyển sang note mới tạo nếu có newlyCreatedId mới
  const prevNewlyCreatedIdRef = useRef<string | null>(newlyCreatedId || null);
  useEffect(() => {
    if (initialNoteId && notes.some((note) => note.id === initialNoteId)) {
      setSelectedNoteId(initialNoteId);
      setIsMobileDetailOpen(true);
    }
  }, [initialNoteId, notes]);

  useEffect(() => {
    if (newlyCreatedId && newlyCreatedId !== prevNewlyCreatedIdRef.current) {
      prevNewlyCreatedIdRef.current = newlyCreatedId;
      setSelectedNoteId(newlyCreatedId);
      setIsMobileDetailOpen(true);
    }
  }, [newlyCreatedId]);

  // Đảm bảo selectedNoteId luôn trỏ tới 1 note hợp lệ khi danh sách notes thay đổi
  useEffect(() => {
    if (notes.length > 0) {
      if (!selectedNoteId && !isMobileViewport) {
        setSelectedNoteId(notes[0].id);
      } else if (selectedNoteId && !notes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(notes[0].id);
      }
    } else {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId, isMobileViewport]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // State cho DUY NHẤT 1 TRÌNH SOẠN THẢO ở cột bên phải
  const [title, setTitle] = useState(selectedNote?.title || "");
  const [notebookId, setNotebookId] = useState<string | undefined>(selectedNote?.notebookId);
  const [isSaved, setIsSaved] = useState(true);
  const [showNotebookMenu, setShowNotebookMenu] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const notebookMenuRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  // Đồng bộ nội dung editor khi đổi note được chọn
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      setNotebookId(selectedNote.notebookId);
      if (editorRef.current && !isComposingRef.current) {
        if (editorRef.current.innerHTML !== selectedNote.content) {
          editorRef.current.innerHTML = selectedNote.content || "";
        }
      }
      setIsSaved(true);
    }
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.content, selectedNote?.notebookId]);

  // Đóng notebook menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notebookMenuRef.current && !notebookMenuRef.current.contains(e.target as Node)) {
        setShowNotebookMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Tự động lưu ngầm debounce
  const handleTriggerSave = (
    newTitle: string,
    newContentHtml: string,
    newNotebookId: string | undefined
  ) => {
    if (!selectedNote) return;
    setIsSaved(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      flushSave(newTitle, newContentHtml, newNotebookId);
    }, 400);
  };

  const flushSave = (
    currentTitle: string,
    currentContentHtml: string,
    currentNotebookId: string | undefined
  ) => {
    if (!selectedNote) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

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

    const updated: NoteItem = {
      ...selectedNote,
      title: currentTitle.trim(),
      content: currentContentHtml,
      notebookId: currentNotebookId || undefined,
      updatedAt: nowStr,
    };

    onUpdateNote(updated);
    setIsSaved(true);
  };

  // Handler khi click chuyển note ở cột trái
  const handleSelectNoteItem = (targetId: string) => {
    if (targetId === selectedNoteId) {
      setIsMobileDetailOpen(true);
      return;
    }

    // Lưu note hiện tại nếu đang có thay đổi chưa lưu
    if (selectedNote && !isSaved) {
      const currentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote.content || "");
      flushSave(title, currentHtml, notebookId);
    }

    isComposingRef.current = false;
    setSelectedNoteId(targetId);
    setIsMobileDetailOpen(true);

    const targetNote = notes.find((n) => n.id === targetId);
    if (targetNote) {
      setTitle(targetNote.title);
      setNotebookId(targetNote.notebookId);
      if (editorRef.current) {
        editorRef.current.innerHTML = targetNote.content || "";
      }
      setIsSaved(true);
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote?.content || "");
    handleTriggerSave(val, contentHtml, notebookId);
  };

  const handleEditorInput = () => {
    isComposingRef.current = true;
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : "";
    handleTriggerSave(title, contentHtml, notebookId);
  };

  const handleBlur = () => {
    isComposingRef.current = false;
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote?.content || "");
    flushSave(title, contentHtml, notebookId);
  };

  const handleSelectNotebook = (nbId: string | undefined) => {
    setNotebookId(nbId);
    setShowNotebookMenu(false);
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote?.content || "");
    handleTriggerSave(title, contentHtml, nbId);
  };

  const currentNotebook = notebookId
    ? notebooks.find((n) => n.id === notebookId)
    : null;

  // Lọc danh sách bên trái theo query con
  const filteredList = notes.filter((n) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      stripHtml(n.content).toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start select-none">
      {/* ========================================================================= */}
      {/* CỘT TRÁI (4/12): DANH SÁCH PREVIEW NOTE (CHỈ LÀ PREVIEW ITEMS)            */}
      {/* ========================================================================= */}
      <div
        className={`md:col-span-4 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3 shadow-[2px_2px_0px_#262626] flex-col min-h-[500px] h-[calc(100vh-14rem)] ${
          isMobileDetailOpen ? "hidden md:flex" : "flex"
        }`}
      >
        {/* Header Mục Lục */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E7E5E4] shrink-0">
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-emerald-950" />
            <span className="text-xs font-bold text-[#1C1917] uppercase tracking-wider font-mono">
              Mục lục trang ({notes.length})
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onCreateClick();
              setIsMobileDetailOpen(true);
            }}
            className="px-2.5 py-1 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 border border-[#262626] rounded-[4px] text-xs font-bold shadow-[1px_1px_0px_#262626] flex items-center gap-1 active:translate-y-[0.5px] transition-all cursor-pointer"
          >
            <Plus size={12} strokeWidth={2.6} />
            <span>Thêm trang</span>
          </button>
        </div>

        {/* Ô Tìm Kiếm Trong Danh Sách */}
        <div className="pt-2 pb-2 shrink-0">
          <div className="relative">
            <Search
              size={13}
              strokeWidth={2.2}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#78716C]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lọc nhanh trang..."
              className="w-full h-7 pl-7 pr-7 bg-white border border-[#262626] rounded-[4px] text-xs text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-1 focus:ring-[#262626]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
              >
                <X size={11} strokeWidth={2.4} />
              </button>
            )}
          </div>
        </div>

        {/* Danh Sách Cuộn Dọc Các Preview Item */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1">
          {filteredList.length === 0 ? (
            <div className="text-center py-10 text-xs text-[#78716C]">
              Không có trang nào phù hợp.
            </div>
          ) : (
            filteredList.map((note, index) => {
              const isSelected = note.id === selectedNoteId;
              const nb = note.notebookId
                ? notebooks.find((n) => n.id === note.notebookId)
                : null;
              const plainSnippet = stripHtml(note.content).slice(0, 80);

              return (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectNoteItem(note.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelectNoteItem(note.id);
                    }
                  }}
                  className={`group relative p-2.5 rounded-[6px] border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#FEF08A] border-[#262626] shadow-[2px_2px_0px_#262626] font-bold text-[#1C1917]"
                      : "bg-white hover:bg-[#FAF8F3] border-[#E7E5E4] hover:border-[#262626] shadow-[0.5px_0.5px_0px_#262626]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] text-[#78716C] font-bold shrink-0">
                        #{index + 1}
                      </span>
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? "text-[#1C1917]" : "text-[#292524]"
                        }`}
                      >
                        {note.title || "Ghi chú không tiêu đề"}
                      </h4>
                    </div>

                    {/* Nút xóa item */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNote(note.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-5 h-5 rounded hover:bg-rose-100 flex items-center justify-center text-[#78716C] hover:text-rose-700 transition-opacity"
                      title="Xóa trang này"
                    >
                      <Trash2 size={11} strokeWidth={2.2} />
                    </button>
                  </div>

                  {/* Trích đoạn nội dung */}
                  <p className="text-[11px] text-[#78716C] line-clamp-2 leading-relaxed mb-1.5 font-sans">
                    {plainSnippet || "(Trang trống...)"}
                  </p>

                  {/* Sổ tay & Thời gian cập nhật */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-[#78716C]">
                    {nb ? (
                      <span
                        className="px-1.5 py-0.2 rounded border border-[#262626] text-[#1C1917] font-bold truncate max-w-[120px]"
                        style={{ backgroundColor: nb.color || "#BBF7D0" }}
                      >
                        {nb.name}
                      </span>
                    ) : (
                      <span className="text-stone-400 italic">Chưa gán sổ</span>
                    )}
                    <span>{note.updatedAt || note.createdAt}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CỘT PHẢI (8/12): DUY NHẤT 1 TRÌNH SOẠN THẢO CHO NOTE ĐANG CHỌN           */}
      {/* ========================================================================= */}
      <div
        className={`md:col-span-8 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#262626] flex-col min-h-[500px] h-[calc(100vh-14rem)] justify-between ${
          isMobileDetailOpen ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedNote ? (
          <>
            {/* 1. Header Trang & Chọn Sổ Tay */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262626] shrink-0 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {/* Nút Quay Lại Danh Sách trên Mobile */}
                <button
                  type="button"
                  onClick={() => setIsMobileDetailOpen(false)}
                  className="md:hidden flex items-center gap-1 px-2 py-1 bg-white hover:bg-[#FEF08A] border border-[#262626] rounded-[4px] text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
                  title="Quay lại danh sách mục lục"
                >
                  <ArrowLeft size={13} strokeWidth={2.4} />
                  <span>Mục lục</span>
                </button>

                {/* Dropdown Gắn Vào Sổ Tay */}
                <div ref={notebookMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotebookMenu(!showNotebookMenu)}
                    className={`px-2.5 py-1 rounded-[4px] border border-[#262626] text-xs font-bold flex items-center gap-1.5 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] transition-all ${
                      currentNotebook
                        ? "text-[#1C1917]"
                        : "bg-[#FAF8F3] text-[#78716C] hover:bg-[#F5F2EA]"
                    }`}
                    style={{
                      backgroundColor: currentNotebook
                        ? currentNotebook.color || "#BBF7D0"
                        : undefined,
                    }}
                  >
                    <BookMarked size={12} strokeWidth={2.4} />
                    <span className="max-w-[140px] truncate">
                      {currentNotebook ? currentNotebook.name : "Gắn Sổ tay..."}
                    </span>
                    <ChevronDown size={11} strokeWidth={2.4} />
                  </button>

                  {showNotebookMenu && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-1 shadow-[3px_3px_0px_#262626] z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#78716C] font-mono border-b border-[#E7E5E4]">
                        Chọn Sổ Tay
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectNotebook(undefined)}
                        className={`w-full text-left px-2 py-1 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                          !notebookId
                            ? "bg-[#FAF8F3] font-bold border border-[#262626]"
                            : "hover:bg-[#FAF8F3] text-[#78716C]"
                        }`}
                      >
                        <span>(Không thuộc sổ tay)</span>
                        {!notebookId && <Check size={12} className="text-emerald-800" />}
                      </button>

                      {notebooks.map((nb) => (
                        <button
                          key={nb.id}
                          type="button"
                          onClick={() => handleSelectNotebook(nb.id)}
                          className={`w-full text-left px-2 py-1 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
                            notebookId === nb.id
                              ? "font-bold border border-[#262626]"
                              : "hover:bg-[#FAF8F3] text-[#1C1917]"
                          }`}
                          style={{
                            backgroundColor:
                              notebookId === nb.id
                                ? nb.color || "#BBF7D0"
                                : undefined,
                          }}
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <div
                              className="w-2.5 h-2.5 rounded-[2px] border border-[#262626] shrink-0"
                              style={{ backgroundColor: nb.color || "#BBF7D0" }}
                            />
                            <span className="truncate">{nb.name}</span>
                          </div>
                          {notebookId === nb.id && (
                            <Check size={12} className="text-emerald-950 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Trạng thái lưu & Nút xóa */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono flex items-center gap-1 text-[#78716C]">
                  {isSaved ? (
                    <span className="text-emerald-800 font-bold flex items-center gap-0.5">
                      <Check size={12} strokeWidth={2.6} />
                      <span>Đã lưu</span>
                    </span>
                  ) : (
                    <span className="text-amber-800 italic">Đang lưu...</span>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => onDeleteNote(selectedNote.id)}
                  className="w-7 h-7 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 transition-colors shadow-[0.5px_0.5px_0px_#262626] active:translate-y-[0.5px]"
                  title="Xóa trang ghi chú"
                >
                  <Trash2 size={13} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* 2. Tiêu Đề Ghi Chú */}
            <div
              className="flex flex-col flex-1 min-h-0"
              onFocusCapture={() => setIsEditorFocused(true)}
              onBlurCapture={(event) => {
                const nextFocused = event.relatedTarget as Node | null;
                if (!event.currentTarget.contains(nextFocused)) {
                  setIsEditorFocused(false);
                }
              }}
            >
              <div className="pt-2 shrink-0">
              <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleBlur}
                placeholder="Tiêu đề trang ghi chú..."
                className="w-full px-2 py-1.5 bg-transparent border-b-2 border-transparent focus:border-[#262626] text-base sm:text-lg font-bold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none transition-colors"
              />
              </div>

            {/* 3. Thanh Công Cụ Soạn Thảo WYSIWYG Kiểu Word (Duy nhất 1 instance) */}
            <div
              className={`pt-2 shrink-0 ${
                isEditorFocused
                  ? "note-editor-toolbar--active"
                  : "note-editor-toolbar--hidden"
              }`}
              style={
                {
                  "--note-keyboard-offset": `${mobileKeyboardOffset}px`,
                } as React.CSSProperties
              }
            >
              <NoteToolbar
                editorRef={editorRef}
                onContentChange={handleEditorInput}
              />
            </div>

            {/* 4. Khung Soạn Thảo Toàn Màn Hình */}
            <div
              className={`flex-1 overflow-y-auto py-2 my-1 ${
                isEditorFocused ? "pb-14 md:pb-2" : ""
              }`}
            >
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleEditorInput}
                onBlur={handleBlur}
                data-placeholder="Bắt đầu viết ghi chú..."
                className="w-full h-full min-h-[260px] p-2 bg-transparent text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none leading-relaxed font-sans selection:bg-[#FEF08A] [&_h1]:text-lg [&_h1]:sm:text-xl [&_h1]:font-black [&_h1]:my-2 [&_h1]:text-[#1C1917] [&_h2]:text-base [&_h2]:sm:text-lg [&_h2]:font-bold [&_h2]:my-1.5 [&_h2]:text-[#1C1917] [&_p]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#262626] [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:italic [&_blockquote]:bg-[#FAF8F3] [&_blockquote]:py-1 [&_blockquote]:rounded-r"
              />
            </div>

            {/* 5. Chân Trang */}
            </div>

            <div className="pt-2 border-t border-[#D4CEBF] flex items-center justify-between text-[11px] font-mono text-[#78716C] shrink-0">
              <div className="flex items-center gap-1.5">
                <Clock size={12} strokeWidth={2.2} />
                <span>Cập nhật: {selectedNote.updatedAt || selectedNote.createdAt}</span>
              </div>
            </div>
          </>
        ) : (
          /* Empty State khi chưa chọn note hoặc không có note nào */
          <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-center p-8">
            <div className="w-12 h-12 rounded-[8px] bg-[#FEF08A] border-[1.5px] border-[#262626] flex items-center justify-center shadow-[2px_2px_0px_#262626]">
              <FileText size={24} className="text-[#1C1917]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-[#1C1917]">
                Chưa có trang ghi chú nào được chọn
              </h4>
              <p className="text-xs text-[#78716C] max-w-xs">
                Hãy chọn một trang từ mục lục bên trái hoặc tạo trang mới.
              </p>
            </div>
            <button
              type="button"
              onClick={onCreateClick}
              className="px-3.5 py-1.5 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 border border-[#262626] rounded-[6px] text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] flex items-center gap-1.5 active:translate-y-[0.5px] transition-all cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.6} />
              <span>Tạo trang mới</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
