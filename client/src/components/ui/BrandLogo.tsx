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
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[68%] h-[68%]"
        >
          {/* Cuốn Sổ Tay Gáy Lò Xo */}
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 2v20" />
          {/* Ngòi Bút Vẽ & Dấu Tick */}
          <path d="m11 11 2 2 4-4" strokeWidth="2.5" />
          <line x1="10" y1="17" x2="16" y2="17" strokeWidth="2" />
        </svg>
      </div>

      {/* Brand Wordmark Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`font-bold tracking-tight text-[#1C1917] ${textSizes[size]}`}>
            Sketch<span className="text-[#1C1917] underline decoration-[#FEF08A] decoration-[3px]">Task</span>
          </span>
        </div>
      )}
    </div>
  );
};

