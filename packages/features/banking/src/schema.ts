import { z } from "zod";

export const createLinkTokenSchema = z.object({
  /** Optional redirect URI for iOS OAuth flows. Must be a registered Plaid redirect URI/universal link. */
  redirectUri: z.string().url().optional(),
  /** Android package name for mobile OAuth flows. Must be registered in the Plaid Dashboard. */
  androidPackageName: z.string().min(1).optional(),
});

export const exchangeTokenSchema = z.object({
  publicToken: z.string().min(1, "Public token is required"),
  institutionId: z.string().optional(),
  institutionName: z.string().optional(),
});

export const connectionIdSchema = z.object({
  connectionId: z.string().uuid("Invalid connection ID"),
});

export const syncTransactionsSchema = z.object({
  connectionId: z.string().uuid("Invalid connection ID"),
});
