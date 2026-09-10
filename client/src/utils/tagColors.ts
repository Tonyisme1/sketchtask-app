// ==========================================
// UTILITY: tagColors (Bảng Màu Tag Đa Dạng Đẹp Mắt)
// ==========================================

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
}

export const TAG_COLOR_MAP: Record<string, TagStyle> = {
  "Công việc": { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#0284C7]" },
  "Học tập": { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#0284C7]" },
  "Dự án": { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#0284C7]" },
  "Dự án Web": { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#0284C7]" },
  "Kế hoạch": { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#0284C7]" },
  "Sức khỏe": { bg: "bg-[#DCFCE7]", text: "text-[#166534]", border: "border-[#16A34A]" },
  "Thói quen": { bg: "bg-[#DCFCE7]", text: "text-[#166534]", border: "border-[#16A34A]" },
  "Hoàn thành": { bg: "bg-[#DCFCE7]", text: "text-[#166534]", border: "border-[#16A34A]" },
  "Gấp": { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#DC2626]" },
  "Khẩn cấp": { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#DC2626]" },
  "Hạn chót": { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#DC2626]" },
  "Quan trọng": { bg: "bg-[#1C1917]", text: "text-white", border: "border-[#1C1917]" },
  "Mục tiêu": { bg: "bg-[#1C1917]", text: "text-white", border: "border-[#1C1917]" },
  "Cá nhân": { bg: "bg-white", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Ý tưởng": { bg: "bg-[#FAF8F3]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Tài chính": { bg: "bg-[#FAF8F3]", text: "text-[#1C1917]", border: "border-[#262626]" },
};

const PALETTE_FALLBACKS: TagStyle[] = [
  { bg: "bg-[#E0F2FE]", text: "text-[#0369A1]", border: "border-[#0284C7]" }, // Xanh dương nhạt
  { bg: "bg-[#DCFCE7]", text: "text-[#166534]", border: "border-[#16A34A]" }, // Xanh lá cây
  { bg: "bg-[#FEE2E2]", text: "text-[#991B1B]", border: "border-[#DC2626]" }, // Đỏ
  { bg: "bg-[#1C1917]", text: "text-white", border: "border-[#1C1917]" },     // Đen
  { bg: "bg-[#FAF8F3]", text: "text-[#1C1917]", border: "border-[#262626]" }, // Trắng giấy
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

