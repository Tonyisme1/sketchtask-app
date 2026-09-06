import { useEffect } from "react";

// ==========================================
// HOOK: useScrollLock (Khóa Cuộn Nền Toàn Diện Chống Giật Layout)
// Hỗ trợ cả Desktop (bù scrollbar width) và Mobile (position fixed + scrollY).
// Hỗ trợ modal lồng nhau qua lockCount.
// ==========================================

let lockCount = 0;
let savedScrollY = 0;
let originalOverflow = "";
let originalPaddingRight = "";
let originalPosition = "";
let originalTop = "";
let originalWidth = "";

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    if (lockCount === 0) {
      // Lưu lại vị trí scroll hiện tại và style ban đầu
      savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;
      originalPosition = document.body.style.position;
      originalTop = document.body.style.top;
      originalWidth = document.body.style.width;

      // Tính bề rộng scrollbar trên desktop để bù padding chống giật layout
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      // Khóa scroll body
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = "100%";
    }

    lockCount++;

    return () => {
      lockCount--;
      if (lockCount <= 0) {
        lockCount = 0;
        const scrollYToRestore = savedScrollY;

        document.body.style.overflow = originalOverflow || "";
        document.body.style.paddingRight = originalPaddingRight || "";
        document.body.style.position = originalPosition || "";
        document.body.style.top = originalTop || "";
        document.body.style.width = originalWidth || "";

        window.scrollTo(0, scrollYToRestore);
      }
    };
  }, [isLocked]);
}
