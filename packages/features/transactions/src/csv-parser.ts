import Papa from "papaparse";

export interface CSVParseResult {
  success: boolean;
  data: ParsedTransaction[];
  errors: string[];
  rowCount: number;
}

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  merchant?: string;
  rawData: Record<string, string>;
}

interface CSVFormat {
  name: string;
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  merchantColumn?: string;
  dateFormat?: string;
  amountMultiplier?: number; // For banks that store debits as positive
}

const KNOWN_FORMATS: CSVFormat[] = [
  // UK Banks (primary - Monzo first)
  {
    name: "Monzo",
    dateColumn: "Date",
    descriptionColumn: "Description",
    amountColumn: "Amount",
    merchantColumn: "Name",
  },
  {
    name: "Starling",
    dateColumn: "Date",
    descriptionColumn: "Reference",
    amountColumn: "Amount",
  },
  {
    name: "Revolut",
    dateColumn: "Started Date",
    descriptionColumn: "Description",
    amountColumn: "Amount",
  },
  {
    name: "Barclays",
    dateColumn: "Date",
    descriptionColumn: "Memo",
    amountColumn: "Amount",
  },
  {
    name: "NatWest",
    dateColumn: "Date",
    descriptionColumn: "Description",
    amountColumn: "Value",
  },
  {
    name: "Lloyds",
    dateColumn: "Transaction Date",
    descriptionColumn: "Transaction Description",
    amountColumn: "Debit Amount",
  },
  {
    name: "Santander UK",
    dateColumn: "Date",
    descriptionColumn: "Description",
    amountColumn: "Amount",
  },
  {
    name: "Halifax",
    dateColumn: "Date",
    descriptionColumn: "Transaction Description",
    amountColumn: "Debit Amount",
  },
  {
    name: "Nationwide",
    dateColumn: "Date",
    descriptionColumn: "Description",
    amountColumn: "Paid out",
  },
  // Generic format (fallback - must be last)
  {
    name: "Generic",
    dateColumn: "date",
    descriptionColumn: "description",
    amountColumn: "amount",
    merchantColumn: "merchant",
  },
];

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

export function detectCSVFormat(headers: string[]): CSVFormat | null {
  const normalizedHeaders = headers.map(normalizeColumnName);

  for (const format of KNOWN_FORMATS) {
    const dateMatch = normalizedHeaders.some(
      (h) => h === normalizeColumnName(format.dateColumn)
    );
    const descMatch = normalizedHeaders.some(
      (h) => h === normalizeColumnName(format.descriptionColumn)
    );
    const amountMatch = normalizedHeaders.some(
      (h) => h === normalizeColumnName(format.amountColumn)
    );

    if (dateMatch && descMatch && amountMatch) {
      return format;
    }
  }

  const hasDate = normalizedHeaders.some((h) => h.includes("date"));
  const hasDescription = normalizedHeaders.some(
    (h) => h.includes("description") || h.includes("memo") || h.includes("name")
  );
  const hasAmount = normalizedHeaders.some(
    (h) => h.includes("amount") || h.includes("debit") || h.includes("credit")
  );

  if (hasDate && hasDescription && hasAmount) {
    const dateCol = headers.find((h) =>
      normalizeColumnName(h).includes("date")
    );
    const descCol = headers.find(
      (h) =>
        normalizeColumnName(h).includes("description") ||
        normalizeColumnName(h).includes("memo") ||
        normalizeColumnName(h).includes("name")
    );
    const amountCol = headers.find(
      (h) =>
        normalizeColumnName(h).includes("amount") ||
        normalizeColumnName(h).includes("debit") ||
        normalizeColumnName(h).includes("credit")
    );

    // All columns should exist since we checked hasDate, hasDescription, hasAmount
    if (dateCol && descCol && amountCol) {
      return {
        name: "Auto-detected",
        dateColumn: dateCol,
        descriptionColumn: descCol,
        amountColumn: amountCol,
      };
    }
  }

  return null;
}

function parseDate(dateStr: string): Date | null {
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/, // M/D/YY or M/D/YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }

  return null;
}

function parseAmount(amountStr: string): number | null {
  // Remove currency symbols and commas (supports £, $, and €)
  const cleaned = amountStr.replace(/[£$€,]/g, "").trim();

  // Handle parentheses for negative numbers
  if (cleaned.startsWith("(") && cleaned.endsWith(")")) {
    const num = parseFloat(cleaned.slice(1, -1));
    return isNaN(num) ? null : -num;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parseCSV(csvContent: string): CSVParseResult {
  const errors: string[] = [];
  const data: ParsedTransaction[] = [];

  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (result.errors.length > 0) {
    errors.push(...result.errors.map((e) => `Row ${e.row}: ${e.message}`));
  }

  if (!result.data.length || !result.meta.fields) {
    return {
      success: false,
      data: [],
      errors: ["CSV file appears to be empty or invalid"],
      rowCount: 0,
    };
  }

  const format = detectCSVFormat(result.meta.fields);

  if (!format) {
    return {
      success: false,
      data: [],
      errors: [
        "Could not detect CSV format. Please ensure your CSV has date, description, and amount columns.",
      ],
      rowCount: 0,
    };
  }

  for (let i = 0; i < result.data.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- Safe array index access in for loop
    const row = result.data[i];
    const rowNum = i + 2; // +2 for header row and 1-based indexing

    const dateStr = row[format.dateColumn];
    const description = row[format.descriptionColumn];
    const amountStr = row[format.amountColumn];
    const merchant = format.merchantColumn
      ? row[format.merchantColumn]
      : undefined;

    if (!dateStr || !description || !amountStr) {
      errors.push(`Row ${rowNum}: Missing required fields`);
      continue;
    }

    const date = parseDate(dateStr);
    if (!date) {
      errors.push(`Row ${rowNum}: Invalid date format "${dateStr}"`);
      continue;
    }

    const amount = parseAmount(amountStr);
    if (amount === null) {
      errors.push(`Row ${rowNum}: Invalid amount "${amountStr}"`);
      continue;
    }

    data.push({
      date,
      description: description.trim(),
      amount: amount * (format.amountMultiplier ?? 1),
      merchant: merchant?.trim(),
      rawData: row,
    });
  }

  return {
    success: errors.length === 0,
    data,
    errors,
    rowCount: result.data.length,
  };
}
