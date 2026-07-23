"use client";

import { useState } from "react";
import { Card, CardDescription, CardTitle, IconChip } from "@finance/ui";
import {
  TransactionUploader,
  type ParsedTransaction,
} from "@finance/transactions";
import { trpc } from "@/trpc/client";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Landmark,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Greeting } from "@/components/dashboard/greeting";

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

  const createManyMutation = trpc.transactions.createMany.useMutation({
    onSuccess: (data) => {
      setLastImportCount(data.count);
    },
  });

  const handleUpload = async (transactions: ParsedTransaction[]) => {
    await createManyMutation.mutateAsync({
      transactions: transactions.map((t) => ({
        amount: t.amount,
        date: t.date,
        description: t.description,
        merchant: t.merchant,
      })),
      autoClassify: true,
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <Greeting
        title={<>Bring your money in</>}
        insight={
          <span className="text-muted-ink text-base font-medium">
            We&apos;ll do the categorising
          </span>
        }
      />

      {/* Uploader */}
      <TransactionUploader onUpload={handleUpload} />

      {/* Success Message */}
      {lastImportCount !== null && (
        <Card surface="sage" className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <p className="text-ink font-semibold">
              Successfully imported {lastImportCount} transactions
            </p>
            <CheckCircle2 className="text-deep-sage h-5 w-5" />
          </div>
          <Link
            href="/dashboard/transactions"
            className="text-cat-emerald text-sm font-semibold hover:underline"
          >
            View transactions →
          </Link>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-3.5 md:grid-cols-3">
        <Card surface="lemon" className="p-5">
          <IconChip
            icon={FileSpreadsheet}
            surface="lemon"
            size="lg"
            className="mb-2"
          />
          <h3 className="text-ink mb-1 font-bold">Supported formats</h3>
          <p className="text-deep-lemon text-sm leading-snug">
            Monzo, Starling, Revolut, Barclays, HSBC, NatWest, Lloyds,
            Santander, Halifax, Nationwide.
          </p>
        </Card>

        <Card surface="lav" className="p-5">
          <IconChip icon={Sparkles} surface="lav" size="lg" className="mb-2" />
          <h3 className="text-ink mb-1 font-bold">AI classification</h3>
          <p className="text-deep-lav text-sm leading-snug">
            Each transaction is read and sorted into the right 50/30/20 bucket.
          </p>
        </Card>

        <Card surface="sage" className="p-5">
          <IconChip
            icon={ShieldCheck}
            surface="sage"
            size="lg"
            className="mb-2"
          />
          <h3 className="text-ink mb-1 font-bold">Your data is safe</h3>
          <p className="text-deep-sage text-sm leading-snug">
            Files are parsed locally. Only the extracted data goes to our
            servers — encrypted in transit and at rest.
          </p>
        </Card>
      </div>

      {/* Bank Export Guides */}
      <Card surface="linen" className="p-6">
        <div className="mb-3 flex items-center gap-3">
          <IconChip icon={Landmark} surface="linen" />
          <div>
            <CardTitle>How to export from your bank</CardTitle>
            <CardDescription className="mt-0.5">
              Step-by-step instructions for common banks
            </CardDescription>
          </div>
        </div>
        <div className="space-y-2">
          {bankGuides.map((guide) => {
            const isExpanded = expandedGuide === guide.name;
            return (
              <div
                key={guide.name}
                className="bg-surface-white rounded-pill shadow-btn overflow-hidden"
              >
                <button
                  type="button"
                  className="text-ink flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition-colors hover:bg-black/[0.03]"
                  aria-expanded={isExpanded}
                  onClick={() =>
                    setExpandedGuide(isExpanded ? null : guide.name)
                  }
                >
                  {guide.name}
                  {isExpanded ? (
                    <ChevronUp className="text-muted-ink h-4 w-4" />
                  ) : (
                    <ChevronDown className="text-muted-ink h-4 w-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="border-t border-black/[0.05] px-5 pb-4 pt-3">
                    <ol className="text-ink-soft list-inside list-decimal space-y-2 text-sm">
                      {guide.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
