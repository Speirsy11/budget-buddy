"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Switch,
  Separator,
} from "@finance/ui";
import { useCurrentUser, UserButton } from "@finance/auth";
import { useTheme } from "next-themes";
import { trpc } from "@/trpc/client";
import { Download, Trash2, Monitor, Moon } from "lucide-react";
import { Mascot } from "@finance/ui";
import { Greeting } from "@/components/dashboard/greeting";

export default function SettingsPage() {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const exportQuery = trpc.transactions.exportAll.useQuery(undefined, {
    enabled: false,
  });

  const handleExport = async () => {
    const exportData = await exportQuery.refetch();
    if (!exportData.data?.json) {
      return;
    }

    const blob = new Blob([exportData.data.json], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `budget-buddy-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-3.5">
      <Greeting
        mascot="peaceful"
        title={<>Settings</>}
        insight={
          <span className="text-muted-ink text-base font-medium">
            Make Buddy yours
          </span>
        }
      />

      {/* Profile */}
      <Card surface="sage">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mascot name="wave" size={44} />
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <UserButton />
            <div>
              <p className="font-medium">{user?.fullName || "User"}</p>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                defaultValue={user?.firstName || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                defaultValue={user?.lastName || ""}
                disabled
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Profile information is managed through your authentication provider.
            Click on your avatar to update.
          </p>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card surface="lemon">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mascot name="star" size={44} />
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customise how the app looks</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div className="flex items-center gap-3">
              <Moon className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-muted-foreground text-xs">
                  Toggle between light and dark themes
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div className="flex items-center gap-3">
              <Monitor className="text-muted-foreground h-4 w-4" />
              <div>
                <p className="text-sm font-medium">System Theme</p>
                <p className="text-muted-foreground text-xs">
                  Automatically match your system preference
                </p>
              </div>
            </div>
            <Switch
              checked={theme === "system"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "system" : "light")
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card surface="sky">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mascot name="pointer" size={44} />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div>
              <p className="text-sm font-medium">Budget Alerts</p>
              <p className="text-muted-foreground text-xs">
                Get notified when you&apos;re approaching budget limits
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div>
              <p className="text-sm font-medium">Weekly Summary</p>
              <p className="text-muted-foreground text-xs">
                Receive a weekly email with your spending summary
              </p>
            </div>
            <Switch />
          </div>
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div>
              <p className="text-sm font-medium">Large Transaction Alerts</p>
              <p className="text-muted-foreground text-xs">
                Get notified for transactions over a certain amount
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card surface="linen">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Mascot name="csv" size={44} />
            <div>
              <CardTitle>Data management</CardTitle>
              <CardDescription>Export or delete your data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div>
              <p className="text-sm font-medium">Export Data</p>
              <p className="text-muted-foreground text-xs">
                Download all your transactions and settings as a JSON file
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportQuery.isFetching}
            >
              <Download className="mr-2 h-4 w-4" />
              {exportQuery.isFetching ? "Exporting…" : "Export JSON"}
            </Button>
          </div>
          <Separator />
          <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg p-3 transition-colors">
            <div>
              <p className="text-destructive text-sm font-medium">
                Delete Account
              </p>
              <p className="text-muted-foreground text-xs">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              <Trash2 className="mr-2 h-4 w-4" />
              Contact support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
