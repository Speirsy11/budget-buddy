import { redirect } from "next/navigation";
import { auth } from "@finance/auth/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isDevAuthEnabled } from "@/server/dev-auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The dev test session has no Clerk session behind it, so this gate has to
  // know about it too — otherwise every dashboard route bounces to /sign-in.
  // Returns false in anything but local development.
  if (isDevAuthEnabled()) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  const session = await auth();

  if (!session?.userId) {
    redirect("/sign-in");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
