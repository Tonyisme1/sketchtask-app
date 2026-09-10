import React, { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

// ==========================================
// COMPONENT: TimePickerPopover (Popup Chọn Giờ Chuẩn TaskNotes & Neo-Brutalist)
// ==========================================

export interface TimePickerPopoverProps {
  value?: string; // Định dạng "HH:mm" (ví dụ "09:00") hoặc rỗng
  onChange: (timeStr: string) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export const TimePickerPopover: React.FC<TimePickerPopoverProps> = ({
  value = "",
  onChange,
  placeholder = "Không đặt giờ",
  className = "",
  align = "left",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hoursListRef = useRef<HTMLDivElement>(null);
  const minutesListRef = useRef<HTMLDivElement>(null);

  // Phân tích giá trị hiện tại
  const [currentHour, currentMinute] = value && value.includes(":")
    ? value.split(":")
    : ["09", "00"];

  const [selectedHour, setSelectedHour] = useState(currentHour || "09");
  const [selectedMinute, setSelectedMinute] = useState(currentMinute || "00");

  // Đồng bộ khi value bên ngoài thay đổi
  useEffect(() => {
    if (value && value.includes(":")) {
      const [h, m] = value.split(":");
      setSelectedHour(h || "09");
      setSelectedMinute(m || "00");
    }
  }, [value]);

  // Cuộn đến mục đang chọn khi mở popover
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (hoursListRef.current) {
          const hourIdx = HOURS.indexOf(selectedHour);
          if (hourIdx !== -1) {
            hoursListRef.current.scrollTop = hourIdx * 28;
          }
        }
        if (minutesListRef.current) {
          const minIdx = MINUTES.indexOf(selectedMinute);
          if (minIdx !== -1) {
            minutesListRef.current.scrollTop = minIdx * 28;
          }
        }
      }, 30);
    }
  }, [isOpen, selectedHour, selectedMinute]);

  // Đóng khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectHour = (h: string) => {
    setSelectedHour(h);
    onChange(`${h}:${selectedMinute}`);
  };

  const handleSelectMinute = (m: string) => {
    setSelectedMinute(m);
    onChange(`${selectedHour}:${m}`);
  };

  const handleSetNow = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    setSelectedHour(h);
    setSelectedMinute(m);
    onChange(`${h}:${m}`);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const handleDone = () => {
    if (!value) {
      onChange(`${selectedHour}:${selectedMinute}`);
    }
    setIsOpen(false);
  };

  const formattedDisplay = value ? value : placeholder;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1 rounded-[4px] border border-[#262626] bg-[#FAF8F3] hover:bg-white text-xs font-mono font-bold text-[#1C1917] transition-all cursor-pointer shadow-[1px_1px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none ${
          isOpen ? "bg-white ring-1 ring-[#1C1917]" : ""
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Clock size={12} className={value ? "text-[#1C1917]" : "text-[#78716C]"} />
          <span className={value ? "text-[#1C1917]" : "text-[#78716C] font-normal"}>
            {formattedDisplay}
          </span>
        </div>
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 z-[1000001] w-56 bg-[#FBF9F4] border-[1.5px] border-[#262626] rounded-[6px] shadow-[3px_3px_0px_#262626] overflow-hidden ${
            align === "right" ? "right-0" : "left-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-3 py-2 bg-[#FAF8F3] border-b border-[#262626]/20 flex items-center justify-between">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-[#78716C]">
              GIỜ (TIME)
            </span>
            <span className="font-mono text-sm font-black text-[#1C1917] bg-white px-2 py-0.5 rounded border border-[#262626]">
              {selectedHour}:{selectedMinute}
            </span>
          </div>

          {/* Body: 2 Columns Hour & Minute */}
          <div className="grid grid-cols-2 p-2 gap-2 border-b border-[#262626]/20">
            {/* Hour Column */}
            <div>
              <p className="text-[10px] font-mono font-bold text-[#78716C] text-center pb-1">
                Giờ
              </p>
              <div
                ref={hoursListRef}
                className="h-36 overflow-y-auto no-scrollbar space-y-0.5 pr-0.5"
              >
                {HOURS.map((h) => {
                  const isSelected = h === selectedHour;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => handleSelectHour(h)}
                      className={`w-full py-1 rounded-[3px] text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#1C1917] text-white border border-[#1C1917] shadow-[1px_1px_0px_#262626]"
                          : "text-[#57534E] hover:bg-white hover:text-[#1C1917]"
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Minute Column */}
            <div>
              <p className="text-[10px] font-mono font-bold text-[#78716C] text-center pb-1">
                Phút
              </p>
              <div
                ref={minutesListRef}
                className="h-36 overflow-y-auto no-scrollbar space-y-0.5 pr-0.5"
              >
                {MINUTES.map((m) => {
                  const isSelected = m === selectedMinute;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMinute(m)}
                      className={`w-full py-1 rounded-[3px] text-xs font-mono font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#1C1917] text-white border border-[#1C1917] shadow-[1px_1px_0px_#262626]"
                          : "text-[#57534E] hover:bg-white hover:text-[#1C1917]"
                      }`}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
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
                className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-[#262626] text-[11px] font-bold text-[#1C1917] cursor-pointer"
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
      )}
    </div>
  );
};
