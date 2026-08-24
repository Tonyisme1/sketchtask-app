// ==========================================
// TILT HELPER (Có thể Bật / Tắt trong Cài Đặt)
// ==========================================

export const CARD_TILTS = [
  "-rotate-[0.5deg]",
  "rotate-0",
  "rotate-[0.5deg]",
] as const;

export const STICKY_TILTS = ["-rotate-1", "rotate-1"] as const;

export function getCardTilt(index: number): string {
  try {
    const saved = localStorage.getItem("sketchtask_local_storage_v1_tilt");
    if (saved !== null && JSON.parse(saved) === false) {
      return "rotate-0";
    }
  } catch {}
  return CARD_TILTS[Math.abs(index) % CARD_TILTS.length];
}
