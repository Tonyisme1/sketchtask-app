import React, { useEffect, useRef, useState } from "react";
import { LogIn, LogOut, Settings, User } from "lucide-react";
import { DynamicIcon } from "../../shared/ui";
import type { UserProfile } from "../../stores/appStore";

interface AccountMenuProps {
  user: UserProfile;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  size?: "sm" | "md";
}

/** Shared account trigger/menu so all platform headers expose the same actions. */
export const AccountMenu: React.FC<AccountMenuProps> = ({
  user,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  size = "md",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9";
  const avatarSize = size === "sm" ? "h-5 w-5" : "h-6 w-6";

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const runMenuAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div ref={menuRef} className="relative shrink-0 select-none">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
        className={`${buttonSize} relative flex items-center justify-center rounded-xl border border-[#E5E5EA] dark:border-[#3A3A3C] text-[#1C1C1E] shadow-2xs transition-all active:scale-95 cursor-pointer overflow-hidden`}
        title={user.isSignedIn ? `Tài khoản: ${user.name}` : "Đăng nhập"}
        aria-label={user.isSignedIn ? `Tài khoản: ${user.name}` : "Đăng nhập"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <DynamicIcon
          name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
          size={size === "sm" ? 16 : 18}
          strokeWidth={2.2}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu tài khoản"
          className="absolute right-0 top-full z-[80] mt-2 w-60 rounded-2xl border border-[#E5E5EA] dark:border-[#2C2C2E] bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl p-1.5 text-[#1C1C1E] dark:text-[#F2F2F7] shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="border-b border-[#E5E5EA] dark:border-[#2C2C2E] px-3 py-2.5 mb-1">
            <div className="flex items-center gap-2.5">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1C1C1E] text-xs font-semibold shrink-0 shadow-xs overflow-hidden"
                style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
              >
                <DynamicIcon
                  name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                  size={14}
                  strokeWidth={2.2}
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-[#1C1C1E] dark:text-[#F2F2F7]">
                  {user.isSignedIn ? user.name : "Khách"}
                </p>
                <p className="truncate font-mono text-[10px] text-[#8E8E93]">
                  {user.isSignedIn ? user.email : "Chưa đăng nhập"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(onOpenSettings)}
            className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-medium text-[#1C1C1E] dark:text-[#F2F2F7] transition-colors hover:bg-black/[0.05] dark:hover:bg-white/[0.08] cursor-pointer"
          >
            <Settings size={15} strokeWidth={2.2} className="text-[#8E8E93]" />
            <span>Cài đặt</span>
          </button>

          {user.isSignedIn ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onLogout)}
              className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-medium text-[#FF3B30] transition-colors hover:bg-[#FF3B30]/10 cursor-pointer"
            >
              <LogOut size={15} strokeWidth={2.2} />
              <span>Đăng xuất</span>
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onOpenLogin)}
              className="flex min-h-9 w-full items-center gap-2 rounded-xl px-3 text-left text-xs font-medium text-[#34C759] dark:text-[#30D158] transition-colors hover:bg-[#34C759]/10 cursor-pointer"
            >
              <LogIn size={15} strokeWidth={2.2} />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
