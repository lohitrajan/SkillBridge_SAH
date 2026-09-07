import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchStudent } from "@/lib/data";

export const Route = createFileRoute("/student/settings")({
  head: () => ({
    meta: [
      { title: "Profile & Settings | SkillBridge" },
      {
        name: "description",
        content: "Update your student profile, contact details, target role and account password on SkillBridge.",
      },
      { property: "og:title", content: "Profile & Settings | SkillBridge" },
      { property: "og:description", content: "Manage your SkillBridge student profile and account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentSettingsPage,
});

interface FormState {
  full_name: string;
  phone: string;
  headline: string;
  bio: string;
  target_role: string;
  location: string;
  department: string;
  degree: string;
}

function StudentSettingsPage() {
  const { studentId, user, profile, refresh, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);
  const [password, setPassword] = useState("");

  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId as string),
    enabled: !!studentId,
  });

  useEffect(() => {
    const s = studentQuery.data;
    if (!s || form) return;
    setForm({
      full_name: s.full_name,
      phone: s.phone ?? "",
      headline: s.headline ?? "",
      bio: s.bio ?? "",
      target_role: s.target_role,
      location: s.location,
      department: s.department,
      degree: s.degree,
    });
  }, [studentQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const studentRes = await supabase
        .from("students")
        .update({
          full_name: values.full_name,
          phone: values.phone || null,
          headline: values.headline || null,
          bio: values.bio || null,
          target_role: values.target_role,
          location: values.location,
          department: values.department,
          degree: values.degree,
        })
        .eq("id", studentId as string);
      if (studentRes.error) throw new Error(studentRes.error.message);

      if (user?.id) {
        const profileRes = await supabase
          .from("profiles")
          .update({ full_name: values.full_name, phone: values.phone || null })
          .eq("id", user.id);
        if (profileRes.error) throw new Error(profileRes.error.message);
      }
    },
    onSuccess: async () => {
      toast.success("Profile updated");
      await queryClient.invalidateQueries({ queryKey: ["student", studentId] });
      await refresh();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const passwordMutation = useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Password updated");
      setPassword("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Profile & Settings" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="Create your student profile before editing it."
          action={
            <Button asChild>
              <Link to="/student/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (studentQuery.isLoading || !form) {
    return (
      <div className="space-y-6">
        <PageHeading title="Profile & Settings" />
        <LoadingRows count={5} />
      </div>
    );
  }

  if (studentQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Profile & Settings" />
        <ErrorState
          message={(studentQuery.error as Error).message}
          onRetry={() => void studentQuery.refetch()}
        />
      </div>
    );
  }

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="space-y-6">
      <PageHeading title="Profile & Settings" description="Keep your profile accurate — recruiters search on it." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile details</CardTitle>
          <CardDescription>Shown on your skill passport and to recruiters who shortlist you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={form.full_name} onChange={set("full_name")} />
            <Field label="Phone" value={form.phone} onChange={set("phone")} placeholder="+91…" />
            <Field label="Department" value={form.department} onChange={set("department")} />
            <Field label="Degree" value={form.degree} onChange={set("degree")} />
            <Field label="Target role" value={form.target_role} onChange={set("target_role")} />
            <Field label="Location" value={form.location} onChange={set("location")} />
          </div>
          <Field
            label="Headline"
            value={form.headline}
            onChange={set("headline")}
            placeholder="Final-year CSE student building data pipelines"
          />
          <div className="space-y-1.5">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              rows={4}
              value={form.bio}
              onChange={(e) => set("bio")(e.target.value)}
              placeholder="A short summary of your interests, strengths and what you're looking for."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={profile?.email ?? user?.email ?? ""} disabled readOnly />
            <p className="text-xs text-muted-foreground">Your sign-in email cannot be changed here.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              <Save className="size-4" /> Save changes
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account security</CardTitle>
          <CardDescription>Set a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </div>
            <Button
              variant="outline"
              className="w-fit"
              disabled={password.length < 8 || passwordMutation.isPending}
              onClick={() => passwordMutation.mutate(password)}
            >
              Update password
            </Button>
          </div>
          <Separator />
          <Button variant="ghost" className="text-destructive" onClick={() => void signOut()}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}
