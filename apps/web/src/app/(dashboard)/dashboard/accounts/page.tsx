"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Badge,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  formatCurrency,
} from "@finance/ui";
import { accountTypeLabel, creditUtilisation } from "@finance/analytics";
import { Plus, TrendingUp, TrendingDown, Wallet, Pencil } from "lucide-react";
import { trpc } from "@/trpc/client";

const ACCOUNT_TYPE_OPTIONS = [
  { value: "checking", label: "Current account" },
  { value: "savings", label: "Savings" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
  { value: "pension", label: "Pension" },
  { value: "property", label: "Property" },
  { value: "credit_card", label: "Credit card" },
  { value: "loan", label: "Loan" },
  { value: "mortgage", label: "Mortgage" },
] as const;

type AccountType = (typeof ACCOUNT_TYPE_OPTIONS)[number]["value"];

const LIABILITY_TYPES = new Set<AccountType>([
  "credit_card",
  "loan",
  "mortgage",
]);

function NetWorthChart({
  history,
}: {
  history: { date: string | Date; netWorth: number }[];
}) {
  if (history.length < 2) return null;

  const values = history.map((p) => p.netWorth);
  const max = Math.max(...values);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = history
    .map((point, index) => {
      const x = (index / (history.length - 1)) * 100;
      const y = 100 - ((point.netWorth - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-24 w-full"
      role="img"
      aria-label={`Net worth trend over the last ${history.length} months`}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="text-deep-sage"
      />
    </svg>
  );
}

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("checking");
  const [balance, setBalance] = useState("");
  const [institution, setInstitution] = useState("");

  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      void utils.accounts.invalidate();
      setName("");
      setBalance("");
      setInstitution("");
      onDone();
    },
  });

  const isLiability = LIABILITY_TYPES.has(type);
  const parsedBalance = Number.parseFloat(balance);
  const canSubmit = name.trim().length > 0 && Number.isFinite(parsedBalance);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add an account</CardTitle>
        <CardDescription>
          {isLiability
            ? "Enter what you owe as a positive number — it is subtracted from net worth."
            : "Enter the current balance. You can update it any time; each update is kept so the trend builds up."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Monzo current account"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as AccountType)}
            >
              <SelectTrigger id="account-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-balance">
              {isLiability ? "Amount owed" : "Current balance"}
            </Label>
            <Input
              id="account-balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(event) => setBalance(event.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="account-institution">Institution (optional)</Label>
            <Input
              id="account-institution"
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              placeholder="e.g. Monzo"
            />
          </div>
        </div>

        <Button
          disabled={!canSubmit || createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              name: name.trim(),
              type,
              currentBalance: parsedBalance,
              institutionName: institution.trim() || undefined,
            })
          }
        >
          {createMutation.isPending ? "Adding…" : "Add account"}
        </Button>
      </CardContent>
    </Card>
  );
}

function BalanceEditor({
  accountId,
  currentBalance,
  onClose,
}: {
  accountId: string;
  currentBalance: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const [value, setValue] = useState(String(currentBalance));

  const mutation = trpc.accounts.updateBalance.useMutation({
    onSuccess: () => {
      void utils.accounts.invalidate();
      onClose();
    },
  });

  const parsed = Number.parseFloat(value);

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        step="0.01"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 w-32"
        aria-label="New balance"
      />
      <Button
        size="sm"
        disabled={!Number.isFinite(parsed) || mutation.isPending}
        onClick={() => mutation.mutate({ id: accountId, balance: parsed })}
      >
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}

export default function AccountsPage() {
  const netWorthQuery = trpc.accounts.netWorth.useQuery({});
  const accountsQuery = trpc.accounts.list.useQuery();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const data = netWorthQuery.data;
  const isEmpty = !accountsQuery.isLoading && accountsQuery.data?.length === 0;
  const change = data?.change;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Everything you own and owe, in one place.
          </p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {showForm ? "Close" : "Add account"}
        </Button>
      </header>

      {showForm && <AddAccountForm onDone={() => setShowForm(false)} />}

      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Net worth</CardDescription>
          {netWorthQuery.isLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <div className="flex flex-wrap items-baseline gap-3">
              <CardTitle className="text-3xl">
                {formatCurrency(data?.netWorth ?? 0)}
              </CardTitle>
              {change && change.absolute !== 0 && (
                <span
                  className={`flex items-center gap-1 text-sm font-medium ${
                    change.absolute > 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {change.absolute > 0 ? (
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="h-4 w-4" aria-hidden="true" />
                  )}
                  {formatCurrency(Math.abs(change.absolute))}
                  {change.percent !== null &&
                    ` (${change.percent > 0 ? "+" : ""}${change.percent.toFixed(1)}%)`}
                </span>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>Assets {formatCurrency(data?.totalAssets ?? 0)}</span>
            <span>Owed {formatCurrency(data?.totalLiabilities ?? 0)}</span>
            {(data?.excludedCount ?? 0) > 0 && (
              <span>{data?.excludedCount} account(s) excluded</span>
            )}
          </div>

          {data?.history && data.hasHistory && (
            <div className="mt-4">
              <NetWorthChart history={data.history} />
            </div>
          )}
          {data && !data.hasHistory && !isEmpty && (
            <p className="text-muted-foreground mt-4 text-xs">
              The trend line appears once balances have been recorded over more
              than one month.
            </p>
          )}
        </CardContent>
      </Card>

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="bg-surface-sage text-deep-sage grid h-12 w-12 place-items-center rounded-[16px]">
              <Wallet className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">No accounts yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Add your current account, savings and any credit cards to see
                your net worth.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>Add your first</Button>
          </CardContent>
        </Card>
      )}

      {accountsQuery.isLoading && <Skeleton className="h-40 w-full" />}

      {(accountsQuery.data?.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Your accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {accountsQuery.data?.map((account) => {
              const utilisation = creditUtilisation({
                id: account.id,
                name: account.name,
                type: account.type,
                currentBalance: account.currentBalance,
                includeInNetWorth: account.includeInNetWorth,
                isActive: account.isActive,
                creditLimit: account.creditLimit,
              });

              return (
                <div
                  key={account.id}
                  className="hover:bg-muted/40 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors"
                >
                  <div className="min-w-[10rem] flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium">
                        {account.name}
                      </p>
                      <Badge variant="outline" className="text-[10px]">
                        {accountTypeLabel(account.type)}
                      </Badge>
                      {!account.includeInNetWorth && (
                        <Badge variant="secondary" className="text-[10px]">
                          Excluded
                        </Badge>
                      )}
                      {!account.isActive && (
                        <Badge variant="secondary" className="text-[10px]">
                          Closed
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {account.institutionName
                        ? `${account.institutionName} · `
                        : ""}
                      {account.transactionCount} transaction
                      {account.transactionCount === 1 ? "" : "s"}
                      {utilisation !== null &&
                        ` · ${utilisation.toFixed(0)}% of limit used`}
                    </p>
                  </div>

                  {editingId === account.id ? (
                    <BalanceEditor
                      accountId={account.id}
                      currentBalance={account.currentBalance}
                      onClose={() => setEditingId(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {LIABILITY_TYPES.has(account.type as AccountType)
                          ? `−${formatCurrency(account.currentBalance)}`
                          : formatCurrency(account.currentBalance)}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(account.id)}
                        aria-label={`Update balance for ${account.name}`}
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
