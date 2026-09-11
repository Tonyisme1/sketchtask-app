import React, { useState, useEffect, useRef } from "react";
import { NoteItem } from "./NoteTypes";
import { useAppStore } from "../../../stores/appStore";
import { useResponsiveLayout } from "../../../shared/hooks";
import { isNativePlatform } from "../../../services/notificationService";
import {
  FileText,
  Plus,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pin,
} from "lucide-react";

export interface NoteMasterDetailViewProps {
  notes: NoteItem[];
  newlyCreatedId?: string | null;
  initialNoteId?: string;
  onUpdateNote: (updatedNote: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onTogglePinNote: (id: string) => void;
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
  newlyCreatedId,
  initialNoteId,
  onUpdateNote,
  onDeleteNote,
  onTogglePinNote,
  onCreateClick,
}) => {
  const { isMobileNoteDetailOpen, setIsMobileNoteDetailOpen } = useAppStore();
  const { isMobile } = useResponsiveLayout();

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
      setIsMobileNoteDetailOpen(true);
    }
  }, [initialNoteId, isMobile, notes, setIsMobileNoteDetailOpen]);

  useEffect(() => {
    if (newlyCreatedId && newlyCreatedId !== prevNewlyCreatedIdRef.current) {
      prevNewlyCreatedIdRef.current = newlyCreatedId;
      setMobileNoteTransition("forward");
      setSelectedNoteId(newlyCreatedId);
      setIsMobileNoteDetailOpen(true);
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 80);
    }
  }, [isMobile, newlyCreatedId, setIsMobileNoteDetailOpen]);

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  // State cho TRÌNH SOẠN THẢO
  const [title, setTitle] = useState(selectedNote?.title || "");
  const [isSaved, setIsSaved] = useState(true);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());

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
    setIsMobileNoteDetailOpen(true);
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
    setIsMobileNoteDetailOpen(false);
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
  const contentCharacterCount = stripHtml(selectedNote?.content || "").length;

  // =========================================================================
  // DANH SÁCH GHI CHÚ: CHỈ MỞ EDITOR SAU KHI NGƯỜI DÙNG CHỌN NOTE
  // =========================================================================
  if ((!selectedNote || !isMobileNoteDetailOpen) && notes.length > 0) {
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
                className={`w-full border-[1.5px] border-[#262626] rounded-[6px] shadow-[2px_2px_0px_#262626] transition-colors ${
                  note.isPinned ? "bg-[#FEF08A]/45" : "bg-[#FFFDF8]"
                }`}
              >
                <div className="flex items-start gap-3 p-3">
                  <span className="pt-0.5 text-[11px] text-[#78716C] shrink-0">
                    #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenNote(note.id)}
                    className="min-w-0 flex-1 text-left active:translate-x-[0.5px] active:translate-y-[0.5px]"
                  >
                    <h3 className="truncate text-[15px] font-semibold text-[#1C1917]">
                      {note.title || "Ghi chú không tiêu đề"}
                    </h3>
                    <p className={`mt-1 text-[13px] leading-relaxed text-[#78716C] ${isPreviewExpanded ? "" : "line-clamp-3"}`}>
                      {plainContent || "Chưa có nội dung"}
                    </p>
                    <div className="mt-2 flex items-center justify-end gap-2 text-[11px] text-[#78716C]">
                      <span className="shrink-0">{note.updatedAt || note.createdAt}</span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onTogglePinNote(note.id)}
                      aria-pressed={Boolean(note.isPinned)}
                      aria-label={note.isPinned ? "Bỏ ghim ghi chú" : "Ghim ghi chú"}
                      title={note.isPinned ? "Bỏ ghim ghi chú" : "Ghim ghi chú"}
                      className={`flex h-9 w-9 items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
                        note.isPinned ? "bg-[#FEF08A] text-[#1C1917]" : "bg-white text-[#78716C]"
                      }`}
                    >
                      <Pin size={15} strokeWidth={2.2} fill={note.isPinned ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenNote(note.id)}
                      aria-label="Mở ghi chú"
                      className="flex h-9 w-7 items-center justify-center text-[#78716C]"
                    >
                      <ChevronRight size={17} strokeWidth={2.2} />
                    </button>
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
                    className="w-full border-t border-[#D4CEBF] px-3 py-2 text-left text-[11px] font-semibold text-[#57534E] hover:bg-[#FAF8F3] hover:text-[#1C1917]"
                  >
                    {isPreviewExpanded ? "Thu gọn nội dung" : "Xem thêm nội dung"}
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
        <div className="bg-[#FFFDF8] border-[1.5px] border-dashed border-[#262626] rounded-[8px] p-8 sm:p-14 text-center shadow-[3px_3px_0px_#262626] space-y-3.5">
          <div className="w-14 h-14 rounded-[8px] bg-[#FEF08A] border-[1.5px] border-[#262626] flex items-center justify-center mx-auto shadow-[2px_2px_0px_#262626]">
            <FileText size={26} className="text-[#1C1917]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#1C1917]">
              Chưa có trang ghi chú nào
            </h3>
            <p className="text-xs sm:text-sm text-[#78716C] max-w-sm mx-auto">
              Hãy mở trang ghi chú đầu tiên để bắt đầu lưu trữ ý tưởng, tài liệu và kế hoạch!
            </p>
          </div>
          <button
            type="button"
            onClick={onCreateClick}
            className="px-5 py-2.5 bg-[#BBF7D0] hover:bg-[#86EFAC] text-emerald-950 border-[1.5px] border-[#262626] rounded-[6px] text-sm font-bold shadow-[2px_2px_0px_#262626] active:translate-y-[0.5px] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={17} strokeWidth={2.6} />
            <span>Mở trang ghi chú mới</span>
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
        ? "bg-[#FBF9F4] mobile-panel-enter"
        : "space-y-4"
    }`}>
      {/* 1. Thanh thao tác ghi chú: quay lại, chọn sổ và xóa (Đồng bộ MobileHeader) */}
      <div className={`flex items-center justify-between gap-2 ${
        isMobile
          ? `sticky top-0 z-30 bg-[#FBF9F4] border-b border-[#262626]/20 px-3.5 sm:px-5 min-h-[56px] sm:min-h-[60px] ${
              isNativePlatform()
                ? "pt-11 pb-2.5"
                : "pt-[max(env(safe-area-inset-top),10px)] pb-2.5"
            }`
          : "rounded-[8px] border-[1.5px] border-[#262626] bg-[#FFFDF8] p-2.5 shadow-[2.5px_2.5px_0px_#262626] sm:p-3"
      }`}>
        <button
          type="button"
          onClick={handleCloseNoteEditor}
          className={`inline-flex min-w-0 items-center gap-1.5 text-xs font-bold text-[#1C1917] transition-all cursor-pointer ${
            isMobile
              ? "h-9 px-2.5 rounded-[4px] border border-[#262626] bg-white shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
              : "h-9 flex-1 rounded-[4px] border-[1.5px] border-[#262626] bg-white px-2.5 shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
          }`}
          aria-label="Quay lại danh sách ghi chú"
          title="Quay lại danh sách ghi chú"
        >
          <ChevronLeft size={16} strokeWidth={2.4} />
          <span className="truncate">Quay lại</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {/* Nút Xóa */}
          <button
            type="button"
            onClick={() => {
              onDeleteNote(selectedNote.id);
              setSelectedNoteId(null);
              setIsMobileNoteDetailOpen(false);
            }}
            className={`h-9 w-9 rounded-[4px] flex items-center justify-center transition-colors cursor-pointer ${
              isMobile
                ? "border border-transparent bg-transparent text-[#78716C] shadow-none hover:bg-[#FECDD3] hover:text-[#BE123C]"
                : "border-[1.5px] border-[#262626] bg-white text-[#78716C] shadow-[1.5px_1.5px_0px_#262626] hover:bg-rose-50 hover:text-rose-600 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
            }`}
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
            ? "min-h-[calc(100dvh-70px)] bg-transparent px-3.5 py-4 sm:px-5 sm:py-5 pb-28"
            : "h-[calc(100dvh-8.5rem)] min-h-[420px] max-h-[760px] rounded-[8px] border-[1.5px] border-[#262626] bg-[#FFFDF8] p-4 shadow-[3px_3px_0px_#262626] sm:p-6 md:h-[calc(100dvh-12rem)] md:min-h-[520px] md:max-h-[820px] md:p-8"
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
            className={`w-full bg-transparent border-b-2 border-transparent focus:border-[#262626] font-black text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none transition-colors ${
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

        {/* Khung nhập nội dung ghi chú, không có thanh công cụ kiểu Word */}
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
            className={`note-editor-content w-full min-h-0 flex-1 overflow-y-auto overscroll-contain bg-transparent text-[#1C1917] focus:outline-none resize-none font-sans selection:bg-[#FEF08A] [&_h1]:text-xl [&_h1]:sm:text-2xl [&_h1]:font-black [&_h1]:my-3 [&_h1]:text-[#1C1917] [&_h2]:text-lg [&_h2]:sm:text-xl [&_h2]:font-bold [&_h2]:my-2 [&_h2]:text-[#1C1917] [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#262626] [&_blockquote]:pl-4 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:bg-[#FAF8F3] [&_blockquote]:py-1.5 [&_blockquote]:rounded-r ${
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
