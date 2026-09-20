import React from "react";

// ==========================================
// COMPONENT: BrandLogo (Logo Nhận Diện Thương Hiệu SketchTask)
// ==========================================

export interface BrandLogoProps {
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
    sm: "text-xs font-bold",
    md: "text-sm sm:text-base font-black tracking-tight",
    lg: "text-base sm:text-lg font-black tracking-tight",
  };

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Emblem: ba dòng việc và dấu hoàn thành, dùng chung ngôn ngữ với time-grid */}
      <div
        className={`${iconSizes[size]} bg-[#1C1917] dark:bg-white rounded-2xl shadow-xs flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-[72%] h-[72%]"
        >
          <rect x="3" y="3" width="18" height="18" rx="5" fill="#1C1917" stroke="none" />
          <path d="M7 8h10M7 12h6M7 16h4" stroke="#FEF08A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M14 16.5l1.8 1.8L19 14" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Brand Wordmark Text */}
      {showText && (
        <div className="flex flex-col leading-none">
          <span
            className={`text-[#1C1917] dark:text-[#F2F2F7] ${textSizes[size]}`}
          >
            Sketch
            <span className="text-[#1C1917] dark:text-white underline decoration-[#FEF08A] decoration-[2px] underline-offset-2">
              Task
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
