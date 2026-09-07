import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, ExternalLink, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { CollegeGate } from "@/components/college/college-gate";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingCards, PageHeading } from "@/components/shared/ui-states";
import { fetchApplicationsForCollege, fetchJobs } from "@/lib/data";

export const Route = createFileRoute("/college/internships")({
  head: () => ({
    meta: [
      { title: "Internships | SkillBridge" },
      { name: "description", content: "Open internships and jobs on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Internships | SkillBridge" },
      { property: "og:description", content: "Open internships and jobs on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeInternshipsPage,
});

function CollegeInternshipsPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Internships & Opportunities" description="Open roles available to your students, and how many have already applied." />
      <CollegeGate>{(collegeId) => <Internships collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

function Internships({ collegeId }: { collegeId: string }) {
  const jobsQuery = useQuery({ queryKey: ["open-jobs"], queryFn: () => fetchJobs({ status: "open" }) });
  const appsQuery = useQuery({
    queryKey: ["college-applications", collegeId],
    queryFn: () => fetchApplicationsForCollege(collegeId),
  });

  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [mode, setMode] = useState("all");

  const jobs = jobsQuery.data ?? [];
  const applications = appsQuery.data ?? [];

  const appCountByJob = useMemo(() => {
    const map = new Map<string, number>();
    applications.forEach((a) => map.set(a.job_id, (map.get(a.job_id) ?? 0) + 1));
    return map;
  }, [applications]);

  const types = useMemo(() => Array.from(new Set(jobs.map((j) => j.opportunity_type))).sort(), [jobs]);
  const modes = useMemo(() => Array.from(new Set(jobs.map((j) => j.work_mode))).sort(), [jobs]);

  const filtered = jobs.filter((j) => {
    if (search && !`${j.title} ${j.companies?.name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (type !== "all" && j.opportunity_type !== type) return false;
    if (mode !== "all" && j.work_mode !== mode) return false;
    return true;
  });

  if (jobsQuery.isLoading || appsQuery.isLoading) return <LoadingCards />;
  if (jobsQuery.isError || appsQuery.isError)
    return (
      <ErrorState
        message={jobsQuery.error?.message ?? appsQuery.error?.message}
        onRetry={() => {
          void jobsQuery.refetch();
          void appsQuery.refetch();
        }}
      />
    );

  const totalApplied = jobs.filter((j) => (appCountByJob.get(j.id) ?? 0) > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open opportunities" value={jobs.length} icon={Briefcase} />
        <StatCard label="Roles our students applied to" value={totalApplied} tone="success" />
        <StatCard label="Total applications" value={applications.length} icon={Users} />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label>Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Role or company" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Work mode</Label>
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All modes</SelectItem>
              {modes.map((m) => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Briefcase} title="No open opportunities" description="There are no matching open roles right now." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => (
            <Card key={j.id}>
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-base">{j.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{j.companies?.name ?? "Company"} · {j.location}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="capitalize">{j.opportunity_type}</Badge>
                  <Badge variant="secondary" className="capitalize">{j.work_mode}</Badge>
                  {j.stipend ? <Badge variant="secondary">{j.stipend}</Badge> : null}
                </div>
                <div className="flex flex-wrap gap-1">
                  {j.requiredSkills.slice(0, 5).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-muted-foreground">
                    <Users className="mr-1 inline size-3.5" />
                    {appCountByJob.get(j.id) ?? 0} of our students applied
                  </span>
                  {j.deadline ? <span className="text-xs text-muted-foreground">Deadline {j.deadline}</span> : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
