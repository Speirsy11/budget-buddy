"use client";

import { Badge } from "@finance/ui";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export interface SyncStatusProps {
  status: "idle" | "syncing" | "success" | "error";
  added?: number;
  modified?: number;
  removed?: number;
  error?: string;
}

export function SyncStatus({
  status,
  added = 0,
  modified = 0,
  removed = 0,
  error,
}: SyncStatusProps) {
  if (status === "idle") {
    return null;
  }

  if (status === "syncing") {
    return (
      <div className="flex items-center gap-2 rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/20">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-700 dark:text-blue-400">
          Syncing transactions...
        </span>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="border-destructive/50 bg-destructive/10 flex items-center gap-2 rounded-lg border p-3">
        <AlertCircle className="text-destructive h-4 w-4" />
        <span className="text-destructive text-sm">
          {error ?? "Failed to sync transactions. Please try again."}
        </span>
      </div>
    );
  }

  const total = added + modified + removed;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-50 p-3 dark:bg-green-950/20">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
        <span>Sync complete.</span>
        {total > 0 ? (
          <span className="flex gap-1">
            {added > 0 && (
              <Badge variant="outline" className="text-xs">
                +{added} new
              </Badge>
            )}
            {modified > 0 && (
              <Badge variant="outline" className="text-xs">
                {modified} updated
              </Badge>
            )}
            {removed > 0 && (
              <Badge variant="outline" className="text-xs">
                {removed} removed
              </Badge>
            )}
          </span>
        ) : (
          <span>No new transactions.</span>
        )}
      </div>
    </div>
  );
}
