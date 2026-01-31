import { createTRPCReact } from "@trpc/react-query";
import type { AnyRouter } from "@trpc/server";

// Create the tRPC React client with a generic AnyRouter type
// This is necessary because the mobile app doesn't have direct access to the server router types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TRPCClient = ReturnType<typeof createTRPCReact<AnyRouter>> &
  Record<string, any>;

export const trpc: TRPCClient = createTRPCReact<AnyRouter>() as TRPCClient;

// Re-export types for convenience
export type {
  Transaction,
  Budget503020,
  TrendData,
  CategoryData,
  MonthlyData,
} from "./types";
