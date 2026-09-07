import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut, Save, Building2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchColleges, type CollegeRow } from "@/lib/data";

export const Route = createFileRoute("/college/settings")({
  head: () => ({
    meta: [
      { title: "Settings | SkillBridge" },
      { name: "description", content: "College profile and account settings on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Settings | SkillBridge" },
      { property: "og:description", content: "College profile and account settings on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeSettingsPage,
});

const INSTITUTION_TYPES = ["University", "Autonomous College", "Affiliated College", "Institute of Technology", "Polytechnic"];

interface CollegeFormState {
  name: string;
  institution_type: string;
  location: string;
  contact_person: string;
  official_email: string;
  website: string;
}

interface ProfileFormState {
  full_name: string;
  phone: string;
}

function CollegeSettingsPage() {
  const { collegeId, user, profile, refresh, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [collegeForm, setCollegeForm] = useState<CollegeFormState | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
  const [password, setPassword] = useState("");

  const collegesQuery = useQuery({ queryKey: ["colleges"], queryFn: fetchColleges });
  const college = (collegesQuery.data ?? []).find((c) => c.id === collegeId) as CollegeRow | undefined;

  useEffect(() => {
    if (!college || collegeForm) return;
    setCollegeForm({
      name: college.name,
      institution_type: college.institution_type,
      location: college.location,
      contact_person: college.contact_person ?? "",
      official_email: college.official_email ?? "",
      website: college.website ?? "",
    });
  }, [college, collegeForm]);

  useEffect(() => {
    if (profileForm) return;
    setProfileForm({ full_name: profile?.full_name ?? "", phone: profile?.phone ?? "" });
  }, [profile, profileForm]);

  const saveCollegeMutation = useMutation({
    mutationFn: async (values: CollegeFormState) => {
      if (!collegeId) throw new Error("No college linked to this account.");
      const { error } = await supabase
        .from("colleges")
        .update({
          name: values.name,
          institution_type: values.institution_type,
          location: values.location,
          contact_person: values.contact_person || null,
          official_email: values.official_email || null,
          website: values.website || null,
        })
        .eq("id", collegeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Institution profile updated");
      await queryClient.invalidateQueries({ queryKey: ["colleges"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (values: ProfileFormState) => {
      if (!user?.id) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: values.full_name, phone: values.phone || null })
        .eq("id", user.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Profile updated");
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

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Settings" />
        <EmptyState
          icon={Building2}
          title="Finish setting up your institution"
          description="Complete onboarding to link your account to your college before editing settings."
          action={<Button asChild><Link to="/college/onboarding">Start onboarding</Link></Button>}
        />
      </div>
    );
  }

  if (collegesQuery.isLoading || !collegeForm || !profileForm) {
    return (
      <div className="space-y-6">
        <PageHeading title="Settings" />
        <LoadingRows count={5} />
      </div>
    );
  }

  if (collegesQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Settings" />
        <ErrorState message={(collegesQuery.error as Error).message} onRetry={() => void collegesQuery.refetch()} />
      </div>
    );
  }

  const setCollege = (key: keyof CollegeFormState) => (value: string) =>
    setCollegeForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  const setProfile = (key: keyof ProfileFormState) => (value: string) =>
    setProfileForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="space-y-6">
      <PageHeading title="Settings" description="Manage your institution profile, account details and security." />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Institution profile</CardTitle>
          <CardDescription>Shown to recruiters and students linked to your college.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="college-name">Institution name</Label>
              <Input id="college-name" value={collegeForm.name} onChange={(e) => setCollege("name")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Institution type</Label>
              <Select value={collegeForm.institution_type} onValueChange={setCollege("institution_type")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {INSTITUTION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college-location">Location</Label>
              <Input id="college-location" value={collegeForm.location} onChange={(e) => setCollege("location")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college-contact">Contact person</Label>
              <Input id="college-contact" value={collegeForm.contact_person} onChange={(e) => setCollege("contact_person")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college-email">Official email</Label>
              <Input id="college-email" type="email" value={collegeForm.official_email} onChange={(e) => setCollege("official_email")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="college-website">Website</Label>
              <Input id="college-website" value={collegeForm.website} onChange={(e) => setCollege("website")(e.target.value)} placeholder="https://…" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveCollegeMutation.mutate(collegeForm)} disabled={saveCollegeMutation.isPending}>
              <Save className="size-4" /> Save institution profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your account</CardTitle>
          <CardDescription>Your personal profile details as the account admin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" value={profileForm.full_name} onChange={(e) => setProfile("full_name")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" value={profileForm.phone} onChange={(e) => setProfile("phone")(e.target.value)} placeholder="+91…" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Email</Label>
              <Input value={profile?.email ?? user?.email ?? ""} disabled readOnly />
              <p className="text-xs text-muted-foreground">Your sign-in email cannot be changed here.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveProfileMutation.mutate(profileForm)} disabled={saveProfileMutation.isPending}>
              <Save className="size-4" /> Save profile
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
