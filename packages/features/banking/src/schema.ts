import { z } from "zod";

export const createLinkTokenSchema = z.object({
  /** Optional redirect URI for OAuth flows (required for UK banks) */
  redirectUri: z.string().url().optional(),
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
