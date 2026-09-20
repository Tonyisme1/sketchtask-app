// ==========================================
// UTILITY: tagColors (Bảng Màu Tag Đa Dạng Đẹp Mắt)
// ==========================================

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
}

export const TAG_COLOR_MAP: Record<string, TagStyle> = {
  "Công việc": { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0369A1] dark:text-sky-300", border: "border-none" },
  "Học tập": { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0369A1] dark:text-sky-300", border: "border-none" },
  "Dự án": { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0369A1] dark:text-sky-300", border: "border-none" },
  "Dự án Web": { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0369A1] dark:text-sky-300", border: "border-none" },
  "Kế hoạch": { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0369A1] dark:text-sky-300", border: "border-none" },
  "Sức khỏe": { bg: "bg-[#DCFCE7] dark:bg-emerald-950/40", text: "text-[#166534] dark:text-emerald-300", border: "border-none" },
  "Thói quen": { bg: "bg-[#DCFCE7] dark:bg-emerald-950/40", text: "text-[#166534] dark:text-emerald-300", border: "border-none" },
  "Hoàn thành": { bg: "bg-[#DCFCE7] dark:bg-emerald-950/40", text: "text-[#166534] dark:text-emerald-300", border: "border-none" },
  "Gấp": { bg: "bg-[#FEE2E2] dark:bg-rose-950/40", text: "text-[#991B1B] dark:text-rose-300", border: "border-none" },
  "Khẩn cấp": { bg: "bg-[#FEE2E2] dark:bg-rose-950/40", text: "text-[#991B1B] dark:text-rose-300", border: "border-none" },
  "Hạn chót": { bg: "bg-[#FEE2E2] dark:bg-rose-950/40", text: "text-[#991B1B] dark:text-rose-300", border: "border-none" },
  "Quan trọng": { bg: "bg-[#1C1917] dark:bg-white", text: "text-white dark:text-[#1C1917]", border: "border-none" },
  "Mục tiêu": { bg: "bg-[#1C1917] dark:bg-white", text: "text-white dark:text-[#1C1917]", border: "border-none" },
  "Cá nhân": { bg: "bg-white dark:bg-[#2C2C2E]", text: "text-[#1C1917] dark:text-[#F2F2F7]", border: "border-none" },
  "Ý tưởng": { bg: "bg-[#FAF8F3] dark:bg-[#2C2C2E]", text: "text-[#1C1917] dark:text-[#F2F2F7]", border: "border-none" },
  "Tài chính": { bg: "bg-[#FAF8F3] dark:bg-[#2C2C2E]", text: "text-[#1C1917] dark:text-[#F2F2F7]", border: "border-none" },
};

const PALETTE_FALLBACKS: TagStyle[] = [
  { bg: "bg-[#E0F2FE] dark:bg-sky-950/40", text: "text-[#0369A1] dark:text-sky-300", border: "border-none" }, // Xanh dương nhạt
  { bg: "bg-[#DCFCE7] dark:bg-emerald-950/40", text: "text-[#166534] dark:text-emerald-300", border: "border-none" }, // Xanh lá cây
  { bg: "bg-[#FEE2E2] dark:bg-rose-950/40", text: "text-[#991B1B] dark:text-rose-300", border: "border-none" }, // Đỏ
  { bg: "bg-[#1C1917] dark:bg-white", text: "text-white dark:text-[#1C1917]", border: "border-none" },     // Đen/Trắng
  { bg: "bg-black/[0.04] dark:bg-white/[0.06]", text: "text-[#1C1917] dark:text-[#F2F2F7]", border: "border-none" }, // Neutral
];

export const getTagStyle = (tag?: string): TagStyle => {
  if (!tag) return PALETTE_FALLBACKS[4];
  if (TAG_COLOR_MAP[tag]) return TAG_COLOR_MAP[tag];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_FALLBACKS.length;
  return PALETTE_FALLBACKS[index];
};
