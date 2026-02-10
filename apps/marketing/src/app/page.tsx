import Link from "next/link";
import { Button } from "@finance/ui";
import { PRICING_PLANS } from "@finance/payments";
import {
  Smile,
  PieChart,
  Upload,
  Shield,
  Zap,
  TrendingUp,
  Check,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navigation */}
      <header className="bg-background/80 sticky top-0 z-50 border-b backdrop-blur-lg">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-600/20">
              <Smile className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              BudgetBuddy
            </span>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Features
            </Link>
            <Link
              href="#pricing"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="#faq"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-in`}>
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-up`}>
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-32">
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/50 via-transparent to-transparent dark:from-blue-950/20" />
          <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <div className="bg-background/80 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                AI-Powered Finance Management
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Take control of your{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
                  finances
                </span>{" "}
                with AI
              </h1>
              <p className="text-muted-foreground mt-6 text-lg leading-8">
                BudgetBuddy is your friendly AI finance companion that
                categorizes transactions, sets personalized goals, and cheers
                you on as you build better money habits.
              </p>
              <div className="mt-10 flex items-center justify-center gap-4">
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-up`}>
                  <Button
                    size="lg"
                    className="gap-2 shadow-lg shadow-blue-600/20"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#features">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </div>
              <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                {[
                  "No credit card required",
                  "14-day free trial",
                  "Cancel anytime",
                ].map((text) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="border-t py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to manage your money
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Powerful features that make financial management effortless
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={Sparkles}
                title="AI Categorization"
                description="Our AI automatically categorizes your transactions with 95%+ accuracy. No manual tagging required."
                color="text-violet-600 dark:text-violet-400"
                bgColor="bg-violet-500/10"
              />
              <FeatureCard
                icon={PieChart}
                title="Smart Budget Goals"
                description="Your buddy learns your habits and suggests personalized spending goals you can actually stick to."
                color="text-blue-600 dark:text-blue-400"
                bgColor="bg-blue-500/10"
              />
              <FeatureCard
                icon={Upload}
                title="Easy Import"
                description="Import transactions from any major UK bank via CSV. Monzo, Starling, Revolut, Barclays, and more."
                color="text-emerald-600 dark:text-emerald-400"
                bgColor="bg-emerald-500/10"
              />
              <FeatureCard
                icon={TrendingUp}
                title="Smart Insights"
                description="Get personalized insights about your spending patterns and actionable recommendations."
                color="text-teal-600 dark:text-teal-400"
                bgColor="bg-teal-500/10"
              />
              <FeatureCard
                icon={Shield}
                title="Bank-Level Security"
                description="Your data is encrypted at rest and in transit. We never sell your information."
                color="text-amber-600 dark:text-amber-400"
                bgColor="bg-amber-500/10"
              />
              <FeatureCard
                icon={Zap}
                title="Real-Time Updates"
                description="See your financial picture update in real-time as you add transactions."
                color="text-rose-600 dark:text-rose-400"
                bgColor="bg-rose-500/10"
              />
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="bg-muted/30 border-t py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                How it works
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Get started in under 5 minutes
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
              <StepCard
                step={1}
                title="Upload Your Transactions"
                description="Export a CSV from your bank and upload it to BudgetBuddy. We support all major banks."
              />
              <StepCard
                step={2}
                title="AI Categorizes Everything"
                description="Our AI analyzes each transaction and assigns the most appropriate category automatically."
              />
              <StepCard
                step={3}
                title="Track & Optimize"
                description="See your spending breakdown, track your budget, and get insights to improve your finances."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="border-t py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Start free, upgrade when you need more
              </p>
            </div>

            <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-2">
              {PRICING_PLANS.filter((p) => p.id !== "pro-yearly").map(
                (plan) => (
                  <PricingCard key={plan.id} plan={plan} />
                )
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-muted/30 border-t py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground mt-4 text-lg">
                Everything you need to know about BudgetBuddy
              </p>
            </div>

            <div className="mx-auto mt-16 max-w-3xl space-y-4">
              <FAQItem
                question="Is my financial data secure?"
                answer="Absolutely. We use bank-level encryption (AES-256) for all data at rest and TLS 1.3 for data in transit. We never sell your data and you can delete your account at any time."
              />
              <FAQItem
                question="Which banks are supported?"
                answer="We support CSV exports from all major UK banks including Monzo, Starling, Revolut, Barclays, HSBC, NatWest, Lloyds, Santander, Halifax, Nationwide, and more. Any bank that exports CSV files will work."
              />
              <FAQItem
                question="How accurate is the AI categorization?"
                answer="Our AI achieves 95%+ accuracy on common transactions. For edge cases, you can easily recategorize transactions and the AI learns from your corrections."
              />
              <FAQItem
                question="Can I cancel my subscription anytime?"
                answer="Yes! You can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your billing period."
              />
              <FAQItem
                question="How does BudgetBuddy set my budget goals?"
                answer="BudgetBuddy analyzes your spending patterns and income to suggest personalized, achievable goals. As you use the app, your buddy learns what works for you and adjusts recommendations to help you succeed."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-24 text-center shadow-2xl shadow-blue-600/20 sm:px-16">
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="relative">
                <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Start taking control of your finances today
                </h2>
                <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
                  Join thousands of users who have transformed their financial
                  habits with BudgetBuddy.
                </p>
                <div className="mt-10 flex items-center justify-center gap-4">
                  <Link
                    href={`${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-up`}
                  >
                    <Button
                      size="lg"
                      variant="secondary"
                      className="gap-2 shadow-lg"
                    >
                      Start Free Trial
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  bgColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-card hover:border-primary/20 hover:shadow-primary/5 group rounded-2xl border p-6 shadow-sm transition-all hover:shadow-lg">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${bgColor}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-bold text-white shadow-md shadow-blue-600/20">
        {step}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{description}</p>
    </div>
  );
}

function PricingCard({
  plan,
}: {
  plan: {
    id: string;
    name: string;
    description: string;
    price: number;
    features: string[];
    highlighted?: boolean;
    cta: string;
  };
}) {
  return (
    <div
      className={`bg-card rounded-2xl border p-8 shadow-sm transition-all hover:shadow-lg ${
        plan.highlighted
          ? "shadow-lg shadow-blue-600/10 ring-2 ring-blue-600"
          : ""
      }`}
    >
      {plan.highlighted && (
        <div className="mb-4 inline-block rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1 text-xs font-medium text-white">
          Most Popular
        </div>
      )}
      <h3 className="text-2xl font-bold">{plan.name}</h3>
      <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
      <div className="mt-4">
        <span className="text-4xl font-bold">
          &pound;{plan.price === 0 ? "0" : plan.price.toFixed(2)}
        </span>
        {plan.price > 0 && (
          <span className="text-muted-foreground">/month</span>
        )}
      </div>
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        href={
          plan.id === "free"
            ? `${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-up`
            : `${process.env.NEXT_PUBLIC_APP_URL || ""}/sign-up?plan=pro`
        }
        className="mt-8 block"
      >
        <Button
          className="w-full"
          variant={plan.highlighted ? "default" : "outline"}
        >
          {plan.cta}
        </Button>
      </Link>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="bg-card group rounded-xl border">
      <summary className="hover:text-primary flex cursor-pointer items-center justify-between p-5 font-semibold transition-colors [&::-webkit-details-marker]:hidden">
        {question}
        <ChevronDown className="text-muted-foreground h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-5 pb-5">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {answer}
        </p>
      </div>
    </details>
  );
}
