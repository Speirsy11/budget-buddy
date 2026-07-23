"use client";

import { useCurrentUser } from "@finance/auth";
import { type ReactNode } from "react";

interface GreetingProps {
  /** Override the user's first name (defaults to Clerk's firstName). */
  name?: string;
  /** Override the rendered greeting line. If provided, displaces "Hey, {name}!". */
  title?: ReactNode;
  /** Small line above the greeting. Defaults to today's long date. */
  eyebrow?: ReactNode;
  /** Inline suffix shown after "Hey {name}!" — usually an emerald insight. */
  insight?: ReactNode;
  /** Right-rail content (e.g. MonthPicker). */
  trailing?: ReactNode;
}

function partOfDay(d: Date) {
  const h = d.getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

export function Greeting({
  name,
  title,
  eyebrow,
  insight,
  trailing,
}: GreetingProps) {
  const { user } = useCurrentUser();
  const firstName = name ?? user?.firstName ?? "there";

  const today = new Date();
  const defaultEyebrow = `${
    [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ][today.getDay()]
  } ${partOfDay(today)}, ${today.getDate()} ${today.toLocaleString("en-GB", {
    month: "short",
  })}`;

  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="min-w-0">
          <div className="text-muted-ink text-meta">
            {eyebrow ?? defaultEyebrow}
          </div>
          <div className="text-greeting text-ink mt-0.5">
            {title ?? (
              <>
                Hey {firstName}!{insight ? " " : ""}
                {insight}
              </>
            )}
          </div>
        </div>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </header>
  );
}
