import Link from "next/link";
import { Button } from "@finance/ui";
import { PRICING_PLANS } from "@finance/payments";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  Lock,
  PieChart,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

const features = [
  {
    icon: FileSpreadsheet,
    title: "CSV-first privacy",
    description:
      "Start with bank CSV exports instead of connecting a live bank account on day one.",
  },
  {
    icon: PieChart,
    title: "50/30/20 budget view",
    description:
      "Turn messy transactions into a simple needs, wants, and savings snapshot.",
  },
  {
    icon: Sparkles,
    title: "AI categorisation",
    description:
      "Classify transactions faster, then correct edge cases as your data gets cleaner.",
  },
  {
    icon: TrendingUp,
    title: "Spending trends",
    description:
      "Spot month-to-month changes before they become expensive habits.",
  },
  {
    icon: BarChart3,
    title: "Web and mobile",
    description:
      "Import on the web, then check budgets, transactions, and insights from your phone.",
  },
  {
    icon: Shield,
    title: "Private by design",
    description:
      "Your data stays yours. Bank connections are always opt-in, never a requirement.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <img src="/budgetbuddy-mark.svg" alt="" className="h-9 w-9" />
            <span className="text-xl font-bold tracking-tight">
              BudgetBuddy
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm text-slate-300 hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-slate-300 hover:text-white"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-sm text-slate-300 hover:text-white"
            >
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`${appUrl}/sign-in`}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
              >
                Sign in
              </Button>
            </Link>
            <Link href={`${appUrl}/sign-up`}>
              <Button
                size="sm"
                className="bg-emerald-400 text-slate-950 hover:bg-emerald-300"
              >
                Get started
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.34),_transparent_34%),radial-gradient(circle_at_80%_20%,_rgba(16,185,129,0.24),_transparent_30%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-medium text-emerald-100">
                <Lock className="h-4 w-4" />
                Privacy-first budgeting before bank sync
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Know what you can spend, without handing over your bank login
                first.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                BudgetBuddy turns UK bank CSV exports into a clear 50/30/20
                budget, searchable transactions, and spending insights on web
                and mobile. Connect your bank later — only if you want to.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href={`${appUrl}/sign-up`}>
                  <Button
                    size="lg"
                    className="gap-2 bg-emerald-400 text-slate-950 shadow-2xl shadow-emerald-500/20 hover:bg-emerald-300"
                  >
                    Start with CSV import <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    See how it works
                  </Button>
                </Link>
              </div>
              <div className="mt-8 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                {[
                  "No credit card required",
                  "CSV import first",
                  "Bank sync optional later",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-6 rounded-[3rem] bg-gradient-to-br from-blue-500/25 to-emerald-400/25 blur-3xl" />
              <img
                src="/budgetbuddy-preview.svg"
                alt="BudgetBuddy dashboard and mobile preview"
                className="relative w-full rounded-[2rem] shadow-2xl shadow-black/30"
              />
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-white/10 bg-white/[0.03] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to know where your money goes
              </h2>
              <p className="mt-4 text-slate-300">
                Import a CSV and get a working budget in minutes — no bank
                credentials required.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-xl shadow-black/10"
                >
                  <div className="mb-4 inline-flex rounded-2xl bg-emerald-300/10 p-3 text-emerald-200">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
            {[
              [
                "1",
                "Upload on web",
                "Export CSV from your bank and import it in the web app.",
              ],
              [
                "2",
                "Review on mobile",
                "Search, classify, and check your monthly budget from your phone.",
              ],
              [
                "3",
                "Stay on top",
                "Set 50/30/20 targets and watch your spending trends month over month.",
              ],
            ].map(([step, title, copy]) => (
              <div
                key={step}
                className="rounded-3xl bg-white p-6 text-slate-950"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-white">
                  {step}
                </div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="border-t border-white/10 bg-white/[0.03] px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple pricing
            </h2>
            <p className="mt-4 text-slate-300">
              Start free with CSV import and budgeting. Upgrade when you want
              more from your data.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {PRICING_PLANS.filter((p) => p.id !== "pro-yearly").map(
                (plan) => (
                  <div
                    key={plan.id}
                    className="rounded-3xl border border-white/10 bg-white p-6 text-left text-slate-950"
                  >
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="mt-2 text-slate-600">{plan.description}</p>
                    <div className="mt-5 text-3xl font-bold">
                      £{plan.price}
                      <span className="text-base font-medium text-slate-500">
                        /{plan.interval}
                      </span>
                    </div>
                    <ul className="mt-6 space-y-3 text-sm text-slate-700">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2">
                          <Check className="h-4 w-4 text-emerald-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl space-y-4">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              FAQ
            </h2>
            <FAQ
              question="Does BudgetBuddy require Open Banking?"
              answer="No. You can start with CSV exports from your bank and get full budgeting and insights without ever connecting a live bank feed."
            />
            <FAQ
              question="Can I use it on mobile?"
              answer="Yes — review transactions, budgets, and analytics from the mobile app. CSV import happens on the web."
            />
            <FAQ
              question="Is this financial advice?"
              answer="No. BudgetBuddy shows budgeting summaries and spending insights; it should not present regulated financial advice or guarantees."
            />
          </div>
        </section>
      </main>
    </div>
  );
}

function FAQ({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="font-semibold">{question}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{answer}</p>
    </div>
  );
}
