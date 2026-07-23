"use client";

interface MonthPickerProps {
  month: number; // 1-12
  year: number;
  onPrev: () => void;
  onNext: () => void;
}

const monthShort = (m: number) =>
  [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ][m - 1];

export function MonthPicker({ month, year, onPrev, onNext }: MonthPickerProps) {
  const prevMonth = month === 1 ? 12 : month - 1;
  const nextMonth = month === 12 ? 1 : month + 1;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onPrev}
        className="shadow-btn bg-surface-white text-ink rounded-pill px-3 py-2 text-sm font-semibold transition hover:brightness-[0.97]"
        aria-label={`Previous month (${monthShort(prevMonth)})`}
      >
        ◀ {monthShort(prevMonth)}
      </button>
      <span className="bg-ink rounded-pill px-4 py-2 text-sm font-semibold text-white">
        {monthShort(month)} {year}
      </span>
      <button
        type="button"
        onClick={onNext}
        className="shadow-btn bg-surface-white text-ink rounded-pill px-3 py-2 text-sm font-semibold transition hover:brightness-[0.97]"
        aria-label={`Next month (${monthShort(nextMonth)})`}
      >
        {monthShort(nextMonth)} ▶
      </button>
    </div>
  );
}
