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
import {
  User,
  Palette,
  Bell,
  Database,
  Download,
  Trash2,
  Monitor,
  Moon,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useCurrentUser();
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    // TODO: Wire to full export API once backend endpoint is ready
    // eslint-disable-next-line no-alert -- Simple notification for stub export action
    window.alert(
      "Export functionality coming soon. Your data will be downloadable as a JSON file."
    );
  };

  const handleDeleteAccount = () => {
    // eslint-disable-next-line no-alert -- Simple confirmation dialog for destructive action
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action is permanent and cannot be undone."
    );
    if (confirmed) {
      // TODO: Wire to account deletion API
      // eslint-disable-next-line no-alert -- Follow-up confirmation for destructive action
      window.alert(
        "Account deletion is not yet implemented. Please contact support."
      );
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Palette className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Bell className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Database className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle>Data Management</CardTitle>
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
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
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
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
