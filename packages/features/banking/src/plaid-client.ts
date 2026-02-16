import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";
import { logger } from "@finance/logger";

const log = logger.child({ module: "plaid-client" });

function getPlaidEnv(): string {
  const env = process.env.PLAID_ENV || "sandbox";
  switch (env) {
    case "production":
      return PlaidEnvironments.production;
    case "development":
      return PlaidEnvironments.development;
    case "sandbox":
    default:
      return PlaidEnvironments.sandbox;
  }
}

let plaidClient: PlaidApi | null = null;

export function getPlaidClient(): PlaidApi {
  if (plaidClient) {
    return plaidClient;
  }

  const clientId = process.env.PLAID_CLIENT_ID;
  const secret = process.env.PLAID_SECRET;

  if (!clientId || !secret) {
    log.error("PLAID_CLIENT_ID and PLAID_SECRET must be set");
    throw new Error("Plaid credentials not configured");
  }

  const configuration = new Configuration({
    basePath: getPlaidEnv(),
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  });

  plaidClient = new PlaidApi(configuration);
  log.info(
    { env: process.env.PLAID_ENV || "sandbox" },
    "Plaid client initialised"
  );

  return plaidClient;
}
