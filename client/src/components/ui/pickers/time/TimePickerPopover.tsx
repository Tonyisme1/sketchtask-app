import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, X, Check } from "lucide-react";

// ==========================================
// COMPONENT: TimePickerPopover (Bộ Chọn Giờ Drum Wheel Chuẩn SketchTask)
// ==========================================

export interface TimePickerPopoverProps {
  value?: string;
  minTime?: string;
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

type DrumWheelColumnProps = {
  label: string;
  items: string[];
  selected: string;
  listRef: React.RefObject<HTMLDivElement>;
  onSelect: (item: string) => void;
  onScroll: () => void;
  isItemDisabled?: (item: string) => boolean;
};

const DrumWheelColumn: React.FC<DrumWheelColumnProps> = ({
  label,
  items,
  selected,
  listRef,
  onSelect,
  onScroll,
  isItemDisabled,
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
          className="pointer-events-none absolute inset-x-1 top-1/2 z-10 h-[42px] -translate-y-1/2 rounded-2xl bg-[var(--accent-blue)]/15 dark:bg-white/10"
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
            const isDisabled = isItemDisabled?.(item) ?? false;

            let fontClass = "text-sm text-[#A8A29E]/30 dark:text-[#636366]/40 font-semibold";
            if (distance === 0) {
              fontClass = "text-2xl sm:text-3xl font-black text-[#1C1917] dark:text-white";
            } else if (distance === 1) {
              fontClass = "text-lg font-bold text-[#78716C]/60 dark:text-[#8E8E93]/60";
            } else if (distance === 2) {
              fontClass = "text-sm font-semibold text-[#A8A29E]/40 dark:text-[#636366]/40";
            }

            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (!isDisabled) onSelect(item);
                }}
                disabled={isDisabled}
                className={`relative z-20 block w-full h-[42px] snap-center font-mono text-center transition-all flex items-center justify-center ${
                  isDisabled ? "cursor-not-allowed opacity-20" : "cursor-pointer"
                } ${fontClass}`}
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
  minTime,
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
  const minimumTotal = minTime && /^\d{2}:\d{2}$/.test(minTime)
    ? Number(minTime.slice(0, 2)) * 60 + Number(minTime.slice(3, 5))
    : undefined;
  const clampParts = (hour: string, minute: string): [string, string] => {
    const total = Number(hour) * 60 + Number(minute);
    if (minimumTotal !== undefined && total < minimumTotal) {
      return [minTime!.slice(0, 2), minTime!.slice(3, 5)];
    }
    return [hour, minute];
  };
  const [initialHour, initialMinute] = clampParts(currentHour || "09", currentMinute || "00");

  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);
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
      const [nextHour, nextMinute] = clampParts(h || "09", m || "00");
      selectedHourRef.current = nextHour;
      selectedMinuteRef.current = nextMinute;
      setSelectedHour(nextHour);
      setSelectedMinute(nextMinute);
    }
  }, [value, minTime]);

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
    const [safeHour, safeMinute] = clampParts(hour, minute);
    selectedHourRef.current = safeHour;
    selectedMinuteRef.current = safeMinute;
    setSelectedHour(safeHour);
    setSelectedMinute(safeMinute);
    onChange(`${safeHour}:${safeMinute}`);
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

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleDone = () => {
    const [safeHour, safeMinute] = clampParts(
      selectedHourRef.current,
      selectedMinuteRef.current,
    );
    if (!value || value !== `${safeHour}:${safeMinute}`) {
      commitTime(safeHour, safeMinute);
    }
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
            ? "pointer-events-auto relative w-full max-w-[310px] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-3xl bg-[#FBF9F4] dark:bg-[#1C1C1E] shadow-2xl animate-in fade-in duration-150"
            : "pointer-events-auto fixed max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl bg-[#FBF9F4] dark:bg-[#1C1C1E] shadow-2xl animate-in fade-in duration-150"
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
        <div className="px-4 py-3 flex items-center justify-between bg-[#FAF8F3] dark:bg-[#202023]">
          <h3 className="text-sm font-bold text-[#1C1917] dark:text-[#F2F2F7] tracking-tight">
            Chọn giờ ({selectedHour}:{selectedMinute})
          </h3>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-[#78716C] hover:text-[#1C1917] dark:text-[#8E8E93] dark:hover:text-white cursor-pointer transition-colors"
            title="Đóng"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        </div>

        {/* 2 Cột Drum Wheel (H và M) */}
        <div className="flex px-4 py-3 gap-4 bg-[#FBF9F4] dark:bg-[#121214] justify-center items-center">
          <DrumWheelColumn
            label="H"
            items={HOURS}
            selected={selectedHour}
            listRef={hoursListRef}
            onSelect={handleSelectHour}
            onScroll={handleHourScroll}
            isItemDisabled={(hour) =>
              minimumTotal !== undefined && Number(hour) * 60 + 59 < minimumTotal
            }
          />
          <span className="font-mono text-xl font-black text-[#262626] dark:text-[#F2F2F7] pb-1">:</span>
          <DrumWheelColumn
            label="M"
            items={MINUTES}
            selected={selectedMinute}
            listRef={minutesListRef}
            onSelect={handleSelectMinute}
            onScroll={handleMinuteScroll}
            isItemDisabled={(minute) =>
              minimumTotal !== undefined &&
              Number(selectedHour) * 60 + Number(minute) < minimumTotal
            }
          />
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-3 bg-[#FAF8F3] dark:bg-[#1C1C1E] flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2 px-3 rounded-2xl bg-white dark:bg-[#2C2C2E] hover:bg-black/5 dark:hover:bg-[#3A3A3C] text-xs font-bold text-[#57534E] dark:text-[#8E8E93] shadow-xs active:scale-95 cursor-pointer transition-all"
          >
            Xóa giờ
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="flex-1 py-2 px-3 rounded-2xl bg-[#1C1917] dark:bg-white hover:bg-black dark:hover:bg-[#F2F2F7] text-white dark:text-[#1C1917] text-xs font-bold shadow-xs active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
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
        className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-muted)] text-xs sm:text-sm font-mono font-bold text-[#1C1917] dark:text-[#F2F2F7] transition-all cursor-pointer shadow-xs active:scale-95 ${
          isOpen ? "ring-2 ring-[var(--accent-blue)]/30" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Clock size={12} className={value ? "text-[var(--accent-blue)]" : "text-[#78716C] dark:text-[#8E8E93]"} />
          <span className={value ? "text-[#1C1917] dark:text-[#F2F2F7]" : "text-[#78716C] dark:text-[#8E8E93] font-normal"}>
            {value || placeholder}
          </span>
        </div>
      </button>
      {panel && createPortal(panel, document.body)}
    </div>
  );
};
