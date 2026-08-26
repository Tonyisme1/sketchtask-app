import React from "react";

// ==========================================
// COMPONENT: BrandLogo (Logo Nhận Diện Thương Hiệu SketchTask)
// ==========================================

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = "md",
  showText = true,
  className = "",
}) => {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Emblem: Sổ Tay & Bút Phác Thảo Nghệ Thuật */}
      <div
        className={`${iconSizes[size]} bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[5px] shadow-[2px_2px_0px_#262626] flex items-center justify-center -rotate-2 hover:rotate-0 transition-transform`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1C1917"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[72%] h-[72%]"
        >
          {/* Cuốn Sổ Tay Bìa Gập */}
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="2"
            fill="#FEF08A"
            stroke="#1C1917"
            strokeWidth="1.8"
          />
          {/* Dải Gáy Sổ & Khoen Lò Xo */}
          <line
            x1="7.5"
            y1="3"
            x2="7.5"
            y2="21"
            stroke="#1C1917"
            strokeWidth="1.6"
          />
          <circle cx="5.2" cy="7" r="0.8" fill="#1C1917" />
          <circle cx="5.2" cy="12" r="0.8" fill="#1C1917" />
          <circle cx="5.2" cy="17" r="0.8" fill="#1C1917" />
          {/* Dấu Tick Hoàn Thành Vẽ Tay */}
          <path
            d="M10.5 12 L13 14.5 L18 8"
            stroke="#1C1917"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Wordmark Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-tight text-[#1C1917] ${textSizes[size]}`}
          >
            Sketch
            <span className="text-[#1C1917] underline decoration-[#FEF08A] decoration-[3px]">
              Task
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
