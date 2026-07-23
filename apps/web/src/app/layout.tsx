import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { ClerkProvider } from "@finance/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { TRPCProvider } from "@/trpc/provider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BudgetBuddy — Smart Personal Finance",
  description:
    "Personal finance dashboard with AI transaction categorisation and 50/30/20 budgeting",
  keywords: ["finance", "budget", "AI", "personal finance", "money management"],
  icons: { icon: "/budgetbuddy-mark.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={dmSans.variable}>
        <body className="bg-background min-h-screen font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TRPCProvider>{children}</TRPCProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
