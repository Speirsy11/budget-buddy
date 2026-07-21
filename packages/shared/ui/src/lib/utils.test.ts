import { describe, expect, it } from "vitest";
import { formatCurrency, formatCurrencyWhole } from "./utils";

describe("formatCurrency", () => {
  it("formats amounts as GBP with pence", () => {
    expect(formatCurrency(1500)).toBe("£1,500.00");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-250.4)).toBe("-£250.40");
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
