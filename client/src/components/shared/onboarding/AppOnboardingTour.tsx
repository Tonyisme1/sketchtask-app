import { useEffect, useState } from "react";
import { useResponsiveLayout } from "../../../hooks";

const STORAGE_KEY = "sketchtask_onboarding_completed_v1";

type TourStep = {
  selector: string;
  title: string;
  description: string;
};

const MOBILE_STEPS: TourStep[] = [
  { selector: '[data-onboarding="mobile-tasks"]', title: "Công việc", description: "Theo dõi các việc cần làm theo ngày, tuần hoặc tháng." },
  { selector: '[data-onboarding="mobile-events"]', title: "Sự kiện", description: "Lịch hẹn có giờ bắt đầu và kết thúc được quản lý riêng ở đây." },
  { selector: '[data-onboarding="mobile-create"]', title: "Tạo mới", description: "Tạo nhanh công việc hoặc sự kiện phù hợp với tab đang mở." },
  { selector: '[data-onboarding="mobile-deadlines"]', title: "Sắp đến", description: "Xem việc sắp đến hạn trước, rồi đến các việc quá hạn." },
];

const TABLET_STEPS: TourStep[] = [
  { selector: '[data-onboarding="tablet-tasks"]', title: "Không gian công việc", description: "Chuyển nhanh giữa hôm nay, công việc và ghi chép." },
  { selector: '[data-onboarding="tablet-search"]', title: "Tìm kiếm", description: "Tìm cả công việc lẫn sự kiện từ một nơi." },
  { selector: '[data-onboarding="tablet-deadlines"]', title: "Hạn định", description: "Chỉ hiện những task có deadline rõ ràng." },
];

const DESKTOP_STEPS: TourStep[] = [
  { selector: '[data-onboarding="desktop-create"]', title: "Tạo nhanh", description: "Tạo đúng loại mục theo workspace bạn đang mở." },
  { selector: '[data-onboarding="desktop-tasks"]', title: "Công việc", description: "Xem backlog, lọc theo danh sách và mở chi tiết trực tiếp từ card." },
  { selector: '[data-onboarding="desktop-deadlines"]', title: "Hạn định", description: "Tập trung vào các task sắp đến hạn và quá hạn, không lẫn với event." },
];

const readCompleted = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

const markCompleted = () => {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    // The tour is optional when storage is unavailable.
  }
};

/** A short first-run coach mark, not a static page of instructions. */
export const AppOnboardingTour = () => {
  const { isDesktop, isTablet } = useResponsiveLayout();
  const steps = isDesktop ? DESKTOP_STEPS : isTablet ? TABLET_STEPS : MOBILE_STEPS;
  const [isOpen, setIsOpen] = useState(() => !readCompleted());
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const dismiss = () => {
    markCompleted();
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const updateTarget = () => {
      const target = document.querySelector(steps[stepIndex]?.selector) as HTMLElement | null;
      setTargetRect(target?.getBoundingClientRect() || null);
    };
    const frame = window.requestAnimationFrame(updateTarget);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [isOpen, stepIndex, steps]);

  if (!isOpen) return null;

  const step = steps[stepIndex];
  const padding = 8;
  const top = Math.max(0, (targetRect?.top || window.innerHeight * 0.32) - padding);
  const left = Math.max(0, (targetRect?.left || window.innerWidth * 0.1) - padding);
  const width = Math.min(
    window.innerWidth - left,
    (targetRect?.width || window.innerWidth * 0.8) + padding * 2,
  );
  const height = Math.min(
    window.innerHeight - top,
    (targetRect?.height || 56) + padding * 2,
  );
  const tooltipWidth = Math.min(320, window.innerWidth - 32);
  const tooltipLeft = Math.min(Math.max(16, left), window.innerWidth - tooltipWidth - 16);
  const tooltipTop = Math.min(top + height + 14, window.innerHeight - 180);

  return (
    <div className="fixed inset-0 z-[100]" aria-live="polite">
      <button type="button" className="absolute inset-0 cursor-default bg-black/55" aria-label="Bỏ qua hướng dẫn" onClick={dismiss} />
      {targetRect && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-xl border-2 border-[var(--accent-blue)]"
          style={{ top, left, width, height }}
        />
      )}
      <section
        role="dialog"
        aria-modal="true"
        aria-label={`Hướng dẫn ${stepIndex + 1}`}
        className="absolute rounded-2xl bg-[var(--bg-surface)] p-4 text-[var(--text-main)] shadow-[2px_2px_0_var(--border-ink)]"
        style={{ top: tooltipTop, left: tooltipLeft, width: tooltipWidth }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent-blue)]">
          Bước {stepIndex + 1}/{steps.length}
        </p>
        <h2 className="mt-1 text-base font-bold">{step.title}</h2>
        <p className="mt-1.5 text-sm leading-5 text-[var(--text-muted)]">{step.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <button type="button" onClick={dismiss} className="px-2 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)]">
            Bỏ qua
          </button>
          <button
            type="button"
            onClick={() => stepIndex === steps.length - 1 ? dismiss() : setStepIndex((index) => index + 1)}
            className="rounded-xl bg-[var(--accent-blue)] px-3 py-2 text-xs font-bold text-[var(--text-on-accent)] hover:bg-[var(--accent-blue-hover)]"
          >
            {stepIndex === steps.length - 1 ? "Bắt đầu" : "Tiếp"}
          </button>
        </div>
      </section>
    </div>
  );
};
