import type { Transaction as PlaidTransaction } from "plaid";
import type { NewTransaction } from "@finance/db";

/**
 * Map a Plaid transaction to the app's transaction format.
 *
 * Plaid amounts are positive for debits (money leaving the account)
 * and negative for credits (money entering the account).
 * Our app uses the opposite convention: positive = income, negative = expense.
 */
export function mapPlaidTransaction(
  plaidTx: PlaidTransaction,
  userId: string,
  bankConnectionId: string
): NewTransaction {
  // Invert amount: Plaid positive = debit (our negative), Plaid negative = credit (our positive)
  const amount = -plaidTx.amount;

  const merchant =
    plaidTx.merchant_name ?? plaidTx.counterparties?.[0]?.name ?? undefined;

  const description =
    plaidTx.name || plaidTx.original_description || "Unknown transaction";

  return {
    userId,
    amount,
    date: new Date(plaidTx.date),
    description,
    merchant: merchant ?? null,
    bankConnectionId,
    externalId: plaidTx.transaction_id,
    source: "open_banking",
  };
}

/**
 * Map Plaid's personal finance category to our AI category system.
 * Returns a rough mapping that can reduce the need for AI classification calls.
 */
export function mapPlaidCategory(
  plaidCategory: PlaidTransaction["personal_finance_category"]
): { category: string; necessityType: "need" | "want" | "savings" } | null {
  if (!plaidCategory) {
    return null;
  }

  const primary = plaidCategory.primary;

  const categoryMap: Record<
    string,
    { category: string; necessityType: "need" | "want" | "savings" }
  > = {
    INCOME: { category: "Income", necessityType: "savings" },
    TRANSFER_IN: { category: "Income", necessityType: "savings" },
    TRANSFER_OUT: {
      category: "Savings & Investments",
      necessityType: "savings",
    },
    LOAN_PAYMENTS: { category: "Bills & Subscriptions", necessityType: "need" },
    RENT_AND_UTILITIES: { category: "Housing", necessityType: "need" },
    TRANSPORTATION: { category: "Transportation", necessityType: "need" },
    FOOD_AND_DRINK: { category: "Food & Groceries", necessityType: "need" },
    MEDICAL: { category: "Healthcare", necessityType: "need" },
    GENERAL_MERCHANDISE: { category: "Shopping", necessityType: "want" },
    ENTERTAINMENT: { category: "Entertainment", necessityType: "want" },
    PERSONAL_CARE: { category: "Personal Care", necessityType: "want" },
    GENERAL_SERVICES: {
      category: "Bills & Subscriptions",
      necessityType: "need",
    },
    TRAVEL: { category: "Travel", necessityType: "want" },
    HOME_IMPROVEMENT: { category: "Housing", necessityType: "need" },
    GOVERNMENT_AND_NON_PROFIT: {
      category: "Gifts & Donations",
      necessityType: "want",
    },
    BANK_FEES: { category: "Fees & Interest", necessityType: "need" },
  };

  // eslint-disable-next-line security/detect-object-injection -- Safe: primary is from Plaid's typed enum response
  return categoryMap[primary] ?? null;
}
