import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, CheckCircle2, Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillPicker } from "@/components/recruiter/skill-picker";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchSkills } from "@/lib/data";

export const Route = createFileRoute("/recruiter/onboarding")({
  head: () => ({
    meta: [
      { title: "Company Onboarding | SkillBridge" },
      {
        name: "description",
        content: "Set up your company profile on SkillBridge to start hiring verified student talent.",
      },
      { property: "og:title", content: "Company Onboarding | SkillBridge" },
      { property: "og:description", content: "Company Onboarding on SkillBridge." },
    ],
  }),
  component: RecruiterOnboardingPage,
});

const sectors = [
  "Information Technology",
  "Software & SaaS",
  "Finance & Banking",
  "Manufacturing",
  "Healthcare",
  "E-commerce",
  "Consulting",
  "Telecommunications",
  "Other",
];
const sizes = ["1-50", "51-200", "201-1000", "1000-5000", "5000+"];

interface FormState {
  name: string;
  sector: string;
  company_size: string;
  location: string;
  website: string;
  recruiter_name: string;
  recruiter_email: string;
}

function RecruiterOnboardingPage() {
  const { user, companyId, refresh, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>({
    name: "",
    sector: "",
    company_size: "",
    location: "",
    website: "",
    recruiter_name: profile?.full_name ?? "",
    recruiter_email: profile?.email ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const skillsQ = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("companies")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          sector: form.sector,
          company_size: form.company_size,
          location: form.location.trim(),
          website: form.website.trim() || null,
          recruiter_name: form.recruiter_name.trim() || null,
          recruiter_email: form.recruiter_email.trim() || null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: async () => {
      toast.success("Company profile created");
      await refresh();
      if (skillIds.length) {
        void navigate({ to: "/recruiter/post", search: { skills: skillIds.join(",") } });
      } else {
        void navigate({ to: "/recruiter/post" });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Company Onboarding" />
        <EmptyState
          icon={CheckCircle2}
          title="Onboarding already complete"
          description="Your company profile is set up. Head to your dashboard to manage postings and talent."
          action={
            <Button asChild>
              <Link to="/recruiter">Go to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e["name"] = "Company name is required";
    if (!form.sector) e["sector"] = "Select a sector";
    if (!form.company_size) e["company_size"] = "Select a company size";
    if (!form.location.trim()) e["location"] = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.recruiter_name.trim()) e["recruiter_name"] = "Contact name is required";
    if (!form.recruiter_email.trim() || !/^\S+@\S+\.\S+$/.test(form.recruiter_email))
      e["recruiter_email"] = "Valid email is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title="Set up your company"
        description="A few quick steps so students can discover and trust your opportunities."
      />

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5" /> Company details
            </CardTitle>
            <CardDescription>Tell students who you are.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              {errors["name"] ? <p className="text-xs text-destructive">{errors["name"]}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Sector</Label>
                <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["sector"] ? <p className="text-xs text-destructive">{errors["sector"]}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label>Company size</Label>
                <Select
                  value={form.company_size}
                  onValueChange={(v) => setForm({ ...form, company_size: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors["company_size"] ? (
                  <p className="text-xs text-destructive">{errors["company_size"]}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
              {errors["location"] ? (
                <p className="text-xs text-destructive">{errors["location"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={() => validateStep1() && setStep(2)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" /> Recruiter contact
            </CardTitle>
            <CardDescription>Who should students and colleges reach out to?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="recruiter_name">Contact name</Label>
              <Input
                id="recruiter_name"
                value={form.recruiter_name}
                onChange={(e) => setForm({ ...form, recruiter_name: e.target.value })}
              />
              {errors["recruiter_name"] ? (
                <p className="text-xs text-destructive">{errors["recruiter_name"]}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recruiter_email">Contact email</Label>
              <Input
                id="recruiter_email"
                type="email"
                value={form.recruiter_email}
                onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })}
              />
              {errors["recruiter_email"] ? (
                <p className="text-xs text-destructive">{errors["recruiter_email"]}</p>
              ) : null}
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => validateStep2() && setStep(3)}>Continue</Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="size-5" /> Skills you typically hire for
            </CardTitle>
            <CardDescription>
              We'll use these to pre-fill your first opportunity posting.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillsQ.isLoading ? (
              <LoadingRows count={2} />
            ) : skillsQ.isError ? (
              <ErrorState onRetry={() => skillsQ.refetch()} />
            ) : (
              <SkillPicker
                skills={skillsQ.data ?? []}
                selected={skillIds}
                onChange={setSkillIds}
                placeholder="Search and select skills…"
              />
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>
                {finishMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Finish setup
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
