"use client";

import { useCallback, useEffect, useState } from "react";
import { ConnectBank, ConnectedAccounts, SyncStatus } from "@finance/banking";
import type { PlaidLinkMetadata } from "@finance/banking";
import { usePlaidLink } from "react-plaid-link";
import { trpc } from "@/trpc/client";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@finance/ui";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Lock,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type SyncState = {
  status: "idle" | "syncing" | "success" | "error";
  added?: number;
  modified?: number;
  removed?: number;
  error?: string;
};

function asErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function UpdateLinkLauncher({
  linkToken,
  onOpened,
  onSuccess,
  onExit,
}: {
  linkToken: string | null;
  onOpened: () => void;
  onSuccess: () => void;
  onExit: () => void;
}) {
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit,
  });

  useEffect(() => {
    if (linkToken && ready) {
      onOpened();
      open();
    }
  }, [linkToken, onOpened, open, ready]);

  return null;
}

export default function OpenBankingPage() {
  const utils = trpc.useUtils();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [updateLinkToken, setUpdateLinkToken] = useState<string | null>(null);
  const [reauthConnectionId, setReauthConnectionId] = useState<string | null>(
    null
  );
  const [syncState, setSyncState] = useState<SyncState>({ status: "idle" });
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(
    null
  );
  const [removingConnectionId, setRemovingConnectionId] = useState<
    string | null
  >(null);
  const [connectionToRemove, setConnectionToRemove] = useState<string | null>(
    null
  );

  const providerStatus = trpc.banking.getProviderStatus.useQuery();
  const connections = trpc.banking.listConnections.useQuery();

  const createLinkToken = trpc.banking.createLinkToken.useMutation({
    onSuccess: (data) => {
      setLinkToken(data.linkToken);
    },
  });

  const exchangeToken = trpc.banking.exchangeToken.useMutation({
    onSuccess: async (data) => {
      setLinkToken(null);
      await utils.banking.listConnections.invalidate();
      if (data.connectionId) {
        syncConnection(data.connectionId);
      }
    },
    onError: (error) => {
      setSyncState({
        status: "error",
        error: error.message,
      });
    },
  });

  const syncMutation = trpc.banking.syncTransactions.useMutation({
    onMutate: ({ connectionId }) => {
      setSyncingConnectionId(connectionId);
      setSyncState({ status: "syncing" });
    },
    onSuccess: async (result) => {
      setSyncState({
        status: "success",
        added: result.added,
        modified: result.modified,
        removed: result.removed,
      });
      setSyncingConnectionId(null);
      await Promise.all([
        utils.banking.listConnections.invalidate(),
        utils.transactions.list.invalidate(),
        utils.analytics.invalidate(),
      ]);
    },
    onError: (error) => {
      setSyncingConnectionId(null);
      setSyncState({ status: "error", error: error.message });
    },
  });

  const removeConnection = trpc.banking.removeConnection.useMutation({
    onMutate: ({ connectionId }) => {
      setRemovingConnectionId(connectionId);
    },
    onSuccess: async () => {
      setRemovingConnectionId(null);
      await utils.banking.listConnections.invalidate();
    },
    onError: (error) => {
      setRemovingConnectionId(null);
      setSyncState({ status: "error", error: error.message });
    },
  });

  const createUpdateLinkToken = trpc.banking.createUpdateLinkToken.useMutation({
    onSuccess: (data) => {
      setUpdateLinkToken(data.linkToken);
    },
    onError: (error) => {
      setReauthConnectionId(null);
      setSyncState({ status: "error", error: error.message });
    },
  });

  const syncConnection = useCallback(
    (connectionId: string) => {
      syncMutation.mutate({ connectionId });
    },
    [syncMutation]
  );

  const handleConnectSuccess = useCallback(
    (publicToken: string, metadata: PlaidLinkMetadata) => {
      exchangeToken.mutate({
        publicToken,
        institutionId: metadata.institution?.institution_id,
        institutionName: metadata.institution?.name,
      });
    },
    [exchangeToken]
  );

  const handleRemove = useCallback((connectionId: string) => {
    setConnectionToRemove(connectionId);
  }, []);

  const confirmRemove = useCallback(() => {
    if (!connectionToRemove) {
      return;
    }

    removeConnection.mutate({ connectionId: connectionToRemove });
    setConnectionToRemove(null);
  }, [connectionToRemove, removeConnection]);

  const handleReauth = useCallback(
    (connectionId: string) => {
      setReauthConnectionId(connectionId);
      createUpdateLinkToken.mutate({ connectionId });
    },
    [createUpdateLinkToken]
  );

  const openLink = () => {
    setSyncState({ status: "idle" });
    if (linkToken) {
      return;
    }
    createLinkToken.mutate({});
  };

  const configured = providerStatus.data?.configured ?? false;
  const openBankingEnabled = providerStatus.data?.openBankingEnabled ?? false;
  const connectionCount = connections.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              UK Open Banking via Plaid
            </Badge>
            {providerStatus.data?.environment && (
              <Badge variant="secondary">
                {providerStatus.data.environment}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Open Banking</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Connect a UK bank account, sync transactions securely, and keep CSV
            import as a privacy-first fallback.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => connections.refetch()}
          disabled={connections.isFetching}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${connections.isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Provider</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              {configured ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              {configured ? "Configured" : "Needs Plaid env"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Uses server-side Plaid credentials only. Secret values are never
            exposed to the browser.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plan access</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              {openBankingEnabled ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Lock className="h-5 w-5 text-amber-600" />
              )}
              {openBankingEnabled ? "Enabled" : "Pro required"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            Current plan: {providerStatus.data?.plan ?? "free"}. Limit:{" "}
            {providerStatus.data?.maxBankConnections ?? 0} connection
            {(providerStatus.data?.maxBankConnections ?? 0) === 1 ? "" : "s"}.
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Connected banks</CardDescription>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
              {connectionCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            PSD2 consent is tracked per connection and re-auth can be launched
            from this page.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connect a UK bank</CardTitle>
          <CardDescription>
            BudgetBuddy uses Plaid Link to collect consent. We store the Plaid
            access token server-side and import transactions into your existing
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!configured && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
              Add `PLAID_CLIENT_ID`, `PLAID_SECRET`, and `PLAID_ENV` to the web
              runtime environment before connecting real accounts.
            </div>
          )}
          {!openBankingEnabled && (
            <div className="rounded-lg border border-blue-500/30 bg-blue-50 p-4 text-sm text-blue-900 dark:bg-blue-950/20 dark:text-blue-200">
              Open Banking is Pro-gated in the API. Use a Pro/trial subscription
              in development to exercise the live connection flow.
            </div>
          )}
          {createLinkToken.error && (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">
              {createLinkToken.error.message}
            </div>
          )}
          {exchangeToken.error && (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">
              {exchangeToken.error.message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {linkToken ? (
              <ConnectBank
                linkToken={linkToken}
                onSuccess={handleConnectSuccess}
                onExit={() => setLinkToken(null)}
                isExchanging={exchangeToken.isPending}
              />
            ) : (
              <Button
                size="lg"
                className="gap-2"
                disabled={
                  !configured ||
                  !openBankingEnabled ||
                  createLinkToken.isPending ||
                  exchangeToken.isPending
                }
                onClick={openLink}
              >
                {createLinkToken.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Building2 className="h-4 w-4" />
                )}
                Prepare secure bank link
              </Button>
            )}
            <Button variant="outline" asChild>
              <a href="/dashboard/import" className="gap-2">
                Prefer CSV import
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <SyncStatus {...syncState} />

      <Card>
        <CardHeader>
          <CardTitle>Connected accounts</CardTitle>
          <CardDescription>
            Sync, re-authenticate, or remove connected institutions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {connections.isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading bank connections…
            </div>
          ) : connections.error ? (
            <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">
              {connections.error.message}
            </div>
          ) : (
            <ConnectedAccounts
              connections={connections.data ?? []}
              onSync={syncConnection}
              onRemove={handleRemove}
              onReauth={handleReauth}
              isSyncing={syncingConnectionId}
              isRemoving={removingConnectionId}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy and release notes</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-3 text-sm">
          <p>
            Open Banking is optional and additive. CSV import remains available
            for users who do not want persistent account access.
          </p>
          <Separator />
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Only Plaid item/access tokens are stored; public tokens are
              exchanged once.
            </li>
            <li>
              Connections can be removed from this page, which also attempts to
              revoke access with Plaid.
            </li>
            <li>
              UK PSD2 consent expiry is tracked and surfaced for
              re-authentication.
            </li>
          </ul>
        </CardContent>
      </Card>

      <UpdateLinkLauncher
        linkToken={updateLinkToken}
        onOpened={() => undefined}
        onSuccess={() => {
          setUpdateLinkToken(null);
          if (reauthConnectionId) {
            syncConnection(reauthConnectionId);
          }
          setReauthConnectionId(null);
        }}
        onExit={() => {
          setUpdateLinkToken(null);
          setReauthConnectionId(null);
        }}
      />

      {createUpdateLinkToken.error && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border p-4 text-sm">
          {asErrorMessage(
            createUpdateLinkToken.error,
            "Failed to start re-authentication."
          )}
        </div>
      )}

      <Dialog
        open={connectionToRemove !== null}
        onOpenChange={(open) => !open && setConnectionToRemove(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove bank connection?</DialogTitle>
            <DialogDescription>
              BudgetBuddy will attempt to revoke access with Plaid and remove
              the connection. Transactions already imported into your dashboard
              will stay in place.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConnectionToRemove(null)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
