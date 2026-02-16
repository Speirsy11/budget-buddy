import {
  router,
  proProcedure,
  protectedProcedure,
  TRPCError,
  getTierConfig,
  type UserPlan,
} from "@finance/api";
import { db, bankConnections, eq, and } from "@finance/db";
import { logger, createTimer } from "@finance/logger";
import { CountryCode, Products } from "plaid";
import { getPlaidClient } from "./plaid-client";
import { syncTransactions } from "./sync";
import {
  createLinkTokenSchema,
  exchangeTokenSchema,
  connectionIdSchema,
  syncTransactionsSchema,
} from "./schema";

const log = logger.child({ module: "banking" });

export const bankingRouter = router({
  /**
   * Create a Plaid Link token for the frontend.
   * Pro-only: open banking requires a paid subscription.
   */
  createLinkToken: proProcedure
    .input(createLinkTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const timer = createTimer();
      log.info({ userId: ctx.userId }, "Creating Plaid link token");

      const plaid = getPlaidClient();

      const request = {
        user: { client_user_id: ctx.userId },
        client_name: "AI Finance",
        products: [Products.Transactions],
        country_codes: [CountryCode.Gb],
        language: "en",
        ...(input.redirectUri && { redirect_uri: input.redirectUri }),
        ...(process.env.PLAID_WEBHOOK_URL && {
          webhook: process.env.PLAID_WEBHOOK_URL,
        }),
      };

      const response = await plaid.linkTokenCreate(request);

      log.info(
        { userId: ctx.userId, durationMs: timer.elapsed() },
        "Plaid link token created"
      );

      return { linkToken: response.data.link_token };
    }),

  /**
   * Exchange a public token from Plaid Link for an access token.
   * Stores the bank connection in the database.
   */
  exchangeToken: proProcedure
    .input(exchangeTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const timer = createTimer();
      log.info(
        { userId: ctx.userId, institution: input.institutionName },
        "Exchanging Plaid public token"
      );

      // Check connection limit based on plan
      const tierConfig = getTierConfig(ctx.userPlan as UserPlan | undefined);
      const existingConnections = await db.query.bankConnections.findMany({
        where: eq(bankConnections.userId, ctx.userId),
      });

      if (existingConnections.length >= tierConfig.maxBankConnections) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You have reached the maximum of ${tierConfig.maxBankConnections} bank connections for your plan. Upgrade to connect more accounts.`,
        });
      }

      const plaid = getPlaidClient();
      const exchangeResponse = await plaid.itemPublicTokenExchange({
        public_token: input.publicToken,
      });

      const accessToken = exchangeResponse.data.access_token;
      const itemId = exchangeResponse.data.item_id;

      // Get account info
      const accountsResponse = await plaid.accountsGet({
        access_token: accessToken,
      });

      const accountIds = accountsResponse.data.accounts.map(
        (a) => a.account_id
      );

      // Calculate PSD2 consent expiry (90 days from now)
      const consentExpiry = new Date();
      consentExpiry.setDate(consentExpiry.getDate() + 90);

      const [connection] = await db
        .insert(bankConnections)
        .values({
          userId: ctx.userId,
          plaidItemId: itemId,
          plaidAccessToken: accessToken,
          institutionId: input.institutionId ?? null,
          institutionName: input.institutionName ?? null,
          accountIds,
          status: "active",
          consentExpiresAt: consentExpiry,
        })
        .returning();

      log.info(
        {
          userId: ctx.userId,
          connectionId: connection?.id,
          institution: input.institutionName,
          accountCount: accountIds.length,
          durationMs: timer.elapsed(),
        },
        "Bank connection created"
      );

      return {
        connectionId: connection?.id,
        institutionName: input.institutionName,
        accountCount: accountIds.length,
      };
    }),

  /**
   * List all bank connections for the current user.
   */
  listConnections: protectedProcedure.query(async ({ ctx }) => {
    log.debug({ userId: ctx.userId }, "Listing bank connections");

    const connections = await db.query.bankConnections.findMany({
      where: eq(bankConnections.userId, ctx.userId),
      columns: {
        id: true,
        institutionId: true,
        institutionName: true,
        accountIds: true,
        status: true,
        lastSyncedAt: true,
        consentExpiresAt: true,
        createdAt: true,
      },
    });

    return connections;
  }),

  /**
   * Get the status of a specific bank connection.
   */
  getConnectionStatus: protectedProcedure
    .input(connectionIdSchema)
    .query(async ({ ctx, input }) => {
      const connection = await db.query.bankConnections.findFirst({
        where: and(
          eq(bankConnections.id, input.connectionId),
          eq(bankConnections.userId, ctx.userId)
        ),
        columns: {
          id: true,
          institutionName: true,
          status: true,
          lastSyncedAt: true,
          consentExpiresAt: true,
          accountIds: true,
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank connection not found",
        });
      }

      // Check if consent is expiring soon (within 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      );
      const consentExpiringSoon =
        connection.consentExpiresAt !== null &&
        connection.consentExpiresAt < sevenDaysFromNow;

      return {
        ...connection,
        consentExpiringSoon,
      };
    }),

  /**
   * Remove a bank connection. Revokes access at Plaid and deletes the record.
   */
  removeConnection: proProcedure
    .input(connectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      log.info(
        { userId: ctx.userId, connectionId: input.connectionId },
        "Removing bank connection"
      );

      const connection = await db.query.bankConnections.findFirst({
        where: and(
          eq(bankConnections.id, input.connectionId),
          eq(bankConnections.userId, ctx.userId)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank connection not found",
        });
      }

      // Revoke access at Plaid
      try {
        const plaid = getPlaidClient();
        await plaid.itemRemove({
          access_token: connection.plaidAccessToken,
        });
      } catch (error) {
        log.warn(
          { connectionId: input.connectionId, err: error },
          "Failed to revoke Plaid item, proceeding with local deletion"
        );
      }

      // Delete the connection from our database
      await db
        .delete(bankConnections)
        .where(eq(bankConnections.id, input.connectionId));

      log.info(
        { userId: ctx.userId, connectionId: input.connectionId },
        "Bank connection removed"
      );

      return { success: true };
    }),

  /**
   * Sync transactions for a specific bank connection.
   */
  syncTransactions: proProcedure
    .input(syncTransactionsSchema)
    .mutation(async ({ ctx, input }) => {
      return syncTransactions(input.connectionId, ctx.userId);
    }),

  /**
   * Sync all active bank connections for the current user.
   */
  syncAll: proProcedure.mutation(async ({ ctx }) => {
    const timer = createTimer();
    log.info({ userId: ctx.userId }, "Syncing all bank connections");

    const connections = await db.query.bankConnections.findMany({
      where: and(
        eq(bankConnections.userId, ctx.userId),
        eq(bankConnections.status, "active")
      ),
    });

    const results = [];
    for (const connection of connections) {
      try {
        const result = await syncTransactions(connection.id, ctx.userId);
        results.push({
          connectionId: connection.id,
          institutionName: connection.institutionName,
          ...result,
        });
      } catch (error) {
        log.error(
          { connectionId: connection.id, err: error },
          "Failed to sync connection"
        );

        // Mark connection as errored
        await db
          .update(bankConnections)
          .set({ status: "error", updatedAt: new Date() })
          .where(eq(bankConnections.id, connection.id));

        results.push({
          connectionId: connection.id,
          institutionName: connection.institutionName,
          error: "Sync failed",
          added: 0,
          modified: 0,
          removed: 0,
        });
      }
    }

    log.info(
      {
        userId: ctx.userId,
        connectionCount: connections.length,
        durationMs: timer.elapsed(),
      },
      "All bank connections synced"
    );

    return { results };
  }),

  /**
   * Create a link token for re-authentication (update mode).
   * Used when PSD2 consent expires or Plaid reports ITEM_LOGIN_REQUIRED.
   */
  createUpdateLinkToken: proProcedure
    .input(connectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      log.info(
        { userId: ctx.userId, connectionId: input.connectionId },
        "Creating Plaid update link token"
      );

      const connection = await db.query.bankConnections.findFirst({
        where: and(
          eq(bankConnections.id, input.connectionId),
          eq(bankConnections.userId, ctx.userId)
        ),
      });

      if (!connection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank connection not found",
        });
      }

      const plaid = getPlaidClient();
      const response = await plaid.linkTokenCreate({
        user: { client_user_id: ctx.userId },
        client_name: "AI Finance",
        country_codes: [CountryCode.Gb],
        language: "en",
        access_token: connection.plaidAccessToken,
      });

      return { linkToken: response.data.link_token };
    }),
});
