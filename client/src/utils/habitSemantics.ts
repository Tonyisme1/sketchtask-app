/** Tính số ngày hoàn thành liên tiếp tính từ ngày hoàn thành gần nhất. */
export const calculateConsecutiveStreak = (completedDates: string[]): number => {
  const validDates = Array.from(
    new Set(
      (completedDates || [])
        .filter((date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim()))
        .map((date) => date.trim()),
    ),
  ).sort((a, b) => b.localeCompare(a));

  if (validDates.length === 0) return 0;

  let streak = 1;
  let previous = Date.parse(`${validDates[0]}T00:00:00Z`);

  for (const date of validDates.slice(1)) {
    const current = Date.parse(`${date}T00:00:00Z`);
    const difference = Math.round((previous - current) / (24 * 60 * 60 * 1000));
    if (difference !== 1) break;
    streak += 1;
    previous = current;
  }

  return streak;
};
