// Schema
export {
  createLinkTokenSchema,
  exchangeTokenSchema,
  connectionIdSchema,
  syncTransactionsSchema,
} from "./schema";

// Mappers (client-safe)
export { mapPlaidCategory } from "./mappers";

// Components
export { ConnectBank } from "./components/connect-bank";
export type {
  ConnectBankProps,
  PlaidLinkMetadata,
} from "./components/connect-bank";
export { ConnectedAccounts } from "./components/connected-accounts";
export type {
  BankConnectionData,
  ConnectedAccountsProps,
} from "./components/connected-accounts";
export { SyncStatus } from "./components/sync-status";
export type { SyncStatusProps } from "./components/sync-status";
