"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Mascot, formatCurrency, type MascotName } from "@finance/ui";
import { X } from "lucide-react";
import { trpc } from "@/trpc/client";

type SurfaceKey = "sage" | "peach" | "sky" | "lav" | "lemon" | "linen";

interface NavItem {
  name: string;
  href: string;
  mascot: MascotName;
  surface: SurfaceKey;
}

const navigation: NavItem[] = [
  { name: "Overview", href: "/dashboard", mascot: "coins", surface: "sage" },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    mascot: "receipt",
    surface: "peach",
  },
  { name: "Budget", href: "/dashboard/budget", mascot: "pie", surface: "sky" },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    mascot: "bars",
    surface: "lav",
  },
  {
    name: "Import",
    href: "/dashboard/import",
    mascot: "csv",
    surface: "lemon",
  },
  {
    name: "Open Banking",
    href: "/dashboard/open-banking",
    mascot: "bank",
    surface: "linen",
  },
];

const secondaryNavigation: NavItem[] = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    mascot: "shield",
    surface: "linen",
  },
];

const surfaceBg: Record<SurfaceKey, string> = {
  sage: "bg-surface-sage",
  peach: "bg-surface-peach",
  sky: "bg-surface-sky",
  lav: "bg-surface-lav",
  lemon: "bg-surface-lemon",
  linen: "bg-surface-linen",
};

function MonthLabel() {
  const now = new Date();
  const month = now.toLocaleString("en-GB", { month: "short", year: "2-digit" });
  return <span>Personal · {month}</span>;
}

function NavLink({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-pill px-2.5 py-2 text-sm transition-all",
        active
          ? "bg-white/[0.07] font-semibold text-white"
          : "font-medium text-[#C8C2B5] hover:bg-white/[0.04] hover:text-white"
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-chip",
          surfaceBg[item.surface],
          active
            ? "shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
            : "shadow-[inset_0_-2px_0_rgba(0,0,0,0.06)]"
        )}
      >
        <Mascot
          name={item.mascot}
          size={26}
          className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
        />
      </span>
      <span className="flex-1 truncate">{item.name}</span>
      {active && (
        <span className="bg-surface-peach h-1.5 w-1.5 rounded-full" />
      )}
    </Link>
  );
}

function SavingsGoalCard() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { data } = trpc.analytics.get503020.useQuery({ month, year });

  const saved = data ? Math.max(0, data.totalIncome - data.totalExpenses) : 0;
  const goal = data?.savings?.target ?? 840;
  const pct = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;

  return (
    <div className="relative mt-auto overflow-hidden rounded-[18px] bg-white/[0.04] p-3.5">
      <Mascot
        name="star"
        size={64}
        className="absolute -right-3.5 -top-2.5 opacity-85"
      />
      <div className="text-[11px] text-[#A39C8E]">Monthly savings goal</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <div className="text-xl font-extrabold text-white">
          {formatCurrency(saved)}
        </div>
        <div className="text-surface-peach text-[11px]">
          / {formatCurrency(goal)}
        </div>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className="h-full bg-gradient-to-r from-[#FFB48A] to-[#FFE5D6] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 text-[10px] text-[#A39C8E]">
        {pct >= 100
          ? "Goal smashed — nice work!"
          : `${pct.toFixed(0)}% of monthly goal`}
      </div>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="flex items-center gap-3 px-1.5 pb-5">
      <div className="bg-surface-sage relative grid h-14 w-14 shrink-0 place-items-end overflow-hidden rounded-[18px] shadow-[0_4px_14px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <Mascot name="wave" size={64} className="-mb-2" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-[17px] font-bold tracking-tight text-white">
          BudgetBuddy
        </div>
        <div className="text-[11px] text-[#9C958A]">
          <MonthLabel />
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[244px] lg:flex-col lg:p-4">
        <BrandBlock />
        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </nav>
        <div className="mt-5 border-t border-white/[0.06] pt-3">
          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              active={pathname === item.href}
            />
          ))}
        </div>
        <SavingsGoalCard />
      </aside>

      {/* Mobile bottom navigation — dark pill with claymation icons */}
      <nav className="fixed inset-x-3 bottom-3 z-50 lg:hidden">
        <div className="bg-sidebar shadow-card flex items-center justify-around rounded-[22px] px-2 py-2">
          {navigation.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-center rounded-pill px-3 py-1.5 transition-all",
                  active && surfaceBg[item.surface]
                )}
              >
                <Mascot name={item.mascot} size={28} />
                <span className="sr-only">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const pathname = usePathname();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="bg-sidebar text-sidebar fixed inset-y-0 left-0 flex w-[244px] flex-col p-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <BrandBlock />
          <button
            type="button"
            onClick={onClose}
            className="text-sidebar-muted hover:text-sidebar -mt-3 rounded-chip p-1.5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              active={pathname === item.href}
              onClick={onClose}
            />
          ))}
        </nav>
        <div className="mt-5 border-t border-white/[0.06] pt-3">
          {secondaryNavigation.map((item) => (
            <NavLink
              key={item.name}
              item={item}
              active={pathname === item.href}
              onClick={onClose}
            />
          ))}
        </div>
        <SavingsGoalCard />
      </div>
    </div>
  );
}
