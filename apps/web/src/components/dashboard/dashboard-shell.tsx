"use client";

import { SidebarProvider } from "./sidebar-context";
import { DashboardSidebar } from "./sidebar";
import { DashboardHeader } from "./header";

function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <DashboardSidebar />
      <div className="lg:pl-[244px]">
        <DashboardHeader />
        <main className="px-4 pb-24 pt-2 sm:px-6 lg:px-7 lg:pb-7 lg:pt-3">
          {children}
        </main>
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
