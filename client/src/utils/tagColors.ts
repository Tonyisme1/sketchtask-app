// ==========================================
// UTILITY: tagColors (Bảng Màu Tag Đa Dạng Đẹp Mắt)
// ==========================================

export interface TagStyle {
  bg: string;
  text: string;
  border: string;
}

export const TAG_COLOR_MAP: Record<string, TagStyle> = {
  "Công việc": { bg: "bg-[#FEF08A]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Học tập": { bg: "bg-[#DDD6FE]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Ý tưởng": { bg: "bg-[#BBF7D0]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Tài chính": { bg: "bg-[#BAE6FD]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Cá nhân": { bg: "bg-[#FECDD3]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Dự án Web": { bg: "bg-[#FED7AA]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Sức khỏe": { bg: "bg-[#A7F3D0]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Mục tiêu": { bg: "bg-[#FDE047]", text: "text-[#1C1917]", border: "border-[#262626]" },
  "Quan trọng": { bg: "bg-[#FCA5A5]", text: "text-[#1C1917]", border: "border-[#262626]" },
};

const PALETTE_FALLBACKS: TagStyle[] = [
  { bg: "bg-[#FEF08A]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#DDD6FE]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#BBF7D0]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#BAE6FD]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#FECDD3]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#FED7AA]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#FBCFE8]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#D9F99D]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#C4B5FD]", text: "text-[#1C1917]", border: "border-[#262626]" },
  { bg: "bg-[#86EFAC]", text: "text-[#1C1917]", border: "border-[#262626]" },
];

export const getTagStyle = (tag?: string): TagStyle => {
  if (!tag) return PALETTE_FALLBACKS[0];
  if (TAG_COLOR_MAP[tag]) return TAG_COLOR_MAP[tag];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PALETTE_FALLBACKS.length;
  return PALETTE_FALLBACKS[index];
};

