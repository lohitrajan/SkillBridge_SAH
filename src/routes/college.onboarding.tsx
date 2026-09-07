import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, GraduationCap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/college/onboarding")({
  head: () => ({
    meta: [
      { title: "Institution setup | SkillBridge" },
      { name: "description", content: "Institution setup on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Institution setup | SkillBridge" },
      { property: "og:description", content: "Institution setup on SkillBridge." },
    ],
  }),
  component: CollegeOnboardingPage,
});

const institutionTypes = [
  "Engineering College",
  "University",
  "Polytechnic",
  "Community College",
  "Business School",
  "Other",
];

const formSchema = z.object({
  name: z.string().trim().min(2, "Institution name is required"),
  institution_type: z.string().min(1, "Select an institution type"),
  location: z.string().trim().min(2, "Location is required"),
  contact_person: z.string().trim().min(2, "Contact person is required"),
  official_email: z.string().trim().email("Enter a valid email"),
  website: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^https?:\/\/.+/.test(v), "Include http(s):// in the URL"),
});

type FormState = z.infer<typeof formSchema>;

function CollegeOnboardingPage() {
  const { user, collegeId, refresh, profile } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>({
    name: "",
    institution_type: "",
    location: "",
    contact_person: profile?.full_name ?? "",
    official_email: profile?.email ?? "",
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const parsed = formSchema.safeParse(form);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        parsed.error.issues.forEach((issue) => {
          fieldErrors[String(issue.path[0])] = issue.message;
        });
        setErrors(fieldErrors);
        throw new Error("Please fix the highlighted fields");
      }
      setErrors({});
      const { data, error } = await supabase
        .from("colleges")
        .insert({
          owner_id: user.id,
          name: parsed.data.name,
          institution_type: parsed.data.institution_type,
          location: parsed.data.location,
          contact_person: parsed.data.contact_person,
          official_email: parsed.data.official_email,
          website: parsed.data.website || null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async () => {
      toast.success("Institution profile created");
      await refresh();
      void navigate({ to: "/college" });
    },
    onError: (e: Error) => {
      if (e.message !== "Please fix the highlighted fields") toast.error(e.message);
    },
  });

  if (collegeId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Institution Setup" />
        <EmptyState
          icon={CheckCircle2}
          title="Onboarding already complete"
          description="Your institution profile is set up. Head to your dashboard to review students and gaps."
          action={
            <Button asChild>
              <Link to="/college">Go to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title="Set up your institution"
        description="Create your college profile so students and industry partners can connect with you."
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="size-5" /> Institution details
          </CardTitle>
          <CardDescription>These details appear on drives, training programs and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Institution name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            {errors["name"] ? <p className="text-xs text-destructive">{errors["name"]}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Institution type</Label>
              <Select
                value={form.institution_type}
                onValueChange={(v) => setForm({ ...form, institution_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {institutionTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors["institution_type"] ? (
                <p className="text-xs text-destructive">{errors["institution_type"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              {errors["location"] ? <p className="text-xs text-destructive">{errors["location"]}</p> : null}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="contact_person">Contact person</Label>
              <Input
                id="contact_person"
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
              {errors["contact_person"] ? (
                <p className="text-xs text-destructive">{errors["contact_person"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="official_email">Official email</Label>
              <Input
                id="official_email"
                type="email"
                value={form.official_email}
                onChange={(e) => setForm({ ...form, official_email: e.target.value })}
              />
              {errors["official_email"] ? (
                <p className="text-xs text-destructive">{errors["official_email"]}</p>
              ) : null}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Website (optional)</Label>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.edu"
            />
            {errors["website"] ? <p className="text-xs text-destructive">{errors["website"]}</p> : null}
          </div>
          <div className="flex justify-end">
            <Button disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
              {createMutation.isPending ? "Creating..." : "Create institution profile"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
