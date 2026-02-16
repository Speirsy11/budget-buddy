import { z } from "zod";
import type { ClassificationResult, TransactionInput } from "./types";
import { logger } from "@finance/logger";

const log = logger.child({ module: "ai-mock" });

/**
 * Check if mock functionality is enabled via environment variable
 */
export function isMockEnabled(): boolean {
  return process.env.MOCK_FUNCTIONALITY === "true";
}

/**
 * Mock response for askAI - returns a generic helpful response
 */
export async function mockAskAI(prompt: string): Promise<string> {
  log.debug({ promptLength: prompt.length }, "Mock askAI called");

  // Simulate a small delay like a real API call
  await delay(100);

  return "This is a mock AI response. Mock mode is enabled to save API costs during development. The actual AI would analyze your prompt and provide a contextual response.";
}

/**
 * Mock response for generateStructuredOutput
 * Attempts to return sensible mock data based on the schema
 */
export async function mockGenerateStructuredOutput<T extends z.ZodTypeAny>(
  prompt: string,
  schema: T
): Promise<z.infer<T>> {
  log.debug(
    { promptLength: prompt.length },
    "Mock generateStructuredOutput called"
  );

  await delay(100);

  // Try to infer what kind of response is expected from the prompt
  const promptLower = prompt.toLowerCase();

  // Check if this is a transaction classification request
  if (
    promptLower.includes("classify") &&
    (promptLower.includes("transaction") ||
      promptLower.includes("description:"))
  ) {
    // Check for batch classification FIRST (before single)
    if (promptLower.includes("classify all these transactions")) {
      const batchResult = generateMockBatchClassification(prompt);
      log.debug(
        {
          resultCount: (batchResult as { results: unknown[] }).results?.length,
        },
        "Mock batch classification generated"
      );
      const parsedBatch = schema.safeParse(batchResult);
      if (parsedBatch.success) {
        return parsedBatch.data;
      }
      log.warn(
        { error: parsedBatch.error.message },
        "Mock batch classification failed validation"
      );
    }

    // Single transaction classification
    const mockClassification = generateMockClassification(prompt);
    const result = schema.safeParse(mockClassification);
    if (result.success) {
      return result.data;
    }
    log.warn(
      { error: result.error.message },
      "Mock single classification failed validation"
    );
  }

  // Fallback: generate a generic mock based on schema shape
  log.debug("Falling back to generic mock schema generation");
  return generateMockFromSchema(schema);
}

/**
 * Mock stream that yields a simple message
 */
export function mockStreamText(_prompt: string) {
  log.debug("Mock streamText called");

  // Return an object that mimics the Vercel AI SDK stream response
  const mockText =
    "This is a mock streaming response. Mock mode is enabled to save API costs during development.";

  return {
    textStream: createMockTextStream(mockText),
    text: Promise.resolve(mockText),
    toDataStreamResponse: () => {
      return new Response(mockText, {
        headers: { "Content-Type": "text/plain" },
      });
    },
  };
}

/**
 * Mock transaction classification with intelligent category detection
 */
export async function mockClassifyTransaction(
  transaction: TransactionInput
): Promise<ClassificationResult> {
  log.debug(
    { description: transaction.description },
    "Mock classifyTransaction called"
  );

  await delay(100);

  const description = transaction.description.toLowerCase();
  const amount = transaction.amount;

  // Keyword-based classification for realistic mock responses
  const classification = detectCategory(description, amount);

  return {
    category: classification.category,
    necessityType: classification.necessityType,
    confidence: classification.confidence,
    reasoning: `Mock classification based on keywords in "${transaction.description}"`,
    suggestedMerchant: extractMerchant(transaction.description),
  };
}

// --- Helper Functions ---

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function* createMockTextStream(text: string): AsyncIterable<string> {
  // Yield the text in small chunks to simulate streaming
  const words = text.split(" ");
  for (const word of words) {
    await delay(20);
    yield word + " ";
  }
}

interface CategoryMatch {
  category: string;
  necessityType: "need" | "want" | "savings";
  confidence: number;
}

function detectCategory(description: string, amount: number): CategoryMatch {
  // Income detection
  if (amount > 0) {
    if (
      description.includes("salary") ||
      description.includes("payroll") ||
      description.includes("wages")
    ) {
      return { category: "Income", necessityType: "need", confidence: 0.95 };
    }
    if (description.includes("refund") || description.includes("return")) {
      return { category: "Income", necessityType: "need", confidence: 0.85 };
    }
    if (description.includes("dividend") || description.includes("interest")) {
      return {
        category: "Savings & Investments",
        necessityType: "savings",
        confidence: 0.9,
      };
    }
    return { category: "Income", necessityType: "need", confidence: 0.7 };
  }

  // Housing
  if (
    description.includes("rent") ||
    description.includes("mortgage") ||
    description.includes("landlord")
  ) {
    return { category: "Housing", necessityType: "need", confidence: 0.95 };
  }
  if (
    description.includes("electric") ||
    description.includes("gas bill") ||
    description.includes("water bill") ||
    description.includes("utility")
  ) {
    return { category: "Housing", necessityType: "need", confidence: 0.9 };
  }

  // Transportation
  if (
    description.includes("petrol") ||
    description.includes("fuel") ||
    description.includes("shell") ||
    description.includes("bp ") ||
    description.includes("esso")
  ) {
    return {
      category: "Transportation",
      necessityType: "need",
      confidence: 0.9,
    };
  }
  if (
    description.includes("uber") ||
    description.includes("lyft") ||
    description.includes("taxi") ||
    description.includes("cab")
  ) {
    return {
      category: "Transportation",
      necessityType: "want",
      confidence: 0.85,
    };
  }
  if (
    description.includes("train") ||
    description.includes("bus") ||
    description.includes("tfl") ||
    description.includes("metro")
  ) {
    return {
      category: "Transportation",
      necessityType: "need",
      confidence: 0.85,
    };
  }

  // Food & Groceries
  if (
    description.includes("tesco") ||
    description.includes("sainsbury") ||
    description.includes("asda") ||
    description.includes("morrisons") ||
    description.includes("lidl") ||
    description.includes("aldi") ||
    description.includes("waitrose") ||
    description.includes("grocery") ||
    description.includes("supermarket")
  ) {
    return {
      category: "Food & Groceries",
      necessityType: "need",
      confidence: 0.9,
    };
  }

  // Dining & Restaurants
  if (
    description.includes("restaurant") ||
    description.includes("cafe") ||
    description.includes("coffee") ||
    description.includes("starbucks") ||
    description.includes("costa") ||
    description.includes("pret") ||
    description.includes("mcdonalds") ||
    description.includes("kfc") ||
    description.includes("nandos") ||
    description.includes("pizza") ||
    description.includes("deliveroo") ||
    description.includes("uber eats") ||
    description.includes("just eat")
  ) {
    return {
      category: "Dining & Restaurants",
      necessityType: "want",
      confidence: 0.85,
    };
  }

  // Healthcare
  if (
    description.includes("pharmacy") ||
    description.includes("chemist") ||
    description.includes("boots") ||
    description.includes("doctor") ||
    description.includes("hospital") ||
    description.includes("dental") ||
    description.includes("medical") ||
    description.includes("nhs")
  ) {
    return { category: "Healthcare", necessityType: "need", confidence: 0.9 };
  }

  // Entertainment
  if (
    description.includes("netflix") ||
    description.includes("spotify") ||
    description.includes("disney") ||
    description.includes("amazon prime") ||
    description.includes("cinema") ||
    description.includes("theatre") ||
    description.includes("concert") ||
    description.includes("game") ||
    description.includes("playstation") ||
    description.includes("xbox") ||
    description.includes("steam")
  ) {
    return {
      category: "Entertainment",
      necessityType: "want",
      confidence: 0.9,
    };
  }

  // Shopping
  if (
    description.includes("amazon") ||
    description.includes("ebay") ||
    description.includes("john lewis") ||
    description.includes("marks spencer") ||
    description.includes("primark") ||
    description.includes("zara") ||
    description.includes("h&m") ||
    description.includes("clothing") ||
    description.includes("shoes")
  ) {
    return { category: "Shopping", necessityType: "want", confidence: 0.8 };
  }

  // Personal Care
  if (
    description.includes("gym") ||
    description.includes("fitness") ||
    description.includes("salon") ||
    description.includes("haircut") ||
    description.includes("spa") ||
    description.includes("beauty")
  ) {
    return {
      category: "Personal Care",
      necessityType: "want",
      confidence: 0.85,
    };
  }

  // Bills & Subscriptions
  if (
    description.includes("phone") ||
    description.includes("mobile") ||
    description.includes("vodafone") ||
    description.includes("ee ") ||
    description.includes("o2 ") ||
    description.includes("three") ||
    description.includes("broadband") ||
    description.includes("internet") ||
    description.includes("bt ") ||
    description.includes("sky") ||
    description.includes("virgin media") ||
    description.includes("subscription")
  ) {
    return {
      category: "Bills & Subscriptions",
      necessityType: "need",
      confidence: 0.85,
    };
  }

  // Savings & Investments
  if (
    description.includes("savings") ||
    description.includes("investment") ||
    description.includes("isa") ||
    description.includes("pension") ||
    description.includes("vanguard") ||
    description.includes("trading")
  ) {
    return {
      category: "Savings & Investments",
      necessityType: "savings",
      confidence: 0.9,
    };
  }

  // Fees & Interest
  if (
    description.includes("fee") ||
    description.includes("charge") ||
    description.includes("interest") ||
    description.includes("overdraft") ||
    description.includes("atm")
  ) {
    return {
      category: "Fees & Interest",
      necessityType: "need",
      confidence: 0.8,
    };
  }

  // Travel
  if (
    description.includes("flight") ||
    description.includes("airline") ||
    description.includes("hotel") ||
    description.includes("airbnb") ||
    description.includes("booking.com") ||
    description.includes("expedia") ||
    description.includes("holiday")
  ) {
    return { category: "Travel", necessityType: "want", confidence: 0.85 };
  }

  // Gifts & Donations
  if (
    description.includes("gift") ||
    description.includes("donation") ||
    description.includes("charity") ||
    description.includes("present")
  ) {
    return {
      category: "Gifts & Donations",
      necessityType: "want",
      confidence: 0.8,
    };
  }

  // Education
  if (
    description.includes("university") ||
    description.includes("college") ||
    description.includes("course") ||
    description.includes("tuition") ||
    description.includes("udemy") ||
    description.includes("coursera") ||
    description.includes("book")
  ) {
    return { category: "Education", necessityType: "want", confidence: 0.8 };
  }

  // Default fallback
  return { category: "Other", necessityType: "want", confidence: 0.5 };
}

function extractMerchant(description: string): string | undefined {
  // Common merchant patterns to extract
  const merchants = [
    "Tesco",
    "Sainsbury",
    "ASDA",
    "Morrisons",
    "Lidl",
    "Aldi",
    "Waitrose",
    "Amazon",
    "Netflix",
    "Spotify",
    "Uber",
    "Starbucks",
    "Costa",
    "McDonald's",
    "Shell",
    "BP",
    "TfL",
  ];

  const descLower = description.toLowerCase();
  for (const merchant of merchants) {
    if (descLower.includes(merchant.toLowerCase())) {
      return merchant;
    }
  }

  return undefined;
}

function generateMockClassification(prompt: string): object {
  // Extract transaction details from prompt
  const descMatch = prompt.match(/description:\s*"?([^"\n]+)"?/i);
  const amountMatch = prompt.match(/amount:\s*£?([\d.]+)/i);

  const description = descMatch?.[1] ?? "unknown transaction";
  const amount = amountMatch ? -parseFloat(amountMatch[1]) : -10;

  const classification = detectCategory(description.toLowerCase(), amount);

  return {
    category: classification.category,
    necessityType: classification.necessityType,
    confidence: classification.confidence,
    reasoning: `Mock classification for "${description}"`,
  };
}

function generateMockBatchClassification(prompt: string): object {
  // Extract numbered transactions from prompt
  const lines = prompt.split("\n");
  const results: Array<{
    index: number;
    category: string;
    necessityType: "need" | "want" | "savings";
    confidence: number;
  }> = [];

  for (const line of lines) {
    // Match patterns like: 0. Description: "TESCO GROCERIES", Amount: £45.50
    // or: 0. Description: TESCO GROCERIES, Amount: £45.50
    const match = line.match(/^(\d+)\.\s*description:\s*"?([^",]+)"?/i);
    if (match) {
      const index = parseInt(match[1], 10);
      const description = match[2].trim().toLowerCase();
      const classification = detectCategory(description, -10);

      results.push({
        index,
        category: classification.category,
        necessityType: classification.necessityType,
        confidence: classification.confidence,
      });
    }
  }

  // If no results were parsed, generate placeholder results
  // Count how many transactions based on numbered lines
  if (results.length === 0) {
    const countMatch = prompt.match(/(\d+)\.\s*description:/gi);
    const count = countMatch ? countMatch.length : 0;
    log.warn(
      { lineCount: lines.length, expectedCount: count },
      "Could not parse batch transactions, generating fallback"
    );

    for (let i = 0; i < count; i++) {
      results.push({
        index: i,
        category: "Other",
        necessityType: "want",
        confidence: 0.5,
      });
    }
  }

  return { results };
}

function generateMockFromSchema<T extends z.ZodTypeAny>(schema: T): z.infer<T> {
  // Basic mock generation for unknown schemas
  // This is a simple implementation that handles common types
  const def = schema._def as { typeName: string };

  if (def.typeName === "ZodObject") {
    // Use unknown intermediate cast for type safety
    const zodObj = schema as unknown as z.ZodObject<z.ZodRawShape>;
    const objShape = zodObj.shape;

    // Build object from entries to avoid object injection warnings
    const entries = Object.entries(objShape).map(([key, fieldSchema]) => [
      key,
      generateMockValue(fieldSchema as z.ZodTypeAny),
    ]);

    return Object.fromEntries(entries) as z.infer<T>;
  }

  // Fallback for non-object schemas
  return generateMockValue(schema) as z.infer<T>;
}

function generateMockValue(schema: z.ZodTypeAny): unknown {
  const def = schema._def;

  switch (def.typeName) {
    case "ZodString":
      return "mock_string";
    case "ZodNumber":
      return 0.75;
    case "ZodBoolean":
      return true;
    case "ZodEnum":
      return def.values[0];
    case "ZodArray":
      return [];
    case "ZodOptional":
      return undefined;
    case "ZodObject":
      return generateMockFromSchema(schema);
    default:
      return null;
  }
}
