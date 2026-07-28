import { getResendClient, FROM_EMAIL } from "./client";
import { WelcomeEmail } from "./templates/welcome";
import { BudgetAlertEmail } from "./templates/budget-alert";
import { WeeklySummaryEmail } from "./templates/weekly-summary";

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendWelcomeEmail(
  to: string,
  userName: string,
  dashboardUrl: string
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to BudgetBuddy!",
      react: WelcomeEmail({ userName, dashboardUrl }),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function sendBudgetAlertEmail(
  to: string,
  data: {
    userName: string;
    categoryName: string;
    budgetAmount: number;
    spentAmount: number;
    percentageUsed: number;
    dashboardUrl: string;
  }
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const isOver = data.percentageUsed >= 100;
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${isOver ? "Budget Exceeded" : "Budget Alert"}: ${data.categoryName}`,
      react: BudgetAlertEmail(data),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function sendWeeklySummaryEmail(
  to: string,
  data: {
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
    dashboardUrl: string;
  }
): Promise<SendEmailResult> {
  try {
    const resend = getResendClient();
    const { data: result, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      // The app formats in GBP throughout; the subject line must match.
      subject: `Your weekly finance summary — £${data.totalSpent.toFixed(0)} spent`,
      react: WeeklySummaryEmail(data),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: result?.id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
