import { router } from "@finance/api";
import { authRouter } from "@finance/auth/server";
import { transactionsRouter } from "@finance/transactions/server";
import { analyticsRouter } from "@finance/analytics/server";
import { bankingRouter } from "@finance/banking/server";

export const appRouter = router({
  auth: authRouter,
  transactions: transactionsRouter,
  analytics: analyticsRouter,
  banking: bankingRouter,
});

export type AppRouter = typeof appRouter;
