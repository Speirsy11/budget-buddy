"use client";

import { useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, Button } from "@finance/ui";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Settings,
  Upload,
  Smile,
  TrendingUp,
  ChevronsLeft,
  ChevronsRight,
  X,
  Menu,
} from "lucide-react";
import { useSidebar } from "./sidebar-context";

const navigation = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Transactions",
    href: "/dashboard/transactions",
    icon: Receipt,
  },
  {
    name: "Budget",
    href: "/dashboard/budget",
    icon: PieChart,
  },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: TrendingUp,
  },
  {
    name: "Import",
    href: "/dashboard/import",
    icon: Upload,
  },
];

const secondaryNavigation = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed, setMobileOpen } = useSidebar();

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden transition-all duration-300 lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col",
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        )}
      >
        <div className="bg-card flex grow flex-col border-r">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-600/25">
                <Smile className="h-5 w-5 text-white" />
              </div>
              {!collapsed && (
                <span className="text-lg font-bold tracking-tight">
                  BudgetBuddy
                </span>
              )}
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="hidden h-8 w-8 shrink-0 lg:flex"
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col px-3 py-4">
            <ul role="list" className="flex flex-1 flex-col gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!collapsed && item.name}
                      {isActive && !collapsed && (
                        <div className="bg-primary ml-auto h-1.5 w-1.5 rounded-full" />
                      )}
                    </Link>
                  </li>
                );
              })}

              <li className="mt-auto pt-4">
                <div className="mb-2 border-t" />
                {secondaryNavigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                        collapsed && "justify-center px-2",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          "h-5 w-5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}
                      />
                      {!collapsed && item.name}
                    </Link>
                  );
                })}
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="bg-card/95 fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-lg lg:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {navigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", isActive && "text-primary")}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
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
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div className="bg-card fixed inset-y-0 left-0 w-72 shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5"
            onClick={onClose}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
              <Smile className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold">BudgetBuddy</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </div>

        <nav className="px-3 py-4">
          <ul className="space-y-1">
            {[...navigation, ...secondaryNavigation].map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-x-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        isActive && "text-primary"
                      )}
                    />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
