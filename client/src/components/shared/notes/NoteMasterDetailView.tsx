import React, { useState, useEffect, useRef } from "react";
import { NoteItem } from "./NoteTypes";
import { isNativePlatform } from "../../../services/notificationService";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pin,
  Check,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  RemoveFormatting,
} from "lucide-react";

export interface NoteMasterDetailViewProps {
  notes: NoteItem[];
  newlyCreatedId?: string | null;
  initialNoteId?: string;
  onUpdateNote: (updatedNote: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onTogglePinNote: (id: string) => void;
  onCreateClick: () => void;
  isMobile: boolean;
  isMobileNoteDetailOpen: boolean;
  onMobileDetailOpenChange: (open: boolean) => void;
}

// Helper trích xuất văn bản thuần không chứa thẻ HTML
const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

export const NoteMasterDetailView: React.FC<NoteMasterDetailViewProps> = ({
  notes,
  newlyCreatedId,
  initialNoteId,
  onUpdateNote,
  onDeleteNote,
  onTogglePinNote,
  onCreateClick,
  isMobile,
  isMobileNoteDetailOpen,
  onMobileDetailOpenChange,
}) => {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(() => {
    if (initialNoteId && notes.some((n) => n.id === initialNoteId)) {
      return initialNoteId;
    }
    if (newlyCreatedId && notes.some((n) => n.id === newlyCreatedId)) {
      return newlyCreatedId;
    }
    // Luôn bắt đầu ở danh sách. Chỉ mở editor sau khi người dùng chọn note.
    return null;
  });

  const [mobileNoteTransition, setMobileNoteTransition] = useState<"forward" | "back">("forward");

  // Đảm bảo selectedNoteId luôn trỏ tới note hợp lệ mà không tự mở note đầu.
  useEffect(() => {
    if (notes.length > 0) {
      if (selectedNoteId && !notes.some((n) => n.id === selectedNoteId)) {
        setSelectedNoteId(null);
      }
    } else {
      setSelectedNoteId(null);
    }
  }, [notes, selectedNoteId]);

  // Tự động chuyển sang note mới tạo nếu có newlyCreatedId mới
  const prevNewlyCreatedIdRef = useRef<string | null>(newlyCreatedId || null);
  useEffect(() => {
    if (initialNoteId && notes.some((note) => note.id === initialNoteId)) {
      setMobileNoteTransition("forward");
      setSelectedNoteId(initialNoteId);
      if (isMobile) onMobileDetailOpenChange(true);
    }
  }, [initialNoteId, isMobile, notes, onMobileDetailOpenChange]);

  useEffect(() => {
    if (newlyCreatedId && newlyCreatedId !== prevNewlyCreatedIdRef.current) {
      prevNewlyCreatedIdRef.current = newlyCreatedId;
      setMobileNoteTransition("forward");
      setSelectedNoteId(newlyCreatedId);
      if (isMobile) onMobileDetailOpenChange(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 80);
    }
  }, [isMobile, newlyCreatedId, onMobileDetailOpenChange]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // State cho TRÌNH SOẠN THẢO
  const [title, setTitle] = useState(selectedNote?.title || "");
  const [isSaved, setIsSaved] = useState(true);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const [activeFormats, setActiveFormats] = useState<Record<string, boolean>>({});

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // Đồng bộ nội dung editor khi đổi note được chọn
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title);
      if (editorRef.current && !isComposingRef.current) {
        editorRef.current.setAttribute("autocomplete", "off");
        if (editorRef.current.innerHTML !== selectedNote.content) {
          editorRef.current.innerHTML = selectedNote.content || "";
        }
      }
      setIsSaved(true);
    }
  }, [selectedNote?.id, selectedNote?.title, selectedNote?.content]);

  // Tự động lưu ngầm debounce
  const handleTriggerSave = (
    newTitle: string,
    newContentHtml: string
  ) => {
    if (!selectedNote) return;
    setIsSaved(false);
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      flushSave(newTitle, newContentHtml);
    }, 400);
  };

  const flushSave = (
    currentTitle: string,
    currentContentHtml: string
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
      updatedAt: nowStr,
    };

    onUpdateNote(updated);
    setIsSaved(true);
  };

  const handleOpenNote = (targetId: string) => {
    setMobileNoteTransition("forward");
    setSelectedNoteId(targetId);
    if (isMobile) onMobileDetailOpenChange(true);
  };

  const handleCloseNoteEditor = () => {
    if (selectedNote && !isSaved) {
      const currentHtml = editorRef.current
        ? editorRef.current.innerHTML
        : selectedNote.content || "";
      flushSave(title, currentHtml);
    }
    setMobileNoteTransition("back");
    setSelectedNoteId(null);
    if (isMobile) onMobileDetailOpenChange(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote?.content || "");
    handleTriggerSave(val, contentHtml);
  };

  const handleEditorInput = () => {
    isComposingRef.current = true;
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : "";
    handleTriggerSave(title, contentHtml);
  };

  const handleBlur = () => {
    isComposingRef.current = false;
    const contentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote?.content || "");
    flushSave(title, contentHtml);
  };

  const syncActiveFormats = () => {
    if (!editorRef.current || !editorRef.current.contains(document.activeElement)) return;
    const commands = ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"];
    setActiveFormats(
      commands.reduce<Record<string, boolean>>((formats, command) => {
        formats[command] = document.queryCommandState(command);
        return formats;
      }, {}),
    );
  };

  const runEditorCommand = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleEditorInput();
    syncActiveFormats();
  };

  useEffect(() => {
    const handleSelectionChange = () => syncActiveFormats();
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);
  const contentCharacterCount = stripHtml(selectedNote?.content || "").length;

  // =========================================================================
  // DANH SÁCH GHI CHÚ: CHỈ MỞ EDITOR SAU KHI NGƯỜI DÙNG CHỌN NOTE
  // =========================================================================
  if ((!selectedNote || (isMobile && !isMobileNoteDetailOpen)) && notes.length > 0) {
    return (
      <div className={`w-full min-w-0 space-y-3 select-none ${
        mobileNoteTransition === "back" ? "mobile-panel-back-enter" : "mobile-tab-enter"
      }`}>
        <div className="space-y-2.5">
          {notes.map((note, index) => {
            const plainContent = stripHtml(note.content || "").replace(/\s+/g, " ").trim();
            const isPreviewExpanded = expandedNoteIds.has(note.id);
            const hasLongPreview = plainContent.length > 150;

            return (
              <article
                key={note.id}
                className={`w-full rounded-3xl shadow-xs transition-colors border border-black/[0.04] dark:border-white/[0.04] ${
                  note.isPinned
                    ? "bg-[var(--accent-sky)]/30 dark:bg-[var(--accent-sky)]/15"
                    : "bg-white dark:bg-[#1E222A]"
                }`}
              >
                <div className="flex items-start gap-3 p-4">
                  <span className="pt-0.5 text-[11px] text-[#78716C] dark:text-[#8E8E93] shrink-0 font-mono">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenNote(note.id)}
                    className="min-w-0 flex-1 text-left active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer"
                  >
                    <h3 className="truncate text-[15px] font-semibold text-[#1C1917] dark:text-[#F2F2F7]">
                      {note.title || "Không tiêu đề"}
                    </h3>
                    <p className={`mt-1 text-[13px] leading-relaxed text-[#78716C] dark:text-[#8E8E93] ${isPreviewExpanded ? "" : "line-clamp-3"}`}>
                      {plainContent || "Trống"}
                    </p>
                  </button>

                  <div className="flex flex-col items-end justify-between shrink-0 self-stretch min-h-[58px]">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onTogglePinNote(note.id)}
                        aria-pressed={Boolean(note.isPinned)}
                        aria-label={note.isPinned ? "Bỏ ghim" : "Ghim"}
                        title={note.isPinned ? "Bỏ ghim" : "Ghim"}
                        className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl shadow-xs active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-colors ${
                          note.isPinned
                            ? "bg-[#FEF08A] dark:bg-amber-400 text-[#1C1917]"
                            : "bg-white dark:bg-[#2C2C2E] text-[#78716C] dark:text-[#8E8E93] hover:bg-[#FAF8F3]"
                        }`}
                      >
                        <Pin size={15} strokeWidth={2.2} fill={note.isPinned ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenNote(note.id)}
                        aria-label="Mở ghi chú"
                        className="flex h-8 w-6 sm:h-9 sm:w-7 items-center justify-center text-[#78716C] dark:text-[#8E8E93] hover:text-[#1C1917] dark:hover:text-white cursor-pointer"
                      >
                        <ChevronRight size={17} strokeWidth={2.2} />
                      </button>
                    </div>

                    <span className="text-[10px] sm:text-[11px] font-mono text-[#8E8E93] dark:text-[#8E8E93] pt-2 text-right whitespace-nowrap">
                      {note.updatedAt || note.createdAt}
                    </span>
                  </div>
                </div>
                {hasLongPreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setExpandedNoteIds((previous) => {
                        const next = new Set(previous);
                        if (next.has(note.id)) next.delete(note.id);
                        else next.add(note.id);
                        return next;
                      });
                    }}
                    className="w-full px-3 py-2 text-left text-[11px] font-semibold text-[#57534E] dark:text-[#8E8E93] hover:bg-[#FAF8F3] dark:hover:bg-[#2C2C2E] hover:text-[#1C1917] dark:hover:text-[#F2F2F7] cursor-pointer rounded-b-3xl"
                  >
                    {isPreviewExpanded ? "Thu gọn" : "Xem thêm"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // EMPTY STATE KHI CHƯA CÓ TRANG GHI CHÚ NÀO
  // =========================================================================
  if (!selectedNote || notes.length === 0) {
    return (
      <div className="w-full min-w-0 select-none">
        <div className="bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-sky)] dark:bg-[var(--accent-sky)]/20 flex items-center justify-center mx-auto shadow-xs">
            <FileText size={22} className="text-[var(--text-on-soft-accent)] dark:text-[var(--accent-sky-strong)]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#1C1917] dark:text-[#F2F2F7]">
              Chưa có ghi chú
            </h3>
          </div>
          <button
            type="button"
            onClick={onCreateClick}
            className="px-4 py-2 bg-[var(--text-strong)] dark:bg-[var(--accent-blue)] text-white rounded-2xl text-xs font-bold active:scale-95 transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>Tạo ghi chú</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TRÌNH SOẠN THẢO GHI CHÚ TRỰC TIẾP TOÀN KHÔNG GIAN (OPEN WORKSPACE)
  // =========================================================================
  return (
    <div className={`w-full min-w-0 select-none ${
      isMobile
        ? "bg-[#F5F7FA] dark:bg-[#12161B] min-h-screen mobile-panel-enter"
        : "space-y-4"
    }`}>
      {/* 1. Thanh thao tác ghi chú: quay lại, chọn sổ và xóa (Đồng bộ MobileHeader) */}
      <div className={`flex items-center justify-between gap-2 ${
        isMobile
          ? `sticky top-0 z-30 bg-[#F5F7FA] dark:bg-[#12161B] px-3.5 sm:px-5 min-h-[56px] sm:min-h-[60px] ${
              isNativePlatform()
                ? "pt-11 pb-2.5"
                : "pt-[max(env(safe-area-inset-top),10px)] pb-2.5"
            }`
          : "rounded-3xl bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] p-2.5 shadow-xs sm:p-3"
      }`}>
        <button
          type="button"
          onClick={handleCloseNoteEditor}
          className={`inline-flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#1C1917] dark:text-[#F2F2F7] transition-all cursor-pointer ${
            isMobile
              ? "mobile-back-button h-9 px-2.5 rounded-2xl bg-white dark:bg-[#1E222A] shadow-xs active:translate-y-[0.5px]"
              : "h-9 flex-1 rounded-2xl bg-white dark:bg-[#262C36] px-3 shadow-xs hover:bg-[#FAF8F3] dark:hover:bg-[#2D3542] active:scale-95"
          }`}
          aria-label="Quay lại danh sách ghi chú"
          title="Quay lại danh sách ghi chú"
        >
          <ChevronLeft size={16} strokeWidth={2.4} />
          <span className="truncate">Quay lại</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Nút Dấu Tích Lưu (mờ khi đã lưu, rõ khi chưa lưu, màu đen/trắng theo theme) */}
          <button
            type="button"
            onClick={() => {
              const currentHtml = editorRef.current ? editorRef.current.innerHTML : (selectedNote?.content || "");
              flushSave(title, currentHtml);
            }}
            disabled={isSaved}
            title={isSaved ? "Đã lưu" : "Lưu"}
            aria-label="Lưu"
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 text-[#1C1917] dark:text-white ${
              isSaved
                ? "opacity-25 cursor-default"
                : "opacity-100 hover:bg-black/5 dark:hover:bg-white/10 active:scale-90 cursor-pointer shadow-xs bg-black/[0.04] dark:bg-white/[0.08]"
            }`}
          >
            <Check size={19} strokeWidth={2.8} />
          </button>

          {/* Nút Xóa */}
          <button
            type="button"
            onClick={() => {
              onDeleteNote(selectedNote.id);
              setSelectedNoteId(null);
              if (isMobile) onMobileDetailOpenChange(false);
            }}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-[#78716C] hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer active:scale-95"
            title="Xóa trang ghi chú này"
            aria-label="Xóa trang ghi chú này"
          >
            <Trash2 size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* 2. KHUNG SOẠN THẢO */}
      <div
        className={`flex flex-col overflow-hidden ${
          isMobile
            ? "min-h-[calc(100dvh-70px)] bg-white dark:bg-[#1E222A] px-4 py-4 sm:px-6 sm:py-5 pb-28"
            : "h-[calc(100dvh-8.5rem)] min-h-[420px] max-h-[760px] rounded-3xl bg-white dark:bg-[#1E222A] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-xs sm:p-6 md:h-[calc(100dvh-12rem)] md:min-h-[520px] md:max-h-[820px] md:p-8"
        }`}
      >
        {/* Tiêu đề ghi chú */}
        <div className="shrink-0">
          <input
            ref={titleInputRef}
            type="text"
            name={`note-title-${selectedNote.id}`}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            inputMode="text"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleBlur}
            placeholder="Tiêu đề trang ghi chú..."
            className={`w-full bg-transparent border-none font-black text-[#1C1917] dark:text-white placeholder:text-[#A8A29E] focus:outline-none transition-colors ${
              isMobile
                ? "px-1 py-2 text-[30px] leading-tight"
                : "px-2 py-2 text-xl sm:text-2xl md:text-3xl"
            }`}
          />
          <div className={`mt-1.5 flex items-center gap-1.5 font-mono text-[#78716C] ${
            isMobile ? "px-1 text-xs" : "text-[10px]"
          }`}>
            <Clock size={12} strokeWidth={2.2} />
            {isMobile ? (
              <>
                <span>{selectedNote.updatedAt || selectedNote.createdAt}</span>
                <span aria-hidden="true">|</span>
                <span>{contentCharacterCount} ký tự</span>
              </>
            ) : (
              <span>Cập nhật: {selectedNote.updatedAt || selectedNote.createdAt}</span>
            )}
          </div>
        </div>

        {/* Thanh công cụ gọn, trượt ngang trên mobile và giữ cố định chiều cao trên desktop */}
        <div
          className="note-editor-toolbar flex shrink-0 items-center gap-1 overflow-x-auto rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] px-1.5 py-1.5 my-2"
          role="toolbar"
          aria-label="Định dạng nội dung ghi chú"
          onMouseDown={(event) => event.preventDefault()}
        >
          {[
            { command: "bold", label: "Đậm", icon: <Bold size={15} strokeWidth={2.6} /> },
            { command: "italic", label: "Nghiêng", icon: <Italic size={15} strokeWidth={2.4} /> },
            { command: "underline", label: "Gạch chân", icon: <Underline size={15} strokeWidth={2.4} /> },
            { command: "strikeThrough", label: "Gạch ngang", icon: <Strikethrough size={15} strokeWidth={2.4} /> },
            { command: "formatBlock", value: "<h1>", label: "Tiêu đề 1", icon: <Heading1 size={15} strokeWidth={2.2} /> },
            { command: "formatBlock", value: "<h2>", label: "Tiêu đề 2", icon: <Heading2 size={15} strokeWidth={2.2} /> },
            { command: "insertUnorderedList", label: "Danh sách", icon: <List size={15} strokeWidth={2.2} /> },
            { command: "insertOrderedList", label: "Danh sách số", icon: <ListOrdered size={15} strokeWidth={2.2} /> },
            { command: "formatBlock", value: "<blockquote>", label: "Trích dẫn", icon: <Quote size={15} strokeWidth={2.2} /> },
            { command: "removeFormat", label: "Xóa định dạng", icon: <RemoveFormatting size={15} strokeWidth={2.2} /> },
          ].map((tool, index) => {
            const isActive = Boolean(activeFormats[tool.command]);
            return (
              <button
                key={`${tool.command}-${tool.value || index}`}
                type="button"
                onClick={() => runEditorCommand(tool.command, tool.value)}
                title={tool.label}
                aria-label={tool.label}
                aria-pressed={isActive}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[#57534E] transition-colors active:scale-95 dark:text-[#D4D4D8] ${
                  isActive
                    ? "bg-[#262626] text-white shadow-2xs dark:bg-[#FAFAFA] dark:text-[#18181B]"
                    : "hover:bg-white dark:hover:bg-[#2C2C2E]"
                }`}
              >
                {tool.icon}
              </button>
            );
          })}
        </div>

        {/* Khung nhập nội dung ghi chú */}
        <div className="flex min-h-0 flex-1 flex-col py-2">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Nội dung ghi chú"
            aria-multiline="true"
            aria-autocomplete="none"
            spellCheck
            autoCorrect="on"
            autoCapitalize="sentences"
            inputMode="text"
            data-form-type="other"
            data-lpignore="true"
            data-1p-ignore="true"
            onInput={handleEditorInput}
            onBlur={handleBlur}
            data-placeholder="Bắt đầu viết nội dung ghi chú tại đây..."
            className={`note-editor-content w-full min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent text-[#1C1917] focus:outline-none resize-none font-sans selection:bg-[#FEF08A] [&_h1]:text-xl [&_h1]:sm:text-2xl [&_h1]:font-black [&_h1]:my-3 [&_h1]:text-[#1C1917] [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h2]:text-[#1C1917] [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#EAB308] [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:bg-[#FAF8F3] dark:[&_blockquote]:bg-white/5 [&_blockquote]:py-1.5 [&_blockquote]:rounded-r-xl ${
              isMobile
                ? "px-1 pt-6 text-[17px] leading-[1.65]"
                : "p-3 text-sm leading-relaxed sm:text-base"
            }`}
          />
        </div>
      </div>
    </div>
  );
};
