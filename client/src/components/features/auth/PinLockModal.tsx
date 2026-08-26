import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock, Unlock, Delete, ShieldCheck, X } from "lucide-react";

// ==========================================
// COMPONENT: PinLockModal (Khóa Mã PIN Bảo Vệ Sổ Tay Vẽ Tay)
// ==========================================

interface PinLockModalProps {
  isOpen: boolean;
  mode: "unlock" | "setup" | "change" | "disable";
  currentPinHash?: string;
  onSuccess: (newPin?: string) => void;
  onCancel?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  mode,
  currentPinHash,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter_old" | "enter_new" | "confirm_new">("enter_new");
  const [errorMsg, setErrorMsg] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setConfirmPin("");
      setErrorMsg("");
      setIsShaking(false);
      if (mode === "unlock" || mode === "disable") {
        setStep("enter_old");
      } else if (mode === "change") {
        setStep("enter_old");
      } else {
        setStep("enter_new");
      }
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
      setPin("");
    }, 500);
  };

  const handleKeyPress = (num: string) => {
    if (pin.length >= 4) return;
    const nextPin = pin + num;
    setPin(nextPin);
    setErrorMsg("");

    if (nextPin.length === 4) {
      // Đã nhập đủ 4 số
      setTimeout(() => {
        handleCompletePin(nextPin);
      }, 150);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleCompletePin = (completedPin: string) => {
    if (mode === "unlock") {
      if (completedPin === currentPinHash) {
        onSuccess();
      } else {
        triggerError("Mã PIN không chính xác!");
      }
    } else if (mode === "disable") {
      if (completedPin === currentPinHash) {
        onSuccess();
      } else {
        triggerError("Mã PIN không chính xác!");
      }
    } else if (mode === "setup") {
      if (step === "enter_new") {
        setConfirmPin(completedPin);
        setPin("");
        setStep("confirm_new");
      } else if (step === "confirm_new") {
        if (completedPin === confirmPin) {
          onSuccess(completedPin);
        } else {
          triggerError("Mã xác nhận không khớp!");
          setTimeout(() => {
            setStep("enter_new");
            setConfirmPin("");
            setPin("");
          }, 600);
        }
      }
    } else if (mode === "change") {
      if (step === "enter_old") {
        if (completedPin === currentPinHash) {
          setPin("");
          setStep("enter_new");
        } else {
          triggerError("Mã PIN cũ không chính xác!");
        }
      } else if (step === "enter_new") {
        setConfirmPin(completedPin);
        setPin("");
        setStep("confirm_new");
      } else if (step === "confirm_new") {
        if (completedPin === confirmPin) {
          onSuccess(completedPin);
        } else {
          triggerError("Mã xác nhận không khớp!");
          setTimeout(() => {
            setStep("enter_new");
            setConfirmPin("");
            setPin("");
          }, 600);
        }
      }
    }
  };

  const getTitle = () => {
    if (mode === "unlock") return "Nhập mã PIN để mở khóa";
    if (mode === "disable") return "Nhập mã PIN để tắt bảo vệ";
    if (step === "enter_old") return "Nhập mã PIN hiện tại";
    if (step === "enter_new") return "Thiết lập mã PIN mới (4 số)";
    if (step === "confirm_new") return "Nhập lại mã PIN để xác nhận";
    return "Khóa bảo vệ";
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000002,
        backgroundColor: "rgba(28, 25, 23, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        touchAction: "none",
      }}
      className="flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div
        className={`relative w-full max-w-xs bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[10px] shadow-[6px_6px_0px_#262626] p-5 flex flex-col items-center space-y-4 ${
          isShaking ? "animate-shake" : ""
        }`}
      >
        {/* Nút Hủy nếu có */}
        {onCancel && mode !== "unlock" && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-3 right-3 text-[#78716C] hover:text-[#1C1917] p-1 bg-white border border-[#D4CEBF] rounded-[4px]"
          >
            <X size={14} />
          </button>
        )}

        {/* Lock Icon */}
        <div className="w-12 h-12 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-full flex items-center justify-center shadow-[2px_2px_0px_#262626] -mt-1">
          <Lock size={20} className="text-[#1C1917]" strokeWidth={2.5} />
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h3 className="font-bold text-sm text-[#1C1917]">{getTitle()}</h3>
          <p className="text-[11px] text-[#78716C]">Bảo vệ sổ tay & ghi chú cá nhân</p>
        </div>

        {/* 4 Dots Indicator */}
        <div className="flex items-center justify-center gap-3 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-[1.5px] border-[#262626] transition-all duration-150 ${
                  isFilled
                    ? "bg-[#262626] scale-110 shadow-[1px_1px_0px_#262626]"
                    : "bg-white"
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-xs font-bold text-rose-600 animate-in fade-in">
            ⚠️ {errorMsg}
          </p>
        )}

        {/* Number Keypad 0-9 */}
        <div className="grid grid-cols-3 gap-2 w-full pt-2">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-11 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] text-base font-mono font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
            >
              {num}
            </button>
          ))}

          <div className="flex items-center justify-center" />

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-11 bg-white hover:bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-[6px] text-base font-mono font-bold text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Xóa số"
            className="h-11 bg-[#F3EFE6] hover:bg-white border-[1.5px] border-[#262626] rounded-[6px] text-[#78716C] hover:text-[#1C1917] shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center justify-center"
          >
            <Delete size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

