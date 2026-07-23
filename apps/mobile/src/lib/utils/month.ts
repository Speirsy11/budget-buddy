export interface MonthCursor {
  month: number;
  year: number;
}

export function stepMonth(cursor: MonthCursor, direction: 1 | -1): MonthCursor {
  const zeroBased = cursor.month - 1 + direction;
  return {
    month: (((zeroBased % 12) + 12) % 12) + 1,
    year: cursor.year + Math.floor(zeroBased / 12),
  };
}
