import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Target } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CollegeGate } from "@/components/college/college-gate";
import { DemandBadge } from "@/components/shared/skill-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingCards, PageHeading } from "@/components/shared/ui-states";
import {
  fetchRoleTemplates,
  fetchSkillDemand,
  fetchStudentSkillsFor,
  fetchStudents,
} from "@/lib/data";

export const Route = createFileRoute("/college/gaps")({
  head: () => ({
    meta: [
      { title: "Skill Gaps | SkillBridge" },
      { name: "description", content: "Skill gap analysis on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Skill Gaps | SkillBridge" },
      { property: "og:description", content: "Skill gap analysis on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeGapsPage,
});

function CollegeGapsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Skill Gaps"
        description="Where your students' skills fall short of industry demand and role requirements."
      />
      <CollegeGate>{(collegeId) => <Gaps collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

function Gaps({ collegeId }: { collegeId: string }) {
  const studentsQuery = useQuery({
    queryKey: ["college-students", collegeId],
    queryFn: () => fetchStudents({ collegeId }),
  });
  const students = studentsQuery.data ?? [];
  const studentIds = students.map((s) => s.id);

  const skillsQuery = useQuery({
    queryKey: ["college-student-skills", studentIds],
    queryFn: () => fetchStudentSkillsFor(studentIds),
    enabled: studentIds.length > 0,
  });
  const demandQuery = useQuery({ queryKey: ["skill-demand"], queryFn: fetchSkillDemand });
  const templatesQuery = useQuery({ queryKey: ["role-templates"], queryFn: fetchRoleTemplates });

  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("all");

  const departments = useMemo(() => Array.from(new Set(students.map((s) => s.department))).sort(), [students]);
  const years = useMemo(() => Array.from(new Set(students.map((s) => s.year))).sort(), [students]);

  const scopedStudents = students.filter((s) => {
    if (department !== "all" && s.department !== department) return false;
    if (year !== "all" && String(s.year) !== year) return false;
    return true;
  });
  const scopedIds = new Set(scopedStudents.map((s) => s.id));

  const isLoading = studentsQuery.isLoading || demandQuery.isLoading || templatesQuery.isLoading || (studentIds.length > 0 && skillsQuery.isLoading);
  const isError = studentsQuery.isError || demandQuery.isError || templatesQuery.isError || skillsQuery.isError;

  const rows = (skillsQuery.data ?? []).filter((r) => scopedIds.has(r.student_id));
  const demand = demandQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  const gapRows = useMemo(() => {
    const proficientBy = new Map<string, Set<string>>();
    rows.forEach((r) => {
      const name = r.skills?.name;
      if (!name || r.proficiency_score < 60) return;
      const set = proficientBy.get(name) ?? new Set<string>();
      set.add(r.student_id);
      proficientBy.set(name, set);
    });

    const roleDemandCount = new Map<string, number>();
    templates.forEach((t) => {
      t.required_skills.forEach((s) => roleDemandCount.set(s, (roleDemandCount.get(s) ?? 0) + 1));
    });

    const bestDemand = new Map<string, { score: number; category: string }>();
    demand.forEach((d) => {
      const name = d.skills?.name;
      if (!name) return;
      const existing = bestDemand.get(name);
      if (!existing || d.demand_score > existing.score) {
        bestDemand.set(name, { score: d.demand_score, category: d.skills?.category ?? "" });
      }
    });

    const allSkillNames = new Set([...bestDemand.keys(), ...roleDemandCount.keys()]);
    const total = scopedStudents.length || 1;

    return Array.from(allSkillNames)
      .map((name) => {
        const proficientCount = proficientBy.get(name)?.size ?? 0;
        const demandScore = bestDemand.get(name)?.score ?? 0;
        const roleCount = roleDemandCount.get(name) ?? 0;
        const coveragePct = Math.round((proficientCount / total) * 100);
        const affected = scopedStudents.length - proficientCount;
        const demandLevel = demandScore >= 85 ? "Very High" : demandScore >= 70 ? "High" : demandScore >= 50 ? "Medium" : "Low";
        const gapScore = Math.max(0, demandScore - coveragePct) + roleCount * 5;
        return {
          name,
          category: bestDemand.get(name)?.category ?? "",
          demandScore,
          demandLevel,
          roleCount,
          coveragePct,
          affected,
          gapScore,
        };
      })
      .filter((g) => g.demandScore > 0 || g.roleCount > 0)
      .sort((a, b) => b.gapScore - a.gapScore);
  }, [rows, demand, templates, scopedStudents]);

  if (isLoading) return <LoadingCards />;
  if (isError)
    return (
      <ErrorState
        message={studentsQuery.error?.message ?? demandQuery.error?.message ?? templatesQuery.error?.message ?? skillsQuery.error?.message}
        onRetry={() => {
          void studentsQuery.refetch();
          void demandQuery.refetch();
          void templatesQuery.refetch();
          void skillsQuery.refetch();
        }}
      />
    );

  if (!students.length)
    return <EmptyState icon={Target} title="No students yet" description="Add students to your roster to analyse skill gaps." />;

  const topGaps = gapRows.slice(0, 10);
  const criticalGaps = gapRows.filter((g) => g.affected / (scopedStudents.length || 1) >= 0.5 && g.demandScore >= 60).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {years.map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button asChild variant="outline" className="ml-auto">
          <Link to="/college/training">Plan training programs</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Students in scope" value={scopedStudents.length} icon={Target} />
        <StatCard label="Skills tracked" value={gapRows.length} />
        <StatCard label="Critical gaps" value={criticalGaps} tone="warning" icon={AlertTriangle} hint="≥50% of students below proficiency & high demand" />
      </div>

      <Card>
        <CardHeader><CardTitle>Top gap skills</CardTitle></CardHeader>
        <CardContent>
          {topGaps.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topGaps} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="affected" fill="var(--chart-3)" radius={[0, 4, 4, 0]} name="Students affected" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No gap data available.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Skill gap detail</CardTitle></CardHeader>
        <CardContent className="p-0">
          {gapRows.length === 0 ? (
            <div className="p-6"><EmptyState title="No gaps found" description="Your students' skills currently align with demand and role templates." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Demand</TableHead>
                    <TableHead className="text-right">Roles requiring</TableHead>
                    <TableHead className="text-right">Coverage</TableHead>
                    <TableHead className="text-right">Students affected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gapRows.map((g) => (
                    <TableRow key={g.name}>
                      <TableCell className="font-medium">{g.name}</TableCell>
                      <TableCell><DemandBadge level={g.demandLevel} /></TableCell>
                      <TableCell className="text-right tabular-nums">{g.roleCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.coveragePct}%</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className={g.affected > 0 ? "bg-warning/20 text-warning-foreground" : "bg-success/15 text-success"}>
                          {g.affected}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
