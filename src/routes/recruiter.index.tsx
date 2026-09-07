import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Briefcase,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MatchExplainer } from "@/components/shared/match-explainer";
import { MatchPill } from "@/components/shared/skill-badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  EmptyState,
  ErrorState,
  LoadingCards,
  LoadingRows,
  PageHeading,
} from "@/components/shared/ui-states";
import { SkillPassportDialog } from "@/components/recruiter/skill-passport-dialog";
import { loadStudentPool, rankStudents } from "@/components/recruiter/match-utils";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchApplicationsForCompany,
  fetchJobs,
  statusLabel,
  type StudentRow,
} from "@/lib/data";
import { useState } from "react";

export const Route = createFileRoute("/recruiter/")({
  head: () => ({
    meta: [
      { title: "Recruiter Dashboard | SkillBridge" },
      {
        name: "description",
        content: "Recruiter Dashboard on SkillBridge, the academia-industry skill collaboration portal.",
      },
      { property: "og:title", content: "Recruiter Dashboard | SkillBridge" },
      { property: "og:description", content: "Recruiter Dashboard on SkillBridge." },
    ],
  }),
  component: RecruiterIndexPage,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

function RecruiterIndexPage() {
  const { companyId } = useAuth();
  const [passportStudent, setPassportStudent] = useState<StudentRow | null>(null);

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
  const poolQ = useQuery({
    queryKey: ["student-pool"],
    queryFn: loadStudentPool,
    enabled: !!companyId,
  });

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Recruiter Dashboard" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile to post opportunities and discover verified talent."
          action={
            <Button asChild>
              <Link to="/recruiter/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isLoading = jobsQ.isLoading || appsQ.isLoading || poolQ.isLoading;
  const isError = jobsQ.isError || appsQ.isError || poolQ.isError;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Recruiter Dashboard" />
        <ErrorState
          message={(jobsQ.error ?? appsQ.error ?? poolQ.error)?.message}
          onRetry={() => {
            void jobsQ.refetch();
            void appsQ.refetch();
            void poolQ.refetch();
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Recruiter Dashboard" />
        <LoadingCards />
        <LoadingRows />
      </div>
    );
  }

  const jobs = jobsQ.data ?? [];
  const apps = appsQ.data ?? [];
  const activePostings = jobs.filter((j) => j.status === "published");
  const shortlisted = apps.filter((a) => a.status === "shortlisted").length;
  const interviews = apps.filter((a) => a.status === "interview").length;
  const selected = apps.filter((a) => a.status === "selected").length;
  const avgMatch = apps.length
    ? Math.round(apps.reduce((a, r) => a + r.match_score, 0) / apps.length)
    : 0;

  const funnelStatuses = ["applied", "under_review", "shortlisted", "interview", "selected"] as const;
  const funnelData = funnelStatuses.map((s) => ({
    name: statusLabel(s),
    count: apps.filter((a) => a.status === s).length,
  }));

  const applicantIds = new Set(apps.map((a) => a.student_id));
  const skillCounts = new Map<string, number>();
  (poolQ.data?.skills ?? [])
    .filter((s) => applicantIds.has(s.student_id))
    .forEach((s) => {
      const name = s.skills?.name ?? "Unknown";
      skillCounts.set(name, (skillCounts.get(name) ?? 0) + 1);
    });
  const skillDist = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  const mostRecentJob = jobs[0];
  const recommended =
    mostRecentJob && poolQ.data
      ? rankStudents(poolQ.data.students, poolQ.data.skills, poolQ.data.projects, {
          requiredSkills: mostRecentJob.requiredSkills,
          preferredSkills: mostRecentJob.preferredSkills,
          graduationYear: mostRecentJob.graduation_year,
        }).slice(0, 5)
      : [];

  const demandedSkills = new Map<string, number>();
  jobs.forEach((j) => j.requiredSkills.forEach((s) => demandedSkills.set(s, (demandedSkills.get(s) ?? 0) + 1)));
  const topDemanded = [...demandedSkills.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <div className="space-y-8">
      <PageHeading
        title="Recruiter Dashboard"
        description="Track your postings, pipeline health and top-matched talent."
        actions={
          <>
            <Button asChild>
              <Link to="/recruiter/post">Post opportunity</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/recruiter/talent">Find talent</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active postings" value={activePostings.length} icon={Briefcase} />
        <StatCard label="Total applications" value={apps.length} icon={ClipboardList} />
        <StatCard label="Shortlisted" value={shortlisted} icon={Star} tone="accent" />
        <StatCard label="Interviews" value={interviews} icon={CalendarClock} tone="warning" />
        <StatCard label="Selected" value={selected} icon={CheckCircle2} tone="success" />
        <StatCard label="Avg. match score" value={`${avgMatch}%`} icon={Sparkles} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Application pipeline funnel</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {apps.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {funnelData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No applications yet" description="Post an opportunity to start receiving applications." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills your applicants have</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {skillDist.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillDist} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No skill data yet" description="Applicant skills will appear once you receive applications." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active postings</CardTitle>
        </CardHeader>
        <CardContent>
          {activePostings.length ? (
            <div className="space-y-2">
              {activePostings.map((job) => {
                const count = apps.filter((a) => a.job_id === job.id).length;
                return (
                  <Link
                    key={job.id}
                    to="/recruiter/applications"
                    search={{ job: job.id }}
                    className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium">{job.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.openings} opening{job.openings === 1 ? "" : "s"} ·{" "}
                        {job.deadline ? `Closes ${new Date(job.deadline).toLocaleDateString()}` : "No deadline"}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-primary">{count} applications</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No active postings"
              description="Publish an opportunity to start receiving applications."
              action={
                <Button asChild>
                  <Link to="/recruiter/post">Post opportunity</Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" /> Top recommended students
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!mostRecentJob ? (
              <EmptyState title="Post an opportunity" description="We'll recommend students once you publish a posting." />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Ranked against your most recent posting — {mostRecentJob.title}
                </p>
                {recommended.map(({ student, match }) => (
                  <div key={student.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{student.full_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.department} · {student.target_role}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <MatchPill score={match.score} />
                      <MatchExplainer result={match} title={mostRecentJob.title} subject={student.full_name} />
                      <Button variant="ghost" size="sm" onClick={() => setPassportStudent(student)}>
                        Passport
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top demanded skills in your postings</CardTitle>
          </CardHeader>
          <CardContent>
            {topDemanded.length ? (
              <ul className="space-y-2">
                {topDemanded.map(([name, count]) => (
                  <li key={name} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="text-muted-foreground">{count} posting{count === 1 ? "" : "s"}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No skills yet" description="Add required skills when posting an opportunity." />
            )}
          </CardContent>
        </Card>
      </div>

      <SkillPassportDialog
        student={passportStudent}
        open={!!passportStudent}
        onOpenChange={(o) => !o && setPassportStudent(null)}
      />
    </div>
  );
}
