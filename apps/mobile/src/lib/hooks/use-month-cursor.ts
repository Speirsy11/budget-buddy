import { useMemo, useState } from "react";
import { stepMonth, type MonthCursor } from "@/lib/utils/month";

export function useMonthCursor(initial?: MonthCursor) {
  const [cursor, setCursor] = useState<MonthCursor>(() => {
    if (initial) return initial;
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear() };
  });

  const range = useMemo(
    () => ({
      startDate: new Date(cursor.year, cursor.month - 1, 1),
      endDate: new Date(cursor.year, cursor.month, 0, 23, 59, 59),
    }),
    [cursor]
  );

  return {
    ...cursor,
    range,
    goToPrevMonth: () => setCursor((c) => stepMonth(c, -1)),
    goToNextMonth: () => setCursor((c) => stepMonth(c, 1)),
  };
}
