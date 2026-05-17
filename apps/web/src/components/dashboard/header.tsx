"use client";

import { UserButton } from "@finance/auth";
import { Button } from "@finance/ui";
import { Bell, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { MobileSidebar } from "./sidebar";
import { useSidebar } from "./sidebar-context";

export function DashboardHeader() {
  const { theme, setTheme } = useTheme();
  const { mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <header className="sticky top-0 z-30">
        <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-7">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="text-ink hover:bg-black/[0.04] shrink-0 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="text-ink-soft hover:text-ink hover:bg-black/[0.04] relative h-9 w-9 rounded-chip"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-ink-soft hover:text-ink hover:bg-black/[0.04] relative h-9 w-9 rounded-chip"
            >
              <Bell className="h-[1.15rem] w-[1.15rem]" />
              <span className="sr-only">Notifications</span>
            </Button>

            <UserButton />
          </div>
        </div>
      </header>

      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
