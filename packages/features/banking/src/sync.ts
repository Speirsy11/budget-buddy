import { getPlaidClient } from "./plaid-client";
import { mapPlaidTransaction, mapPlaidCategory } from "./mappers";
import { db, bankConnections, transactions, eq, and } from "@finance/db";
import { logger, createTimer } from "@finance/logger";
import type {
  RemovedTransaction,
  Transaction as PlaidTransaction,
} from "plaid";

const log = logger.child({ module: "banking-sync" });

export interface SyncResult {
  added: number;
  modified: number;
  removed: number;
  cursor: string;
}

/**
 * Sync transactions for a bank connection using Plaid's /transactions/sync endpoint.
 * Uses cursor-based pagination for incremental updates.
 */
export async function syncTransactions(
  connectionId: string,
  userId: string
): Promise<SyncResult> {
  const timer = createTimer();
  const plaid = getPlaidClient();

  const connection = await db.query.bankConnections.findFirst({
    where: and(
      eq(bankConnections.id, connectionId),
      eq(bankConnections.userId, userId)
    ),
  });

  if (!connection) {
    throw new Error("Bank connection not found");
  }

  log.info(
    {
      connectionId,
      userId,
      institution: connection.institutionName,
      hasCursor: !!connection.cursor,
    },
    "Starting transaction sync"
  );

  let cursor = connection.cursor ?? undefined;
  let hasMore = true;

  const allAdded: PlaidTransaction[] = [];
  const allModified: PlaidTransaction[] = [];
  const allRemoved: RemovedTransaction[] = [];

  // Paginate through all available updates
  while (hasMore) {
    const response = await plaid.transactionsSync({
      access_token: connection.plaidAccessToken,
      cursor,
      count: 500,
    });

    const data = response.data;
    allAdded.push(...data.added);
    allModified.push(...data.modified);
    allRemoved.push(...data.removed);

    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  log.debug(
    {
      connectionId,
      added: allAdded.length,
      modified: allModified.length,
      removed: allRemoved.length,
    },
    "Plaid sync response received"
  );

  // Process added transactions
  if (allAdded.length > 0) {
    const newTransactions = allAdded.map((tx) => {
      const mapped = mapPlaidTransaction(tx, userId, connectionId);
      const plaidCategory = mapPlaidCategory(tx.personal_finance_category);

      if (plaidCategory) {
        return {
          ...mapped,
          aiClassified: plaidCategory.category,
          necessityScore:
            plaidCategory.necessityType === "need"
              ? 1
              : plaidCategory.necessityType === "savings"
                ? 0.5
                : 0,
        };
      }

      return mapped;
    });

    // Filter out transactions that already exist (by externalId)
    const externalIds = newTransactions
      .map((t) => t.externalId)
      .filter((id): id is string => id !== null && id !== undefined);

    const existing =
      externalIds.length > 0
        ? await db.query.transactions.findMany({
            where: and(
              eq(transactions.userId, userId)
              // Check for existing external IDs to avoid duplicates
            ),
            columns: { externalId: true },
          })
        : [];

    const existingIds = new Set(existing.map((t) => t.externalId));
    const toInsert = newTransactions.filter(
      (t) => t.externalId && !existingIds.has(t.externalId)
    );

    if (toInsert.length > 0) {
      await db.insert(transactions).values(toInsert);
    }

    log.debug(
      {
        connectionId,
        inserted: toInsert.length,
        skipped: newTransactions.length - toInsert.length,
      },
      "Added transactions processed"
    );
  }

  // Process modified transactions
  for (const tx of allModified) {
    const mapped = mapPlaidTransaction(tx, userId, connectionId);
    await db
      .update(transactions)
      .set({
        amount: mapped.amount,
        description: mapped.description,
        merchant: mapped.merchant,
        date: mapped.date,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(transactions.externalId, tx.transaction_id),
          eq(transactions.userId, userId)
        )
      );
  }

  // Process removed transactions
  for (const tx of allRemoved) {
    if (tx.transaction_id) {
      await db
        .delete(transactions)
        .where(
          and(
            eq(transactions.externalId, tx.transaction_id),
            eq(transactions.userId, userId)
          )
        );
    }
  }

  // Update the connection's cursor and last synced timestamp
  await db
    .update(bankConnections)
    .set({
      cursor: cursor ?? null,
      lastSyncedAt: new Date(),
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(bankConnections.id, connectionId));

  const result: SyncResult = {
    added: allAdded.length,
    modified: allModified.length,
    removed: allRemoved.length,
    cursor: cursor ?? "",
  };

  log.info(
    {
      connectionId,
      userId,
      ...result,
      durationMs: timer.elapsed(),
    },
    "Transaction sync completed"
  );

  return result;
}
