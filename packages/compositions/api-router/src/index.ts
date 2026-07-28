import { analyticsRouter, accountsRouter } from "@finance/analytics/server";
import { router } from "@finance/api";
import { authRouter } from "@finance/auth/server";
import { bankingRouter } from "@finance/banking/server";
import { paymentsRouter } from "@finance/payments/server";
import { transactionsRouter, rulesRouter } from "@finance/transactions/server";

export const appRouter = router({
  auth: authRouter,
  transactions: transactionsRouter,
  rules: rulesRouter,
  analytics: analyticsRouter,
  accounts: accountsRouter,
  banking: bankingRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
