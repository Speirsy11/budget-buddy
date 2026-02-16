"use client";

import { format } from "date-fns";
import { Button, Badge, cn } from "@finance/ui";
import {
  Building2,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

export interface BankConnectionData {
  id: string;
  institutionId: string | null;
  institutionName: string | null;
  accountIds: string[] | null;
  status: string;
  lastSyncedAt: Date | null;
  consentExpiresAt: Date | null;
  createdAt: Date;
}

export interface ConnectedAccountsProps {
  connections: BankConnectionData[];
  onSync: (connectionId: string) => void;
  onRemove: (connectionId: string) => void;
  onReauth: (connectionId: string) => void;
  isSyncing?: string | null;
  isRemoving?: string | null;
}

function getStatusBadge(status: string, consentExpiresAt: Date | null) {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const consentExpiringSoon =
    consentExpiresAt !== null && consentExpiresAt < sevenDaysFromNow;

  if (status === "error") {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Error
      </Badge>
    );
  }

  if (status === "requires_reauth" || consentExpiringSoon) {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-yellow-500 text-yellow-600"
      >
        <AlertTriangle className="h-3 w-3" />
        {consentExpiringSoon ? "Consent Expiring" : "Re-auth Required"}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
      <CheckCircle2 className="h-3 w-3" />
      Connected
    </Badge>
  );
}

export function ConnectedAccounts({
  connections,
  onSync,
  onRemove,
  onReauth,
  isSyncing,
  isRemoving,
}: ConnectedAccountsProps) {
  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Building2 className="text-muted-foreground mb-3 h-10 w-10" />
        <p className="text-muted-foreground text-sm">
          No bank accounts connected yet.
        </p>
        <p className="text-muted-foreground text-xs">
          Connect a UK bank account to automatically sync your transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((connection) => {
        const needsReauth =
          connection.status === "requires_reauth" ||
          connection.status === "error";

        return (
          <div
            key={connection.id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <Building2 className="text-primary h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {connection.institutionName ?? "Unknown Bank"}
                  </p>
                  {getStatusBadge(
                    connection.status,
                    connection.consentExpiresAt
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  {connection.accountIds
                    ? `${connection.accountIds.length} account${connection.accountIds.length === 1 ? "" : "s"}`
                    : "No accounts"}
                  {connection.lastSyncedAt &&
                    ` · Last synced ${format(connection.lastSyncedAt, "dd MMM yyyy HH:mm")}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {needsReauth ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReauth(connection.id)}
                >
                  <AlertTriangle className="h-3 w-3" />
                  Re-authenticate
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSync(connection.id)}
                  disabled={isSyncing === connection.id}
                >
                  <RefreshCw
                    className={cn(
                      "h-3 w-3",
                      isSyncing === connection.id && "animate-spin"
                    )}
                  />
                  Sync
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(connection.id)}
                disabled={isRemoving === connection.id}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
