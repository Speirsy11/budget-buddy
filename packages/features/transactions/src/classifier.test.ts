import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI package so the classifier logic is tested in isolation,
// without hitting OpenAI or relying on the mock-mode env flag.
vi.mock("@finance/ai", () => ({
  generateStructuredOutput: vi.fn(),
}));

import { generateStructuredOutput } from "@finance/ai";
import { classifyTransaction, classifyTransactionsBatch } from "./classifier";

const mockGenerate = vi.mocked(generateStructuredOutput);

beforeEach(() => {
  mockGenerate.mockReset();
});

describe("classifyTransaction", () => {
  it("returns the structured classification from the AI client", async () => {
    mockGenerate.mockResolvedValue({
      category: "Food & Groceries",
      necessityType: "need",
      confidence: 0.92,
      reasoning: "Supermarket purchase",
    });

    const result = await classifyTransaction({
      description: "TESCO STORES",
      amount: -45.5,
    });

    expect(result.category).toBe("Food & Groceries");
    expect(result.necessityType).toBe("need");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("includes the description and amount in the prompt sent to the model", async () => {
    mockGenerate.mockResolvedValue({
      category: "Other",
      necessityType: "want",
      confidence: 0.5,
    });

    await classifyTransaction({
      description: "MYSTERY CHARGE",
      amount: -12.34,
      merchant: "ACME",
    });

    const prompt = mockGenerate.mock.calls[0][0] as string;
    expect(prompt).toContain("MYSTERY CHARGE");
    expect(prompt).toContain("12.34");
    expect(prompt).toContain("ACME");
    expect(prompt).toContain("(expense)");
  });

  it("marks positive amounts as income/credit in the prompt", async () => {
    mockGenerate.mockResolvedValue({
      category: "Income",
      necessityType: "need",
      confidence: 0.9,
    });

    await classifyTransaction({ description: "SALARY", amount: 2500 });

    const prompt = mockGenerate.mock.calls[0][0] as string;
    expect(prompt).toContain("(income/credit)");
  });
});

describe("classifyTransactionsBatch", () => {
  it("returns an empty array without calling the AI for no transactions", async () => {
    const result = await classifyTransactionsBatch([]);

    expect(result).toEqual([]);
    expect(mockGenerate).not.toHaveBeenCalled();
  });

  it("classifies small batches (<= 3) individually", async () => {
    mockGenerate.mockResolvedValue({
      category: "Dining & Restaurants",
      necessityType: "want",
      confidence: 0.8,
    });

    const result = await classifyTransactionsBatch([
      { description: "NANDOS", amount: -20 },
      { description: "COSTA", amount: -4 },
    ]);

    expect(result).toHaveLength(2);
    // One call per transaction for small batches.
    expect(mockGenerate).toHaveBeenCalledTimes(2);
  });

  it("uses a single batched call for larger batches (> 3)", async () => {
    mockGenerate.mockResolvedValue({
      results: [
        {
          index: 0,
          category: "Food & Groceries",
          necessityType: "need",
          confidence: 0.9,
        },
        {
          index: 1,
          category: "Transportation",
          necessityType: "need",
          confidence: 0.85,
        },
        {
          index: 2,
          category: "Entertainment",
          necessityType: "want",
          confidence: 0.8,
        },
        {
          index: 3,
          category: "Shopping",
          necessityType: "want",
          confidence: 0.7,
        },
      ],
    });

    const txns = [
      { description: "TESCO", amount: -50 },
      { description: "SHELL", amount: -60 },
      { description: "NETFLIX", amount: -10 },
      { description: "AMAZON", amount: -30 },
    ];
    const result = await classifyTransactionsBatch(txns);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(4);
    expect(result[1].category).toBe("Transportation");
  });

  it("preserves original order even when the model returns results out of order", async () => {
    mockGenerate.mockResolvedValue({
      results: [
        {
          index: 3,
          category: "Shopping",
          necessityType: "want",
          confidence: 0.7,
        },
        {
          index: 0,
          category: "Food & Groceries",
          necessityType: "need",
          confidence: 0.9,
        },
        {
          index: 2,
          category: "Entertainment",
          necessityType: "want",
          confidence: 0.8,
        },
        {
          index: 1,
          category: "Transportation",
          necessityType: "need",
          confidence: 0.85,
        },
      ],
    });

    const result = await classifyTransactionsBatch([
      { description: "TESCO", amount: -50 },
      { description: "SHELL", amount: -60 },
      { description: "NETFLIX", amount: -10 },
      { description: "AMAZON", amount: -30 },
    ]);

    expect(result[0].category).toBe("Food & Groceries");
    expect(result[1].category).toBe("Transportation");
    expect(result[2].category).toBe("Entertainment");
    expect(result[3].category).toBe("Shopping");
  });

  it("falls back to a default classification when the model omits an index", async () => {
    mockGenerate.mockResolvedValue({
      results: [
        {
          index: 0,
          category: "Food & Groceries",
          necessityType: "need",
          confidence: 0.9,
        },
        // index 1 missing
        {
          index: 2,
          category: "Entertainment",
          necessityType: "want",
          confidence: 0.8,
        },
        {
          index: 3,
          category: "Shopping",
          necessityType: "want",
          confidence: 0.7,
        },
      ],
    });

    const result = await classifyTransactionsBatch([
      { description: "TESCO", amount: -50 },
      { description: "UNKNOWN", amount: -60 },
      { description: "NETFLIX", amount: -10 },
      { description: "AMAZON", amount: -30 },
    ]);

    expect(result).toHaveLength(4);
    expect(result[1]).toEqual({
      category: "Other",
      necessityType: "want",
      confidence: 0.5,
    });
  });
});
