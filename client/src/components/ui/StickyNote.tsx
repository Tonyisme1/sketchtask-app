import React from "react";

// ==========================================
// COMPONENT: StickyNote (Tier 2 & 3 Expressive/Decor)
// ==========================================

export interface StickyNoteProps {
  content: string;
  color?: "yellow" | "coral" | "mint" | "sky" | "lavender";
  tilt?: "left" | "right";
  className?: string;
}

export const StickyNote: React.FC<StickyNoteProps> = ({
  content,
  color = "yellow",
  tilt = "left",
  className = "",
}) => {
  const colorMap = {
    yellow: "bg-[#FEF08A]",
    coral: "bg-[#FECDD3]",
    mint: "bg-[#BBF7D0]",
    sky: "bg-[#BAE6FD]",
    lavender: "bg-[#DDD6FE]",
  };

  const rotation = tilt === "left" ? "-rotate-1" : "rotate-1";

  return (
    <div
      className={`relative p-3.5 border-[1.5px] border-[#262626] shadow-[2.5px_2.5px_0px_#262626] rounded-[2px] ${colorMap[color]} ${rotation} ${className}`}
    >
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-3.5 bg-white/70 border-t border-b border-[#262626]/20" />
      <p className="font-serif italic text-xs text-[#1C1917] leading-relaxed">
        {content}
      </p>
    </div>
  );
};

