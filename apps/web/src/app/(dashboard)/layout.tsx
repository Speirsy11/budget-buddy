import { redirect } from "next/navigation";
import { auth } from "@finance/auth/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.userId) {
    redirect("/sign-in");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
