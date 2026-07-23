"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Progress,
  cn,
  formatDate,
} from "@finance/ui";
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  parseCSV,
  type CSVParseResult,
  type ParsedTransaction,
} from "../csv-parser";

interface TransactionUploaderProps {
  onUpload: (transactions: ParsedTransaction[]) => Promise<void>;
  className?: string;
}

type UploadState =
  | "idle"
  | "parsing"
  | "preview"
  | "uploading"
  | "success"
  | "error";

export function TransactionUploader({
  onUpload,
  className,
}: TransactionUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [parseResult, setParseResult] = useState<CSVParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      setState("error");
      return;
    }

    setState("parsing");
    setError(null);

    try {
      const content = await file.text();
      const result = parseCSV(content);
      setParseResult(result);

      if (result.data.length === 0) {
        setError("No valid transactions found in the file");
        setState("error");
      } else {
        setState("preview");
      }
    } catch {
      setError("Failed to parse CSV file");
      setState("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!parseResult?.data.length) return;

    setState("uploading");
    setUploadProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await onUpload(parseResult.data);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setState("success");
    } catch {
      setError("Failed to upload transactions");
      setState("error");
    }
  };

  const reset = () => {
    setState("idle");
    setParseResult(null);
    setError(null);
    setUploadProgress(0);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import Transactions
        </CardTitle>
        <CardDescription>
          Upload a CSV file from your bank to automatically import and
          categorize transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state === "idle" && (
          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="mb-2 text-lg font-medium">
              Drag and drop your CSV file here
            </p>
            <p className="text-muted-foreground mb-4 text-sm">
              Supports most UK bank export formats (Monzo, Starling, Revolut,
              Barclays, HSBC, NatWest, Lloyds, and more)
            </p>
            <label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
              <Button variant="outline" asChild>
                <span>Or browse files</span>
              </Button>
            </label>
          </div>
        )}

        {state === "parsing" && (
          <div className="py-8 text-center">
            <Loader2 className="text-primary mx-auto mb-4 h-12 w-12 animate-spin" />
            <p className="text-lg font-medium">Parsing CSV file...</p>
          </div>
        )}

        {state === "preview" && parseResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                Found {parseResult.data.length} transactions
              </span>
            </div>

            {parseResult.errors.length > 0 && (
              <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                <p className="mb-1 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  {parseResult.errors.length} rows had issues:
                </p>
                <ul className="space-y-1 text-xs text-yellow-700 dark:text-yellow-300">
                  {parseResult.errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {parseResult.errors.length > 3 && (
                    <li>...and {parseResult.errors.length - 3} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border">
              <div className="max-h-48 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-medium">Date</th>
                      <th className="p-2 text-left font-medium">Description</th>
                      <th className="p-2 text-right font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parseResult.data.slice(0, 5).map((t, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{formatDate(t.date)}</td>
                        <td className="max-w-[200px] truncate p-2">
                          {t.description}
                        </td>
                        <td
                          className={cn(
                            "p-2 text-right font-medium",
                            t.amount < 0 ? "text-red-600" : "text-green-600"
                          )}
                        >
                          £{Math.abs(t.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parseResult.data.length > 5 && (
                <div className="bg-muted text-muted-foreground p-2 text-center text-sm">
                  ...and {parseResult.data.length - 5} more transactions
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
              <Button onClick={handleUpload} className="flex-1">
                Import {parseResult.data.length} Transactions
              </Button>
            </div>
          </div>
        )}

        {state === "uploading" && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              <Loader2 className="text-primary mx-auto mb-2 h-8 w-8 animate-spin" />
              <p className="font-medium">Importing transactions...</p>
              <p className="text-muted-foreground text-sm">
                AI is categorizing your transactions
              </p>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {state === "success" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-green-500" />
            <p className="mb-2 text-lg font-medium">Import Complete!</p>
            <p className="text-muted-foreground mb-4 text-sm">
              {parseResult?.data.length} transactions have been imported and
              categorized
            </p>
            <Button onClick={reset}>Import More</Button>
          </div>
        )}

        {state === "error" && (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <p className="mb-2 text-lg font-medium">Import Failed</p>
            <p className="text-muted-foreground mb-4 text-sm">{error}</p>
            <Button onClick={reset}>Try Again</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
