import { generateStructuredOutput } from "@finance/ai";
import { z } from "zod";

export interface TransactionToClassify {
  description: string;
  amount: number;
  merchant?: string;
  date?: Date;
}

export interface ClassificationResult {
  category: string;
  necessityType: "need" | "want" | "savings";
  confidence: number;
  reasoning?: string;
}

const ClassificationSchema = z.object({
  category: z.string(),
  necessityType: z.enum(["need", "want", "savings"]),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
});

const BatchClassificationSchema = z.object({
  results: z.array(
    z.object({
      index: z.number(),
      category: z.string(),
      necessityType: z.enum(["need", "want", "savings"]),
      confidence: z.number().min(0).max(1),
    })
  ),
});

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

Transaction:`;

export async function classifyTransaction(
  transaction: TransactionToClassify
): Promise<ClassificationResult> {
  const prompt = `${CLASSIFICATION_PROMPT}
Description: ${transaction.description}
Amount: £${Math.abs(transaction.amount).toFixed(2)} ${transaction.amount < 0 ? "(expense)" : "(income/credit)"}
${transaction.merchant ? `Merchant: ${transaction.merchant}` : ""}
${transaction.date ? `Date: ${transaction.date.toISOString().split("T")[0]}` : ""}

Classify this transaction.`;

  const result = await generateStructuredOutput(prompt, ClassificationSchema, {
    model: "gpt-4o-mini",
    temperature: 0.2,
  });

  return result;
}

export async function classifyTransactionsBatch(
  transactions: TransactionToClassify[]
): Promise<ClassificationResult[]> {
  if (transactions.length === 0) return [];

  if (transactions.length <= 3) {
    return Promise.all(transactions.map(classifyTransaction));
  }

  const transactionList = transactions
    .map(
      (t, i) =>
        `${i}. Description: "${t.description}", Amount: £${Math.abs(t.amount).toFixed(2)} ${t.amount < 0 ? "(expense)" : "(income)"}`
    )
    .join("\n");

  const prompt = `${CLASSIFICATION_PROMPT}

Classify all these transactions:
${transactionList}

Return results for each transaction by index.`;

  const result = await generateStructuredOutput(
    prompt,
    BatchClassificationSchema,
    {
      model: "gpt-4o-mini",
      temperature: 0.2,
    }
  );

  // Map results back to original order
  const resultsMap = new Map(
    result.results.map((r) => [
      r.index,
      {
        category: r.category,
        necessityType: r.necessityType,
        confidence: r.confidence,
      },
    ])
  );

  return transactions.map((_, i) => {
    const classification = resultsMap.get(i);
    return (
      classification ?? {
        category: "Other",
        necessityType: "want" as const,
        confidence: 0.5,
      }
    );
  });
}
