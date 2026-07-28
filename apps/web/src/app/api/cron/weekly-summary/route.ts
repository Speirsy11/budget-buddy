import { db, transactions, eq, and, gte, lte } from "@finance/db";
import { notifyWeeklySummary, isEmailConfigured } from "@finance/email";
import { calculate503020 } from "@finance/analytics";
import { logger, createTimer } from "@finance/logger";

const log = logger.child({ module: "cron-weekly-summary" });

/**
 * Weekly spending summary, intended to be hit by an external scheduler.
 *
 * Authenticated with a shared secret rather than a user session: there is no
 * user in a cron request. Without CRON_SECRET set the route refuses every
 * request, so an unconfigured deployment cannot be triggered by anyone.
 */
function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    log.warn("weekly-summary: unauthorised request rejected");
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    log.info("weekly-summary: skipped, RESEND_API_KEY not set");
    return Response.json({ skipped: true, reason: "email not configured" });
  }

  const timer = createTimer();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  const allUsers = await db.query.users.findMany();
  let sent = 0;
  let skipped = 0;

  for (const user of allUsers) {
    const weekTransactions = await db.query.transactions.findMany({
      where: and(
        eq(transactions.userId, user.id),
        gte(transactions.date, weekStart),
        lte(transactions.date, now)
      ),
      with: { category: true },
    });

    // Nothing happened this week — a summary of nothing is just noise.
    if (weekTransactions.length === 0) {
      skipped += 1;
      continue;
    }

    const totalIncome = weekTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSpent = weekTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const spendByCategory = new Map<string, number>();
    for (const transaction of weekTransactions) {
      if (transaction.amount >= 0) continue;
      const name = transaction.category?.name ?? "Uncategorised";
      spendByCategory.set(
        name,
        (spendByCategory.get(name) ?? 0) + Math.abs(transaction.amount)
      );
    }

    const topCategories = [...spendByCategory.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
      }));

    const breakdown = calculate503020(totalIncome, weekTransactions);

    await notifyWeeklySummary({
      email: user.email,
      userId: user.id,
      userName: user.firstName ?? "there",
      weekStartDate: weekStart.toLocaleDateString("en-GB"),
      weekEndDate: now.toLocaleDateString("en-GB"),
      totalSpent,
      totalIncome,
      netSavings: totalIncome - totalSpent,
      topCategories,
      budgetStatus: {
        needs: {
          spent: breakdown.needs.actual,
          budget: breakdown.needs.target,
        },
        wants: {
          spent: breakdown.wants.actual,
          budget: breakdown.wants.target,
        },
        savings: {
          spent: breakdown.savings.actual,
          budget: breakdown.savings.target,
        },
      },
    });

    sent += 1;
  }

  log.info(
    { sent, skipped, durationMs: timer.elapsed() },
    "weekly-summary: completed"
  );

  return Response.json({ sent, skipped });
}
