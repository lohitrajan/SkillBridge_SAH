import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ClipboardCheck, GraduationCap, Percent, Target } from "lucide-react";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CollegeGate } from "@/components/college/college-gate";
import { downloadCsv } from "@/components/college/csv";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingCards, PageHeading } from "@/components/shared/ui-states";
import { fetchAllAttempts, fetchApplicationsForCollege, statusLabel, fetchStudents } from "@/lib/data";

export const Route = createFileRoute("/college/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics | SkillBridge" },
      { name: "description", content: "Placement analytics on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Analytics | SkillBridge" },
      { property: "og:description", content: "Placement analytics on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeAnalyticsPage,
});

function CollegeAnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Placement Analytics" description="Readiness, applications and assessment participation across your cohort." />
      <CollegeGate>{(collegeId) => <Analytics collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

function Analytics({ collegeId }: { collegeId: string }) {
  const studentsQuery = useQuery({ queryKey: ["college-students", collegeId], queryFn: () => fetchStudents({ collegeId }) });
  const appsQuery = useQuery({ queryKey: ["college-applications", collegeId], queryFn: () => fetchApplicationsForCollege(collegeId) });
  const attemptsQuery = useQuery({ queryKey: ["all-attempts"], queryFn: () => fetchAllAttempts() });

  const students = studentsQuery.data ?? [];
  const studentIds = useMemo(() => new Set(students.map((s) => s.id)), [students]);
  const applications = appsQuery.data ?? [];
  const attempts = (attemptsQuery.data ?? []).filter((a) => studentIds.has(a.student_id));

  const isLoading = studentsQuery.isLoading || appsQuery.isLoading || attemptsQuery.isLoading;
  const isError = studentsQuery.isError || appsQuery.isError || attemptsQuery.isError;

  const total = students.length;
  const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);
  const avgReadiness = avg(students.map((s) => s.readiness_score));
  const placementReady = students.filter((s) => s.readiness_score >= 75).length;

  const buckets = [
    { label: "0-40", min: 0, max: 40 },
    { label: "40-60", min: 40, max: 60 },
    { label: "60-75", min: 60, max: 75 },
    { label: "75-90", min: 75, max: 90 },
    { label: "90-100", min: 90, max: 101 },
  ];
  const distChart = buckets.map((b) => ({
    label: b.label,
    students: students.filter((s) => s.readiness_score >= b.min && s.readiness_score < b.max).length,
  }));

  const byDept = new Map<string, number[]>();
  students.forEach((s) => {
    const arr = byDept.get(s.department) ?? [];
    arr.push(s.readiness_score);
    byDept.set(s.department, arr);
  });
  const deptChart = Array.from(byDept.entries())
    .map(([dept, scores]) => ({ dept, avgReadiness: avg(scores), count: scores.length }))
    .sort((a, b) => b.avgReadiness - a.avgReadiness);

  const funnelOrder = ["applied", "under_review", "shortlisted", "interview", "selected", "rejected"];
  const funnelChart = funnelOrder.map((status) => ({
    status: statusLabel(status),
    count: applications.filter((a) => a.status === status).length,
  }));

  const studentsWithAttempts = new Set(attempts.map((a) => a.student_id)).size;
  const participationPct = total ? Math.round((studentsWithAttempts / total) * 100) : 0;
  const avgAttemptScore = avg(attempts.map((a) => a.score));

  const exportCsv = () => {
    downloadCsv(
      "placement-analytics.csv",
      students.map((s) => ({
        Name: s.full_name,
        Department: s.department,
        Year: s.year,
        Readiness: s.readiness_score,
        Applications: applications.filter((a) => a.student_id === s.id).length,
        Selected: applications.filter((a) => a.student_id === s.id && a.status === "selected").length,
        "Assessment Attempts": attempts.filter((a) => a.student_id === s.id).length,
      })),
    );
  };

  if (isLoading) return <LoadingCards />;
  if (isError)
    return (
      <ErrorState
        message={studentsQuery.error?.message ?? appsQuery.error?.message ?? attemptsQuery.error?.message}
        onRetry={() => {
          void studentsQuery.refetch();
          void appsQuery.refetch();
          void attemptsQuery.refetch();
        }}
      />
    );

  if (!total)
    return <EmptyState icon={Target} title="No students yet" description="Add students to your roster to see analytics." />;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCsv} className="gap-1.5">
          <ArrowDownToLine className="size-4" /> Export CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg readiness" value={`${avgReadiness}%`} icon={GraduationCap} />
        <StatCard label="Placement ready" value={placementReady} tone="success" icon={Target} hint={`${total ? Math.round((placementReady / total) * 100) : 0}% of cohort`} />
        <StatCard label="Total applications" value={applications.length} icon={Percent} />
        <StatCard label="Assessment participation" value={`${participationPct}%`} icon={ClipboardCheck} hint={`Avg score ${avgAttemptScore}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Readiness distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distChart}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="students" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Department-wise average readiness</CardTitle></CardHeader>
          <CardContent>
            {deptChart.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={deptChart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dept" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="avgReadiness" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No department data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Application funnel</CardTitle></CardHeader>
          <CardContent>
            {applications.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={funnelChart} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis type="category" dataKey="status" width={100} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="var(--chart-3)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No applications submitted yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Department breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Avg readiness</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptChart.map((d) => (
                  <TableRow key={d.dept}>
                    <TableCell className="font-medium">{d.dept}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.avgReadiness}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
