import { generateText, generateObject, streamText as aiStreamText } from "ai";
import { z } from "zod";
import { getModel, type ModelId } from "./model-registry";
import {
  ClassificationResultSchema,
  type TransactionInput,
  type ClassificationResult,
} from "./types";
import {
  isMockEnabled,
  mockAskAI,
  mockGenerateStructuredOutput,
  mockStreamText,
  mockClassifyTransaction,
} from "./mock";

export async function askAI(
  prompt: string,
  options?: {
    model?: ModelId;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  if (isMockEnabled()) {
    return mockAskAI(prompt);
  }

  const model = getModel(options?.model);

  const result = await generateText({
    model,
    prompt,
    maxOutputTokens: options?.maxTokens ?? 1000,
    temperature: options?.temperature ?? 0.7,
  });

  return result.text;
}

export async function generateStructuredOutput<T extends z.ZodTypeAny>(
  prompt: string,
  schema: T,
  options?: {
    model?: ModelId;
    temperature?: number;
  }
): Promise<z.infer<T>> {
  if (isMockEnabled()) {
    return mockGenerateStructuredOutput(prompt, schema);
  }

  const model = getModel(options?.model);

  const result = await generateObject({
    model,
    prompt,
    schema,
    temperature: options?.temperature ?? 0.3,
  });

  return result.object;
}

export function streamText(
  prompt: string,
  options?: {
    model?: ModelId;
    maxTokens?: number;
    temperature?: number;
  }
) {
  if (isMockEnabled()) {
    return mockStreamText(prompt);
  }

  const model = getModel(options?.model);

  return aiStreamText({
    model,
    prompt,
    maxOutputTokens: options?.maxTokens ?? 2000,
    temperature: options?.temperature ?? 0.7,
  });
}

// Pre-built prompts for common finance tasks
export async function classifyTransaction(
  transaction: TransactionInput
): Promise<ClassificationResult> {
  if (isMockEnabled()) {
    return mockClassifyTransaction(transaction);
  }

  const prompt = `Analyze this financial transaction and classify it:

Transaction Details:
- Description: ${transaction.description}
- Amount: $${transaction.amount}
${transaction.merchant ? `- Merchant: ${transaction.merchant}` : ""}
${transaction.date ? `- Date: ${transaction.date}` : ""}

Classify this transaction into one of these categories:
- Housing (rent, mortgage, utilities)
- Transportation (gas, car payment, public transit)
- Food & Dining (groceries, restaurants)
- Healthcare (medical, dental, pharmacy)
- Entertainment (streaming, games, events)
- Shopping (clothing, electronics, general retail)
- Personal Care (gym, salon, wellness)
- Education (tuition, books, courses)
- Bills & Subscriptions (phone, internet, subscriptions)
- Income (salary, freelance, investments)
- Savings & Investments (transfers to savings, investments)
- Other

Also determine if this is a:
- need: Essential expense (housing, utilities, groceries, healthcare)
- want: Non-essential but quality of life (entertainment, dining out, shopping)
- savings: Money put aside for future (savings accounts, investments)

Provide your confidence level (0-1) and brief reasoning.`;

  return generateStructuredOutput(prompt, ClassificationResultSchema, {
    model: "gpt-4o-mini",
    temperature: 0.2,
  });
}
