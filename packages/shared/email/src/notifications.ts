import { logger } from "@finance/logger";
import {
  sendWelcomeEmail,
  sendBudgetAlertEmail,
  sendWeeklySummaryEmail,
  type SendEmailResult,
} from "./send";

const log = logger.child({ module: "email" });

/**
 * Whether email can actually be sent.
 *
 * Every notification checks this first and returns a "skipped" result rather
 * than attempting a send that is guaranteed to fail. Running without a key is
 * a supported configuration — the app works, mail just does not leave — so it
 * should not fill logs with errors.
 */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface NotificationResult extends SendEmailResult {
  skipped?: boolean;
}

const SKIPPED: NotificationResult = {
  success: false,
  skipped: true,
  error: "RESEND_API_KEY not set",
};

function appUrl(path = "/dashboard"): string {
  const base = process.env.APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}${path}`;
}

/**
 * Wrap a send so a mail failure can never take down the operation that
 * triggered it. Nobody should fail to sign up because Resend is down.
 */
async function safeSend(
  kind: string,
  context: Record<string, unknown>,
  send: () => Promise<SendEmailResult>
): Promise<NotificationResult> {
  if (!isEmailConfigured()) {
    log.debug({ ...context, kind }, "email skipped: RESEND_API_KEY not set");
    return SKIPPED;
  }

  try {
    const result = await send();

    if (result.success) {
      log.info({ ...context, kind, messageId: result.messageId }, "email sent");
    } else {
      log.warn({ ...context, kind, error: result.error }, "email send failed");
    }

    return result;
  } catch (error) {
    log.error({ ...context, kind, err: error }, "email send threw");
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function notifyWelcome(params: {
  email: string;
  userName: string;
  userId: string;
}): Promise<NotificationResult> {
  return safeSend("welcome", { userId: params.userId }, () =>
    sendWelcomeEmail(params.email, params.userName, appUrl())
  );
}

export async function notifyBudgetAlert(params: {
  email: string;
  userName: string;
  userId: string;
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentageUsed: number;
}): Promise<NotificationResult> {
  return safeSend(
    "budget_alert",
    {
      userId: params.userId,
      categoryName: params.categoryName,
      percentageUsed: params.percentageUsed,
    },
    () =>
      sendBudgetAlertEmail(params.email, {
        userName: params.userName,
        categoryName: params.categoryName,
        budgetAmount: params.budgetAmount,
        spentAmount: params.spentAmount,
        percentageUsed: params.percentageUsed,
        dashboardUrl: appUrl("/dashboard/budget"),
      })
  );
}

export async function notifyWeeklySummary(params: {
  email: string;
  userId: string;
  userName: string;
  weekStartDate: string;
  weekEndDate: string;
  totalSpent: number;
  totalIncome: number;
  netSavings: number;
  topCategories: { name: string; amount: number; percentage: number }[];
  budgetStatus: {
    needs: { spent: number; budget: number };
    wants: { spent: number; budget: number };
    savings: { spent: number; budget: number };
  };
}): Promise<NotificationResult> {
  const { email, userId, ...data } = params;

  return safeSend("weekly_summary", { userId }, () =>
    sendWeeklySummaryEmail(email, { ...data, dashboardUrl: appUrl() })
  );
}
