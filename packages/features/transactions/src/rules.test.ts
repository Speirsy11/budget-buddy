import { describe, it, expect } from "vitest";
import {
  ruleMatches,
  findMatchingRule,
  applyRules,
  type MatchableRule,
} from "./rules";

function rule(overrides: Partial<MatchableRule> = {}): MatchableRule {
  return {
    id: "rule-1",
    pattern: "tesco",
    matchType: "contains",
    matchField: "any",
    categoryId: "cat-groceries",
    priority: 100,
    enabled: true,
    ...overrides,
  };
}

describe("ruleMatches", () => {
  it("matches a noisy bank description case-insensitively", () => {
    expect(
      ruleMatches(rule(), { description: "TESCO STORES 3294   LONDON GB" })
    ).toBe(true);
  });

  it("collapses repeated whitespace before comparing", () => {
    expect(
      ruleMatches(rule({ pattern: "uber eats" }), {
        description: "UBER    EATS   LONDON",
      })
    ).toBe(true);
  });

  it("does not match an unrelated description", () => {
    expect(ruleMatches(rule(), { description: "SAINSBURYS LOCAL" })).toBe(
      false
    );
  });

  it("ignores disabled rules", () => {
    expect(
      ruleMatches(rule({ enabled: false }), { description: "TESCO STORES" })
    ).toBe(false);
  });

  describe("matchField", () => {
    it("scopes to merchant when asked", () => {
      const merchantRule = rule({ matchField: "merchant" });
      expect(
        ruleMatches(merchantRule, {
          description: "TESCO STORES",
          merchant: "Shell",
        })
      ).toBe(false);
      expect(
        ruleMatches(merchantRule, {
          description: "CARD PAYMENT",
          merchant: "Tesco",
        })
      ).toBe(true);
    });

    it("does not match a merchant rule when merchant is absent", () => {
      expect(
        ruleMatches(rule({ matchField: "merchant" }), {
          description: "TESCO STORES",
        })
      ).toBe(false);
    });

    it("scopes to description when asked", () => {
      expect(
        ruleMatches(rule({ matchField: "description" }), {
          description: "CARD PAYMENT",
          merchant: "Tesco",
        })
      ).toBe(false);
    });
  });

  describe("matchType", () => {
    it("supports starts_with", () => {
      const r = rule({ matchType: "starts_with", pattern: "tesco" });
      expect(ruleMatches(r, { description: "TESCO STORES" })).toBe(true);
      expect(ruleMatches(r, { description: "PAYMENT TO TESCO" })).toBe(false);
    });

    it("supports equals", () => {
      const r = rule({ matchType: "equals", pattern: "rent" });
      expect(ruleMatches(r, { description: "Rent" })).toBe(true);
      expect(ruleMatches(r, { description: "Rent payment" })).toBe(false);
    });

    it("supports regex", () => {
      const r = rule({ matchType: "regex", pattern: "^tfl\\b" });
      expect(ruleMatches(r, { description: "TFL TRAVEL CHARGE" })).toBe(true);
      expect(ruleMatches(r, { description: "NETFLIX" })).toBe(false);
    });

    it("treats an invalid regex as a non-match rather than throwing", () => {
      const r = rule({ matchType: "regex", pattern: "([unclosed" });
      expect(() => ruleMatches(r, { description: "anything" })).not.toThrow();
      expect(ruleMatches(r, { description: "anything" })).toBe(false);
    });
  });

  it("ignores an empty pattern instead of matching everything", () => {
    expect(
      ruleMatches(rule({ pattern: "   " }), { description: "TESCO" })
    ).toBe(false);
  });
});

describe("findMatchingRule", () => {
  it("returns null when nothing matches", () => {
    expect(findMatchingRule([rule()], { description: "ALDI" })).toBeNull();
  });

  it("prefers the lower priority number", () => {
    const builtIn = rule({
      id: "built-in",
      priority: 10,
      categoryId: "cat-groceries",
    });
    const userRule = rule({
      id: "user",
      priority: 100,
      categoryId: "cat-other",
    });

    const match = findMatchingRule([userRule, builtIn], {
      description: "TESCO STORES",
    });
    expect(match?.categoryId).toBe("cat-groceries");
  });

  it("prefers the more specific pattern at equal priority", () => {
    const broad = rule({
      id: "broad",
      pattern: "amazon",
      categoryId: "cat-shopping",
    });
    const specific = rule({
      id: "specific",
      pattern: "amazon prime",
      categoryId: "cat-entertainment",
    });

    const match = findMatchingRule([broad, specific], {
      description: "AMAZON PRIME VIDEO",
    });
    expect(match?.categoryId).toBe("cat-entertainment");
  });

  it("is stable when priority and pattern length tie", () => {
    const a = rule({ id: "a", pattern: "shell", categoryId: "cat-transport" });
    const b = rule({ id: "b", pattern: "SHELL", categoryId: "cat-other" });

    const first = findMatchingRule([a, b], { description: "SHELL GARAGE" });
    const second = findMatchingRule([b, a], { description: "SHELL GARAGE" });
    expect(first?.rule.id).toBe(second?.rule.id);
  });
});

describe("applyRules", () => {
  const rules = [
    rule({ id: "groceries", pattern: "tesco", categoryId: "cat-groceries" }),
    rule({ id: "streaming", pattern: "netflix", categoryId: "cat-ent" }),
  ];

  it("splits a batch into matched and unmatched", () => {
    const result = applyRules(rules, [
      { description: "TESCO STORES 1234" },
      { description: "NETFLIX.COM" },
      { description: "SOME UNKNOWN MERCHANT" },
    ]);

    expect(result.matched).toHaveLength(2);
    expect(result.unmatched).toHaveLength(1);
    expect(result.unmatched[0]?.description).toBe("SOME UNKNOWN MERCHANT");
  });

  it("reports which rule claimed each transaction", () => {
    const result = applyRules(rules, [{ description: "TESCO EXPRESS" }]);
    expect(result.matched[0]?.ruleId).toBe("groceries");
    expect(result.matched[0]?.categoryId).toBe("cat-groceries");
  });

  it("sends everything to unmatched when all rules are disabled", () => {
    const disabled = rules.map((r) => ({ ...r, enabled: false }));
    const result = applyRules(disabled, [{ description: "TESCO STORES" }]);

    expect(result.matched).toHaveLength(0);
    expect(result.unmatched).toHaveLength(1);
  });

  it("handles an empty batch", () => {
    const result = applyRules(rules, []);
    expect(result.matched).toEqual([]);
    expect(result.unmatched).toEqual([]);
  });
});
