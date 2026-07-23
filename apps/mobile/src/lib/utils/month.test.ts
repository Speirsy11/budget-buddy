import { describe, expect, it } from "vitest";
import { stepMonth } from "./month";

describe("stepMonth", () => {
  it("moves back one month within the same year", () => {
    expect(stepMonth({ month: 7, year: 2026 }, -1)).toEqual({
      month: 6,
      year: 2026,
    });
  });

  it("moves forward one month within the same year", () => {
    expect(stepMonth({ month: 7, year: 2026 }, 1)).toEqual({
      month: 8,
      year: 2026,
    });
  });

  it("rolls back from January into the previous December", () => {
    expect(stepMonth({ month: 1, year: 2026 }, -1)).toEqual({
      month: 12,
      year: 2025,
    });
  });

  it("rolls forward from December into the next January", () => {
    expect(stepMonth({ month: 12, year: 2026 }, 1)).toEqual({
      month: 1,
      year: 2027,
    });
  });
});
