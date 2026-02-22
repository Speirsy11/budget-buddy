"use node";

import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const CLASSIFICATION_PROMPT = `You are a financial transaction classifier. Analyze the transaction and classify it.

Categories available:
- Housing (rent, mortgage, utilities, home repairs)
- Transportation (gas, car payment, public transit, rideshare, parking)
- Food & Groceries (supermarket, grocery stores)
- Dining & Restaurants (restaurants, fast food, coffee shops, bars)
- Healthcare (medical, dental, pharmacy, health insurance)
- Entertainment (streaming, movies, games, concerts, sports)
- Shopping (clothing, electronics, general retail, Amazon)
- Personal Care (gym, salon, spa, wellness)
- Education (tuition, books, courses, training)
- Bills & Subscriptions (phone, internet, subscriptions)
- Income (salary, freelance, dividends, refunds)
- Savings & Investments (transfers to savings, investments, retirement)
- Fees & Interest (bank fees, interest charges, ATM fees)
- Travel (flights, hotels, vacation expenses)
- Gifts & Donations (charitable giving, gifts)
- Other

Necessity types:
- need: Essential for survival or required obligations (housing, utilities, groceries, healthcare, minimum debt payments)
- want: Discretionary spending that improves quality of life (entertainment, dining out, shopping, subscriptions)
- savings: Money being set aside (savings transfers, investments, debt paydown beyond minimums)

Return a JSON object with: { "category": string, "necessityType": "need"|"want"|"savings", "confidence": number (0-1) }`;

const BATCH_PROMPT = `You are a financial transaction classifier. Classify ALL transactions below.

Categories: Housing, Transportation, Food & Groceries, Dining & Restaurants, Healthcare, Entertainment, Shopping, Personal Care, Education, Bills & Subscriptions, Income, Savings & Investments, Fees & Interest, Travel, Gifts & Donations, Other

Necessity types: need, want, savings

Return a JSON object with: { "results": [{ "index": number, "category": string, "necessityType": "need"|"want"|"savings", "confidence": number }] }`;

/**
 * Classify a single transaction using AI.
 */
export const classifyTransaction = action({
  args: {
    transactionId: v.id("transactions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Fetch the transaction
    const transactions = await ctx.runQuery(internal.transactions.getByIds, {
      ids: [args.transactionId],
    });

    const transaction = transactions[0];
    if (!transaction || transaction.userId !== identity.subject) {
      throw new Error("Transaction not found");
    }

    const isMock = process.env.MOCK_FUNCTIONALITY === "true";

    let classification: { category: string; necessityType: string; confidence: number };

    if (isMock) {
      classification = mockClassify(transaction.description, transaction.amount);
    } else {
      const prompt = `${CLASSIFICATION_PROMPT}

Transaction:
Description: ${transaction.description}
Amount: £${Math.abs(transaction.amount).toFixed(2)} ${transaction.amount < 0 ? "(expense)" : "(income/credit)"}
${transaction.merchant ? `Merchant: ${transaction.merchant}` : ""}`;

      const { generateText } = await import("ai");
      const { createOpenAI } = await import("@ai-sdk/openai");

      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.2,
      });

      try {
        classification = JSON.parse(result.text);
      } catch {
        classification = { category: "Other", necessityType: "want", confidence: 0.5 };
      }
    }

    // Apply the classification
    await ctx.runMutation(internal.transactions.applyClassifications, {
      classifications: [
        {
          transactionId: args.transactionId,
          category: classification.category,
          necessityType: classification.necessityType,
          confidence: classification.confidence,
        },
      ],
    });

    return classification;
  },
});

/**
 * Classify multiple transactions in batch using AI.
 */
export const classifyBatch = action({
  args: {
    transactionIds: v.array(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const transactions = await ctx.runQuery(internal.transactions.getByIds, {
      ids: args.transactionIds,
    });

    // Verify ownership
    const ownedTransactions = transactions.filter(
      (t) => t.userId === identity.subject
    );

    if (ownedTransactions.length === 0) return [];

    const isMock = process.env.MOCK_FUNCTIONALITY === "true";

    let classifications: Array<{
      index: number;
      category: string;
      necessityType: string;
      confidence: number;
    }>;

    if (isMock) {
      classifications = ownedTransactions.map((t, i) => ({
        index: i,
        ...mockClassify(t.description, t.amount),
      }));
    } else {
      const transactionList = ownedTransactions
        .map(
          (t, i) =>
            `${i}. Description: "${t.description}", Amount: £${Math.abs(t.amount).toFixed(2)} ${t.amount < 0 ? "(expense)" : "(income)"}`
        )
        .join("\n");

      const prompt = `${BATCH_PROMPT}

Classify all these transactions:
${transactionList}

Return results for each transaction by index.`;

      const { generateText } = await import("ai");
      const { createOpenAI } = await import("@ai-sdk/openai");

      const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        prompt,
        temperature: 0.2,
      });

      try {
        const parsed = JSON.parse(result.text);
        classifications = parsed.results;
      } catch {
        classifications = ownedTransactions.map((t, i) => ({
          index: i,
          category: "Other",
          necessityType: "want",
          confidence: 0.5,
        }));
      }
    }

    // Apply classifications
    const toApply = classifications.map((c) => ({
      transactionId: ownedTransactions[c.index]!._id,
      category: c.category,
      necessityType: c.necessityType,
      confidence: c.confidence,
    }));

    await ctx.runMutation(internal.transactions.applyClassifications, {
      classifications: toApply,
    });

    return classifications;
  },
});

/**
 * Mock classification for development/testing.
 */
function mockClassify(description: string, amount: number) {
  const desc = description.toLowerCase();

  if (amount > 0) {
    return { category: "Income", necessityType: "savings" as const, confidence: 0.9 };
  }

  const patterns: Array<{
    keywords: string[];
    category: string;
    necessityType: "need" | "want" | "savings";
  }> = [
    { keywords: ["rent", "mortgage", "housing"], category: "Housing", necessityType: "need" },
    { keywords: ["electric", "gas", "water", "utility"], category: "Housing", necessityType: "need" },
    { keywords: ["tesco", "sainsbury", "asda", "aldi", "lidl", "grocery", "supermarket"], category: "Food & Groceries", necessityType: "need" },
    { keywords: ["uber", "bus", "train", "fuel", "petrol", "parking"], category: "Transportation", necessityType: "need" },
    { keywords: ["restaurant", "mcdonald", "nando", "pizza", "deliveroo", "just eat"], category: "Dining & Restaurants", necessityType: "want" },
    { keywords: ["netflix", "spotify", "disney", "amazon prime", "cinema"], category: "Entertainment", necessityType: "want" },
    { keywords: ["amazon", "ebay", "asos", "zara", "primark"], category: "Shopping", necessityType: "want" },
    { keywords: ["gym", "salon", "barber", "spa"], category: "Personal Care", necessityType: "want" },
    { keywords: ["doctor", "pharmacy", "dental", "hospital", "nhs"], category: "Healthcare", necessityType: "need" },
    { keywords: ["phone", "broadband", "internet", "subscription"], category: "Bills & Subscriptions", necessityType: "need" },
    { keywords: ["savings", "investment", "isa", "pension"], category: "Savings & Investments", necessityType: "savings" },
    { keywords: ["fee", "interest", "charge", "atm"], category: "Fees & Interest", necessityType: "need" },
    { keywords: ["flight", "hotel", "airbnb", "booking"], category: "Travel", necessityType: "want" },
  ];

  for (const pattern of patterns) {
    if (pattern.keywords.some((kw) => desc.includes(kw))) {
      return {
        category: pattern.category,
        necessityType: pattern.necessityType,
        confidence: 0.85,
      };
    }
  }

  return { category: "Other", necessityType: "want" as const, confidence: 0.5 };
}
