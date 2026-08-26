import React from "react";

// ==========================================
// UTILS: Search Helper (Chuẩn Hóa Tiếng Việt & Highlight Từ Khóa)
// ==========================================

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
 * vd: "Tập thể dục" -> "tap the duc"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return "";
  let result = str.toLowerCase();
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  result = result.replace(/đ/g, "d");
  // Loại bỏ các ký tự dấu thanh kết hợp
  result = result.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  result = result.replace(/\u02C6|\u0306|\u031B/g, "");
  return result.trim();
}

/**
 * Kiểm tra xem văn bản nguồn có chứa tất cả các từ trong chuỗi tìm kiếm hay không
 * (Hỗ trợ tìm kiếm đa từ khóa không cần liền kề & không dấu)
 */
export function matchesQuery(sourceText: string, searchQuery: string): boolean {
  if (!searchQuery || !searchQuery.trim()) return true;
  if (!sourceText) return false;

  const normalizedSource = removeVietnameseTones(sourceText);
  const normalizedQuery = removeVietnameseTones(searchQuery);

  // Tách query thành các từ đơn (tokens)
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  // Mọi token phải xuất hiện trong source
  return tokens.every((token) => normalizedSource.includes(token));
}

/**
 * Component Highlight từ khóa tìm kiếm trong văn bản
 */
export interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  query,
  className = "",
}) => {
  if (!query || !query.trim() || !text) {
    return <span className={className}>{text}</span>;
  }

  const cleanQuery = query.trim();
  const normalizedText = removeVietnameseTones(text);
  const normalizedQuery = removeVietnameseTones(cleanQuery);

  // Nếu tìm thấy vị trí khớp không dấu
  const startIndex = normalizedText.indexOf(normalizedQuery);
  if (startIndex === -1) {
    return <span className={className}>{text}</span>;
  }

  const endIndex = startIndex + cleanQuery.length;
  const before = text.slice(0, startIndex);
  const match = text.slice(startIndex, endIndex);
  const after = text.slice(endIndex);

  return (
    <span className={className}>
      {before}
      <mark className="bg-[#FEF08A] text-[#1C1917] font-bold px-0.5 rounded-[2px] shadow-[0.5px_0.5px_0px_#262626]">
        {match}
      </mark>
      {after}
    </span>
  );
};

