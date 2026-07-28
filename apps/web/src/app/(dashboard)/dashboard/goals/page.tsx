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
  Progress,
  Skeleton,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  formatCurrency,
} from "@finance/ui";
import type { GoalPace } from "@finance/analytics";
import { Plus, Target, Trash2, Trophy } from "lucide-react";
import { trpc } from "@/trpc/client";

const PACE_BADGE: Record<GoalPace, { label: string; className: string }> = {
  achieved: {
    label: "Achieved",
    className: "bg-emerald-100 text-emerald-800",
  },
  on_track: { label: "On track", className: "bg-sky-100 text-sky-800" },
  behind: { label: "Behind", className: "bg-amber-100 text-amber-900" },
  no_deadline: { label: "No deadline", className: "bg-muted" },
};

function formatMonths(months: number | null) {
  if (months === null) return null;
  if (months < 0) return "date passed";
  if (months < 1) return "less than a month left";
  return `${Math.round(months)} month${Math.round(months) === 1 ? "" : "s"} left`;
}

function NewGoalForm({ onDone }: { onDone: () => void }) {
  const utils = trpc.useUtils();
  const accountsQuery = trpc.accounts.list.useQuery();

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [linkedAccountId, setLinkedAccountId] = useState<string>("none");

  const createMutation = trpc.goals.create.useMutation({
    onSuccess: () => {
      void utils.goals.invalidate();
      setName("");
      setTarget("");
      setCurrent("");
      setTargetDate("");
      setLinkedAccountId("none");
      onDone();
    },
  });

  const parsedTarget = Number.parseFloat(target);
  const isLinked = linkedAccountId !== "none";
  const canSubmit = name.trim().length > 0 && parsedTarget > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">New goal</CardTitle>
        <CardDescription>
          Link a savings account to track progress automatically, or enter
          contributions yourself.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Goal</Label>
            <Input
              id="goal-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Emergency fund"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Target amount</Label>
            <Input
              id="goal-target"
              type="number"
              step="0.01"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              placeholder="6000"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-date">Target date (optional)</Label>
            <Input
              id="goal-date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-account">Track with account (optional)</Label>
            <Select value={linkedAccountId} onValueChange={setLinkedAccountId}>
              <SelectTrigger id="goal-account">
                <SelectValue placeholder="Track manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Track manually</SelectItem>
                {accountsQuery.data?.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!isLinked && (
            <div className="space-y-1.5">
              <Label htmlFor="goal-current">Saved so far (optional)</Label>
              <Input
                id="goal-current"
                type="number"
                step="0.01"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                placeholder="0"
              />
            </div>
          )}
        </div>

        <Button
          disabled={!canSubmit || createMutation.isPending}
          onClick={() =>
            createMutation.mutate({
              name: name.trim(),
              targetAmount: parsedTarget,
              currentAmount: isLinked ? 0 : Number.parseFloat(current) || 0,
              targetDate: targetDate ? new Date(targetDate) : undefined,
              linkedAccountId: isLinked ? linkedAccountId : undefined,
            })
          }
        >
          {createMutation.isPending ? "Creating…" : "Create goal"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const utils = trpc.useUtils();
  const goalsQuery = trpc.goals.list.useQuery({});
  const [showForm, setShowForm] = useState(false);
  const [contributions, setContributions] = useState<Record<string, string>>(
    {}
  );

  const contributeMutation = trpc.goals.contribute.useMutation({
    onSuccess: () => void utils.goals.invalidate(),
  });
  const deleteMutation = trpc.goals.delete.useMutation({
    onSuccess: () => void utils.goals.invalidate(),
  });

  const goals = goalsQuery.data?.goals ?? [];
  const summary = goalsQuery.data?.summary;
  const isEmpty = !goalsQuery.isLoading && goals.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings goals</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {summary && summary.activeCount > 0
              ? `${summary.activeCount} active · ${formatCurrency(summary.totalRequiredMonthly)} a month to stay on schedule`
              : "Set a target and a date, and see what it takes to get there."}
          </p>
        </div>
        <Button onClick={() => setShowForm((open) => !open)}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {showForm ? "Close" : "New goal"}
        </Button>
      </header>

      {showForm && <NewGoalForm onDone={() => setShowForm(false)} />}

      {goalsQuery.isLoading && <Skeleton className="h-40 w-full" />}

      {isEmpty && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="bg-surface-sky text-deep-sky grid h-12 w-12 place-items-center rounded-[16px]">
              <Target className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="font-medium">No goals yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                An emergency fund, a deposit, a holiday — anything with a number
                attached.
              </p>
            </div>
            <Button onClick={() => setShowForm(true)}>Create one</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((goal) => {
          const { progress } = goal;
          const badge = PACE_BADGE[progress.pace];
          const monthsLabel = formatMonths(progress.monthsRemaining);

          return (
            <Card key={goal.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {progress.isAchieved && (
                        <Trophy
                          className="h-4 w-4 text-amber-500"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate">{goal.name}</span>
                    </CardTitle>
                    <CardDescription>
                      {formatCurrency(progress.currentAmount)} of{" "}
                      {formatCurrency(progress.targetAmount)}
                      {goal.linkedAccount &&
                        ` · via ${goal.linkedAccount.name}`}
                    </CardDescription>
                  </div>
                  <Badge className={badge.className}>{badge.label}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <Progress value={progress.percentComplete} />
                  <div className="text-muted-foreground mt-1.5 flex justify-between text-xs">
                    <span>{progress.percentComplete.toFixed(0)}%</span>
                    <span>
                      {formatCurrency(progress.remaining)} to go
                      {monthsLabel ? ` · ${monthsLabel}` : ""}
                    </span>
                  </div>
                </div>

                {progress.requiredMonthlyContribution !== null && (
                  <p className="text-sm">
                    Put aside{" "}
                    <strong>
                      {formatCurrency(progress.requiredMonthlyContribution)}
                    </strong>{" "}
                    a month to arrive on time.
                  </p>
                )}

                {progress.pace === "behind" &&
                  progress.projectedCompletionDate && (
                    <p className="text-muted-foreground text-xs">
                      At your current rate you would get there in{" "}
                      {progress.projectedCompletionDate.toLocaleDateString(
                        "en-GB",
                        { month: "long", year: "numeric" }
                      )}
                      .
                    </p>
                  )}

                <div className="flex items-center gap-2 pt-1">
                  {!goal.linkedAccountId && !progress.isAchieved && (
                    <>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Add amount"
                        className="h-8 w-32"
                        aria-label={`Contribution to ${goal.name}`}
                        value={contributions[goal.id] ?? ""}
                        onChange={(event) =>
                          setContributions((previous) => ({
                            ...previous,
                            [goal.id]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        disabled={contributeMutation.isPending}
                        onClick={() => {
                          const amount = Number.parseFloat(
                            contributions[goal.id] ?? ""
                          );
                          if (!Number.isFinite(amount)) return;
                          contributeMutation.mutate({
                            id: goal.id,
                            amount,
                          });
                          setContributions((previous) => ({
                            ...previous,
                            [goal.id]: "",
                          }));
                        }}
                      >
                        Add
                      </Button>
                    </>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="ml-auto"
                    onClick={() => deleteMutation.mutate({ id: goal.id })}
                    aria-label={`Delete goal ${goal.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
