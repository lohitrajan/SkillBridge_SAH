import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, KeyRound, Loader2, LogOut, User } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/recruiter/settings")({
  head: () => ({
    meta: [
      { title: "Settings | SkillBridge" },
      { name: "description", content: "Manage your account, security and notification preferences on SkillBridge." },
      { property: "og:title", content: "Settings | SkillBridge" },
      { property: "og:description", content: "Manage your SkillBridge recruiter account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecruiterSettingsPage,
});

const NOTIF_PREFS_KEY = "recruiter-notification-prefs";

interface NotifPrefs {
  newApplicants: boolean;
  statusUpdates: boolean;
  productUpdates: boolean;
}

const defaultPrefs: NotifPrefs = {
  newApplicants: true,
  statusUpdates: true,
  productUpdates: false,
};

function loadPrefs(): NotifPrefs {
  if (typeof window === "undefined") return defaultPrefs;
  try {
    const raw = window.localStorage.getItem(NOTIF_PREFS_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...(JSON.parse(raw) as Partial<NotifPrefs>) };
  } catch {
    return defaultPrefs;
  }
}

function RecruiterSettingsPage() {
  const { user, profile, refresh, signOut } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile]);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const updatePref = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    window.localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
    toast.success("Notification preferences saved");
  };

  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword.length < 6) throw new Error("Password must be at least 6 characters.");
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading title="Settings" description="Manage your account, security and notification preferences." />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="size-5" /> Profile</CardTitle>
          <CardDescription>Your personal contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email ?? ""} disabled readOnly />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 90000 00000" />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
              {profileMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="size-5" /> Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input id="confirm_password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending}>
              {passwordMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Update password
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bell className="size-5" /> Notification preferences</CardTitle>
          <CardDescription>Choose what you'd like to be notified about.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">New applicants</p>
              <p className="text-xs text-muted-foreground">Get notified when a student applies to your postings.</p>
            </div>
            <Switch checked={prefs.newApplicants} onCheckedChange={(v) => updatePref("newApplicants", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Application status updates</p>
              <p className="text-xs text-muted-foreground">Get notified about pipeline changes.</p>
            </div>
            <Switch checked={prefs.statusUpdates} onCheckedChange={(v) => updatePref("statusUpdates", v)} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Product updates</p>
              <p className="text-xs text-muted-foreground">Occasional news about new SkillBridge features.</p>
            </div>
            <Switch checked={prefs.productUpdates} onCheckedChange={(v) => updatePref("productUpdates", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LogOut className="size-5" /> Sign out</CardTitle>
          <CardDescription>Sign out of your SkillBridge account on this device.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => void signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
