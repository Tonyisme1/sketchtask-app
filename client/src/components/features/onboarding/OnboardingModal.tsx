import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAppStore } from "../../../stores/appStore";
import {
  CheckSquare,
  BookOpen,
  Lightbulb,
  Flame,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Cloud,
  Edit3,
  X,
} from "lucide-react";

// ==========================================
// COMPONENT: OnboardingModal (Chào Mừng & Giới Thiệu Ứng Dụng)
// ==========================================

const STEPS = [
  {
    IconComponent: Edit3,
    iconBg: "#FEF08A",
    title: "Chào mừng đến SketchTask!",
    subtitle: "Sổ tay công việc phong cách vẽ tay",
    description:
      "SketchTask giúp bạn quản lý công việc, ghi chép ý tưởng và rèn luyện thói quen tốt — mọi lúc, mọi nơi, kể cả khi không có mạng.",
    features: null,
  },
  {
    IconComponent: null,
    iconBg: null,
    title: "4 tính năng cốt lõi",
    subtitle: "Mọi thứ bạn cần trong một app",
    description: null,
    features: [
      {
        Icon: CheckSquare,
        color: "text-amber-700",
        bg: "bg-[#FEF08A]",
        name: "Việc cần làm",
        desc: "Quản lý công việc theo ngày với nhãn, hạn chót và ưu tiên.",
      },
      {
        Icon: BookOpen,
        color: "text-sky-700",
        bg: "bg-[#BAE6FD]",
        name: "Sổ tay cá nhân",
        desc: "Tạo nhiều cuốn sổ riêng cho từng dự án, học tập hay cuộc sống.",
      },
      {
        Icon: Lightbulb,
        color: "text-purple-700",
        bg: "bg-[#DDD6FE]",
        name: "Bảng ý tưởng",
        desc: "Dán nhanh suy nghĩ bất chợt trước khi chúng bay mất.",
      },
      {
        Icon: Flame,
        color: "text-orange-700",
        bg: "bg-[#FED7AA]",
        name: "Thói quen & Tổng kết",
        desc: "Theo dõi streak hàng ngày và điểm lại mỗi cuối tuần.",
      },
    ],
  },
  {
    IconComponent: null,
    iconBg: null,
    title: "Bắt đầu thế nào?",
    subtitle: "Chỉ cần 3 bước đơn giản",
    description: null,
    features: [
      {
        Icon: CheckSquare,
        color: "text-[#1C1917]",
        bg: "bg-[#BBF7D0]",
        name: "① Tạo việc đầu tiên",
        desc: 'Bấm nút "+ Thêm việc" ở Tab Hôm Nay hoặc Kế Hoạch.',
      },
      {
        Icon: Cloud,
        color: "text-[#1C1917]",
        bg: "bg-[#BAE6FD]",
        name: "② Thử dữ liệu mẫu",
        desc: 'Vào Cài đặt → Đồng bộ → "Thử ngay" để xem app trông như thế nào khi đầy dữ liệu.',
      },
      {
        Icon: Sparkles,
        color: "text-[#1C1917]",
        bg: "bg-[#FEF08A]",
        name: "③ Đăng nhập để đồng bộ",
        desc: "Bấm Avatar góc trên → Đăng nhập để dữ liệu đồng bộ giữa điện thoại & máy tính.",
      },
    ],
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { dismissOnboarding, loadSampleData } = useAppStore();
  const [step, setStep] = useState(0);

  if (!isOpen) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleClose = () => {
    dismissOnboarding();
    if (onClose) onClose();
  };

  const handleNext = () => {
    if (isLast) {
      handleClose();
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleLoadSample = () => {
    loadSampleData();
    handleClose();
  };

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 999998,
        backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        touchAction: "none",
      }}
      className="flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
    >
      {/* Modal Card Chính */}
      <div className="relative w-full max-w-sm bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[10px] shadow-[6px_6px_0px_#262626] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Paper Tape decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#FEF08A]/90 border-x border-[#262626]/40 rotate-1 shadow-sm pointer-events-none z-10" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 bg-white hover:bg-rose-50 text-[#78716C] hover:text-rose-600 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center active:translate-y-[0.5px] transition-all"
          title="Đóng giới thiệu"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-[#E7E2D8]">
          <div
            className="h-full bg-[#262626] transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Step: Header */}
          <div className="text-center space-y-1.5">
            {current.IconComponent && (
              <div
                className="w-14 h-14 mx-auto rounded-[8px] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] flex items-center justify-center -rotate-1 mb-2"
                style={{ backgroundColor: current.iconBg! }}
              >
                <current.IconComponent
                  size={24}
                  className="text-[#1C1917]"
                  strokeWidth={2.2}
                />
              </div>
            )}
            <h2 className="font-bold text-base text-[#1C1917]">
              {current.title}
            </h2>
            <p className="text-[11px] font-mono text-[#78716C]">
              {current.subtitle}
            </p>
          </div>

          {/* Step: Description or Features */}
          {current.description && (
            <p className="text-xs text-[#1C1917] leading-relaxed text-center bg-white border border-[#D4CEBF] rounded-[6px] p-3">
              {current.description}
            </p>
          )}

          {current.features && (
            <div className="space-y-2">
              {current.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2 bg-white border border-[#D4CEBF] rounded-[6px]"
                >
                  <span
                    className={`w-7 h-7 rounded-[4px] border border-[#262626] flex items-center justify-center shrink-0 ${f.bg}`}
                  >
                    <f.Icon size={15} className={f.color} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-[11px] text-[#1C1917]">
                      {f.name}
                    </p>
                    <p className="text-[10px] text-[#78716C] leading-snug mt-0.5">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-5 bg-[#262626]"
                    : "w-1.5 bg-[#D4CEBF] hover:bg-[#A8A29E]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 pb-5 pt-0 space-y-2">
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-3 py-2 bg-white border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] hover:bg-[#F3EFE6] active:translate-y-[0.5px] active:shadow-none transition-all"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#262626] hover:bg-[#1C1917] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#A8A29E] text-xs font-bold text-white active:translate-y-[0.5px] active:shadow-none transition-all"
            >
              <span>{isLast ? "Bắt đầu sử dụng" : "Tiếp theo"}</span>
              {isLast ? (
                <Sparkles size={13} className="text-amber-300" />
              ) : (
                <ChevronRight size={14} />
              )}
            </button>
          </div>

          {isLast && (
            <button
              type="button"
              onClick={handleLoadSample}
              className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-y-[0.5px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <span>Nạp dữ liệu mẫu để khám phá</span>
              <Sparkles size={13} className="text-amber-700" />
            </button>
          )}

          <button
            type="button"
            onClick={dismissOnboarding}
            className="w-full text-center text-[10px] text-[#78716C] hover:text-[#1C1917] font-mono py-1"
          >
            Bỏ qua, tôi tự khám phá
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
