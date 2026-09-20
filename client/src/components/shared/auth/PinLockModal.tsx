import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock, Delete, X, AlertCircle } from "lucide-react";
import { useScrollLock } from "../../../hooks/useScrollLock";

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
  useScrollLock(isOpen);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter_old" | "enter_new" | "confirm_new">("enter_new");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setConfirmPin("");
      setErrorMsg("");
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
    setTimeout(() => {
      setPin("");
    }, 400);
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
    if (mode === "unlock") return "Nhập mã PIN";
    if (mode === "disable") return "Tắt mã PIN";
    if (step === "enter_old") return "Nhập mã PIN hiện tại";
    if (step === "enter_new") return "Thiết lập mã PIN (4 số)";
    if (step === "confirm_new") return "Xác nhận mã PIN";
    return "Mã PIN";
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000002,
        touchAction: "none",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={getTitle()}
      className="bg-black/50 backdrop-blur-md flex items-end sm:items-center justify-center p-4 sm:p-6 select-none animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-xs bg-white dark:bg-[#1E1E22] rounded-3xl shadow-2xl p-6 flex flex-col items-center space-y-4"
      >
        {/* Nút Hủy nếu có */}
        {onCancel && mode !== "unlock" && (
          <button
            type="button"
            onClick={onCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white bg-black/[0.04] dark:bg-white/[0.08] transition-colors cursor-pointer"
            title="Đóng"
            aria-label="Đóng"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        )}

        {/* Lock Icon */}
        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center -mt-1 shadow-xs">
          <Lock size={22} strokeWidth={2.4} />
        </div>

        {/* Title */}
        <div className="text-center">
          <h3 className="font-bold text-base text-[#1C1C1E] dark:text-[#F2F2F7]">{getTitle()}</h3>
        </div>

        {/* 4 Dots Indicator */}
        <div className="flex items-center justify-center gap-3.5 py-1">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled
                    ? "bg-[#1C1C1E] dark:bg-white scale-110 shadow-xs"
                    : "bg-black/10 dark:bg-white/10"
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 animate-in fade-in">
            <AlertCircle size={14} strokeWidth={2.4} />
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Number Keypad 0-9 */}
        <div className="grid grid-cols-3 gap-2 w-full pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-12 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] rounded-2xl text-lg font-bold font-mono text-[#1C1C1E] dark:text-[#F2F2F7] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
            >
              {num}
            </button>
          ))}

          <div className="flex items-center justify-center" />

          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            className="h-12 bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] rounded-2xl text-lg font-bold font-mono text-[#1C1C1E] dark:text-[#F2F2F7] active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Xóa số"
            className="h-12 bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] rounded-2xl text-[#8E8E93] hover:text-[#1C1917] dark:hover:text-white active:scale-95 transition-all flex items-center justify-center cursor-pointer"
          >
            <Delete size={20} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
