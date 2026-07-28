"use client";

import { useMemo, useState } from "react";
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
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from "@finance/ui";
import { Plus, Trash2, Wand2, Zap, Search } from "lucide-react";
import { trpc } from "@/trpc/client";

type MatchType = "contains" | "starts_with" | "equals" | "regex";
type MatchField = "description" | "merchant" | "any";

const MATCH_TYPE_LABELS: Record<MatchType, string> = {
  contains: "Contains",
  starts_with: "Starts with",
  equals: "Equals",
  regex: "Regex",
};

const MATCH_FIELD_LABELS: Record<MatchField, string> = {
  any: "Description or merchant",
  description: "Description only",
  merchant: "Merchant only",
};

function NewRuleForm({ onCreated }: { onCreated: () => void }) {
  const categoriesQuery = trpc.transactions.categories.useQuery();
  const utils = trpc.useUtils();

  const [pattern, setPattern] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [matchType, setMatchType] = useState<MatchType>("contains");
  const [matchField, setMatchField] = useState<MatchField>("any");
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.rules.create.useMutation({
    onSuccess: () => {
      setPattern("");
      setCategoryId("");
      setError(null);
      void utils.rules.list.invalidate();
      onCreated();
    },
    onError: (mutationError) => setError(mutationError.message),
  });

  // Debounce-free preview: only fetch once the pattern looks intentional.
  const previewQuery = trpc.rules.preview.useQuery(
    { pattern, matchType, matchField },
    { enabled: pattern.trim().length >= 3, staleTime: 5_000 }
  );

  const categories = categoriesQuery.data ?? [];
  const canSubmit = pattern.trim().length > 0 && categoryId.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New rule
        </CardTitle>
        <CardDescription>
          Match text in a transaction and file it automatically. Rules run
          before the AI classifier, so they are instant and cost nothing.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="rule-pattern">Text to match</Label>
            <Input
              id="rule-pattern"
              value={pattern}
              onChange={(event) => setPattern(event.target.value)}
              placeholder="e.g. tesco"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-category">File as</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="rule-category">
                <SelectValue placeholder="Choose a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-match-type">Match type</Label>
            <Select
              value={matchType}
              onValueChange={(value) => setMatchType(value as MatchType)}
            >
              <SelectTrigger id="rule-match-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATCH_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rule-match-field">Look at</Label>
            <Select
              value={matchField}
              onValueChange={(value) => setMatchField(value as MatchField)}
            >
              <SelectTrigger id="rule-match-field">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MATCH_FIELD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {pattern.trim().length >= 3 && (
          <div
            className="bg-muted/40 text-muted-foreground flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
            role="status"
            aria-live="polite"
          >
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {previewQuery.isFetching ? (
              <span>Checking your transactions…</span>
            ) : (
              <span>
                Matches{" "}
                <strong className="text-foreground">
                  {previewQuery.data?.matchCount ?? 0}
                </strong>{" "}
                existing transaction
                {previewQuery.data?.matchCount === 1 ? "" : "s"}
                {previewQuery.data?.samples?.length
                  ? ` — e.g. ${previewQuery.data.samples[0]?.description}`
                  : ""}
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}

        <Button
          onClick={() =>
            createMutation.mutate({
              name: `${pattern.trim()} → category`,
              pattern: pattern.trim(),
              matchType,
              matchField,
              categoryId,
            })
          }
          disabled={!canSubmit || createMutation.isPending}
        >
          {createMutation.isPending ? "Creating…" : "Create rule"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function RulesPage() {
  const utils = trpc.useUtils();
  const rulesQuery = trpc.rules.list.useQuery();
  const [applyResult, setApplyResult] = useState<string | null>(null);

  const toggleMutation = trpc.rules.update.useMutation({
    onSuccess: () => void utils.rules.list.invalidate(),
  });

  const deleteMutation = trpc.rules.delete.useMutation({
    onSuccess: () => void utils.rules.list.invalidate(),
  });

  const applyMutation = trpc.rules.applyToExisting.useMutation({
    onSuccess: (result) => {
      setApplyResult(
        result.updatedCount === 0
          ? "Nothing to do — every transaction already has a category."
          : `Categorised ${result.updatedCount} of ${result.candidateCount} uncategorised transactions.`
      );
      void utils.rules.list.invalidate();
      void utils.transactions.list.invalidate();
      void utils.analytics.invalidate();
    },
  });

  const rules = useMemo(() => rulesQuery.data ?? [], [rulesQuery.data]);
  const { builtIn, custom } = useMemo(
    () => ({
      builtIn: rules.filter((rule) => rule.isBuiltIn),
      custom: rules.filter((rule) => !rule.isBuiltIn),
    }),
    [rules]
  );

  const activeCount = rules.filter((rule) => rule.enabled).length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Categorisation rules
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {activeCount} active rule{activeCount === 1 ? "" : "s"}. Rules are
            checked before the AI classifier — the more you have, the less you
            spend on classification.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => applyMutation.mutate({ onlyUncategorized: true })}
          disabled={applyMutation.isPending}
        >
          <Wand2 className="mr-2 h-4 w-4" aria-hidden="true" />
          {applyMutation.isPending
            ? "Applying…"
            : "Apply to uncategorised transactions"}
        </Button>
      </header>

      {applyResult && (
        <div
          className="bg-surface-sage/40 rounded-lg px-4 py-3 text-sm"
          role="status"
          aria-live="polite"
        >
          {applyResult}
        </div>
      )}

      <NewRuleForm onCreated={() => setApplyResult(null)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your rules</CardTitle>
          <CardDescription>
            {custom.length === 0
              ? "You have not written any rules yet."
              : `${custom.length} custom rule${custom.length === 1 ? "" : "s"}.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {rulesQuery.isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          )}

          {custom.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              onToggle={(enabled) =>
                toggleMutation.mutate({ id: rule.id, enabled })
              }
              onDelete={() => deleteMutation.mutate({ id: rule.id })}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" aria-hidden="true" />
            Built-in rules
          </CardTitle>
          <CardDescription>
            {builtIn.length} common UK merchants, ready to go. Turn any of them
            off if you would rather categorise those yourself.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          {builtIn.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              compact
              onToggle={(enabled) =>
                toggleMutation.mutate({ id: rule.id, enabled })
              }
              onDelete={() => deleteMutation.mutate({ id: rule.id })}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface RuleRowProps {
  rule: {
    id: string;
    pattern: string;
    matchType: string;
    enabled: boolean;
    timesApplied: number;
    category?: { name: string; color: string | null } | null;
  };
  compact?: boolean;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
}

function RuleRow({ rule, compact, onToggle, onDelete }: RuleRowProps) {
  return (
    <div className="hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors">
      <Switch
        checked={rule.enabled}
        onCheckedChange={onToggle}
        aria-label={`Enable rule matching ${rule.pattern}`}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <code className="truncate text-sm font-medium">{rule.pattern}</code>
          {rule.matchType !== "contains" && (
            <Badge variant="outline" className="text-[10px]">
              {MATCH_TYPE_LABELS[rule.matchType as MatchType] ?? rule.matchType}
            </Badge>
          )}
        </div>
        {!compact && rule.timesApplied > 0 && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            Applied {rule.timesApplied} time
            {rule.timesApplied === 1 ? "" : "s"}
          </p>
        )}
      </div>

      {rule.category && (
        <Badge
          variant="secondary"
          style={
            rule.category.color
              ? {
                  backgroundColor: `${rule.category.color}20`,
                  color: rule.category.color,
                }
              : undefined
          }
        >
          {rule.category.name}
        </Badge>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label={`Delete rule matching ${rule.pattern}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
