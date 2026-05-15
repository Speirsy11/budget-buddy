import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend {
  if (resendClient) {
    return resendClient;
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY.");
  }

  resendClient = new Resend(resendApiKey);
  return resendClient;
}

export const resend = new Proxy({} as Resend, {
  get(_target, property, receiver) {
    return Reflect.get(getResendClient(), property, receiver);
  },
});

export const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@financeai.com";
