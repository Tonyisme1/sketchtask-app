import React, { useState, useEffect, useCallback, useRef } from "react";
import { NoteItem } from "./NoteTypes";
import { NotebookDto } from "../../../types";
import { NoteCard } from "./NoteCard";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
} from "lucide-react";

interface NoteListProps {
  notes: NoteItem[];
  notebooks: NotebookDto[];
  newlyCreatedId?: string | null;
  initialNoteId?: string;
  onUpdateNote: (updatedNote: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onCreateClick: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  notes,
  notebooks,
  newlyCreatedId,
  initialNoteId,
  onUpdateNote,
  onDeleteNote,
  onCreateClick,
  searchQuery = "",
  onClearSearch,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | "none">("none");
  const touchStartXRef = useRef<number | null>(null);
  const wheelLockRef = useRef(false);

  // Đảm bảo currentPageIndex luôn hợp lệ khi danh sách notes thay đổi
  useEffect(() => {
    if (initialNoteId) {
      const idx = notes.findIndex((n) => n.id === initialNoteId);
      if (idx !== -1) {
        setFlipDirection(idx >= currentPageIndex ? "next" : "prev");
        setCurrentPageIndex(idx);
        return;
      }
    }
    if (newlyCreatedId) {
      const idx = notes.findIndex((n) => n.id === newlyCreatedId);
      if (idx !== -1) {
        setFlipDirection("next");
        setCurrentPageIndex(idx);
        return;
      }
    }
    if (currentPageIndex >= notes.length && notes.length > 0) {
      setCurrentPageIndex(notes.length - 1);
    }
  }, [initialNoteId, newlyCreatedId, notes, currentPageIndex]);

  const totalPages = notes.length;
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex >= totalPages - 1;
  const currentNote = notes[currentPageIndex] || null;

  // Handler lật sang trang trước
  const handlePrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setFlipDirection("prev");
      setCurrentPageIndex((prev) => prev - 1);
    }
  }, [currentPageIndex]);

  // Handler lật sang trang sau
  const handleNextPage = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setFlipDirection("next");
      setCurrentPageIndex((prev) => prev + 1);
    }
  }, [currentPageIndex, totalPages]);

  // Handler nhảy tới trang chỉ định
  const handleJumpToPage = useCallback(
    (targetIndex: number) => {
      if (targetIndex >= 0 && targetIndex < totalPages) {
        setFlipDirection(targetIndex > currentPageIndex ? "next" : "prev");
        setCurrentPageIndex(targetIndex);
      }
    },
    [currentPageIndex, totalPages]
  );

  // Hỗ trợ lật trang bằng phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      // Nếu đang gõ text thông thường -> dùng Alt + Arrow
      if (isTyping) {
        if (e.altKey && e.key === "ArrowLeft") {
          e.preventDefault();
          handlePrevPage();
        } else if (e.altKey && e.key === "ArrowRight") {
          e.preventDefault();
          handleNextPage();
        }
        return;
      }

      // Khi đang xem bình thường
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        handlePrevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        handleNextPage();
      } else if (e.key === "Home") {
        e.preventDefault();
        handleJumpToPage(0);
      } else if (e.key === "End") {
        e.preventDefault();
        handleJumpToPage(totalPages - 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevPage, handleNextPage, handleJumpToPage, totalPages]);

  // Hỗ trợ lật trang bằng bánh xe chuột (Mouse Wheel) có debounce khóa tốc độ
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const isInsideEditorContent =
      target.closest("[contenteditable='true']") || target.closest("textarea");

    if (isInsideEditorContent) {
      const el = isInsideEditorContent as HTMLElement;
      if (el.scrollHeight > el.clientHeight) {
        return; // Ưu tiên cuộn nội dung bên trong editor
      }
    }

    if (wheelLockRef.current) return;

    if (Math.abs(e.deltaY) > 30 || Math.abs(e.deltaX) > 30) {
      wheelLockRef.current = true;
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 400);

      if (e.deltaY > 0 || e.deltaX > 0) {
        handleNextPage();
      } else {
        handlePrevPage();
      }
    }
  };

  // Hỗ trợ vuốt cảm ứng trên màn hình điện thoại (Touch Swipe)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartXRef.current;

    if (Math.abs(diff) > 45) {
      if (diff > 0) {
        handlePrevPage(); // Vuốt sang phải -> Lật về trước
      } else {
        handleNextPage(); // Vuốt sang trái -> Lật tới sau
      }
    }
    touchStartXRef.current = null;
  };

  return (
    <div className="space-y-3.5 select-none">
      {/* 1. THANH ĐIỀU KHIỂN LẬT TẬP & QUICK PAGER */}
      <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-2.5 sm:p-3 shadow-[2px_2px_0px_#262626] flex flex-wrap items-center justify-between gap-2.5">
        {/* Tiêu đề & Thông tin */}
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen size={16} strokeWidth={2.4} className="text-emerald-900 shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-[#1C1917] truncate">
            {searchQuery
              ? `Kết quả tìm kiếm (${notes.length} trang)`
              : `Cuốn tập ghi chép`}
          </span>
          {searchQuery && onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="text-[11px] text-emerald-800 font-bold hover:underline shrink-0"
            >
              (Xóa lọc)
            </button>
          )}
        </div>

        {/* Cụm Nút Lật Trang & Nhảy Nhanh */}
        {totalPages > 0 && (
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Về trang đầu */}
            <button
              type="button"
              onClick={() => handleJumpToPage(0)}
              disabled={isFirstPage}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-[#FAF8F3] hover:bg-[#FEF08A] disabled:opacity-40 disabled:hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] disabled:active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Về trang đầu tiên (Home)"
              aria-label="Về trang đầu"
            >
              <ChevronsLeft size={15} strokeWidth={2.5} />
            </button>

            {/* Lật trang trước */}
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={isFirstPage}
              className="px-2 sm:px-2.5 h-7 sm:h-8 rounded-[4px] bg-[#FAF8F3] hover:bg-[#FEF08A] disabled:opacity-40 disabled:hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] flex items-center gap-1 text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] disabled:active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Lật sang trang trước (Alt + mũi tên trái hoặc vuốt phải)"
              aria-label="Lật trang trước"
            >
              <ChevronLeft size={16} strokeWidth={2.6} />
              <span className="hidden sm:inline">Lật trước</span>
            </button>

            {/* Selector Nhảy Nhanh Đến Trang */}
            <div className="flex items-center gap-1 bg-white border-[1.5px] border-[#262626] rounded-[4px] px-2 h-7 sm:h-8 shadow-[1px_1px_0px_#262626]">
              <span className="text-[11px] sm:text-xs font-mono font-bold text-[#1C1917]">
                Trang
              </span>
              <select
                value={currentPageIndex}
                onChange={(e) => handleJumpToPage(Number(e.target.value))}
                className="bg-transparent text-xs font-mono font-black text-emerald-900 focus:outline-none cursor-pointer px-0.5 py-0.5"
                title="Chọn nhảy nhanh tới bất kỳ trang nào"
              >
                {notes.map((_, idx) => (
                  <option key={idx} value={idx}>
                    #{idx + 1}
                  </option>
                ))}
              </select>
              <span className="text-[11px] sm:text-xs font-mono text-[#78716C]">
                / {totalPages}
              </span>
            </div>

            {/* Lật trang sau */}
            <button
              type="button"
              onClick={handleNextPage}
              disabled={isLastPage}
              className="px-2 sm:px-2.5 h-7 sm:h-8 rounded-[4px] bg-[#FAF8F3] hover:bg-[#FEF08A] disabled:opacity-40 disabled:hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] flex items-center gap-1 text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] disabled:active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Lật sang trang sau (Alt + mũi tên phải hoặc vuốt trái)"
              aria-label="Lật trang sau"
            >
              <span className="hidden sm:inline">Lật sau</span>
              <ChevronRight size={16} strokeWidth={2.6} />
            </button>

            {/* Tới trang cuối */}
            <button
              type="button"
              onClick={() => handleJumpToPage(totalPages - 1)}
              disabled={isLastPage}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-[4px] bg-[#FAF8F3] hover:bg-[#FEF08A] disabled:opacity-40 disabled:hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] disabled:active:translate-y-0 transition-all cursor-pointer disabled:cursor-not-allowed"
              title="Tới trang cuối cùng (End)"
              aria-label="Tới trang cuối"
            >
              <ChevronsRight size={15} strokeWidth={2.5} />
            </button>

            {/* Nút Thêm Trang Nhanh */}
            <button
              type="button"
              onClick={onCreateClick}
              className="h-7 sm:h-8 px-2.5 bg-[#BBF7D0] hover:bg-[#86EFAC] border-[1.5px] border-[#262626] rounded-[4px] text-xs font-bold text-[#1C1917] flex items-center gap-1 shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] transition-all ml-1 cursor-pointer"
              title="Thêm trang ghi chú mới vào cuốn tập"
            >
              <Plus size={15} strokeWidth={2.6} />
              <span className="hidden md:inline">Thêm trang</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. KHU VỰC CUỐN TẬP XẾP CHỒNG LỚP (STACKED NOTEBOOK PAGE) */}
      {totalPages === 0 ? (
        /* Empty State khi chưa có trang nào */
        <div className="flex justify-center items-center py-10">
          <div className="w-full max-w-md bg-[#FFFDF8] border-[2px] border-dashed border-[#262626] rounded-[8px] p-8 text-center shadow-[3px_3px_0px_#262626] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#FAF8F3] border border-[#262626] flex items-center justify-center mx-auto shadow-[1px_1px_0px_#262626]">
              <Sparkles size={22} className="text-amber-700" />
            </div>
            <p className="text-sm font-bold text-[#1C1917]">
              Cuốn tập hiện chưa có trang ghi chép nào
            </p>
            <p className="text-xs text-[#78716C]">
              Hãy tạo trang đầu tiên để bắt đầu ghi chép ý tưởng của bạn!
            </p>
            <button
              type="button"
              onClick={onCreateClick}
              className="px-4 py-2 bg-[#BBF7D0] hover:bg-[#86EFAC] text-[#1C1917] border-[1.5px] border-[#262626] rounded-[6px] text-xs font-bold shadow-[2px_2px_0px_#262626] active:translate-y-[1px] transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={15} strokeWidth={2.6} />
              <span>+ Mở trang ghi chú mới</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex justify-center items-center py-2 sm:py-4 px-1 gap-2 sm:gap-3"
        >
          {/* Nút Lật Mép Trái Sổ */}
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={isFirstPage}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF8] hover:bg-[#FEF08A] disabled:opacity-30 disabled:hover:bg-[#FFFDF8] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Lật về trang trước (◀)"
            aria-label="Lật trang trước"
          >
            <ChevronLeft size={20} strokeWidth={2.8} />
          </button>

          {/* KHUNG CUỐN TẬP GỌN GÀNG (NOTEBOOK CONTAINER) */}
          <div className="w-full max-w-[620px] h-[560px] sm:h-[600px] relative">
            {/* TRANG GHI CHÚ ĐANG MỞ (ACTIVE CARD) */}
            {currentNote && (
              <div
                key={currentNote.id}
                className={`w-full h-full relative z-10 transition-all ${
                  flipDirection === "next"
                    ? "animate-in fade-in slide-in-from-right-4 duration-200"
                    : flipDirection === "prev"
                    ? "animate-in fade-in slide-in-from-left-4 duration-200"
                    : "animate-in fade-in zoom-in-95 duration-150"
                }`}
              >
                <NoteCard
                  note={currentNote}
                  pageIndex={currentPageIndex}
                  notebooks={notebooks}
                  onUpdate={onUpdateNote}
                  onDelete={(id) => {
                    onDeleteNote(id);
                    if (currentPageIndex > 0 && currentPageIndex >= totalPages - 1) {
                      setCurrentPageIndex(currentPageIndex - 1);
                    }
                  }}
                  autoFocus={newlyCreatedId === currentNote.id}
                  className="w-full h-full shadow-[3px_3px_0px_#262626]"
                />
              </div>
            )}
          </div>

          {/* Nút Lật Mép Phải Sổ */}
          <button
            type="button"
            onClick={handleNextPage}
            disabled={isLastPage}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFFDF8] hover:bg-[#FEF08A] disabled:opacity-30 disabled:hover:bg-[#FFFDF8] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
            title="Lật sang trang sau (▶)"
            aria-label="Lật trang sau"
          >
            <ChevronRight size={20} strokeWidth={2.8} />
          </button>
        </div>
      )}

      {/* 3. DẢI CHẤM CHỈ BÁO VỊ TRÍ TRANG (MINI PAGE DOTS) */}
      {totalPages > 1 && totalPages <= 25 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {notes.map((_, idx) => {
            const isActive = idx === currentPageIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleJumpToPage(idx)}
                className={`h-2 rounded-full border border-[#262626] transition-all cursor-pointer ${
                  isActive
                    ? "w-6 bg-[#FEF08A] shadow-[1px_1px_0px_#262626]"
                    : "w-2 bg-[#E7E5E4] hover:bg-[#D6D3D1]"
                }`}
                title={`Nhảy tới trang #${idx + 1}`}
                aria-label={`Trang ${idx + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
