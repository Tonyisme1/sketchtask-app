import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Highlighter,
  Quote,
  ChevronDown,
  Pilcrow,
  RemoveFormatting,
} from "lucide-react";

export interface NoteToolbarProps {
  editorRef: React.RefObject<HTMLDivElement>;
  onContentChange: () => void;
}

export const NoteToolbar: React.FC<NoteToolbarProps> = ({
  editorRef,
  onContentChange,
}) => {
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const highlightMenuRef = useRef<HTMLDivElement>(null);

  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    h1: false,
    h2: false,
    bullet: false,
    numbered: false,
    quote: false,
  });

  // Kiểm tra trạng thái active liên tục giống Microsoft Word (queryCommandState)
  const checkActiveStates = () => {
    try {
      const isBold = document.queryCommandState("bold");
      const isItalic = document.queryCommandState("italic");
      const isUnderline = document.queryCommandState("underline");
      const isStrike = document.queryCommandState("strikeThrough");
      const blockVal = (document.queryCommandValue("formatBlock") || "").toLowerCase();
      const isH1 = blockVal === "h1";
      const isH2 = blockVal === "h2";
      const isBullet = document.queryCommandState("insertUnorderedList");
      const isNumbered = document.queryCommandState("insertOrderedList");
      const isQuote = blockVal === "blockquote";

      setActiveStates({
        bold: isBold,
        italic: isItalic,
        underline: isUnderline,
        strike: isStrike,
        h1: isH1,
        h2: isH2,
        bullet: isBullet,
        numbered: isNumbered,
        quote: isQuote,
      });
    } catch {
      // Bỏ qua nếu chưa sẵn sàng
    }
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (
        editorRef.current &&
        (document.activeElement === editorRef.current ||
          editorRef.current.contains(document.activeElement))
      ) {
        checkActiveStates();
      }
    };

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (
        highlightMenuRef.current &&
        !highlightMenuRef.current.contains(e.target as Node)
      ) {
        setShowHighlightMenu(false);
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [editorRef]);

  // Helper thực thi lệnh Rich Text trực quan (WYSIWYG execCommand)
  const exec = (command: string, value: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, value);
    checkActiveStates();
    onContentChange();
  };

  // Helper bôi màu dạ quang trực tiếp
  const applyHighlight = (colorHex: string) => {
    setShowHighlightMenu(false);
    if (editorRef.current) {
      editorRef.current.focus();
    }

    const success = document.execCommand("hiliteColor", false, colorHex);
    if (!success) {
      document.execCommand("backColor", false, colorHex);
    }
    checkActiveStates();
    onContentChange();
  };

  // Helper class nút khi Active (đang bật như Word) vs Bình thường
  const getBtnClass = (isActive: boolean) =>
    `w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer border ${
      isActive
        ? "bg-[#FEF08A] text-[#1C1917] border-[#262626] font-black shadow-[inset_1px_1px_0px_#262626] -translate-y-0.2"
        : "bg-white hover:bg-[#FAF8F3] text-[#57534E] hover:text-[#1C1917] border-[#262626] shadow-[0.5px_0.5px_0px_#262626] active:translate-y-[0.5px]"
    }`;

  return (
    <div className="flex items-center gap-1 p-1 bg-[#F5F2EA] border border-[#262626] rounded-[6px] shadow-[1px_1px_0px_#262626] flex-wrap select-none w-full max-w-full overflow-hidden">
      {/* 1. In Đậm B */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("bold")}
        title="In đậm (Bold)"
        className={getBtnClass(activeStates.bold)}
      >
        <Bold size={12} strokeWidth={activeStates.bold ? 3.2 : 2.4} />
      </button>

      {/* 2. In Nghiêng I */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("italic")}
        title="In nghiêng (Italic)"
        className={getBtnClass(activeStates.italic)}
      >
        <Italic size={12} strokeWidth={activeStates.italic ? 3.2 : 2.4} />
      </button>

      {/* 3. Gạch Chân U */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("underline")}
        title="Gạch chân (Underline)"
        className={getBtnClass(activeStates.underline)}
      >
        <Underline size={12} strokeWidth={activeStates.underline ? 3.2 : 2.4} />
      </button>

      {/* 4. Gạch Ngang S */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("strikeThrough")}
        title="Gạch ngang (Strikethrough)"
        className={getBtnClass(activeStates.strike)}
      >
        <Strikethrough size={12} strokeWidth={activeStates.strike ? 3.2 : 2.4} />
      </button>

      {/* Vạch Phân Cách */}
      <div className="w-[1px] h-3.5 bg-[#D4CEBF] mx-0.2" />

      {/* 5. Tiêu Đề Lớn H1 */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("formatBlock", activeStates.h1 ? "<p>" : "<h1>")}
        title="Tiêu đề lớn H1"
        className={getBtnClass(activeStates.h1)}
      >
        <Heading1 size={13} strokeWidth={activeStates.h1 ? 3 : 2.4} />
      </button>

      {/* 6. Tiêu Đề Phụ H2 */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("formatBlock", activeStates.h2 ? "<p>" : "<h2>")}
        title="Tiêu đề phụ H2"
        className={getBtnClass(activeStates.h2)}
      >
        <Heading2 size={13} strokeWidth={activeStates.h2 ? 3 : 2.4} />
      </button>

      {/* 7. Đoạn Văn Thường P */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("formatBlock", "<p>")}
        title="Văn bản bình thường"
        className={getBtnClass(!activeStates.h1 && !activeStates.h2 && !activeStates.quote)}
      >
        <Pilcrow size={11} strokeWidth={2.4} />
      </button>

      {/* Vạch Phân Cách */}
      <div className="w-[1px] h-3.5 bg-[#D4CEBF] mx-0.2" />

      {/* 8. Danh Sách Dấu Chấm Bullet */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("insertUnorderedList")}
        title="Danh sách dấu chấm (Bullet List)"
        className={getBtnClass(activeStates.bullet)}
      >
        <List size={13} strokeWidth={activeStates.bullet ? 3 : 2.4} />
      </button>

      {/* 9. Danh Sách Đánh Số 1. 2. 3. */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("insertOrderedList")}
        title="Danh sách đánh số (Numbered List)"
        className={getBtnClass(activeStates.numbered)}
      >
        <ListOrdered size={13} strokeWidth={activeStates.numbered ? 3 : 2.4} />
      </button>

      {/* Vạch Phân Cách */}
      <div className="w-[1px] h-3.5 bg-[#D4CEBF] mx-0.2" />

      {/* 10. Bút Dạ Quang Highlight Gọn Gàng Không Bị Tràn */}
      <div ref={highlightMenuRef} className="relative">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setShowHighlightMenu(!showHighlightMenu)}
          title="Bút dạ quang Highlight màu"
          className="px-1.5 h-6 rounded bg-[#FEF08A] hover:bg-[#FDE047] border border-[#262626] flex items-center gap-0.5 text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] active:translate-y-[0.5px] transition-all cursor-pointer font-bold"
        >
          <Highlighter size={11} strokeWidth={2.6} />
          <ChevronDown size={9} strokeWidth={2.6} />
        </button>

        {/* Menu Màu Dạng Ngang Nhỏ Gọn (Micro Palette) - Căn Lề Phải Để Không Tràn */}
        {showHighlightMenu && (
          <div className="absolute right-0 top-full mt-1 bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[6px] p-1.5 shadow-[2.5px_2.5px_0px_#262626] z-50 flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
            {/* Vàng dạ quang */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyHighlight("#FEF08A")}
              title="Vàng dạ quang"
              className="w-5 h-5 rounded-full bg-[#FEF08A] hover:scale-110 border border-[#262626] transition-transform cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
            />
            {/* Xanh ngọc */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyHighlight("#BBF7D0")}
              title="Xanh ngọc"
              className="w-5 h-5 rounded-full bg-[#BBF7D0] hover:scale-110 border border-[#262626] transition-transform cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
            />
            {/* Tím nhạt */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyHighlight("#DDD6FE")}
              title="Tím nhạt"
              className="w-5 h-5 rounded-full bg-[#DDD6FE] hover:scale-110 border border-[#262626] transition-transform cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
            />
            {/* Hồng phấn */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyHighlight("#FECDD3")}
              title="Hồng phấn"
              className="w-5 h-5 rounded-full bg-[#FECDD3] hover:scale-110 border border-[#262626] transition-transform cursor-pointer shadow-[0.5px_0.5px_0px_#262626]"
            />
            {/* Vạch chia */}
            <div className="w-[1px] h-4 bg-[#D4CEBF]" />
            {/* Xóa highlight */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyHighlight("transparent")}
              title="Tẩy màu dạ quang"
              className="w-5 h-5 rounded bg-white hover:bg-stone-100 border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
            >
              <RemoveFormatting size={11} />
            </button>
          </div>
        )}
      </div>

      {/* 11. Trích Dẫn Quote */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("formatBlock", activeStates.quote ? "<p>" : "<blockquote>")}
        title="Khối trích dẫn (Quote)"
        className={getBtnClass(activeStates.quote)}
      >
        <Quote size={12} strokeWidth={activeStates.quote ? 3 : 2.4} />
      </button>

      {/* 12. Xóa Toàn Bộ Định Dạng */}
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => exec("removeFormat")}
        title="Xóa định dạng (Trở về chữ thường)"
        className="w-6 h-6 rounded bg-white hover:bg-[#FAF8F3] border border-[#262626] flex items-center justify-center text-[#78716C] hover:text-[#1C1917] shadow-[0.5px_0.5px_0px_#262626] active:translate-y-[0.5px] transition-all cursor-pointer ml-auto"
      >
        <RemoveFormatting size={11} strokeWidth={2.4} />
      </button>
    </div>
  );
};
