import React, { useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckSquare,
  ChevronRight,
  Menu,
  NotebookPen,
  Sparkles,
  X,
  Gift,
  CheckCircle2,
} from "lucide-react";
import { BrandLogo, Button } from "../../ui";
import { SeoHead } from "./SeoHead";
import { useAppStore } from "../../../stores/appStore";

export type MarketingRoute = "home" | "features" | "how-it-works" | "pricing";

interface LandingPageProps {
  route: MarketingRoute;
  onNavigate: (path: string) => void;
}

const routeMeta: Record<MarketingRoute, { title: string; description: string }> = {
  home: {
    title: "SketchTask - Sắp xếp công việc theo cách của bạn",
    description:
      "SketchTask giúp bạn gom task, lịch hẹn, ghi chú và nhật ký vào một không gian làm việc rõ ràng, nhẹ nhàng. Dùng thử miễn phí 7 ngày.",
  },
  features: {
    title: "Tính năng | SketchTask",
    description:
      "Khám phá cách SketchTask kết hợp task, lịch hẹn, ghi chú, sổ tay và nhật ký trong một workspace dễ dùng.",
  },
  "how-it-works": {
    title: "Cách hoạt động | SketchTask",
    description:
      "Bắt đầu với SketchTask trong vài bước: ghi lại, sắp xếp, thực hiện và nhìn lại tiến trình của bạn.",
  },
  pricing: {
    title: "Bảng giá & Gói dịch vụ | SketchTask",
    description:
      "Trải nghiệm trọn bộ tính năng SketchTask với 7 ngày dùng thử miễn phí. Linh hoạt theo tháng, năm hoặc trọn đời.",
  },
};

const navItems: Array<{ href: string; label: string; route: MarketingRoute }> = [
  { href: "/", label: "Trang chủ", route: "home" },
  { href: "/features", label: "Tính năng", route: "features" },
  { href: "/how-it-works", label: "Cách hoạt động", route: "how-it-works" },
  { href: "/pricing", label: "Bảng giá (Free 7 ngày)", route: "pricing" },
];

const featureCards = [
  {
    icon: CheckSquare,
    title: "Task rõ ràng",
    text: "Từ việc nhỏ đến kế hoạch lớn, mọi task đều có ngữ cảnh, thời gian và trạng thái dễ theo dõi.",
    accent: "bg-[#BAE6FD]",
  },
  {
    icon: CalendarDays,
    title: "Lịch hẹn đúng chỗ",
    text: "Tách lịch hẹn và hạn hoàn thành để bạn biết việc nào cần xuất hiện vào đúng thời điểm.",
    accent: "bg-[#FEF08A]",
  },
  {
    icon: NotebookPen,
    title: "Note không bị lạc",
    text: "Ghi chú thường, sổ tay và nhật ký nằm trong một hệ thống nhưng mỗi loại vẫn có không gian riêng.",
    accent: "bg-[#BBF7D0]",
  },
  {
    icon: BookOpen,
    title: "Nhật ký có chiều sâu",
    text: "Ghi lại điều đã làm, cảm nhận và những bước tiến trong ngày theo timeline tự nhiên.",
    accent: "bg-[#DDD6FE]",
  },
];

const pricingPlans = [
  {
    id: "free",
    name: "Khởi Động (Free)",
    badge: "Mặc định",
    badgeBg: "bg-white",
    price: "0đ",
    period: "/ vĩnh viễn",
    description: "Trải nghiệm cơ bản trên trình duyệt hoặc máy tính cá nhân.",
    cta: "Dùng thử miễn phí",
    ctaVariant: "secondary" as const,
    features: [
      "Quản lý Task & Lịch hẹn cơ bản",
      "Tối đa 3 Sổ tay chủ đề",
      "Ghi chép & Nhật ký cục bộ",
      "Lưu trữ an toàn trên thiết bị",
    ],
  },
  {
    id: "pro",
    name: "Sketch Pro",
    isPopular: true,
    badge: "🎁 FREE 7 NGÀY ĐẦU",
    badgeBg: "bg-[#FEF08A] text-[#1C1917] font-black border border-[#262626] animate-pulse",
    price: "49.000đ",
    period: "/ tháng (hoặc 399k/năm)",
    description: "Workspace trọn vẹn dành cho người làm việc chuyên nghiệp.",
    cta: "Bắt đầu 7 ngày miễn phí",
    ctaVariant: "primary" as const,
    features: [
      "🎉 Dùng thử Full tính năng 7 ngày (0đ)",
      "Đồng bộ đám mây Realtime đa thiết bị",
      "Không giới hạn Sổ tay & Nhãn phân loại",
      "Báo cáo Năng suất & Đúc kết tuần nâng cao",
      "Khóa mã PIN bảo mật tuyệt đối",
      "Nhắc việc & Thông báo qua hệ thống",
      "Hỗ trợ ưu tiên 24/7",
    ],
  },
  {
    id: "lifetime",
    name: "Trọn Đời (Lifetime)",
    badge: "👑 Mua 1 lần dùng mãi",
    badgeBg: "bg-[#DDD6FE] text-[#1C1917] font-bold border border-[#262626]",
    price: "799.000đ",
    period: "/ vĩnh viễn",
    description: "Sở hữu toàn bộ tính năng trọn đời, không bao giờ phải gia hạn.",
    cta: "Sở hữu trọn đời",
    ctaVariant: "secondary" as const,
    features: [
      "Toàn bộ quyền lợi của gói Pro vĩnh viễn",
      "Huy hiệu Supporter nét mực vàng",
      "Nạp tính năng mới sớm nhất (Early Access)",
      "Không phí duy trì định kỳ",
      "Ủng hộ đội ngũ phát triển độc lập",
    ],
  },
];

const go = (
  event: React.MouseEvent<HTMLAnchorElement>,
  onNavigate: (path: string) => void,
  path: string,
) => {
  event.preventDefault();
  onNavigate(path);
};

const BrandMark = () => (
  <div className="flex items-center gap-2 text-xs font-mono text-[#78716C]">
    <span className="inline-flex h-2.5 w-2.5 border-[1.5px] border-[#262626] bg-[#BBF7D0]" />
    <span>một góc làm việc vừa đủ</span>
  </div>
);

// Interactive Animated Product Board
const ProductBoard = () => {
  const [tasksState, setTasksState] = useState([
    { id: 1, text: "Chuẩn bị nội dung cho buổi họp", meta: "09:00 · Dự án Web", checked: true, bg: "bg-[#FEF08A]" },
    { id: 2, text: "Đọc và ghi chú chương tiếp theo", meta: "Hạn · 17:00 · Học tập", checked: false, bg: "bg-[#FBF9F4]" },
    { id: 3, text: "Một dòng cho nhật ký hôm nay", meta: "14:15 · đã lưu", checked: true, bg: "bg-[#BBF7D0]" },
  ]);

  const toggleDemoTask = (id: number) => {
    setTasksState((prev) =>
      prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t))
    );
  };

  return (
    <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto group/board transition-transform duration-300 hover:-translate-y-1">
      {/* Lớp nền đổ bóng nét mực phong cách Sketch */}
      <div className="absolute -right-3 -top-3 h-full w-full border-[1.5px] border-[#262626] bg-[#DDD6FE] transition-transform duration-300 group-hover/board:translate-x-1 group-hover/board:translate-y-1" />
      <div className="relative border-[1.5px] border-[#262626] bg-white p-4 shadow-[4px_4px_0px_#262626] sm:p-6 transition-all">
        <div className="mb-5 flex items-center justify-between border-b-[1.5px] border-[#262626] pb-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#78716C]">workspace / today</p>
            <h2 className="mt-1 text-xl font-black tracking-tight">Hôm nay</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="border-[1.5px] border-[#262626] bg-[#FEF08A] px-2 py-0.5 font-mono text-xs font-bold shadow-[1px_1px_0px_#262626]">
              Thứ Bảy, 05/09
            </span>
          </div>
        </div>

        {/* Demo Interactive Tasks with Hand Drawn Checkboxes */}
        <div className="space-y-3">
          {tasksState.map((task) => (
            <div
              key={task.id}
              onClick={() => toggleDemoTask(task.id)}
              className={`border-[1.5px] border-[#262626] p-3 transition-all duration-150 cursor-pointer shadow-[2px_2px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:brightness-95 ${task.bg}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center border-[1.5px] border-[#262626] bg-white transition-all ${
                    task.checked ? "bg-[#BBF7D0]" : ""
                  }`}
                >
                  {task.checked && <Check size={13} strokeWidth={3} />}
                </span>
                <div className="min-w-0">
                  <p className={`font-semibold leading-snug transition-all ${task.checked ? "line-through opacity-70" : ""}`}>
                    {task.text}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-[#57534E]">{task.meta}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t-[1.5px] border-[#D4CEBF] pt-3 font-mono text-[10px] text-[#78716C]">
          <span>Chạm vào thẻ để thử trải nghiệm</span>
          <span className="text-[#1C1917] font-bold">mở sổ & tiếp tục →</span>
        </div>
      </div>
    </div>
  );
};

const MarketingHeader: React.FC<LandingPageProps & { mobileOpen: boolean; onToggleMobile: () => void }> = ({
  route,
  onNavigate,
  mobileOpen,
  onToggleMobile,
}) => {
  const { user } = useAppStore();

  return (
    <header className="sticky top-0 z-40 border-b-[1.5px] border-[#262626] bg-[#FBF9F4] select-none shadow-[0px_1px_0px_#262626]">
      <div className="mx-auto flex min-h-[72px] w-full max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <a href="/" onClick={(event) => go(event, onNavigate, "/")} aria-label="SketchTask - Trang chủ">
          <BrandLogo size="lg" />
        </a>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => go(event, onNavigate, item.href)}
              aria-current={route === item.route ? "page" : undefined}
              className={`border-[1.5px] px-3 py-2 text-sm font-semibold transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                route === item.route
                  ? "border-[#262626] bg-[#FEF08A] shadow-[1.5px_1.5px_0px_#262626]"
                  : "border-transparent text-[#57534E] hover:border-[#D4CEBF] hover:bg-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2.5 sm:flex">
          {user.isSignedIn ? (
            <Button type="button" size="sm" onClick={() => onNavigate("/app")}>
              Vào Workspace của bạn <ArrowRight size={14} className="ml-1" />
            </Button>
          ) : (
            <>
              <a
                href="/login"
                onClick={(event) => go(event, onNavigate, "/login")}
                className="px-3 py-2 text-sm font-bold text-[#1C1917] hover:underline decoration-[#FEF08A] decoration-2 underline-offset-4"
              >
                Đăng nhập
              </a>
              <Button type="button" size="sm" onClick={() => onNavigate("/app")}>
                Dùng thử 7 ngày <ArrowRight size={14} className="ml-1" />
              </Button>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleMobile}
          aria-expanded={mobileOpen}
          aria-controls="marketing-mobile-nav"
          aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
          className="flex h-10 w-10 items-center justify-center border-[1.5px] border-[#262626] bg-white shadow-[1.5px_1.5px_0px_#262626] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none sm:hidden cursor-pointer"
        >
          {mobileOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      {mobileOpen && (
        <nav id="marketing-mobile-nav" className="border-t-[1.5px] border-[#262626] bg-white px-5 py-4 sm:hidden animate-in slide-in-from-top-2 duration-150" aria-label="Điều hướng mobile">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-1.5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => go(event, onNavigate, item.href)}
                className={`border-[1.5px] px-3.5 py-2.5 text-sm font-bold rounded-[4px] ${
                  route === item.route ? "border-[#262626] bg-[#FEF08A] shadow-[1px_1px_0px_#262626]" : "border-transparent text-[#57534E]"
                }`}
              >
                {item.label}
              </a>
            ))}
            {!user.isSignedIn && (
              <a
                href="/login"
                onClick={(event) => go(event, onNavigate, "/login")}
                className="border-[1.5px] border-[#D4CEBF] bg-[#FAF8F3] px-3.5 py-2.5 text-sm font-bold text-[#1C1917] rounded-[4px] text-center"
              >
                Đăng nhập tài khoản
              </a>
            )}
            <Button type="button" onClick={() => onNavigate("/app")} className="mt-2 w-full justify-center">
              {user.isSignedIn ? "Vào Workspace ngay" : "Bắt đầu 7 ngày miễn phí"}{" "}
              <ArrowRight size={14} className="ml-1" />
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
};

const PricingSection: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  return (
    <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 lg:px-10 animate-in fade-in duration-200">
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FEF08A] border-[1.5px] border-[#262626] rounded-full text-xs font-black shadow-[1.5px_1.5px_0px_#262626] mb-3">
          <Gift size={14} className="text-amber-800" />
          <span>7 NGÀY DÙNG THỬ MIỄN PHÍ · KHÔNG CẦN THẺ TÍN DỤNG</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black tracking-[-0.04em] text-[#1C1917]">
          Bảng giá đơn giản, minh bạch.
        </h2>
        <p className="mt-4 text-sm sm:text-base text-[#57534E] leading-relaxed">
          Trải nghiệm toàn bộ sức mạnh của SketchTask hoàn toàn miễn phí trong 7 ngày đầu. Chọn gói phù hợp với phong cách làm việc của bạn.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-stretch">
        {pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`relative flex flex-col justify-between border-[1.5px] border-[#262626] p-6 sm:p-7 rounded-[8px] transition-all duration-200 hover:-translate-y-1 ${
              plan.isPopular
                ? "bg-[#FFFDF8] shadow-[4px_4px_0px_#262626] ring-2 ring-[#262626]"
                : "bg-white shadow-[2px_2px_0px_#262626]"
            }`}
          >
            {/* Huy hiệu gói */}
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-[4px] ${plan.badgeBg}`}>
                {plan.badge}
              </span>
              {plan.isPopular && (
                <span className="text-xs font-bold text-amber-900 bg-[#FEF08A] px-2 py-0.5 rounded border border-[#262626]">
                  Khuyên Dùng ⭐
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black text-[#1C1917]">{plan.name}</h3>
              <p className="text-xs text-[#57534E] mt-1 min-h-[36px]">{plan.description}</p>

              {/* Khung Giá */}
              <div className="my-5 pb-5 border-b border-[#D4CEBF]">
                <span className="font-mono text-3xl sm:text-4xl font-black text-[#1C1917]">
                  {plan.price}
                </span>
                <span className="text-xs font-bold text-[#78716C] ml-1.5 font-mono">
                  {plan.period}
                </span>
              </div>

              {/* Danh sách tính năng */}
              <div className="space-y-2.5 mb-6 text-xs">
                {plan.features.map((feat) => (
                  <div key={feat} className="flex items-start gap-2 text-[#1C1917] font-medium">
                    <CheckCircle2 size={15} className="text-emerald-700 shrink-0 mt-0.5" strokeWidth={2.4} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút CTA */}
            <Button
              type="button"
              variant={plan.ctaVariant}
              onClick={() => onNavigate("/app")}
              className="w-full justify-center text-xs font-bold py-2.5 shadow-[1.5px_1.5px_0px_#262626]"
            >
              {plan.cta} <ArrowRight size={14} className="ml-1.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-12 p-4 sm:p-5 bg-[#FAF8F3] border-[1.5px] border-[#262626] rounded-[8px] text-center max-w-2xl mx-auto shadow-[1.5px_1.5px_0px_#262626]">
        <p className="text-xs font-bold text-[#1C1917]">
          🛡️ Bảo đảm hài lòng · Hủy gói bất cứ lúc nào
        </p>
        <p className="text-[11px] text-[#78716C] mt-1">
          Dữ liệu của bạn luôn được lưu trữ an toàn. Dù hết hạn gói, bạn vẫn có thể xem và xuất toàn bộ task & ghi chú của mình.
        </p>
      </div>
    </section>
  );
};

const HomePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <>
    <section className="relative overflow-hidden border-b-[1.5px] border-[#262626]">
      <div className="pointer-events-none absolute -left-16 top-14 h-40 w-40 border-[1.5px] border-[#262626] bg-[#FEF08A]/35 sm:h-56 sm:w-56 animate-pulse" />
      <div className="pointer-events-none absolute -right-16 bottom-10 h-36 w-36 rotate-6 border-[1.5px] border-[#262626] bg-[#BBF7D0]/40 sm:h-52 sm:w-52" />
      <div className="relative mx-auto grid max-w-[1280px] gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20 lg:px-10 lg:py-28">
        <div>
          <BrandMark />
          <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[4.75rem]">
            Làm việc rõ hơn,
            <span className="block text-[#57534E]">sống nhẹ đầu hơn.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#57534E] sm:text-lg">
            SketchTask gom task, lịch hẹn, ghi chú và nhật ký vào một workspace có trật tự, nhưng vẫn giữ cảm giác như trang giấy nét mực của riêng bạn.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" size="md" onClick={() => onNavigate("/app")}>
              Dùng thử 7 ngày miễn phí <ArrowRight size={16} className="ml-2" />
            </Button>
            <a
              href="/pricing"
              onClick={(event) => go(event, onNavigate, "/pricing")}
              className="inline-flex items-center justify-center px-3 py-2 text-sm font-bold text-[#57534E] underline decoration-[#FEF08A] decoration-2 underline-offset-4 hover:text-[#1C1917]"
            >
              Xem các gói dịch vụ <ChevronRight size={15} className="ml-1" />
            </a>
          </div>
          <p className="mt-5 font-mono text-[11px] text-[#78716C] flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-600" />
            <span>🎁 Tặng 7 ngày dùng thử full tính năng · Dữ liệu lưu an toàn trên máy</span>
          </p>
        </div>
        <ProductBoard />
      </div>
    </section>

    {/* Section Tính năng tóm tắt */}
    <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#78716C]">Không gian của bạn</p>
          <h2 className="mt-3 max-w-md text-3xl font-black tracking-[-0.035em] sm:text-4xl">
            Mọi thứ quan trọng, nhìn là hiểu.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featureCards.map(({ icon: Icon, title, text, accent }) => (
            <article key={title} className="border-[1.5px] border-[#262626] bg-white p-5 shadow-[2px_2px_0px_#262626] transition-transform duration-200 hover:-translate-y-1">
              <div className={`flex h-10 w-10 items-center justify-center border-[1.5px] border-[#262626] ${accent} shadow-[1px_1px_0px_#262626]`}>
                <Icon size={19} />
              </div>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#57534E]">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    {/* Section Bảng giá trực tiếp trên trang chủ */}
    <div className="border-t-[1.5px] border-[#262626] bg-[#FFFDF8]">
      <PricingSection onNavigate={onNavigate} />
    </div>
  </>
);

const FeaturesPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <>
    <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 lg:px-10 animate-in fade-in">
      <BrandMark />
      <div className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
        <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl">
          Một hệ thống nhỏ, đủ để ngày của bạn bớt rối.
        </h1>
        <p className="max-w-xl text-base leading-7 text-[#57534E] sm:text-lg">
          Không gom mọi thứ vào một màn hình. SketchTask chia đúng ngữ cảnh để bạn biết lúc nào nên làm, lúc nào nên ghi và lúc nào nên nhìn lại.
        </p>
      </div>
    </section>
    <section className="border-y-[1.5px] border-[#262626] bg-white">
      <div className="mx-auto grid max-w-[1280px] gap-px bg-[#262626] sm:grid-cols-2 lg:grid-cols-4">
        {featureCards.map(({ icon: Icon, title, text, accent }, index) => (
          <article key={title} className="bg-[#FBF9F4] p-6 sm:min-h-[280px] sm:p-8">
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center border-[1.5px] border-[#262626] ${accent} shadow-[1px_1px_0px_#262626]`}>
                <Icon size={21} />
              </div>
              <span className="font-mono text-xs text-[#78716C]">0{index + 1}</span>
            </div>
            <h2 className="mt-10 text-xl font-black">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#57534E]">{text}</p>
          </article>
        ))}
      </div>
    </section>
    <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
      <div className="grid gap-8 border-[1.5px] border-[#262626] bg-[#BBF7D0] p-6 shadow-[3px_3px_0px_#262626] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#57534E]">Ít hơn nhưng tốt hơn</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-0.035em]">
            Bắt đầu trải nghiệm ngay hôm nay với 7 ngày miễn phí.
          </h2>
        </div>
        <Button type="button" variant="secondary" onClick={() => onNavigate("/app")}>
          Bắt đầu ngay <ArrowRight size={15} className="ml-2" />
        </Button>
      </div>
    </section>
  </>
);

const HowItWorksPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const steps = [
    { number: "01", title: "Ghi lại", text: "Thêm task hoặc note ngay khi ý nghĩ xuất hiện. Chưa cần sắp xếp mọi thứ hoàn hảo." },
    { number: "02", title: "Đặt đúng chỗ", text: "Chọn ngày, lịch hẹn, hạn hoàn thành hoặc đưa việc chưa quyết định vào Hộp chờ." },
    { number: "03", title: "Làm và nhìn lại", text: "Hoàn thành từng việc, ghi lại điều đã làm và nhìn thấy tiến trình của chính mình." },
  ];
  return (
    <>
      <section className="mx-auto max-w-[1280px] px-5 py-16 sm:px-8 sm:py-24 lg:px-10 animate-in fade-in">
        <BrandMark />
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl">
          Bắt đầu đơn giản. Tiếp tục tự nhiên.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-[#57534E] sm:text-lg">
          SketchTask được xây quanh một vòng lặp ngắn: ghi lại điều cần nhớ, đặt nó vào đúng ngữ cảnh, rồi quay lại với một ngày nhẹ đầu hơn.
        </p>
      </section>
      <section className="border-y-[1.5px] border-[#262626] bg-[#F3EFE6]">
        <div className="mx-auto grid max-w-[1280px] gap-0 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className={`relative border-[#262626] p-6 sm:p-10 ${
                index < steps.length - 1 ? "border-b-[1.5px] lg:border-b-0 lg:border-r-[1.5px]" : ""
              }`}
            >
              <span className="font-mono text-sm text-[#78716C]">{step.number}</span>
              <h2 className="mt-12 text-3xl font-black">{step.title}</h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-[#57534E]">{step.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-[1280px] px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-10">
        <Sparkles size={25} className="mx-auto text-amber-600" />
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
          Bạn không cần một ngày hoàn hảo để bắt đầu.
        </h2>
        <Button type="button" className="mt-7" onClick={() => onNavigate("/app")}>
          Mở không gian làm việc (Free 7 ngày) <ArrowRight size={15} className="ml-2" />
        </Button>
      </section>
    </>
  );
};

const LandingFooter: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => (
  <footer className="border-t-[1.5px] border-[#262626] bg-[#F3EFE6] select-none">
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-end md:justify-between lg:px-10">
      <div>
        <BrandLogo size="md" />
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#57534E]">
          Một workspace nhỏ gọn cho những ngày có nhiều việc, nhiều ý tưởng và vẫn cần một khoảng thở.
        </p>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
        <button type="button" onClick={() => onNavigate("/app")} className="underline decoration-[#FEF08A] decoration-2 underline-offset-4 text-[#1C1917] font-bold">
          Vào ứng dụng (Free 7 ngày)
        </button>
        <button type="button" onClick={() => onNavigate("/pricing")} className="underline decoration-[#FEF08A] decoration-2 underline-offset-4">
          Bảng giá & Gói
        </button>
        <button type="button" onClick={() => onNavigate("/features")} className="underline decoration-[#FEF08A] decoration-2 underline-offset-4">
          Tính năng
        </button>
        <button type="button" onClick={() => onNavigate("/how-it-works")} className="underline decoration-[#FEF08A] decoration-2 underline-offset-4">
          Cách hoạt động
        </button>
        <button type="button" onClick={() => onNavigate("/login")} className="underline decoration-[#FEF08A] decoration-2 underline-offset-4">
          Đăng nhập
        </button>
      </div>
    </div>
  </footer>
);

export const LandingPage: React.FC<LandingPageProps> = ({ route, onNavigate }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const meta = routeMeta[route];
  const navigate = (path: string) => {
    setMobileOpen(false);
    onNavigate(path);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF9F4] font-sans text-[#1C1917] selection:bg-[#FEF08A] selection:text-[#1C1917]">
      <SeoHead title={meta.title} description={meta.description} path={route === "home" ? "/" : `/${route}`} />
      <MarketingHeader
        route={route}
        onNavigate={navigate}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((open) => !open)}
      />
      <main>
        {route === "home" && <HomePage onNavigate={navigate} />}
        {route === "features" && <FeaturesPage onNavigate={navigate} />}
        {route === "how-it-works" && <HowItWorksPage onNavigate={navigate} />}
        {route === "pricing" && <PricingSection onNavigate={navigate} />}
      </main>
      <LandingFooter onNavigate={navigate} />
    </div>
  );
};
