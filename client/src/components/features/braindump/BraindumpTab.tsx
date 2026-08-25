import React, { useState, useEffect } from "react";
import { useAppStore, StickyNoteItem } from "../../../stores/appStore";
import { Button } from "../../ui/Button";
import { CustomColorPicker, ColorOption } from "../../ui/CustomColorPicker";
import { DynamicIcon } from "../../ui/DynamicIcon";
import { Pin, X, ArrowRight } from "lucide-react";

// ==========================================
// COMPONENT: BraindumpTab (Đa Dạng Màu - Cuộn Mượt - Tự Đóng Khi Click Ngoài)
// ==========================================

const STICKY_PALETTE: ColorOption[] = [
  { name: "Vàng nghệ", hex: "#FEF08A" },
  { name: "San hô", hex: "#FECDD3" },
  { name: "Bạc hà", hex: "#BBF7D0" },
  { name: "Da trời", hex: "#BAE6FD" },
  { name: "Oải hương", hex: "#DDD6FE" },
  { name: "Cam đào", hex: "#FED7AA" },
  { name: "Xanh xô", hex: "#D9F99D" },
  { name: "Hồng phấn", hex: "#FBCFE8" },
  { name: "Lam ngọc", hex: "#A5F3FC" },
  { name: "Cát ngà", hex: "#E7E5E4" },
];

const HEX_TO_COLOR_KEY: Record<string, StickyNoteItem["color"]> = {
  "#fef08a": "yellow",
  "#fecdd3": "coral",
  "#bbf7d0": "mint",
  "#bae6fd": "sky",
  "#ddd6fe": "lavender",
  "#fed7aa": "peach",
  "#d9f99d": "lime",
  "#fbcfe8": "pink",
  "#a5f3fc": "cyan",
  "#e7e5e4": "stone",
};

const COLOR_KEY_TO_HEX: Record<StickyNoteItem["color"], string> = {
  yellow: "#FEF08A",
  coral: "#FECDD3",
  mint: "#BBF7D0",
  sky: "#BAE6FD",
  lavender: "#DDD6FE",
  peach: "#FED7AA",
  lime: "#D9F99D",
  pink: "#FBCFE8",
  cyan: "#A5F3FC",
  stone: "#E7E5E4",
};

export const BraindumpTab: React.FC = () => {
  const {
    stickyNotes,
    addStickyNote,
    togglePinStickyNote,
    deleteStickyNote,
    convertNoteToTask,
    convertNoteToNotebookTask,
    notebooks,
  } = useAppStore();

  const [inputText, setInputText] = useState("");
  const [selectedColor, setSelectedColor] =
    useState<StickyNoteItem["color"]>("yellow");
  const [colorFilter, setColorFilter] = useState<string>("all");
  const [openAssignNbId, setOpenAssignNbId] = useState<string | null>(null);

  const colorMap: Record<StickyNoteItem["color"], string> = {
    yellow: "bg-[#FEF08A]",
    coral: "bg-[#FECDD3]",
    mint: "bg-[#BBF7D0]",
    sky: "bg-[#BAE6FD]",
    lavender: "bg-[#DDD6FE]",
    peach: "bg-[#FED7AA]",
    lime: "bg-[#D9F99D]",
    pink: "bg-[#FBCFE8]",
    cyan: "bg-[#A5F3FC]",
    stone: "bg-[#E7E5E4]",
  };

  // Tự động đóng menu chọn sổ khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-notebook-dropdown-container]")) {
        setOpenAssignNbId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addStickyNote(inputText, selectedColor);
    setInputText("");
  };

  const sortedNotes = [...stickyNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const filteredNotes = sortedNotes.filter((note) => {
    if (colorFilter === "all") return true;
    return note.color === colorFilter;
  });

  return (
    <div className="space-y-3.5 max-w-2xl mx-auto">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1C1917]">
          Ý Tưởng
        </h2>
        <div className="text-xs font-mono bg-[#FEF08A] text-[#1C1917] px-2 py-0.5 border-[1.5px] border-[#262626] rounded-[4px] font-bold shadow-[1px_1px_0px_#262626]">
          {stickyNotes.length} Note
        </div>
      </div>

      {/* 2. Quick Note Creation Bar */}
      <form
        onSubmit={handleAddNote}
        className="p-3 bg-white border-[1.5px] border-[#262626] rounded-[6px] shadow-[2.5px_2.5px_0px_#262626] space-y-2"
      >
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ghi nhanh ý tưởng..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs sm:text-sm bg-[#FBF9F4] border border-[#262626] rounded-[4px] outline-none font-sans"
          />
          <Button type="submit" variant="primary">
            + Dán Note
          </Button>
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t border-[#D4CEBF]/60 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#78716C] text-[11px] font-bold">Màu:</span>
            <CustomColorPicker
              value={COLOR_KEY_TO_HEX[selectedColor]}
              onChange={(hex) => {
                const matchedKey = HEX_TO_COLOR_KEY[hex.toLowerCase()] || "yellow";
                setSelectedColor(matchedKey);
              }}
              colors={STICKY_PALETTE}
              label="Màu giấy"
            />
          </div>

          <span className="text-[10px] text-[#78716C]">
            📌 Ghim lên đầu
          </span>
        </div>
      </form>

      {/* 3. Lọc Màu (Cuộn ngang mượt mà, ẩn thanh cuộn) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1.5 bg-white border border-[#D4CEBF] rounded-[4px] text-xs select-none">
        <button
          type="button"
          onClick={() => setColorFilter("all")}
          className={`px-2 py-0.5 rounded-[2px] border text-xs shrink-0 transition-all ${
            colorFilter === "all"
              ? "bg-[#262626] text-white border-[#262626] font-bold"
              : "bg-[#FBF9F4] text-[#78716C] border-[#D4CEBF] hover:text-[#1C1917]"
          }`}
        >
          Tất cả ({stickyNotes.length})
        </button>

        {STICKY_PALETTE.map((p) => {
          const key = HEX_TO_COLOR_KEY[p.hex.toLowerCase()];
          const count = stickyNotes.filter((n) => n.color === key).length;
          return (
            <button
              key={p.hex}
              type="button"
              onClick={() => setColorFilter(key)}
              className={`px-2 py-0.5 rounded-[2px] border text-xs shrink-0 flex items-center gap-1 transition-all ${
                colorFilter === key
                  ? "border-[#262626] font-bold shadow-[1px_1px_0px_#262626] -translate-y-[0.5px]"
                  : "border-[#D4CEBF] opacity-85 hover:opacity-100"
              }`}
              style={{ backgroundColor: p.hex }}
            >
              <span>{p.name}</span>
              <span className="text-[10px] font-mono">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 4. Sticky Notes Canvas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 pt-0.5">
        {filteredNotes.length === 0 ? (
          <div className="col-span-full py-10 text-center text-[#78716C] border-[1.5px] border-dashed border-[#D4CEBF] rounded-[6px] bg-[#FBF9F4]">
            <p className="text-sm">Chưa có ghi chú nào.</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const rotation = note.tilt === "left" ? "-rotate-1" : "rotate-1";
            return (
              <div
                key={note.id}
                className={`group relative p-3.5 border-[1.5px] border-[#262626] shadow-[2.5px_2.5px_0px_#262626] rounded-[3px] ${
                  colorMap[note.color]
                } ${rotation} flex flex-col justify-between min-h-[145px] transition-all hover:shadow-[3.5px_3.5px_0px_#262626] animate-note-drop`}
              >
                {/* Miếng Băng Dính Vàng Phác Thảo hoặc Ghim Đỏ */}
                {note.isPinned ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 animate-bounce">
                    <div className="w-5 h-5 rounded-full bg-red-500 border border-[#262626] flex items-center justify-center text-white shadow-sm">
                      <Pin size={11} strokeWidth={2.5} />
                    </div>
                  </div>
                ) : (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-[#FEF08A]/80 border-x border-[#262626]/40 rotate-1 shadow-sm pointer-events-none" />
                )}

                {/* Top Action */}
                <div className="flex items-center justify-between pb-0.5">
                  <button
                    type="button"
                    onClick={() => togglePinStickyNote(note.id)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 transition-all ${
                      note.isPinned
                        ? "bg-red-100 border-red-500 text-red-700 font-bold"
                        : "bg-white/70 hover:bg-white border-[#262626]/40 text-[#78716C]"
                    }`}
                  >
                    <Pin size={10} strokeWidth={2.2} />
                    <span>{note.isPinned ? "Đã ghim" : "Ghim"}</span>
                  </button>

                  <button
                    onClick={() => deleteStickyNote(note.id)}
                    title="Xóa ghi chú"
                    className="text-[#78716C] hover:text-red-600 p-0.5"
                  >
                    <X size={12} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Content */}
                <p className="font-serif italic text-xs sm:text-sm text-[#1C1917] leading-relaxed select-text py-1.5">
                  “{note.content}”
                </p>

                {/* Bottom Actions */}
                <div className="pt-1.5 border-t border-[#262626]/15 flex items-center justify-between gap-1">
                  <button
                    onClick={() => convertNoteToTask(note.id)}
                    title="Chuyển việc hôm nay"
                    className="text-[10px] font-bold text-[#1C1917] bg-white hover:bg-[#FEF08A] px-2 py-0.5 border border-[#262626] rounded-[2px] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] flex items-center gap-1"
                  >
                    <ArrowRight size={10} strokeWidth={2.2} />
                    <span>Hôm nay</span>
                  </button>

                  <div data-notebook-dropdown-container className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenAssignNbId(openAssignNbId === note.id ? null : note.id);
                      }}
                      className="text-[10px] font-bold text-[#1C1917] bg-white/80 hover:bg-white px-1.5 py-0.5 border border-[#262626] rounded-[2px] shadow-[1px_1px_0px_#262626] flex items-center gap-1 active:translate-y-[0.5px]"
                    >
                      <DynamicIcon name="lucide:BookMarked" size={11} strokeWidth={2.2} />
                      <span>Sổ</span>
                      <span className="text-[8px] text-[#78716C]">▾</span>
                    </button>

                    {openAssignNbId === note.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 bottom-full mb-1 w-44 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[4px] shadow-[2.5px_2.5px_0px_#262626] z-50 p-1 space-y-0.5 text-xs max-h-36 overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95"
                      >
                        {notebooks.length === 0 ? (
                          <div className="p-1 text-[10px] text-[#78716C]">
                            Chưa có sổ
                          </div>
                        ) : (
                          notebooks.map((nb) => (
                            <button
                              key={nb.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                convertNoteToNotebookTask(note.id, nb.id);
                                setOpenAssignNbId(null);
                              }}
                              className="w-full text-left px-1.5 py-1 bg-white hover:bg-[#FEF08A] rounded text-[10px] font-bold flex items-center gap-1.5 truncate transition-colors shadow-[0.5px_0.5px_0px_#262626]"
                            >
                              <DynamicIcon name={nb.icon} size={12} strokeWidth={2.2} />
                              <span className="truncate">{nb.name}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
