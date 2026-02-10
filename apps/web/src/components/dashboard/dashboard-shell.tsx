"use client";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="bg-muted/40 min-h-screen">
      <DashboardSidebar />
      <div className={collapsed ? "lg:pl-[72px]" : "lg:pl-64"}>
        <DashboardHeader />
        <main className="p-4 pb-20 sm:p-6 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}
