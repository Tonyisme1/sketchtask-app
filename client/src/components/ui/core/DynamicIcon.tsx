import React, { useState, useEffect } from "react";
import * as LucideIcons from "lucide-react";

// ==========================================
// COMPONENT: DynamicIcon (Hiển Thị Icon Lucide, Ảnh Avatar URL Hoặc Emoji)
// ==========================================

export interface DynamicIconProps {
  name?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({
  name = "lucide:BookMarked",
  size = 16,
  strokeWidth = 2.2,
  className = "",
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [name]);

  if (!name) {
    const FallbackIcon = (LucideIcons as any).BookMarked;
    return <FallbackIcon size={size} strokeWidth={strokeWidth} className={className} />;
  }

  // 1. Nếu là URL hình ảnh (Google avatar, uploaded image, data URL, blob, path)
  const isImage =
    name.startsWith("http://") ||
    name.startsWith("https://") ||
    name.startsWith("data:image/") ||
    name.startsWith("blob:") ||
    name.startsWith("/");

  if (isImage) {
    if (imageError) {
      const FallbackIcon = (LucideIcons as any).User || (LucideIcons as any).BookMarked;
      return <FallbackIcon size={size} strokeWidth={strokeWidth} className={className} />;
    }
    return (
      <img
        src={name}
        alt="Avatar"
        className={`w-full h-full object-cover rounded-[inherit] select-none pointer-events-none ${className}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImageError(true)}
      />
    );
  }

  // 2. Nếu là icon Lucide (vd: "lucide:BookOpen", "lucide:Rocket")
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

  // 3. Fallback: icon là emoji text thường
  return <span className={className}>{name}</span>;
};
