import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Building2, ClipboardList, Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState, LoadingCards, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchApplicationsForCompany, fetchJobs, type CompanyRow } from "@/lib/data";

export const Route = createFileRoute("/recruiter/company")({
  head: () => ({
    meta: [
      { title: "Company Profile | SkillBridge" },
      { name: "description", content: "Manage your company profile on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Company Profile | SkillBridge" },
      { property: "og:description", content: "Manage your company profile on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RecruiterCompanyPage,
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
  recruiter_name: string;
  recruiter_email: string;
  website: string;
  about: string;
}

function toForm(c: CompanyRow): FormState {
  return {
    name: c.name ?? "",
    sector: c.sector ?? "",
    company_size: c.company_size ?? "",
    location: c.location ?? "",
    recruiter_name: c.recruiter_name ?? "",
    recruiter_email: c.recruiter_email ?? "",
    website: c.website ?? "",
    about: c.about ?? "",
  };
}

function RecruiterCompanyPage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState | null>(null);

  const companyQ = useQuery({
    queryKey: ["recruiter-company", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId!)
        .single();
      if (error) throw new Error(error.message);
      return data as CompanyRow;
    },
    enabled: !!companyId,
  });

  const jobsQ = useQuery({
    queryKey: ["recruiter-jobs", companyId],
    queryFn: () => fetchJobs({ companyId: companyId! }),
    enabled: !!companyId,
  });
  const appsQ = useQuery({
    queryKey: ["recruiter-applications", companyId],
    queryFn: () => fetchApplicationsForCompany(companyId!),
    enabled: !!companyId,
  });

  useEffect(() => {
    if (companyQ.data) setForm(toForm(companyQ.data));
  }, [companyQ.data]);

  const saveMutation = useMutation({
    mutationFn: async (input: FormState) => {
      if (!companyId) throw new Error("No company found");
      const { error } = await supabase
        .from("companies")
        .update({
          name: input.name.trim(),
          sector: input.sector,
          company_size: input.company_size,
          location: input.location.trim(),
          recruiter_name: input.recruiter_name.trim() || null,
          recruiter_email: input.recruiter_email.trim() || null,
          website: input.website.trim() || null,
          about: input.about.trim() || null,
        })
        .eq("id", companyId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Company profile updated");
      void queryClient.invalidateQueries({ queryKey: ["recruiter-company", companyId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Company Profile" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile to manage it here."
          action={
            <Button asChild>
              <Link to="/recruiter/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (companyQ.isLoading || !form) {
    return (
      <div className="space-y-6">
        <PageHeading title="Company Profile" />
        <LoadingCards count={3} />
        <LoadingRows />
      </div>
    );
  }

  if (companyQ.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Company Profile" />
        <ErrorState message={companyQ.error?.message} onRetry={() => companyQ.refetch()} />
      </div>
    );
  }

  const jobs = jobsQ.data ?? [];
  const openPostings = jobs.filter((j) => j.status === "open" || j.status === "active").length;
  const apps = appsQ.data ?? [];
  const shortlisted = apps.filter((a) => ["shortlisted", "interview", "selected"].includes(a.status)).length;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Company Profile"
        description="Keep your company details up to date so students and colleges trust your postings."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total postings" value={jobs.length} icon={Briefcase} />
        <StatCard label="Open postings" value={openPostings} icon={ClipboardList} tone="accent" />
        <StatCard label="Total applicants" value={apps.length} icon={Users} tone="success" />
        <StatCard label="Shortlisted+" value={shortlisted} icon={Users} tone="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" /> Company details
          </CardTitle>
          <CardDescription>This information is visible to students and colleges.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Sector</Label>
              <Select value={form.sector} onValueChange={(v) => setForm({ ...form, sector: v })}>
                <SelectTrigger><SelectValue placeholder="Select sector" /></SelectTrigger>
                <SelectContent>
                  {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company size</Label>
              <Select value={form.company_size} onValueChange={(v) => setForm({ ...form, company_size: v })}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {sizes.map((s) => <SelectItem key={s} value={s}>{s} employees</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://example.com" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="recruiter_name">Recruiter contact name</Label>
              <Input id="recruiter_name" value={form.recruiter_name} onChange={(e) => setForm({ ...form, recruiter_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recruiter_email">Recruiter contact email</Label>
              <Input id="recruiter_email" type="email" value={form.recruiter_email} onChange={(e) => setForm({ ...form, recruiter_email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about">About the company</Label>
            <Textarea id="about" rows={5} value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} placeholder="Tell students about your mission, culture and what makes you a great place to work." />
          </div>
          <div className="flex justify-end">
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
