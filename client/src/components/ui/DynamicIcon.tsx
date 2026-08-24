import React from "react";
import * as LucideIcons from "lucide-react";

// ==========================================
// COMPONENT: DynamicIcon (Hiển Thị Icon Lucide Sắc Nét Hoặc Emoji)
// ==========================================

interface DynamicIconProps {
  name?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  fallback?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name = "lucide:BookMarked",
  size = 16,
  strokeWidth = 2.2,
  className = "",
  fallback = "📓",
}) => {
  if (!name) {
    return <span className={className}>{fallback}</span>;
  }

  // Nếu là icon Lucide (vd: "lucide:BookOpen", "lucide:Rocket")
  if (name.startsWith("lucide:")) {
    const iconKey = name.replace("lucide:", "");
    const IconComponent = (LucideIcons as any)[iconKey];

    if (IconComponent) {
      return (
        <IconComponent
          size={size}
          strokeWidth={strokeWidth}
          className={className}
        />
      );
    }
  }

  // Fallback: icon là emoji text thường
  return <span className={className}>{name}</span>;
};

