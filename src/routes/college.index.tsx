import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap, Percent, Rocket, Target, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CollegeGate } from "@/components/college/college-gate";
import { DemandBadge } from "@/components/shared/skill-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState, LoadingCards, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import {
  fetchApplicationsForCollege,
  fetchSkillDemand,
  fetchStudentSkillsFor,
  fetchStudents,
  statusLabel,
} from "@/lib/data";

export const Route = createFileRoute("/college/")({
  head: () => ({
    meta: [
      { title: "Institution Dashboard | SkillBridge" },
      { name: "description", content: "Institution Dashboard on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Institution Dashboard | SkillBridge" },
      { property: "og:description", content: "Institution Dashboard on SkillBridge." },
    ],
  }),
  component: CollegeIndexPage,
});

function CollegeIndexPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Institution Dashboard"
        description="A real-time snapshot of your students' placement readiness and industry alignment."
      />
      <CollegeGate>{(collegeId) => <Dashboard collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

function Dashboard({ collegeId }: { collegeId: string }) {
  const studentsQuery = useQuery({
    queryKey: ["college-students", collegeId],
    queryFn: () => fetchStudents({ collegeId }),
  });
  const students = studentsQuery.data ?? [];
  const studentIds = students.map((s) => s.id);

  const appsQuery = useQuery({
    queryKey: ["college-applications", collegeId],
    queryFn: () => fetchApplicationsForCollege(collegeId),
  });

  const skillsQuery = useQuery({
    queryKey: ["college-student-skills", studentIds],
    queryFn: () => fetchStudentSkillsFor(studentIds),
    enabled: studentIds.length > 0,
  });

  const demandQuery = useQuery({ queryKey: ["skill-demand"], queryFn: fetchSkillDemand });

  if (studentsQuery.isLoading) return <LoadingCards />;
  if (studentsQuery.isError)
    return <ErrorState message={studentsQuery.error.message} onRetry={() => studentsQuery.refetch()} />;

  const applications = appsQuery.data ?? [];
  const skillRows = skillsQuery.data ?? [];
  const demand = demandQuery.data ?? [];

  const total = students.length;
  const avg = (nums: number[]) => (nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : 0);
  const avgReadiness = avg(students.map((s) => s.readiness_score));
  const avgSkillScore = avg(skillRows.map((r) => r.proficiency_score));
  const placementReady = students.filter((s) => s.readiness_score >= 75).length;

  const applicantIds = new Set(applications.map((a) => a.student_id));
  const internshipParticipation = students.filter((s) => applicantIds.has(s.id)).length;
  const selectedStudentIds = new Set(
    applications.filter((a) => a.status === "selected").map((a) => a.student_id),
  );
  const placementRate = total ? Math.round((selectedStudentIds.size / total) * 100) : 0;

  // Department-wise average readiness
  const byDept = new Map<string, number[]>();
  students.forEach((s) => {
    const arr = byDept.get(s.department) ?? [];
    arr.push(s.readiness_score);
    byDept.set(s.department, arr);
  });
  const deptChart = Array.from(byDept.entries())
    .map(([dept, scores]) => ({ dept, avgReadiness: avg(scores), count: scores.length }))
    .sort((a, b) => b.avgReadiness - a.avgReadiness);

  // Readiness distribution histogram
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

  // Applications funnel
  const funnelOrder = ["applied", "under_review", "shortlisted", "interview", "selected"];
  const funnelChart = funnelOrder.map((status) => ({
    status: statusLabel(status),
    count: applications.filter((a) => a.status === status).length,
  }));

  // Demand vs readiness heatmap (top 12 demanded skills)
  const topDemand = [...demand]
    .reduce<Map<string, { skill: string; category: string; demandLevel: string; demandScore: number }>>(
      (map, d) => {
        const name = d.skills?.name ?? "Unknown";
        const existing = map.get(name);
        if (!existing || d.demand_score > existing.demandScore) {
          map.set(name, {
            skill: name,
            category: d.skills?.category ?? "",
            demandLevel: d.demand_score >= 85 ? "Very High" : d.demand_score >= 70 ? "High" : d.demand_score >= 50 ? "Medium" : "Low",
            demandScore: d.demand_score,
          });
        }
        return map;
      },
      new Map(),
    );
  const heatmap = Array.from(topDemand.values())
    .sort((a, b) => b.demandScore - a.demandScore)
    .slice(0, 12)
    .map((d) => {
      const proficient = skillRows.filter(
        (r) => r.skills?.name === d.skill && r.proficiency_score >= 60,
      ).length;
      const pct = total ? Math.round((proficient / total) * 100) : 0;
      return { ...d, pct, gap: Math.max(0, d.demandScore - pct) };
    });

  const openGapCount = heatmap.filter((h) => h.gap >= 25).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={total} icon={Users} />
        <StatCard label="Placement Ready (≥75)" value={placementReady} icon={Target} tone="success" hint={`${total ? Math.round((placementReady / total) * 100) : 0}% of cohort`} />
        <StatCard label="Avg Skill Score" value={`${avgSkillScore}%`} icon={TrendingUp} />
        <StatCard label="Avg Readiness" value={`${avgReadiness}%`} icon={GraduationCap} />
        <StatCard label="Internship Participation" value={internshipParticipation} icon={Rocket} hint={`${total ? Math.round((internshipParticipation / total) * 100) : 0}% applied at least once`} />
        <StatCard label="Placement Rate" value={`${placementRate}%`} icon={Percent} tone="success" hint={`${selectedStudentIds.size} selected`} />
        <StatCard label="Open Industry Skill Gaps" value={openGapCount} tone="warning" hint="Skills with ≥25pt gap" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
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
                  <Bar dataKey="avgReadiness" fill="var(--chart-1)" radius={[4, 4, 0, 0]} name="Avg Readiness" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No department data yet.</p>
            )}
          </CardContent>
        </Card>

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
          <CardHeader><CardTitle>Applications funnel</CardTitle></CardHeader>
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

        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild variant="outline" className="justify-start"><Link to="/college/gaps">Analyse skill gaps</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/college/training">Manage training programs</Link></Button>
            <Button asChild variant="outline" className="justify-start"><Link to="/college/drives">View placement drives</Link></Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Industry Skill Demand vs Student Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          {skillsQuery.isLoading || demandQuery.isLoading ? (
            <LoadingRows count={4} />
          ) : heatmap.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Demand level</TableHead>
                    <TableHead className="text-right">Industry demand score</TableHead>
                    <TableHead className="text-right">% our students proficient</TableHead>
                    <TableHead className="text-right">Gap</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {heatmap.map((h) => (
                    <TableRow key={h.skill}>
                      <TableCell className="font-medium">{h.skill}</TableCell>
                      <TableCell><DemandBadge level={h.demandLevel} /></TableCell>
                      <TableCell className="text-right tabular-nums">{h.demandScore}</TableCell>
                      <TableCell className="text-right tabular-nums">{h.pct}%</TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            h.gap >= 40
                              ? "bg-destructive/10 text-destructive"
                              : h.gap >= 20
                                ? "bg-warning/20 text-warning-foreground"
                                : "bg-success/15 text-success"
                          }
                        >
                          {h.gap} pt gap
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No industry demand data available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
