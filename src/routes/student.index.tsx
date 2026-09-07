import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ClipboardCheck, Sparkles, Target, XCircle } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { ReadinessRing } from "@/components/shared/readiness-ring";
import { MatchPill } from "@/components/shared/skill-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  applyToJob,
  fetchApplicationsForStudent,
  fetchAssessments,
  fetchAttempts,
  fetchJobs,
  fetchProjects,
  fetchRoleTemplates,
  fetchStudent,
  fetchStudentSkills,
} from "@/lib/data";
import { readinessBreakdown } from "@/lib/matching";
import { matchJobForStudent, matchRoleForStudent, resolveRoleTemplate, timeOfDayGreeting } from "@/components/student/shared";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Dashboard | SkillBridge" },
      { name: "description", content: "Dashboard on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Dashboard | SkillBridge" },
      { property: "og:description", content: "Dashboard on SkillBridge." },
    ],
  }),
  component: StudentIndexPage,
});

function StudentIndexPage() {
  const { studentId, profile } = useAuth();
  const queryClient = useQueryClient();

  const enabled = !!studentId;
  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId as string),
    enabled,
  });
  const skillsQuery = useQuery({
    queryKey: ["student-skills", studentId],
    queryFn: () => fetchStudentSkills(studentId as string),
    enabled,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", studentId],
    queryFn: () => fetchProjects(studentId as string),
    enabled,
  });
  const rolesQuery = useQuery({ queryKey: ["role-templates"], queryFn: fetchRoleTemplates, enabled });
  const jobsQuery = useQuery({ queryKey: ["jobs", "open"], queryFn: () => fetchJobs({ status: "open" }), enabled });
  const applicationsQuery = useQuery({
    queryKey: ["applications", studentId],
    queryFn: () => fetchApplicationsForStudent(studentId as string),
    enabled,
  });
  const assessmentsQuery = useQuery({ queryKey: ["assessments"], queryFn: fetchAssessments, enabled });
  const attemptsQuery = useQuery({
    queryKey: ["attempts", studentId],
    queryFn: () => fetchAttempts(studentId as string),
    enabled,
  });

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
        <PageHeading title="Dashboard" />
        <EmptyState
          icon={Sparkles}
          title="Finish setting up your profile"
          description="Complete onboarding to unlock your dashboard, skill gap analysis, and internship matches."
          action={
            <Button asChild>
              <Link to="/student/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const anyLoading =
    studentQuery.isLoading || skillsQuery.isLoading || projectsQuery.isLoading || rolesQuery.isLoading || jobsQuery.isLoading;
  const anyError = studentQuery.isError || skillsQuery.isError || projectsQuery.isError || rolesQuery.isError || jobsQuery.isError;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Dashboard" />
        <LoadingRows count={6} />
      </div>
    );
  }
  if (anyError || !studentQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeading title="Dashboard" />
        <ErrorState
          onRetry={() => {
            void studentQuery.refetch();
            void skillsQuery.refetch();
            void projectsQuery.refetch();
            void rolesQuery.refetch();
            void jobsQuery.refetch();
          }}
        />
      </div>
    );
  }

  const student = studentQuery.data;
  const skills = skillsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const applications = applicationsQuery.data ?? [];
  const assessments = assessmentsQuery.data ?? [];
  const attempts = attemptsQuery.data ?? [];

  const firstName = (student.full_name || profile?.full_name || "there").split(" ")[0];
  const breakdown = readinessBreakdown(student);
  const role = resolveRoleTemplate(roles, student.target_role);
  const matchResult = role ? matchRoleForStudent(student, skills, projects, role) : null;

  const appliedJobIds = new Set(applications.map((a) => a.job_id));
  const jobMatches = jobs
    .map((job) => ({ job, result: matchJobForStudent(student, skills, projects, job, applications.length) }))
    .sort((a, b) => b.result.score - a.result.score)
    .slice(0, 3);

  const pendingAssessments = assessments.filter(
    (a) => !attempts.some((at) => at.assessment_id === a.id),
  );

  const highPriorityMissing = matchResult ? matchResult.missing.filter((m) => m.priority === "HIGH") : [];

  const actions: { label: string; to: string }[] = [];
  if (highPriorityMissing[0]) {
    actions.push({ label: `Close the ${highPriorityMissing[0].skill} gap`, to: "/student/skill-gap" });
  }
  if (pendingAssessments[0]) {
    actions.push({ label: `Take the ${pendingAssessments[0].title} assessment`, to: "/student/assessments" });
  }
  if (projects.length < 2) {
    actions.push({ label: "Add a project to your portfolio", to: "/student/projects" });
  }
  actions.push({ label: "Review your learning roadmap", to: "/student/roadmap" });

  const recentVerifications = [...skills]
    .filter((s) => s.last_verified_at)
    .sort((a, b) => (b.last_verified_at ?? "").localeCompare(a.last_verified_at ?? ""))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeading
        title={`${timeOfDayGreeting()}, ${firstName}`}
        description={`Targeting ${student.target_role || "a role"} · ${student.department}, Year ${student.year}`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Placement readiness</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <ReadinessRing value={student.readiness_score} />
            <div className="w-full space-y-2">
              {breakdown.map((b) => (
                <div key={b.label} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{b.label}</span>
                  <span className="font-medium tabular-nums">{Math.round(b.value)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="size-4 text-primary" /> Skill gap vs {role?.title ?? student.target_role}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {matchResult ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {matchResult.matched.map((m) => (
                    <span key={m.skill} className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                      <CheckCircle2 className="size-3.5" /> {m.skill}
                    </span>
                  ))}
                  {matchResult.missing.filter((m) => m.required).map((m) => (
                    <span key={m.skill} className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                      <XCircle className="size-3.5" /> {m.skill}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {highPriorityMissing.length} high-priority skill{highPriorityMissing.length === 1 ? "" : "s"} missing for your target role.
                </p>
                <div>
                  <p className="mb-2 text-sm font-medium">Recommended actions</p>
                  <ul className="space-y-2">
                    {actions.map((a) => (
                      <li key={a.label}>
                        <Link to={a.to} className="text-sm text-primary underline-offset-2 hover:underline">
                          {a.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Set a target role to see your skill gap.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Top internship matches</h2>
        {jobMatches.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No open opportunities yet" description="Check back soon for new listings." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobMatches.map(({ job, result }) => {
              const applied = appliedJobIds.has(job.id);
              return (
                <Card key={job.id}>
                  <CardHeader className="space-y-1 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{job.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{job.companies?.name} · {job.location}</p>
                      </div>
                      <MatchPill score={result.score} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {job.requiredSkills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                    {result.missing.filter((m) => m.required).length ? (
                      <p className="text-xs text-muted-foreground">
                        Missing: {result.missing.filter((m) => m.required).map((m) => m.skill).join(", ")}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Deadline: {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Rolling"}
                    </p>
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

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Recent skill verifications</h2>
        {recentVerifications.length === 0 ? (
          <EmptyState title="No verified skills yet" description="Take an assessment to verify your skills." />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Assessment score</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last verified</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentVerifications.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.skills?.name ?? "—"}</TableCell>
                    <TableCell>{s.assessment_score != null ? `${s.assessment_score}%` : "—"}</TableCell>
                    <TableCell>{s.verification_source ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={s.verified ? "bg-success/15 text-success" : ""}>
                        {s.verified ? "Verified" : "Unverified"}
                      </Badge>
                    </TableCell>
                    <TableCell>{s.last_verified_at ? new Date(s.last_verified_at).toLocaleDateString() : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
