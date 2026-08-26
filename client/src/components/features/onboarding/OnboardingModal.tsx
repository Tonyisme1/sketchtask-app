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
  Calendar,
  Clock,
  ShieldCheck,
  Search,
  ArrowRight,
} from "lucide-react";

// ==========================================
// COMPONENT: OnboardingModal (Hướng Dẫn Sử Dụng Chi Tiết & Chào Mừng)
// ==========================================

const STEPS = [
  {
    stepNumber: "01",
    IconComponent: Edit3,
    iconBg: "#FEF08A",
    title: "Chào mừng đến SketchTask!",
    subtitle: "Sổ tay công việc số phong cách vẽ tay",
    description:
      "SketchTask là không gian làm việc cá nhân kết hợp giữa sự ấm áp của sổ tay giấy phác thảo và sức mạnh công nghệ số — hoạt động 100% không cần mạng.",
    features: [
      {
        Icon: CheckSquare,
        color: "text-amber-800",
        bg: "bg-[#FEF08A]",
        name: "Hoàn toàn Offline-First",
        desc: "Dữ liệu lưu an toàn trên máy, mở app là dùng ngay không cần chờ mạng.",
      },
      {
        Icon: Sparkles,
        color: "text-emerald-800",
        bg: "bg-[#BBF7D0]",
        name: "Trải nghiệm xúc giác sống động",
        desc: "Âm thanh tick mực lách cách, checkbox vẽ tay và hiệu ứng lật trang êm ái.",
      },
    ],
  },
  {
    stepNumber: "02",
    IconComponent: Calendar,
    iconBg: "#BBF7D0",
    title: "Tab Hôm Nay & Kế Hoạch",
    subtitle: "Lên lịch trình và giải quyết công việc",
    description: null,
    features: [
      {
        Icon: CheckSquare,
        color: "text-emerald-800",
        bg: "bg-[#BBF7D0]",
        name: "Thêm việc nhanh 1 chạm",
        desc: "Gõ tiêu đề và bấm Enter hoặc nút [+] để tạo ngay việc cần làm.",
      },
      {
        Icon: Clock,
        color: "text-amber-800",
        bg: "bg-[#FEF08A]",
        name: "Hạn chót & Mức độ ưu tiên",
        desc: "Bấm [+ Tùy chọn] để gán giờ hẹn, nhãn #Tag và mức độ 🔴 Gấp / 🟡 Vừa / 🟢 Thấp.",
      },
      {
        Icon: ArrowRight,
        color: "text-sky-800",
        bg: "bg-[#BAE6FD]",
        name: "Dời lịch 1 giây [ ➔ Mai ]",
        desc: "Chưa kịp làm xong? Bấm nút [Mai] trên thẻ việc để tự động dời sang ngày mai.",
      },
    ],
  },
  {
    stepNumber: "03",
    IconComponent: BookOpen,
    iconBg: "#BAE6FD",
    title: "Tab Sổ Tay (Notebooks)",
    subtitle: "Tổ chức công việc theo từng dự án",
    description: null,
    features: [
      {
        Icon: BookOpen,
        color: "text-sky-800",
        bg: "bg-[#BAE6FD]",
        name: "Kệ sách bìa màu riêng biệt",
        desc: "Tạo nhiều cuốn sổ riêng cho Dự án, Học tập, Tài chính hay Cuộc sống.",
      },
      {
        Icon: Sparkles,
        color: "text-purple-800",
        bg: "bg-[#DDD6FE]",
        name: "Thống kê tiến độ % hoàn thành",
        desc: "Mỗi cuốn sổ có thanh đo tiến độ giúp bạn nắm rõ khối lượng việc đã hoàn tất.",
      },
      {
        Icon: Calendar,
        color: "text-orange-800",
        bg: "bg-[#FED7AA]",
        name: "Hộp việc chờ xếp lịch (Backlog)",
        desc: "Việc ghi vào sổ nhưng chưa chọn ngày sẽ hiển thị trong Tab Kế Hoạch để bạn kéo thả sau.",
      },
    ],
  },
  {
    stepNumber: "04",
    IconComponent: Lightbulb,
    iconBg: "#DDD6FE",
    title: "Ý Tưởng & Rèn Thói Quen",
    subtitle: "Bảng Brain Dump & Theo dõi Streak",
    description: null,
    features: [
      {
        Icon: Lightbulb,
        color: "text-purple-800",
        bg: "bg-[#DDD6FE]",
        name: "Bảng dán Sticky Note tự do",
        desc: "Dán nhanh suy nghĩ bất chợt, ghim việc quan trọng hoặc đổi thành task bất cứ lúc nào.",
      },
      {
        Icon: Flame,
        color: "text-orange-800",
        bg: "bg-[#FED7AA]",
        name: "Chuỗi thói quen (Streak)",
        desc: "Tick thói quen hàng ngày (uống nước, đọc sách, tập thể dục) để duy trì ngọn lửa kiên trì.",
      },
      {
        Icon: Edit3,
        color: "text-pink-800",
        bg: "bg-[#FECDD3]",
        name: "Nhật ký tâm trạng & Phản tư tuần",
        desc: "Chấm điểm cảm xúc mỗi ngày và tổng kết đúc kết lại bài học mỗi cuối tuần.",
      },
    ],
  },
  {
    stepNumber: "05",
    IconComponent: Cloud,
    iconBg: "#FED7AA",
    title: "Đồng Bộ & Mẹo Nâng Cao",
    subtitle: "Sẵn sàng làm chủ ngày làm việc",
    description: null,
    features: [
      {
        Icon: Cloud,
        color: "text-sky-800",
        bg: "bg-[#BAE6FD]",
        name: "Đăng nhập để đồng bộ đám mây",
        desc: "Bấm Avatar góc trên → Đăng nhập Google/Email để đồng bộ giữa Điện thoại & Máy tính.",
      },
      {
        Icon: Search,
        color: "text-amber-800",
        bg: "bg-[#FEF08A]",
        name: "Tìm kiếm toàn cục (Ctrl + K)",
        desc: "Tìm tức thì bất kỳ việc, sổ tay hay ghi chú nào với thuật toán không dấu siêu tốc.",
      },
      {
        Icon: ShieldCheck,
        color: "text-emerald-800",
        bg: "bg-[#BBF7D0]",
        name: "Mã PIN bảo mật riêng cho máy",
        desc: "Cài đặt mã khóa 4 số trong phần Cài đặt để bảo vệ riêng tư khi mang máy ra ngoài.",
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

  // MỖI KHI MỞ LẠI MODAL (TỪ CÀI ĐẶT HOẶC AVATAR): LUÔN QUAY LẠI BƯỚC ĐẦU TIÊN (BƯỚC 0)
  useEffect(() => {
    if (isOpen) {
      setStep(0);
    }
  }, [isOpen]);

  // Khóa cuộn màn hình phía sau khi mở modal hướng dẫn
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

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
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
      className="flex items-center justify-center p-3 sm:p-4 select-none animate-in fade-in duration-200 pointer-events-auto"
      onClick={handleClose}
    >
      {/* Modal Card Chính */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#FBF9F4] border-[2px] border-[#262626] rounded-[10px] shadow-[6px_6px_0px_#262626] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Paper Tape decoration */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#FEF08A]/90 border-x border-[#262626]/40 rotate-1 shadow-sm pointer-events-none z-10" />

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-2.5 right-2.5 z-20 w-7 h-7 bg-white hover:bg-rose-50 text-[#78716C] hover:text-rose-600 border border-[#262626] rounded-[4px] shadow-[1px_1px_0px_#262626] flex items-center justify-center active:translate-y-[0.5px] transition-all"
          title="Đóng hướng dẫn"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-[#E7E2D8] shrink-0">
          <div
            className="h-full bg-[#262626] transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Content Scrollable Area */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto no-scrollbar flex-1">
          {/* Step: Header */}
          <div className="text-center space-y-1">
            {current.IconComponent && (
              <div
                className="w-12 h-12 mx-auto rounded-[8px] border-[1.5px] border-[#262626] shadow-[2px_2px_0px_#262626] flex items-center justify-center -rotate-1 mb-1.5"
                style={{ backgroundColor: current.iconBg! }}
              >
                <current.IconComponent
                  size={22}
                  className="text-[#1C1917]"
                  strokeWidth={2.2}
                />
              </div>
            )}
            <div className="inline-flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold text-[#1C1917] bg-[#FEF08A] px-1.5 py-0.2 rounded border border-[#262626]">
                Bước {step + 1}/{STEPS.length}
              </span>
              <h2 className="font-bold text-sm sm:text-base text-[#1C1917]">
                {current.title}
              </h2>
            </div>
            <p className="text-[11px] font-mono text-[#78716C]">
              {current.subtitle}
            </p>
          </div>

          {/* Step: Description */}
          {current.description && (
            <p className="text-xs text-[#1C1917] leading-relaxed text-center bg-white border border-[#D4CEBF] rounded-[6px] p-2.5 shadow-[1px_1px_0px_#D4CEBF]">
              {current.description}
            </p>
          )}

          {/* Step: Detailed Feature Cards */}
          {current.features && (
            <div className="space-y-2">
              {current.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2 sm:p-2.5 bg-white border border-[#262626] rounded-[6px] shadow-[1.5px_1.5px_0px_#262626]"
                >
                  <span
                    className={`w-7 h-7 rounded-[4px] border border-[#262626] flex items-center justify-center shrink-0 mt-0.5 ${f.bg}`}
                  >
                    <f.Icon size={15} className={f.color} strokeWidth={2.2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[11px] sm:text-xs text-[#1C1917]">
                      {f.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-[#78716C] leading-snug mt-0.5">
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
                type="button"
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step
                    ? "w-6 bg-[#262626]"
                    : "w-1.5 bg-[#D4CEBF] hover:bg-[#A8A29E]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-4 sm:px-5 pb-4 pt-1 space-y-2 bg-[#FBF9F4] border-t border-[#D4CEBF]/60 shrink-0">
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
              <span>{isLast ? "Bắt đầu sử dụng ngay" : "Tiếp theo ➔"}</span>
              {isLast && <Sparkles size={13} className="text-amber-300" />}
            </button>
          </div>

          {isLast && (
            <button
              type="button"
              onClick={handleLoadSample}
              className="w-full py-2 bg-[#FEF08A] hover:bg-[#FDE047] border-[1.5px] border-[#262626] rounded-[4px] shadow-[1.5px_1.5px_0px_#262626] text-xs font-bold text-[#1C1917] active:translate-y-[0.5px] active:shadow-none transition-all flex items-center justify-center gap-1.5"
            >
              <span>Nạp dữ liệu mẫu để trải nghiệm</span>
              <Sparkles size={13} className="text-amber-700" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            className="w-full text-center text-[10px] text-[#78716C] hover:text-[#1C1917] font-mono py-0.5"
          >
            Bỏ qua hướng dẫn
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
