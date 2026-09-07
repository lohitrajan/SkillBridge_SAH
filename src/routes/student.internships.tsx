import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Briefcase, MapPin, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { MatchPill } from "@/components/shared/skill-badge";
import { MatchExplainer } from "@/components/shared/match-explainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { applyToJob, fetchApplicationsForStudent, fetchJobs, fetchProjects, fetchStudent, fetchStudentSkills } from "@/lib/data";
import { matchJobForStudent } from "@/components/student/shared";

export const Route = createFileRoute("/student/internships")({
  head: () => ({
    meta: [
      { title: "Internships | SkillBridge" },
      { name: "description", content: "Internships on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Internships | SkillBridge" },
      { property: "og:description", content: "Internships on SkillBridge." },
    ],
  }),
  component: StudentInternshipsPage,
});

function StudentInternshipsPage() {
  const { studentId } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!studentId;

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");

  const studentQuery = useQuery({ queryKey: ["student", studentId], queryFn: () => fetchStudent(studentId as string), enabled });
  const skillsQuery = useQuery({ queryKey: ["student-skills", studentId], queryFn: () => fetchStudentSkills(studentId as string), enabled });
  const projectsQuery = useQuery({ queryKey: ["projects", studentId], queryFn: () => fetchProjects(studentId as string), enabled });
  const jobsQuery = useQuery({ queryKey: ["jobs", "open"], queryFn: () => fetchJobs({ status: "open" }), enabled: true });
  const applicationsQuery = useQuery({ queryKey: ["applications", studentId], queryFn: () => fetchApplicationsForStudent(studentId as string), enabled });

  const applyMutation = useMutation({
    mutationFn: (input: { jobId: string; matchScore: number }) =>
      applyToJob({ jobId: input.jobId, studentId: studentId as string, matchScore: input.matchScore }),
    onSuccess: async () => {
      toast.success("Application submitted!");
      await queryClient.invalidateQueries({ queryKey: ["applications", studentId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Internships" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="Set up your profile to see personalised internship matches."
          action={<Button asChild><Link to="/student/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const anyLoading = studentQuery.isLoading || skillsQuery.isLoading || projectsQuery.isLoading || jobsQuery.isLoading;
  const anyError = studentQuery.isError || skillsQuery.isError || projectsQuery.isError || jobsQuery.isError;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Internships" />
        <LoadingRows count={6} />
      </div>
    );
  }
  if (anyError || !studentQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeading title="Internships" />
        <ErrorState onRetry={() => { void studentQuery.refetch(); void jobsQuery.refetch(); }} />
      </div>
    );
  }

  const student = studentQuery.data;
  const skills = skillsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const appliedJobIds = new Set(applications.map((a) => a.job_id));

  const opportunityTypes = ["all", ...Array.from(new Set(jobs.map((j) => j.opportunity_type)))];
  const workModes = ["all", ...Array.from(new Set(jobs.map((j) => j.work_mode)))];

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !search ||
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.companies?.name.toLowerCase().includes(search.toLowerCase()) ||
      j.requiredSkills.some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || j.opportunity_type === typeFilter;
    const matchesMode = modeFilter === "all" || j.work_mode === modeFilter;
    return matchesSearch && matchesType && matchesMode;
  });

  const matches = filteredJobs
    .map((job) => ({ job, result: matchJobForStudent(student, skills, projects, job, applications.length) }))
    .sort((a, b) => b.result.score - a.result.score);

  return (
    <div className="space-y-6">
      <PageHeading title="Internships" description="Browse open opportunities matched to your skills." />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by title, company or skill" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            {opportunityTypes.map((t) => <SelectItem key={t} value={t}>{t === "all" ? "All types" : t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={modeFilter} onValueChange={setModeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Work mode" /></SelectTrigger>
          <SelectContent>
            {workModes.map((m) => <SelectItem key={m} value={m}>{m === "all" ? "All modes" : m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {matches.length === 0 ? (
        <EmptyState icon={Briefcase} title="No opportunities found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map(({ job, result }) => {
            const applied = appliedJobIds.has(job.id);
            return (
              <Card key={job.id}>
                <CardHeader className="space-y-1 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{job.title}</CardTitle>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        {job.companies?.name} · <MapPin className="size-3" /> {job.location} · {job.work_mode}
                      </p>
                    </div>
                    <MatchPill score={result.score} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {job.requiredSkills.slice(0, 4).map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  </div>
                  {result.missing.filter((m) => m.required).length ? (
                    <p className="text-xs text-muted-foreground">
                      Missing: {result.missing.filter((m) => m.required).map((m) => m.skill).join(", ")}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Rolling"}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <MatchExplainer result={result} title={job.title} subject={job.companies?.name ?? undefined} />
                    <JobDetailDialog job={job} />
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={applied || applyMutation.isPending}
                    onClick={() => applyMutation.mutate({ jobId: job.id, matchScore: result.score })}
                  >
                    {applied ? "Applied" : "Apply now"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JobDetailDialog({ job }: { job: ReturnType<typeof matchJobForStudent> extends never ? never : import("@/lib/data").JobWithSkills }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">View details</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{job.title}</DialogTitle>
          <DialogDescription>{job.companies?.name} · {job.location} · {job.work_mode}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{job.description}</p>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="text-muted-foreground">Type:</span> {job.opportunity_type}</p>
            <p><span className="text-muted-foreground">Duration:</span> {job.duration ?? "—"}</p>
            <p><span className="text-muted-foreground">Stipend:</span> {job.stipend ?? job.salary ?? "—"}</p>
            <p><span className="text-muted-foreground">Openings:</span> {job.openings}</p>
          </div>
          <div>
            <p className="mb-1 font-medium">Required skills</p>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </div>
          {job.preferredSkills.length ? (
            <div>
              <p className="mb-1 font-medium">Preferred skills</p>
              <div className="flex flex-wrap gap-1.5">
                {job.preferredSkills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
