import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, X, Check } from "lucide-react";

// ==========================================
// COMPONENT: TimePickerPopover (Bộ Chọn Giờ Drum Wheel Chuẩn SketchTask)
// ==========================================

export interface TimePickerPopoverProps {
  value?: string;
  onChange: (timeStr: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
const WHEEL_ROW_HEIGHT = 42;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS;
const PANEL_WIDTH = 290;
const VIEWPORT_GUTTER = 8;
const TOUCH_BREAKPOINT = 1024;

type PanelPosition = {
  top: number;
  left: number;
};
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const PRESETS = [
  { label: "08:00", h: "08", m: "00" },
  { label: "09:30", h: "09", m: "30" },
  { label: "12:00", h: "12", m: "00" },
  { label: "14:30", h: "14", m: "30" },
  { label: "18:00", h: "18", m: "00" },
  { label: "21:00", h: "21", m: "00" },
];

type DrumWheelColumnProps = {
  label: string;
  items: string[];
  selected: string;
  listRef: React.RefObject<HTMLDivElement>;
  onSelect: (item: string) => void;
  onScroll: () => void;
};

const DrumWheelColumn: React.FC<DrumWheelColumnProps> = ({
  label,
  items,
  selected,
  listRef,
  onSelect,
  onScroll,
}) => {
  const selectedIndex = items.indexOf(selected);

  return (
    <div className="min-w-0 flex-1 flex flex-col items-center">
      {/* Header ký hiệu cột: H / M */}
      <span className="text-xs font-mono font-black text-[#78716C] tracking-widest pb-1 select-none">
        {label}
      </span>

      <div className="relative w-full overflow-hidden">
        {/* Vạch kẻ khung chọn tiêu điểm ở giữa */}
        <div
          className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-[42px] -translate-y-1/2 rounded-[6px] border-[1.5px] border-[#262626] bg-[#FEF08A]/15 shadow-[0.5px_0.5px_0px_#262626]"
          aria-hidden="true"
        />

        <div
          ref={listRef}
          onScroll={onScroll}
          className="h-[210px] overflow-y-auto overscroll-contain no-scrollbar snap-y snap-mandatory select-none"
          style={{
            height: WHEEL_HEIGHT,
            scrollPaddingBlock: `${WHEEL_ROW_HEIGHT * 2}px`,
            paddingBlock: `${WHEEL_ROW_HEIGHT * 2}px`,
            touchAction: "pan-y",
          }}
          role="listbox"
          aria-label={`Danh sách ${label}`}
        >
          {items.map((item, idx) => {
            const distance = Math.abs(idx - selectedIndex);
            const isSelected = idx === selectedIndex;

            let fontClass = "text-sm text-[#A8A29E]/30 font-semibold";
            if (distance === 0) {
              fontClass = "text-2xl sm:text-3xl font-black text-[#1C1917]";
            } else if (distance === 1) {
              fontClass = "text-lg font-bold text-[#78716C]/60";
            } else if (distance === 2) {
              fontClass = "text-sm font-semibold text-[#A8A29E]/40";
            }

            return (
              <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                className={`relative z-20 block w-full h-[42px] snap-center font-mono text-center transition-all cursor-pointer flex items-center justify-center ${fontClass}`}
                aria-selected={isSelected}
              >
                <span>{item}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const TimePickerPopover: React.FC<TimePickerPopoverProps> = ({
  value = "",
  onChange,
  placeholder = "Không đặt giờ",
  className = "",
  align = "left",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const hoursListRef = useRef<HTMLDivElement>(null);
  const minutesListRef = useRef<HTMLDivElement>(null);
  const syncingListsRef = useRef(false);
  const [isTouchViewport, setIsTouchViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth < TOUCH_BREAKPOINT,
  );

  const [currentHour, currentMinute] = value && value.includes(":")
    ? value.split(":")
    : ["09", "00"];

  const [selectedHour, setSelectedHour] = useState(currentHour || "09");
  const [selectedMinute, setSelectedMinute] = useState(currentMinute || "00");
  const selectedHourRef = useRef(selectedHour);
  const selectedMinuteRef = useRef(selectedMinute);

  useEffect(() => {
    const updateViewportMode = () => {
      setIsTouchViewport(window.innerWidth < TOUCH_BREAKPOINT);
    };

    updateViewportMode();
    window.addEventListener("resize", updateViewportMode);
    return () => window.removeEventListener("resize", updateViewportMode);
  }, []);

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const panelWidth = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
    const estimatedPanelHeight = 370;
    const preferredLeft = align === "right" ? rect.right - panelWidth : rect.left;
    const left = clamp(
      preferredLeft,
      VIEWPORT_GUTTER,
      Math.max(VIEWPORT_GUTTER, window.innerWidth - panelWidth - VIEWPORT_GUTTER)
    );
    const fitsBelow = window.innerHeight - rect.bottom >= estimatedPanelHeight + VIEWPORT_GUTTER;
    const top = fitsBelow
      ? rect.bottom + 6
      : Math.max(VIEWPORT_GUTTER, rect.top - estimatedPanelHeight - 6);

    setPanelPosition({ top, left });
  };

  const syncListsToSelection = () => {
    syncingListsRef.current = true;
    const hourIdx = HOURS.indexOf(selectedHourRef.current);
    const minuteIdx = MINUTES.indexOf(selectedMinuteRef.current);
    if (hoursListRef.current && hourIdx !== -1) {
      hoursListRef.current.scrollTop = hourIdx * WHEEL_ROW_HEIGHT;
    }
    if (minutesListRef.current && minuteIdx !== -1) {
      minutesListRef.current.scrollTop = minuteIdx * WHEEL_ROW_HEIGHT;
    }
    window.setTimeout(() => {
      syncingListsRef.current = false;
    }, 120);
  };

  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      const nextHour = h || "09";
      const nextMinute = m || "00";
      selectedHourRef.current = nextHour;
      selectedMinuteRef.current = nextMinute;
      setSelectedHour(nextHour);
      setSelectedMinute(nextMinute);
    }
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    if (!isTouchViewport) updatePanelPosition();
    const frame = window.requestAnimationFrame(syncListsToSelection);
    const handleViewportChange = () => {
      if (!isTouchViewport) updatePanelPosition();
    };
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isOpen, isTouchViewport]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const commitTime = (hour: string, minute: string) => {
    selectedHourRef.current = hour;
    selectedMinuteRef.current = minute;
    setSelectedHour(hour);
    setSelectedMinute(minute);
    onChange(`${hour}:${minute}`);
  };

  const getScrolledItem = (listRef: React.RefObject<HTMLDivElement>, items: string[]) => {
    const list = listRef.current;
    if (!list) return null;
    const index = clamp(
      Math.round(list.scrollTop / WHEEL_ROW_HEIGHT),
      0,
      items.length - 1
    );
    return items[index] ?? null;
  };

  const handleHourScroll = () => {
    if (syncingListsRef.current) return;
    const nextHour = getScrolledItem(hoursListRef, HOURS);
    if (nextHour && nextHour !== selectedHourRef.current) {
      commitTime(nextHour, selectedMinuteRef.current);
    }
  };

  const handleMinuteScroll = () => {
    if (syncingListsRef.current) return;
    const nextMinute = getScrolledItem(minutesListRef, MINUTES);
    if (nextMinute && nextMinute !== selectedMinuteRef.current) {
      commitTime(selectedHourRef.current, nextMinute);
    }
  };

  const handleSelectHour = (hour: string) => {
    commitTime(hour, selectedMinuteRef.current);
    hoursListRef.current?.scrollTo({
      top: HOURS.indexOf(hour) * WHEEL_ROW_HEIGHT,
      behavior: "smooth",
    });
  };

  const handleSelectMinute = (minute: string) => {
    commitTime(selectedHourRef.current, minute);
    minutesListRef.current?.scrollTo({
      top: MINUTES.indexOf(minute) * WHEEL_ROW_HEIGHT,
      behavior: "smooth",
    });
  };

  const handleApplyPreset = (h: string, m: string) => {
    commitTime(h, m);
    window.requestAnimationFrame(syncListsToSelection);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleDone = () => {
    if (!value) commitTime(selectedHourRef.current, selectedMinuteRef.current);
    setIsOpen(false);
  };

  const panel = isOpen && (isTouchViewport || panelPosition) ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Chọn giờ"
      className={
        isTouchViewport
          ? "fixed inset-0 z-[1000001] flex items-center justify-center bg-black/50 p-4"
          : "pointer-events-none fixed inset-0 z-[1000001]"
      }
      onClick={isTouchViewport ? () => setIsOpen(false) : undefined}
    >
      <div
        ref={panelRef}
        className={
          isTouchViewport
            ? "pointer-events-auto relative w-full max-w-[310px] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-[10px] border-[1.5px] border-[#262626] bg-[#FBF9F4] shadow-[4px_4px_0px_#262626] animate-in zoom-in-95 duration-150"
            : "pointer-events-auto fixed max-w-[calc(100vw-1rem)] overflow-hidden rounded-[10px] border-[1.5px] border-[#262626] bg-[#FBF9F4] shadow-[3.5px_3.5px_0px_#262626] animate-in fade-in zoom-in-95 duration-150"
        }
        style={
          isTouchViewport
            ? undefined
            : {
                top: panelPosition?.top,
                left: panelPosition?.left,
                width: `min(${PANEL_WIDTH}px, calc(100vw - ${VIEWPORT_GUTTER * 2}px))`,
              }
        }
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header: Title */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-[#262626]/15 bg-[#FAF8F3]">
          <h3 className="text-sm font-bold text-[#1C1917] tracking-tight">
            Chọn giờ ({selectedHour}:{selectedMinute})
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-[4px] border border-transparent hover:border-[#262626] hover:bg-white text-[#78716C] hover:text-[#1C1917] active:translate-y-[0.5px] cursor-pointer"
            title="Đóng"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-3 py-1.5 bg-white/70 border-b border-[#262626]/10 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {PRESETS.map((p) => {
            const isMatch = selectedHour === p.h && selectedMinute === p.m;
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p.h, p.m)}
                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono font-bold border transition-all cursor-pointer whitespace-nowrap active:translate-y-[0.5px] ${
                  isMatch
                    ? "bg-[#1C1917] text-white border-[#1C1917] shadow-[1px_1px_0px_#262626]"
                    : "bg-[#FAF8F3] text-[#57534E] border-[#D4CEBF] hover:bg-[#FEF08A] hover:text-[#1C1917] hover:border-[#262626]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* 2 Cột Drum Wheel (H và M) */}
        <div className="flex px-4 py-3 gap-4 bg-[#FBF9F4] justify-center items-center">
          <DrumWheelColumn
            label="H"
            items={HOURS}
            selected={selectedHour}
            listRef={hoursListRef}
            onSelect={handleSelectHour}
            onScroll={handleHourScroll}
          />
          <span className="font-mono text-xl font-black text-[#262626] pb-1">:</span>
          <DrumWheelColumn
            label="M"
            items={MINUTES}
            selected={selectedMinute}
            listRef={minutesListRef}
            onSelect={handleSelectMinute}
            onScroll={handleMinuteScroll}
          />
        </div>

        {/* Bottom Actions */}
        <div className="px-3.5 py-2.5 bg-[#FAF8F3] border-t border-[#262626]/15 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-1.5 px-2 rounded-[6px] bg-white hover:bg-slate-100 border-[1.5px] border-[#262626] text-xs font-bold text-[#57534E] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer transition-all"
          >
            Xóa giờ
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="flex-1 py-1.5 px-3 rounded-[6px] bg-[#1C1917] hover:bg-[#262626] text-white border-[1.5px] border-[#1C1917] text-xs font-bold shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer flex items-center justify-center gap-1.5 transition-all"
          >
            <Check size={13} strokeWidth={3} />
            <span>Hoàn tất</span>
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => !open)}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-[#262626] bg-[#FAF8F3] hover:bg-white text-xs sm:text-sm font-mono font-bold text-[#1C1917] transition-all cursor-pointer shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
          isOpen ? "bg-white ring-1 ring-[#1C1917]" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Clock size={12} className={value ? "text-[#1C1917]" : "text-[#78716C]"} />
          <span className={value ? "text-[#1C1917]" : "text-[#78716C] font-normal"}>
            {value || placeholder}
          </span>
        </div>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
};
