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
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`${buttonSize} relative flex items-center justify-center rounded-[4px] border-[1.5px] border-[#262626] bg-white text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] transition-all hover:bg-[#FAF8F3] active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none`}
        title={user.isSignedIn ? `Tài khoản: ${user.name}` : "Đăng nhập"}
        aria-label={user.isSignedIn ? `Tài khoản: ${user.name}` : "Đăng nhập"}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span
          className={`${avatarSize} flex items-center justify-center rounded-[2px] border border-[#262626] text-[#1C1917]`}
          style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
        >
          <DynamicIcon
            name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
            size={size === "sm" ? 12 : 14}
            strokeWidth={2.2}
          />
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="Menu tài khoản"
          className="absolute right-0 top-full z-[80] mt-2 w-56 rounded-[6px] border-[1.5px] border-[#262626] bg-[#FFFDF8] p-1.5 text-[#1C1917] shadow-[3px_3px_0px_#262626] animate-in fade-in slide-in-from-top-1 duration-100"
        >
          <div className="border-b border-[#D4CEBF] px-2.5 py-2">
            <div className="flex items-center gap-2">
              <User size={14} strokeWidth={2.3} />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">
                  {user.isSignedIn ? user.name : "Khách"}
                </p>
                <p className="truncate font-mono text-[10px] text-[#78716C]">
                  {user.isSignedIn ? user.email : "Chưa đăng nhập"}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={() => runMenuAction(onOpenSettings)}
            className="flex min-h-9 w-full items-center gap-2 rounded-[4px] px-2.5 text-left text-xs font-bold transition-colors hover:bg-[#FEF08A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#262626]"
          >
            <Settings size={14} strokeWidth={2.3} />
            <span>Cài đặt</span>
          </button>

          {user.isSignedIn ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onLogout)}
              className="flex min-h-9 w-full items-center gap-2 rounded-[4px] px-2.5 text-left text-xs font-bold text-[#BE123C] transition-colors hover:bg-[#FFE4E6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#262626]"
            >
              <LogOut size={14} strokeWidth={2.3} />
              <span>Đăng xuất</span>
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => runMenuAction(onOpenLogin)}
              className="flex min-h-9 w-full items-center gap-2 rounded-[4px] px-2.5 text-left text-xs font-bold transition-colors hover:bg-[#BBF7D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#262626]"
            >
              <LogIn size={14} strokeWidth={2.3} />
              <span>Đăng nhập / Đăng ký</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
