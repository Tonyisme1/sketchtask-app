import React from "react";

// ==========================================
// COMPONENT: Button (Tier 1 Core UI + Tactile Press)
// ==========================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "mint";
  size?: "sm" | "md";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-all duration-100 " +
    "border-[1.5px] border-[#262626] rounded-[4px] " +
    "active:translate-x-[2px] active:translate-y-[2px] active:shadow-none " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none select-none";

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs shadow-[1.5px_1.5px_0px_#262626]",
    md: "px-4 py-2 text-sm shadow-[2px_2px_0px_#262626] hover:-translate-x-[0.5px] hover:-translate-y-[0.5px]",
  };

  const variantClasses = {
    primary: "bg-[#FEF08A] text-[#1C1917] hover:bg-[#FDE047]",
    secondary: "bg-[#FFFFFF] text-[#1C1917] hover:bg-[#F3EFE6]",
    danger: "bg-[#FECDD3] text-[#1C1917] hover:bg-[#FDA4AF]",
    mint: "bg-[#BBF7D0] text-[#1C1917] hover:bg-[#86EFAC]",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

