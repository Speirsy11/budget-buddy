import { describe, it, expect, afterEach } from "vitest";
import { z } from "zod";
import {
  isMockEnabled,
  mockClassifyTransaction,
  mockGenerateStructuredOutput,
} from "./mock";

const SingleSchema = z.object({
  category: z.string(),
  necessityType: z.enum(["need", "want", "savings"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

const BatchSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      category: z.string(),
      necessityType: z.enum(["need", "want", "savings"]),
      confidence: z.number().min(0).max(1),
    })
  ),
});

describe("isMockEnabled", () => {
  const original = process.env.MOCK_FUNCTIONALITY;
  afterEach(() => {
    if (original === undefined) delete process.env.MOCK_FUNCTIONALITY;
    else process.env.MOCK_FUNCTIONALITY = original;
  });

  it("is true only when MOCK_FUNCTIONALITY === 'true'", () => {
    process.env.MOCK_FUNCTIONALITY = "true";
    expect(isMockEnabled()).toBe(true);

    process.env.MOCK_FUNCTIONALITY = "false";
    expect(isMockEnabled()).toBe(false);

    delete process.env.MOCK_FUNCTIONALITY;
    expect(isMockEnabled()).toBe(false);
  });
});

describe("mockClassifyTransaction", () => {
  it("classifies a grocery merchant as a need", async () => {
    const result = await mockClassifyTransaction({
      description: "TESCO STORES 1234",
      amount: -52.3,
    });

    expect(result.category).toBe("Food & Groceries");
    expect(result.necessityType).toBe("need");
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.suggestedMerchant).toBe("Tesco");
  });

  it("classifies streaming services as an entertainment want", async () => {
    const result = await mockClassifyTransaction({
      description: "SPOTIFY PREMIUM",
      amount: -9.99,
    });

    expect(result.category).toBe("Entertainment");
    expect(result.necessityType).toBe("want");
  });

  it("classifies positive salary amounts as income", async () => {
    const result = await mockClassifyTransaction({
      description: "ACME LTD SALARY",
      amount: 2750,
    });

    expect(result.category).toBe("Income");
    expect(result.necessityType).toBe("need");
  });

  it("classifies savings transfers as savings", async () => {
    const result = await mockClassifyTransaction({
      description: "TRANSFER TO ISA",
      amount: -200,
    });

    expect(result.category).toBe("Savings & Investments");
    expect(result.necessityType).toBe("savings");
  });

  it("falls back to Other for unrecognised descriptions", async () => {
    const result = await mockClassifyTransaction({
      description: "ZZQX UNKNOWN VENDOR",
      amount: -13.37,
    });

    expect(result.category).toBe("Other");
    expect(result.confidence).toBe(0.5);
  });
});

describe("mockGenerateStructuredOutput", () => {
  it("returns a schema-valid single classification for a classify prompt", async () => {
    const prompt =
      'Classify this transaction.\nDescription: "SHELL PETROL", Amount: £60.00';
    const result = await mockGenerateStructuredOutput(prompt, SingleSchema);

    expect(SingleSchema.safeParse(result).success).toBe(true);
    expect(result.category).toBe("Transportation");
  });

  it("returns one result per transaction for a batch classify prompt", async () => {
    const prompt = `Classify all these transactions:
0. Description: "TESCO", Amount: £45.50 (expense)
1. Description: "NETFLIX", Amount: £9.99 (expense)
2. Description: "SHELL", Amount: £60.00 (expense)`;

    const result = await mockGenerateStructuredOutput(prompt, BatchSchema);

    expect(BatchSchema.safeParse(result).success).toBe(true);
    expect(result.results).toHaveLength(3);
    expect(result.results.map((r) => r.index)).toEqual([0, 1, 2]);
    expect(result.results[0].category).toBe("Food & Groceries");
  });

  it("generates a generic schema-shaped object for unknown prompts", async () => {
    const GenericSchema = z.object({
      title: z.string(),
      score: z.number(),
      enabled: z.boolean(),
    });

    const result = await mockGenerateStructuredOutput(
      "Summarise this report",
      GenericSchema
    );

    expect(GenericSchema.safeParse(result).success).toBe(true);
  });
});
