import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../../stores/appStore";
import { DynamicIcon } from "../../ui";
import {
  X,
  Check,
  RefreshCw,
  LogOut,
  Laptop,
  Radio,
  BookMarked,
  Lightbulb,
  CheckSquare,
  BookOpen,
  Cloud,
  ShieldCheck,
  Pencil,
  ArrowRight,
  Lock,
} from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";
import { useModalBackClose } from "../../../hooks/useModalBackClose";

export interface AccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchAccount?: () => void;
  onOpenPinSetup?: () => void;
}

const AVATAR_COLORS = [
  { name: "Vàng Nắng", hex: "#FEF08A" },
  { name: "Xanh Bạc Hà", hex: "#BBF7D0" },
  { name: "Xanh Da Trời", hex: "#BAE6FD" },
  { name: "Tím Oải Hương", hex: "#DDD6FE" },
  { name: "Hồng San Hô", hex: "#FECDD3" },
  { name: "Cam Đào", hex: "#FED7AA" },
];

const AVATAR_ICONS = [
  "lucide:User",
  "lucide:UserCheck",
  "lucide:Sparkles",
  "lucide:Smile",
  "lucide:Star",
  "lucide:Flame",
  "lucide:Zap",
  "lucide:BookOpen",
  "lucide:Heart",
];

export const AccountProfileModal: React.FC<AccountProfileModalProps> = ({
  isOpen,
  onClose,
  onSwitchAccount,
  onOpenPinSetup,
}) => {
  useModalBackClose(isOpen, onClose);
  const {
    user,
    updateUserProfile,
    logout,
    syncNow,
    syncStatus,
    lastSyncedAt,
    tasks,
    notebooks,
    stickyNotes,
    journalEntries,
    pinCode,
  } = useAppStore();

  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState(user.name);

  // Avatar Picker State
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useScrollLock(isVisible);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      setEditNameValue(user.name);
      return;
    }

    if (!isVisible) return;

    setIsClosing(true);
    const exitTimer = window.setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 220);

    return () => window.clearTimeout(exitTimer);
  }, [isOpen, isVisible, user.name]);

  if (!isVisible || !mounted) return null;

  const handleSaveName = () => {
    if (editNameValue.trim()) {
      updateUserProfile({ name: editNameValue.trim() });
    }
    setIsEditingName(false);
  };

  const handleSelectColor = (colorHex: string) => {
    updateUserProfile({ avatarBg: colorHex });
  };

  const handleSelectIcon = (iconName: string) => {
    updateUserProfile({ avatar: iconName });
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const success = await syncNow();
    setIsSyncing(false);
    if (success) {
      setSyncDone(true);
      setTimeout(() => setSyncDone(false), 2500);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Thông tin tài khoản cá nhân"
      onClick={onClose}
      className="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 mobile-scrim-enter select-none"
    >
      <div
        role="document"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-h-[92dvh] sm:max-h-[85vh] sm:max-w-lg bg-[#FBF9F4] border-t-[2px] sm:border-[2px] border-[#262626] rounded-t-[22px] sm:rounded-[8px] shadow-[0px_-4px_0px_#262626] sm:shadow-[4px_4px_0px_#262626] p-4 sm:p-6 overflow-y-auto flex flex-col justify-start space-y-4 ${
          isClosing ? "mobile-panel-exit" : "mobile-panel-enter"
        }`}
      >
        {/* Mobile Grab Handle */}
        <div className="sm:hidden flex justify-center -mt-2 pb-1">
          <div className="w-10 h-1 bg-[#262626]/30 rounded-full" />
        </div>

        {/* 1. Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#FEF08A] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917]">
              <DynamicIcon name="lucide:UserCheck" size={17} strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#1C1917] tracking-tight">
                Tài Khoản Cá Nhân
              </h2>
              <p className="text-[10px] text-[#78716C] font-mono">
                Quản lý hồ sơ, bảo mật & đồng bộ đám mây
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] bg-white hover:bg-[#FEF08A] border border-[#262626] shadow-[1px_1px_0px_#262626] flex items-center justify-center text-[#1C1917] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer shrink-0"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* 2. User Profile Card & Avatar Customizer */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-3">
          <div className="flex items-center gap-3.5">
            {/* Clickable Avatar for Picker */}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="relative w-14 h-14 rounded-[8px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] shrink-0 shadow-[2px_2px_0px_#262626] active:translate-x-[0.5px] active:translate-y-[0.5px] cursor-pointer group"
              style={{ backgroundColor: user.avatarBg || "#FEF08A" }}
              title="Nhấn để đổi màu & icon đại diện"
            >
              <DynamicIcon
                name={user.avatar || (user.isSignedIn ? "lucide:UserCheck" : "lucide:User")}
                size={26}
                strokeWidth={2.2}
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-[3px] bg-white border border-[#262626] shadow-[0.5px_0.5px_0px_#262626] flex items-center justify-center text-[10px] text-[#1C1917]">
                <Pencil size={10} strokeWidth={2.4} />
              </span>
            </button>

            {/* User Details & Edit Name */}
            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                    className="flex-1 px-2 py-1 bg-white border border-[#262626] rounded text-xs font-bold text-[#1C1917] focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="px-2 py-1 bg-[#BBF7D0] border border-[#262626] rounded text-xs font-bold text-[#1C1917] shadow-[1px_1px_0px_#262626] active:translate-y-[0.5px]"
                  >
                    Lưu
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-[#1C1917] truncate">
                    {user.name || "Người Dùng Sketch"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                    title="Đổi tên hiển thị"
                  >
                    <Pencil size={12} strokeWidth={2} />
                  </button>
                </div>
              )}

              <p className="text-xs text-[#78716C] font-mono truncate mt-0.5">
                {user.email || "Chưa đăng ký email (Khách)"}
              </p>

              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border border-[#262626] bg-[#FAF8F3] text-[#1C1917]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C1917] animate-pulse" />
                  {user.isSignedIn ? "Đã đăng nhập" : "Khách cục bộ (Offline)"}
                </span>

                <span className="text-[10px] font-mono text-[#78716C] bg-white px-1.5 py-0.5 rounded border border-[#D4CEBF]">
                  ID: #{user.email ? user.email.split("@")[0] : "local_user"}
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Avatar Customizer */}
          {showAvatarPicker && (
            <div className="pt-3 border-t border-[#262626]/15 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
              <div>
                <span className="text-[11px] font-bold text-[#1C1917] font-mono">
                  Màu nền giấy:
                </span>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => handleSelectColor(c.hex)}
                      className={`w-7 h-7 rounded-[4px] border-[1.5px] border-[#262626] flex items-center justify-center transition-all cursor-pointer ${
                        user.avatarBg === c.hex
                          ? "shadow-[1.5px_1.5px_0px_#262626] scale-105"
                          : "opacity-80 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {user.avatarBg === c.hex && (
                        <Check size={13} strokeWidth={3} className="text-[#1C1917]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-[#1C1917] font-mono">
                  Biểu tượng:
                </span>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {AVATAR_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => handleSelectIcon(icon)}
                      className={`w-7 h-7 bg-white rounded-[4px] border-[1.5px] border-[#262626] flex items-center justify-center text-[#1C1917] transition-all cursor-pointer ${
                        user.avatar === icon
                          ? "bg-[#1C1917] text-white shadow-[1.5px_1.5px_0px_#262626] font-bold"
                          : "hover:bg-[#FAF8F3]"
                      }`}
                    >
                      <DynamicIcon name={icon} size={14} strokeWidth={2.2} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Realtime Sync & Cloud Storage Card */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-4 shadow-[2px_2px_0px_#262626] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#1C1917] font-mono flex items-center gap-1.5">
              <Cloud size={14} strokeWidth={2.4} className="text-[#1C1917]" />
              <span>Đồng Bộ & Dữ Liệu</span>
            </span>

            <span className="font-mono text-[10px] text-[#1C1917] bg-[#FAF8F3] px-2 py-0.5 rounded border border-[#262626] font-bold">
              {syncStatus === "syncing"
                ? "Đang đồng bộ..."
                : lastSyncedAt
                ? `Đã lưu (${lastSyncedAt})`
                : "Realtime Sẵn Sàng"}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 bg-[#FAF8F3] border border-[#262626]/20 rounded-[4px] text-center">
              <span className="block font-mono text-sm font-black text-[#1C1917]">
                {tasks.length}
              </span>
              <span className="text-[10px] text-[#78716C] font-semibold flex items-center justify-center gap-1">
                <CheckSquare size={11} className="text-[#1C1917]" />
                <span>Việc</span>
              </span>
            </div>

            <div className="p-2 bg-[#FAF8F3] border border-[#262626]/20 rounded-[4px] text-center">
              <span className="block font-mono text-sm font-black text-[#1C1917]">
                {notebooks.length}
              </span>
              <span className="text-[10px] text-[#78716C] font-semibold flex items-center justify-center gap-1">
                <BookMarked size={11} className="text-[#1C1917]" />
                <span>Sổ tay</span>
              </span>
            </div>

            <div className="p-2 bg-[#FAF8F3] border border-[#262626]/20 rounded-[4px] text-center">
              <span className="block font-mono text-sm font-black text-[#1C1917]">
                {stickyNotes.length}
              </span>
              <span className="text-[10px] text-[#78716C] font-semibold flex items-center justify-center gap-1">
                <Lightbulb size={11} className="text-[#1C1917]" />
                <span>Ý tưởng</span>
              </span>
            </div>

            <div className="p-2 bg-[#FAF8F3] border border-[#262626]/20 rounded-[4px] text-center">
              <span className="block font-mono text-sm font-black text-[#1C1917]">
                {journalEntries.length}
              </span>
              <span className="text-[10px] text-[#78716C] font-semibold flex items-center justify-center gap-1">
                <BookOpen size={11} className="text-[#1C1917]" />
                <span>Nhật ký</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-2 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin text-emerald-800" : ""} />
            <span>
              {syncDone ? (
                <span className="text-emerald-900 font-black">✓ Đồng bộ thành công!</span>
              ) : isSyncing ? (
                "Đang gửi dữ liệu lên máy chủ..."
              ) : (
                "Đồng bộ dữ liệu ngay"
              )}
            </span>
          </button>
        </div>

        {/* 4. Connected Devices & Security */}
        <div className="bg-[#FFFDF8] border-[1.5px] border-[#262626] rounded-[8px] p-3.5 shadow-[2px_2px_0px_#262626] space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#1C1917] font-mono flex items-center gap-1.5">
            <ShieldCheck size={14} strokeWidth={2.4} className="text-emerald-700" />
            <span>Thiết Bị & Bảo Mật</span>
          </span>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between bg-[#FAF8F3] p-2 rounded border border-[#262626]/10">
              <span className="flex items-center gap-2 text-[#1C1917] font-bold">
                <Laptop size={14} strokeWidth={2} className="text-stone-700" />
                <span>Thiết bị đang dùng</span>
              </span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 font-bold">
                <Radio size={11} className="animate-pulse text-emerald-600" />
                Realtime Online
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#FAF8F3] p-2 rounded border border-[#262626]/10">
              <span className="flex items-center gap-2 text-[#1C1917] font-bold">
                <Lock size={14} strokeWidth={2} className="text-stone-700" />
                <span>Mã PIN bảo vệ</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenPinSetup) onOpenPinSetup();
                }}
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-[#262626] ${
                  pinCode ? "bg-[#BBF7D0] text-emerald-950" : "bg-stone-200 text-stone-700"
                }`}
              >
                {pinCode ? "Đang bật" : "Cài đặt PIN"}
              </button>
            </div>
          </div>
        </div>

        {/* 5. Bottom Action Buttons */}
        <div className="pt-2 grid grid-cols-2 gap-2 shrink-0">
          {onSwitchAccount && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchAccount();
              }}
              className="py-2.5 bg-white hover:bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer"
            >
              <span>Đổi tài khoản</span>
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className={`py-2.5 bg-white hover:bg-rose-50 border-[1.5px] border-rose-400 rounded-[4px] shadow-[1.5px_1.5px_0px_#E11D48] text-xs font-bold text-rose-700 flex items-center justify-center gap-1.5 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none transition-all cursor-pointer ${
              !onSwitchAccount ? "col-span-2" : ""
            }`}
          >
            <LogOut size={14} strokeWidth={2.4} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
