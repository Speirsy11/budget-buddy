import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@finance/auth";
import { Button } from "@finance/ui";
import {
  Smile,
  PieChart,
  Upload,
  Shield,
  ArrowRight,
  Sparkles,
  TrendingUp,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-background/80 fixed top-0 z-50 w-full border-b backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-600/20">
              <Smile className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              BudgetBuddy
            </span>
          </div>
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton>
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm">Get Started</Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button size="sm">
                  Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-20 pt-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20" />
        <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="container mx-auto max-w-4xl text-center">
          <div className="bg-background/80 mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium shadow-sm backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-muted-foreground">
              AI-Powered Finance Management
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-7xl">
            Master Your Money
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
              with Intelligent Insights
            </span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg sm:text-xl">
            Your friendly AI buddy automatically categorizes transactions, sets
            personalized budget goals, and helps you build better money habits.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <SignedOut>
              <SignUpButton>
                <Button
                  size="lg"
                  className="gap-2 px-8 text-lg shadow-lg shadow-blue-600/20"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </SignUpButton>
              <Button
                variant="outline"
                size="lg"
                className="px-8 text-lg"
                disabled
                title="Demo coming soon"
              >
                Watch Demo
              </Button>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="gap-2 px-8 text-lg shadow-lg shadow-blue-600/20"
                >
                  Go to Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </SignedIn>
          </div>

          {/* Trust indicators */}
          <div className="text-muted-foreground mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            {[
              "No credit card required",
              "14-day free trial",
              "Bank-level encryption",
            ].map((text) => (
              <div key={text} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-muted/30 border-t px-4 py-20">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Everything You Need to Take Control
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
              Powerful features designed to simplify your financial life
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: "AI Classification",
                description:
                  "Automatically categorize transactions using advanced AI. No manual tagging required.",
                color: "text-violet-600 dark:text-violet-400",
                bgColor: "bg-violet-500/10",
              },
              {
                icon: PieChart,
                title: "50/30/20 Budget",
                description:
                  "Your AI buddy learns your spending habits and helps you set achievable, personalized budget goals.",
                color: "text-blue-600 dark:text-blue-400",
                bgColor: "bg-blue-500/10",
              },
              {
                icon: Upload,
                title: "Easy Import",
                description:
                  "Import bank statements from any major bank. Just drag and drop your CSV file.",
                color: "text-emerald-600 dark:text-emerald-400",
                bgColor: "bg-emerald-500/10",
              },
              {
                icon: Shield,
                title: "Bank-Level Security",
                description:
                  "Your data is encrypted and never shared. Privacy-first architecture you can trust.",
                color: "text-amber-600 dark:text-amber-400",
                bgColor: "bg-amber-500/10",
              },
              {
                icon: TrendingUp,
                title: "Smart Insights",
                description:
                  "Get personalized recommendations to improve your spending habits and save more.",
                color: "text-teal-600 dark:text-teal-400",
                bgColor: "bg-teal-500/10",
              },
              {
                icon: BarChart3,
                title: "Trend Analysis",
                description:
                  "Visualize spending patterns over time. Identify trends and optimize your budget.",
                color: "text-rose-600 dark:text-rose-400",
                bgColor: "bg-rose-500/10",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-card hover:border-primary/20 hover:shadow-primary/5 group rounded-2xl border p-6 transition-all hover:shadow-lg"
              >
                <div
                  className={`mb-4 inline-flex rounded-xl p-3 ${feature.bgColor}`}
                >
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              Get Started in 3 Steps
            </h2>
            <p className="text-muted-foreground text-lg">
              From upload to insights in under a minute
            </p>
          </div>
          <div className="space-y-6">
            {[
              {
                step: "01",
                title: "Upload Your Transactions",
                description:
                  "Export a CSV from your bank and drag it into BudgetBuddy. We support all major banks.",
              },
              {
                step: "02",
                title: "AI Categorizes Everything",
                description:
                  "BudgetBuddy automatically categorizes your transactions and suggests personalized budget goals.",
              },
              {
                step: "03",
                title: "Get Actionable Insights",
                description:
                  "View your spending breakdown, track against your budget, and get personalized tips.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-card hover:border-primary/20 flex items-start gap-5 rounded-2xl border p-6 transition-colors"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md shadow-blue-600/20">
                  {item.step}
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-center text-white shadow-2xl shadow-blue-600/20 sm:p-16">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Ready to Transform Your Finances?
              </h2>
              <p className="mb-8 text-lg text-blue-100">
                Join thousands of users who have taken control of their money
                with BudgetBuddy.
              </p>
              <SignedOut>
                <SignUpButton>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 px-8 text-lg shadow-lg"
                  >
                    Start Your Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="gap-2 px-8 text-lg shadow-lg"
                  >
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-4 py-10">
        <div className="container mx-auto">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600">
                <Smile className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold">BudgetBuddy</span>
            </div>
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} BudgetBuddy. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
