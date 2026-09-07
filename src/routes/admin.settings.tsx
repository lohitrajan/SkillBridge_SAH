import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings | SkillBridge" },
      { name: "description", content: "Settings on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Settings | SkillBridge" },
      { property: "og:description", content: "Settings on SkillBridge." },
    ],
  }),
  component: AdminSettingsPage,
});

const HEALTH_TABLES = [
  { key: "profiles", label: "Profiles" },
  { key: "students", label: "Students" },
  { key: "colleges", label: "Colleges" },
  { key: "companies", label: "Companies" },
  { key: "job_postings", label: "Job postings" },
  { key: "applications", label: "Applications" },
  { key: "skills", label: "Skills" },
  { key: "assessments", label: "Assessments" },
] as const;

async function fetchPlatformHealth() {
  const results = await Promise.all(
    HEALTH_TABLES.map(async (t) => {
      const { count, error } = await supabase.from(t.key).select("*", { count: "exact", head: true });
      if (error) throw new Error(error.message);
      return { ...t, count: count ?? 0 };
    }),
  );
  return results;
}

interface AdminPrefs {
  pageSize: number;
  emailDigest: boolean;
}

const PREFS_KEY = "skillbridge-admin-prefs";

function loadPrefs(): AdminPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { pageSize: 25, emailDigest: true, ...(JSON.parse(raw) as Partial<AdminPrefs>) };
  } catch {
    // ignore malformed local storage
  }
  return { pageSize: 25, emailDigest: true };
}

function AdminSettingsPage() {
  const { profile, refresh, signOut } = useAuth();
  const healthQuery = useQuery({ queryKey: ["admin-platform-health"], queryFn: fetchPlatformHealth });

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [password, setPassword] = useState("");
  const [prefs, setPrefs] = useState<AdminPrefs>(loadPrefs);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.full_name, profile?.phone]);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile loaded");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", profile.id);
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
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Password changed");
      setPassword("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <PageHeading title="Settings" description="Manage your admin profile, security, and platform preferences." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details as an administrator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={profile?.email ?? ""} disabled />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input value={phone ?? ""} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <Button disabled={profileMutation.isPending || !fullName.trim()} onClick={() => profileMutation.mutate()}>
              {profileMutation.isPending ? "Saving…" : "Save profile"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Update your password or sign out of your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>New password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <Button disabled={passwordMutation.isPending || !password} onClick={() => passwordMutation.mutate()}>
              {passwordMutation.isPending ? "Updating…" : "Change password"}
            </Button>
            <div className="border-t border-border pt-3">
              <Button variant="outline" className="gap-1.5 text-destructive" onClick={() => void signOut()}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Stored locally in this browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Default page size</Label>
              <Input
                type="number"
                min={10}
                max={100}
                value={prefs.pageSize}
                onChange={(e) => setPrefs((p) => ({ ...p, pageSize: Number(e.target.value) || 25 }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Email digest</p>
                <p className="text-xs text-muted-foreground">Receive a weekly summary of platform activity.</p>
              </div>
              <Switch checked={prefs.emailDigest} onCheckedChange={(v) => setPrefs((p) => ({ ...p, emailDigest: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Platform health</CardTitle>
            <CardDescription>Live row counts for key tables.</CardDescription>
          </CardHeader>
          <CardContent>
            {healthQuery.isLoading ? (
              <LoadingRows count={4} />
            ) : healthQuery.isError ? (
              <ErrorState message={healthQuery.error.message} onRetry={() => healthQuery.refetch()} />
            ) : (
              <ul className="divide-y divide-border">
                {(healthQuery.data ?? []).map((h) => (
                  <li key={h.key} className="flex items-center justify-between py-2 text-sm">
                    <span>{h.label}</span>
                    <span className="font-medium tabular-nums">{h.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
