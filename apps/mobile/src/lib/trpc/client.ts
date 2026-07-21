import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@finance/api-router";
import type { inferRouterOutputs } from "@trpc/server";

export const trpc: ReturnType<typeof createTRPCReact<AppRouter>> =
  createTRPCReact<AppRouter>();

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Transaction = RouterOutputs["transactions"]["list"]["data"][number];

// Re-export types for convenience
export type {
  Budget503020,
  TrendData,
  CategoryData,
  MonthlyData,
} from "./types";
