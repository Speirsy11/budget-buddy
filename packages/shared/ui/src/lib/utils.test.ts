import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyWhole, formatDate } from "./utils";

describe("formatCurrency", () => {
  it("formats amounts as GBP with pence", () => {
    expect(formatCurrency(1500)).toBe("£1,500.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-250.4)).toBe("-£250.40");
  });
});

describe("formatDate", () => {
  it("formats dates day-first for the UK", () => {
    expect(formatDate(new Date(2026, 0, 2))).toBe("2 Jan 2026");
  });
});

describe("formatCurrencyWhole", () => {
  it("formats amounts as GBP without pence", () => {
    expect(formatCurrencyWhole(1500)).toBe("£1,500");
  });

  it("rounds to the nearest pound", () => {
    expect(formatCurrencyWhole(2287.44)).toBe("£2,287");
  });
});
