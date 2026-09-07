import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Percent,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingCards, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import {
  fetchAllApplications,
  fetchAllAttempts,
  fetchColleges,
  fetchCompanies,
  fetchJobs,
  fetchStudents,
} from "@/lib/data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Platform Overview | SkillBridge" },
      { name: "description", content: "Platform Overview on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Platform Overview | SkillBridge" },
      { property: "og:description", content: "Platform Overview on SkillBridge." },
    ],
  }),
  component: AdminIndexPage,
});

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
}

function AdminIndexPage() {
  const studentsQ = useQuery({ queryKey: ["admin-students"], queryFn: () => fetchStudents() });
  const collegesQ = useQuery({ queryKey: ["admin-colleges"], queryFn: fetchColleges });
  const companiesQ = useQuery({ queryKey: ["admin-companies"], queryFn: fetchCompanies });
  const jobsQ = useQuery({ queryKey: ["admin-jobs"], queryFn: () => fetchJobs() });
  const appsQ = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchAllApplications(2000) });
  const attemptsQ = useQuery({ queryKey: ["admin-attempts"], queryFn: () => fetchAllAttempts(2000) });

  const loading =
    studentsQ.isLoading || collegesQ.isLoading || companiesQ.isLoading || jobsQ.isLoading || appsQ.isLoading || attemptsQ.isLoading;
  const anyError = studentsQ.isError || collegesQ.isError || companiesQ.isError || jobsQ.isError || appsQ.isError || attemptsQ.isError;

  return (
    <div className="space-y-6">
      <PageHeading title="Platform Overview" description="A real-time snapshot of SkillBridge activity across all roles." />

      {loading ? (
        <LoadingCards count={8} />
      ) : anyError ? (
        <ErrorState
          message="Some dashboard data failed to load."
          onRetry={() => {
            void studentsQ.refetch();
            void collegesQ.refetch();
            void companiesQ.refetch();
            void jobsQ.refetch();
            void appsQ.refetch();
            void attemptsQ.refetch();
          }}
        />
      ) : (
        <Dashboard
          students={studentsQ.data ?? []}
          colleges={collegesQ.data ?? []}
          companies={companiesQ.data ?? []}
          jobs={jobsQ.data ?? []}
          applications={appsQ.data ?? []}
          attempts={attemptsQ.data ?? []}
        />
      )}
    </div>
  );
}

function Dashboard({
  students,
  colleges,
  companies,
  jobs,
  applications,
  attempts,
}: {
  students: ReturnType<typeof fetchStudents> extends Promise<infer T> ? T : never;
  colleges: ReturnType<typeof fetchColleges> extends Promise<infer T> ? T : never;
  companies: ReturnType<typeof fetchCompanies> extends Promise<infer T> ? T : never;
  jobs: ReturnType<typeof fetchJobs> extends Promise<infer T> ? T : never;
  applications: ReturnType<typeof fetchAllApplications> extends Promise<infer T> ? T : never;
  attempts: ReturnType<typeof fetchAllAttempts> extends Promise<infer T> ? T : never;
}) {
  const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);
  const avgReadiness = avg(students.map((s) => s.readiness_score));
  const selectedStudentIds = new Set(applications.filter((a) => a.status === "selected").map((a) => a.student_id));
  const placementRate = students.length ? Math.round((selectedStudentIds.size / students.length) * 100) : 0;

  const signupBuckets = new Map<string, number>();
  const createdKeys = [
    ...companies.map((c) => (c as unknown as { created_at?: string }).created_at),
    ...colleges.map((c) => (c as unknown as { created_at?: string }).created_at),
  ].filter((v): v is string => !!v);
  createdKeys.forEach((iso) => {
    const k = monthKey(iso);
    signupBuckets.set(k, (signupBuckets.get(k) ?? 0) + 1);
  });

  const appBuckets = new Map<string, number>();
  applications.forEach((a) => {
    const k = monthKey(a.created_at);
    appBuckets.set(k, (appBuckets.get(k) ?? 0) + 1);
  });
  const trendChart = Array.from(new Set([...signupBuckets.keys(), ...appBuckets.keys()]))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .map((k) => ({ month: k, signups: signupBuckets.get(k) ?? 0, applications: appBuckets.get(k) ?? 0 }));

  type Activity = { id: string; label: string; sub: string; at: string };
  const activity: Activity[] = [
    ...applications.slice(0, 6).map((a) => ({
      id: `app-${a.id}`,
      label: `${a.students?.full_name ?? "A student"} applied to ${a.job_postings?.title ?? "an opportunity"}`,
      sub: a.job_postings?.companies?.name ?? "",
      at: a.created_at,
    })),
    ...attempts.slice(0, 6).map((a) => ({
      id: `attempt-${a.id}`,
      label: `Attempt on ${a.assessments?.title ?? "an assessment"} scored ${a.score}%`,
      sub: "",
      at: a.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={students.length} icon={GraduationCap} />
        <StatCard label="Colleges" value={colleges.length} icon={Building2} />
        <StatCard label="Companies" value={companies.length} icon={ShieldCheck} />
        <StatCard label="Postings" value={jobs.length} icon={Briefcase} />
        <StatCard label="Applications" value={applications.length} icon={FileText} />
        <StatCard label="Assessments taken" value={attempts.length} icon={ClipboardCheck} />
        <StatCard label="Avg readiness" value={`${avgReadiness}%`} icon={TrendingUp} />
        <StatCard label="Placement rate" value={`${placementRate}%`} icon={Percent} tone="success" hint={`${selectedStudentIds.size} selected`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Signups &amp; applications over time</CardTitle></CardHeader>
          <CardContent>
            {trendChart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Area type="monotone" dataKey="signups" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.2} name="Signups" />
                  <Area type="monotone" dataKey="applications" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.2} name="Applications" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Not enough data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline" className="justify-start"><Link to="/admin/users"><Users className="size-4" /> Manage users</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/admin/students">Students directory</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/admin/colleges">Colleges</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/admin/industries">Industries</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/admin/opportunities">Opportunities</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/admin/reports">Reports</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent activity</CardTitle></CardHeader>
        <CardContent>
          {activity.length ? (
            <ul className="divide-y divide-border">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{a.label}</p>
                    {a.sub ? <p className="truncate text-xs text-muted-foreground">{a.sub}</p> : null}
                  </div>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {new Date(a.at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <LoadingRows count={3} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
