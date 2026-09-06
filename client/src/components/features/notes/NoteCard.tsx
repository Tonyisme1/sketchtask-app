import React, { useState, useEffect, useRef } from "react";
import { NoteItem } from "./NoteTypes";
import { NotebookDto } from "../../../types";
import { NoteToolbar } from "./NoteToolbar";
import { useMobileKeyboardOffset } from "./useMobileKeyboardOffset";
import {
  Clock,
  Trash2,
  Check,
  BookMarked,
  Sparkles,
  ChevronDown,
} from "lucide-react";

interface NoteCardProps {
  note: NoteItem;
  pageIndex: number;
  notebooks: NotebookDto[];
  onUpdate?: (updatedNote: NoteItem) => void;
  onDelete?: (id: string) => void;
  autoFocus?: boolean;
  className?: string;
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  pageIndex,
  notebooks,
  onUpdate,
  onDelete,
  autoFocus = false,
  className,
}) => {
  const [title, setTitle] = useState(note.title);
  const [notebookId, setNotebookId] = useState<string | undefined>(note.notebookId);
  const [isSaved, setIsSaved] = useState(true);
  const [showNotebookMenu, setShowNotebookMenu] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches
  );
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const mobileKeyboardOffset = useMobileKeyboardOffset();

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const notebookMenuRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches);

    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  // Nạp nội dung HTML ban đầu vào editor
  useEffect(() => {
    setTitle(note.title);
    setNotebookId(note.notebookId);
    if (editorRef.current && !isComposingRef.current) {
      if (editorRef.current.innerHTML !== note.content) {
        editorRef.current.innerHTML = note.content || "";
      }
    }
    setIsSaved(true);
  }, [note.id, note.title, note.content, note.notebookId]);

  useEffect(() => {
    if (autoFocus && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [autoFocus]);

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
      ...note,
      title: currentTitle.trim(),
      content: currentContentHtml,
      notebookId: currentNotebookId || undefined,
      updatedAt: nowStr,
    };

    onUpdate?.(updated);
    setIsSaved(true);
  };

  const handleBlur = () => {
    isComposingRef.current = false;
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : note.content;
    flushSave(title, contentHtml, notebookId);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : note.content;
    handleTriggerSave(val, contentHtml, notebookId);
  };

  const handleEditorInput = () => {
    isComposingRef.current = true;
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : "";
    handleTriggerSave(title, contentHtml, notebookId);
  };

  const handleSelectNotebook = (nbId: string | undefined) => {
    setNotebookId(nbId);
    setShowNotebookMenu(false);
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : note.content;
    handleTriggerSave(title, contentHtml, nbId);
  };

  // Sổ tay đang gắn kết
  const currentNotebook = notebookId
    ? notebooks.find((n) => n.id === notebookId)
    : null;

  return (
    <div
      data-note-card={note.id}
      data-page-index={pageIndex}
      className={`bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 sm:p-5 shadow-[3px_3px_0px_#262626] flex flex-col justify-between transition-all select-none relative group ${
        className || "w-full h-[560px] sm:h-[600px]"
      }`}
    >
      {/* 1. Header Trang Tập: Số Trang + Sổ Tay + Công Cụ + Trạng Thái Lưu */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#262626] shrink-0 gap-1.5 flex-wrap">
        {/* Số Trang & Chọn Sổ Tay */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Huy hiệu số trang */}
          <span className="px-2 py-0.5 rounded-[4px] bg-[#FAF8F3] border border-[#262626] text-[11px] font-mono font-bold text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626]">
            Trang #{pageIndex + 1}
          </span>

          {/* Dropdown Gắn Vào Sổ Tay */}
          <div ref={notebookMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotebookMenu(!showNotebookMenu)}
              className={`px-2.5 py-0.5 rounded-[4px] border border-[#262626] text-[10px] font-bold flex items-center gap-1.5 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] transition-all ${
                currentNotebook
                  ? "text-[#1C1917]"
                  : "bg-[#FAF8F3] text-[#78716C] hover:bg-[#F5F2EA]"
              }`}
              style={{
                backgroundColor: currentNotebook
                  ? currentNotebook.color || "#BBF7D0"
                  : undefined,
              }}
              title="Chọn sổ tay cho trang ghi chú"
            >
              <BookMarked size={11} strokeWidth={2.4} />
              <span className="max-w-[100px] truncate">
                {currentNotebook ? currentNotebook.name : "Gắn Sổ tay..."}
              </span>
              <ChevronDown size={10} strokeWidth={2.4} />
            </button>

            {/* Menu Chọn Sổ Tay */}
            {showNotebookMenu && (
              <div className="absolute left-0 top-full mt-1.5 w-52 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-1.5 shadow-[3px_3px_0px_#262626] z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#78716C] font-mono border-b border-[#E7E5E4]">
                  Chọn Sổ Tay
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectNotebook(undefined)}
                  className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
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
                    className={`w-full text-left px-2 py-1.5 rounded-[4px] text-xs flex items-center justify-between transition-colors ${
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

        {/* Trạng thái lưu, Nút Bật/Tắt Toolbar & Nút Xóa */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowToolbar(!showToolbar)}
            className={`hidden md:flex px-2 py-0.5 rounded-[4px] border border-[#262626] text-[10px] font-bold items-center gap-1 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] transition-all ${
              showToolbar
                ? "bg-[#FEF08A] text-[#1C1917]"
                : "bg-white text-[#78716C] hover:bg-[#FAF8F3]"
            }`}
            title="Bật/Tắt thanh công cụ soạn thảo"
          >
            <Sparkles size={11} strokeWidth={2.4} />
            <span className="hidden sm:inline">Công cụ</span>
          </button>

          {/* Trạng thái lưu */}
          <span className="text-[10px] font-mono flex items-center gap-1 text-[#78716C]">
            {isSaved ? (
              <span className="text-emerald-800 font-bold flex items-center gap-0.5" title="Đã lưu">
                <Check size={12} strokeWidth={2.8} />
              </span>
            ) : (
              <span className="text-amber-800 italic" title="Đang lưu...">...</span>
            )}
          </span>

          {/* Nút Xóa Trang */}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              className="w-6 h-6 rounded bg-white hover:bg-rose-50 border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-rose-600 transition-colors shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
              title="Xóa trang ghi chú này"
              aria-label="Xóa trang ghi chú"
            >
              <Trash2 size={12} strokeWidth={2.2} />
            </button>
          )}
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
          className="w-full px-1 py-1 bg-transparent text-base sm:text-lg font-bold text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none border-b border-[#262626] transition-colors"
        />
        </div>

      {/* 3. Thanh Công Cụ WYSIWYG Soạn Thảo */}
      {showToolbar && (!isMobileViewport || isEditorFocused) && (
        <div
          className="pt-1.5 shrink-0 note-editor-toolbar--active"
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
      )}

      {/* 4. Khung Soạn Thảo Trực Quan */}
      <div
        className={`flex-1 py-2 my-1 overflow-hidden flex flex-col ${
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
          className="w-full flex-1 p-2 bg-transparent text-xs sm:text-sm text-[#1C1917] focus:outline-none resize-none leading-relaxed font-sans overflow-y-auto rich-note-editor selection:bg-[#FEF08A] [&_h1]:text-base [&_h1]:sm:text-lg [&_h1]:font-black [&_h1]:my-1 [&_h1]:text-[#1C1917] [&_h2]:text-sm [&_h2]:sm:text-base [&_h2]:font-bold [&_h2]:my-1 [&_h2]:text-[#1C1917] [&_p]:my-0.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-[#262626] [&_blockquote]:pl-2.5 [&_blockquote]:my-1.5 [&_blockquote]:italic [&_blockquote]:bg-[#FAF8F3] [&_blockquote]:py-0.5 [&_blockquote]:rounded-r"
        />
      </div>

      {/* 5. Chân Trang Tập: Mốc thời gian */}
      </div>

      <div className="pt-2 border-t border-[#D4CEBF] flex items-center justify-between text-[10px] font-mono text-[#78716C] shrink-0">
        <div className="flex items-center gap-1.5">
          <Clock size={11} strokeWidth={2.2} />
          <span>Cập nhật: {note.updatedAt || note.createdAt}</span>
        </div>
      </div>
    </div>
  );
};
