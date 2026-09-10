import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Clock, X } from "lucide-react";

// ==========================================
// COMPONENT: TimePickerPopover
// Wheel chọn giờ/phút: vạch giữa là giá trị đang chọn, cuộn tới đâu cập nhật tới đó.
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
const WHEEL_ROW_HEIGHT = 38;
const WHEEL_VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS;
const PANEL_WIDTH = 256;
const VIEWPORT_GUTTER = 8;
const TOUCH_BREAKPOINT = 1024;

type PanelPosition = {
  top: number;
  left: number;
};

type WheelColumnProps = {
  label: string;
  items: string[];
  selected: string;
  listRef: React.RefObject<HTMLDivElement>;
  onSelect: (item: string) => void;
  onScroll: () => void;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const TimeWheelColumn: React.FC<WheelColumnProps> = ({
  label,
  items,
  selected,
  listRef,
  onSelect,
  onScroll,
}) => (
  <div className="min-w-0">
    <p className="text-[10px] font-mono font-bold text-[#78716C] text-center pb-1">
      {label}
    </p>
    <div className="relative">
      <div
        ref={listRef}
        onScroll={onScroll}
        className="h-[190px] overflow-y-auto overscroll-contain no-scrollbar snap-y snap-mandatory rounded-[4px] border border-[#D6D3D1] bg-white"
        style={{
          height: WHEEL_HEIGHT,
          scrollPaddingBlock: `${WHEEL_ROW_HEIGHT * 2}px`,
          paddingBlock: `${WHEEL_ROW_HEIGHT * 2}px`,
          touchAction: "pan-y",
        }}
        role="listbox"
        aria-label={`Danh sách ${label.toLowerCase()}`}
      >
        {items.map((item) => {
          const isSelected = item === selected;
          return (
            <button
              key={item}
              type="button"
              onClick={() => onSelect(item)}
              className={`relative z-20 block w-full h-[38px] snap-center text-xs font-mono font-bold text-center transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#1C1917] text-white"
                  : "text-[#57534E] hover:bg-[#FAF8F3] hover:text-[#1C1917]"
              }`}
              aria-selected={isSelected}
            >
              {item}
            </button>
          );
        })}
      </div>

      {/* Vạch chuẩn cố định ở giữa, không che thao tác cuộn */}
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 z-30 h-[38px] -translate-y-1/2 border-y-[1.5px] border-[#1C1917]"
        aria-hidden="true"
      />
    </div>
  </div>
);

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
    const estimatedPanelHeight = 350;
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

  // Đồng bộ giá trị do component cha thay đổi mà không làm giật vị trí wheel.
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

  // Đặt wheel khi mở và giữ popup bám theo nút khi form bên dưới cuộn.
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

  // Đóng khi chạm bên ngoài cả trigger lẫn popup portal.
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

  const handleSetNow = () => {
    const now = new Date();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    commitTime(hour, minute);
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
            ? "pointer-events-auto relative w-full max-w-[360px] max-h-[calc(100dvh-2rem)] overflow-hidden rounded-[8px] border-[1.5px] border-[#262626] bg-[#FBF9F4] shadow-[4px_4px_0px_#262626]"
            : "pointer-events-auto fixed max-w-[calc(100vw-1rem)] overflow-hidden rounded-[6px] border-[1.5px] border-[#262626] bg-[#FBF9F4] shadow-[3px_3px_0px_#262626]"
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
      <div className="px-3 py-2 bg-[#FAF8F3] border-b border-[#262626]/20 flex items-center justify-between">
        <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#78716C]">
          GIỜ (TIME)
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-black text-[#1C1917] bg-white px-2 py-0.5 rounded border border-[#262626]">
            {selectedHour}:{selectedMinute}
          </span>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-[#262626] bg-white text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none cursor-pointer"
            aria-label="Đóng bảng chọn giờ"
            title="Đóng"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 p-2 gap-2 border-b border-[#262626]/20">
        <TimeWheelColumn
          label="Giờ"
          items={HOURS}
          selected={selectedHour}
          listRef={hoursListRef}
          onSelect={handleSelectHour}
          onScroll={handleHourScroll}
        />
        <TimeWheelColumn
          label="Phút"
          items={MINUTES}
          selected={selectedMinute}
          listRef={minutesListRef}
          onSelect={handleSelectMinute}
          onScroll={handleMinuteScroll}
        />
      </div>

      <div className="px-2.5 py-1.5 bg-[#FAF8F3] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={handleClear}
          className="text-[#78716C] hover:text-rose-700 font-bold hover:underline cursor-pointer"
        >
          Xóa
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleSetNow}
            className="px-2 py-0.5 rounded bg-white hover:bg-[#F5F3EF] border border-[#262626] text-[11px] font-bold text-[#1C1917] cursor-pointer"
          >
            Hiện tại
          </button>
          <button
            type="button"
            onClick={handleDone}
            className="px-2.5 py-0.5 rounded bg-[#1C1917] hover:bg-[#262626] text-white border border-[#1C1917] text-[11px] font-bold shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px] cursor-pointer"
          >
            Xong
          </button>
        </div>
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
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#262626] bg-[#FAF8F3] hover:bg-white text-sm font-mono font-bold text-[#1C1917] transition-all cursor-pointer shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
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
