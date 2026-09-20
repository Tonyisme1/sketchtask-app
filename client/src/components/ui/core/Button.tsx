import React from "react";

// ==========================================
// COMPONENT: Button (Modern Fully Rounded + Tactile Press)
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
    "inline-flex items-center justify-center font-bold transition-all duration-150 " +
    "rounded-2xl border-none " +
    "active:scale-95 active:shadow-none " +
    "disabled:opacity-50 disabled:pointer-events-none disabled:shadow-none select-none cursor-pointer";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs shadow-2xs",
    md: "px-4 py-2.5 text-sm shadow-xs",
  };

  const variantClasses = {
    primary: "bg-[#1C1917] dark:bg-white text-white dark:text-[#1C1917] hover:bg-black dark:hover:bg-[#F4F4F5]",
    secondary: "bg-white dark:bg-[#2C2C2E] text-[#1C1917] dark:text-[#F2F2F7] hover:bg-[#F2F2F7] dark:hover:bg-[#3A3A3C] shadow-xs",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    mint: "bg-emerald-600 text-white hover:bg-emerald-700",
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
