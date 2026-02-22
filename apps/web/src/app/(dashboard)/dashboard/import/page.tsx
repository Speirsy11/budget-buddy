"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@finance/ui";
import {
  TransactionUploader,
  type ParsedTransaction,
} from "@finance/transactions";
import { useMutation, useAction } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import {
  CheckCircle2,
  FileSpreadsheet,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";

const bankGuides = [
  {
    name: "Monzo",
    steps: [
      "Open the Monzo app and go to your account",
      'Scroll down and tap "Export transactions"',
      "Select your date range",
      'Choose "Export as CSV" and save the file',
    ],
  },
  {
    name: "Starling Bank",
    steps: [
      "Log in to your Starling account online or via the app",
      'Go to "Statements" in the menu',
      "Select your date range and choose CSV format",
      "Download the statement",
    ],
  },
  {
    name: "Barclays",
    steps: [
      "Log in to Barclays Online Banking",
      'Go to your account and click "Export"',
      "Select CSV format and your date range",
      "Download the file",
    ],
  },
  {
    name: "Revolut",
    steps: [
      "Open the Revolut app or log in online",
      'Go to your account and tap "Statements"',
      "Select the date range and choose CSV format",
      "Generate and download the statement",
    ],
  },
];

export default function ImportPage() {
  const [lastImportCount, setLastImportCount] = useState<number | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const createMany = useMutation(api.transactions.createMany);
  const classifyBatch = useAction(api.ai.classifyBatch);

  const handleUpload = async (transactions: ParsedTransaction[]) => {
    // Create transactions
    const ids = await createMany({
      transactions: transactions.map((t) => ({
        amount: t.amount,
        date: t.date.getTime(),
        description: t.description,
        merchant: t.merchant,
      })),
    });

    setLastImportCount(ids.length);

    // Auto-classify in background
    if (ids.length > 0) {
      classifyBatch({ transactionIds: ids }).catch(() => {
        // Classification is best-effort
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Uploader */}
      <TransactionUploader onUpload={handleUpload} />

      {/* Success Message */}
      {lastImportCount !== null && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-900/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="font-medium text-emerald-800 dark:text-emerald-200">
                  Successfully imported {lastImportCount} transactions
                </p>
              </div>
              <Link
                href="/dashboard/transactions"
                className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-300"
              >
                View transactions
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <FileSpreadsheet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="mb-1 font-semibold">Supported Formats</h3>
            <p className="text-muted-foreground text-sm">
              Monzo, Starling, Revolut, Barclays, HSBC, NatWest, Lloyds,
              Santander, Halifax, Nationwide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="mb-1 font-semibold">AI Classification</h3>
            <p className="text-muted-foreground text-sm">
              Our AI automatically analyzes each transaction and assigns the
              most appropriate category.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="mb-1 font-semibold">Your Data is Secure</h3>
            <p className="text-muted-foreground text-sm">
              Files are processed locally in your browser. Only extracted data
              is sent to our servers, encrypted in transit and at rest.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bank Export Guides - Accordion Style */}
      <Card>
        <CardHeader>
          <CardTitle>How to Export from Your Bank</CardTitle>
          <CardDescription>
            Step-by-step instructions for common banks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {bankGuides.map((guide) => {
            const isExpanded = expandedGuide === guide.name;
            return (
              <div key={guide.name} className="rounded-lg border">
                <button
                  type="button"
                  className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 text-left font-medium transition-colors"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedGuide(isExpanded ? null : guide.name)
                  }
                >
                  {guide.name}
                  {isExpanded ? (
                    <ChevronUp className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <ChevronDown className="text-muted-foreground h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3">
                    <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
                      {guide.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
