"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, IconChip, formatCurrency } from "@finance/ui";
import {
  BarChart3,
  FileSpreadsheet,
  Landmark,
  LayoutGrid,
  PiggyBank,
  PieChart,
  ReceiptText,
  RefreshCw,
  Settings,
  Target,
  Wallet,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { trpc } from "@/trpc/client";

type SurfaceKey = "sage" | "peach" | "sky" | "lav" | "lemon" | "linen";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  surface: SurfaceKey;
}

const navigation: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutGrid, surface: "sage" },
  {
    name: "Accounts",
    href: "/dashboard/accounts",
    icon: Wallet,
    surface: "linen",
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: ReceiptText,
    surface: "peach",
  },
  { name: "Budget", href: "/dashboard/budget", icon: PieChart, surface: "sky" },
  {
    name: "Goals",
    href: "/dashboard/goals",
    icon: Target,
    surface: "lav",
  },
  {
    name: "Recurring",
    href: "/dashboard/subscriptions",
    icon: RefreshCw,
    surface: "peach",
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    surface: "lav",
  },
  {
    name: "Import",
    href: "/dashboard/import",
    icon: FileSpreadsheet,
    surface: "lemon",
  },
  {
    name: "Open Banking",
    href: "/dashboard/open-banking",
    icon: Landmark,
    surface: "linen",
  },
];

const secondaryNavigation: NavItem[] = [
  {
    name: "Rules",
    href: "/dashboard/rules",
    icon: Wand2,
    surface: "sage",
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
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

const deepTextClass: Record<SurfaceKey, string> = {
  sage: "text-deep-sage",
  peach: "text-deep-peach",
  sky: "text-deep-sky",
  lav: "text-deep-lav",
  lemon: "text-deep-lemon",
  linen: "text-ink-soft",
};

function MonthLabel() {
  const now = new Date();
  const month = now.toLocaleString("en-GB", {
    month: "short",
    year: "2-digit",
  });
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
        "rounded-pill flex items-center gap-3 px-2.5 py-2 text-sm transition-all",
        active
          ? "bg-white/[0.07] font-semibold text-white"
          : "font-medium text-[#C8C2B5] hover:bg-white/[0.04] hover:text-white"
      )}
    >
      <IconChip
        icon={item.icon}
        surface={item.surface}
        size="sm"
        className={cn(
          active
            ? "shadow-[0_0_0_2px_rgba(255,255,255,0.18)]"
            : "shadow-[inset_0_-2px_0_rgba(0,0,0,0.06)]"
        )}
      />
      <span className="flex-1 truncate">{item.name}</span>
      {active && <span className="bg-surface-peach h-1.5 w-1.5 rounded-full" />}
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
    <div className="relative overflow-hidden rounded-[18px] bg-white/[0.04] p-3.5">
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
      <div className="bg-surface-sage text-deep-sage grid h-11 w-11 shrink-0 place-items-center rounded-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <PiggyBank size={24} strokeWidth={2.25} aria-hidden="true" />
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
        {/*
          The nav scrolls and the savings card stays pinned. Without this the
          links push the card off the bottom of a short viewport, where it is
          clipped rather than reachable. min-h-0 is required for a flex child
          to be allowed to shrink below its content height.
        */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
        </div>
        <div className="shrink-0 pt-3">
          <SavingsGoalCard />
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-3 bottom-3 z-50 lg:hidden">
        <div className="bg-sidebar shadow-card flex items-center justify-around rounded-[22px] px-2 py-2">
          {navigation.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "rounded-pill flex items-center justify-center px-3 py-1.5 transition-all",
                  active && surfaceBg[item.surface]
                )}
              >
                <item.icon
                  size={20}
                  strokeWidth={2.25}
                  aria-hidden="true"
                  className={cn(
                    active ? deepTextClass[item.surface] : "text-[#C8C2B5]"
                  )}
                />
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
            className="text-sidebar-muted hover:text-sidebar rounded-chip -mt-3 p-1.5"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Same scroll/pin split as the desktop sidebar. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
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
        </div>
        <div className="shrink-0 pt-3">
          <SavingsGoalCard />
        </div>
      </div>
    </div>
  );
}
