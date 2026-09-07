import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Layers, Percent, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CollegeGate } from "@/components/college/college-gate";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingCards, PageHeading } from "@/components/shared/ui-states";
import { fetchStudentSkillsFor, fetchStudents } from "@/lib/data";

export const Route = createFileRoute("/college/intelligence")({
  head: () => ({
    meta: [
      { title: "Skill Intelligence | SkillBridge" },
      { name: "description", content: "Skill Intelligence on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Skill Intelligence | SkillBridge" },
      { property: "og:description", content: "Skill Intelligence on SkillBridge." },
    ],
  }),
  component: CollegeIntelligencePage,
});

function CollegeIntelligencePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Skill Intelligence"
        description="Aggregated coverage, verification and proficiency signal across your student body."
      />
      <CollegeGate>{(collegeId) => <Intelligence collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)"];

function Intelligence({ collegeId }: { collegeId: string }) {
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

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const isLoading = studentsQuery.isLoading || (studentIds.length > 0 && skillsQuery.isLoading);
  const isError = studentsQuery.isError || skillsQuery.isError;

  const rows = skillsQuery.data ?? [];
  const studentIdByDept = useMemo(() => new Map(students.map((s) => [s.id, s.department])), [students]);
  const total = students.length;

  const bySkill = useMemo(() => {
    const map = new Map<
      string,
      { name: string; category: string; verified: number; claimed: number; scoreSum: number; count: number }
    >();
    rows.forEach((r) => {
      const name = r.skills?.name ?? "Unknown";
      const entry = map.get(name) ?? {
        name,
        category: r.skills?.category ?? "",
        verified: 0,
        claimed: 0,
        scoreSum: 0,
        count: 0,
      };
      entry.claimed += 1;
      if (r.verified) entry.verified += 1;
      entry.scoreSum += r.proficiency_score;
      entry.count += 1;
      map.set(name, entry);
    });
    return Array.from(map.values())
      .map((e) => ({
        ...e,
        coveragePct: total ? Math.round((e.claimed / total) * 100) : 0,
        verifiedPct: e.claimed ? Math.round((e.verified / e.claimed) * 100) : 0,
        avgScore: e.count ? Math.round(e.scoreSum / e.count) : 0,
      }))
      .sort((a, b) => b.coveragePct - a.coveragePct);
  }, [rows, total]);

  const categories = useMemo(
    () => Array.from(new Set(bySkill.map((s) => s.category).filter(Boolean))).sort(),
    [bySkill],
  );

  const filtered = bySkill.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalVerified = rows.filter((r) => r.verified).length;
  const verifiedVsClaimed = [
    { name: "Verified", value: totalVerified },
    { name: "Claimed only", value: rows.length - totalVerified },
  ];

  const proficiencyBuckets = [
    { label: "Beginner", min: 0, max: 40 },
    { label: "Developing", min: 40, max: 60 },
    { label: "Intermediate", min: 60, max: 75 },
    { label: "Advanced", min: 75, max: 90 },
    { label: "Expert", min: 90, max: 101 },
  ].map((b) => ({
    label: b.label,
    count: rows.filter((r) => r.proficiency_score >= b.min && r.proficiency_score < b.max).length,
  }));

  const byDept = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    rows.forEach((r) => {
      const dept = studentIdByDept.get(r.student_id) ?? "Unknown";
      const entry = map.get(dept) ?? { sum: 0, count: 0 };
      entry.sum += r.proficiency_score;
      entry.count += 1;
      map.set(dept, entry);
    });
    return Array.from(map.entries())
      .map(([dept, v]) => ({ dept, avgScore: v.count ? Math.round(v.sum / v.count) : 0 }))
      .sort((a, b) => b.avgScore - a.avgScore);
  }, [rows, studentIdByDept]);

  if (isLoading) return <LoadingCards />;
  if (isError)
    return (
      <ErrorState
        message={studentsQuery.error?.message ?? skillsQuery.error?.message}
        onRetry={() => {
          void studentsQuery.refetch();
          void skillsQuery.refetch();
        }}
      />
    );

  if (!total)
    return <EmptyState icon={Users} title="No students yet" description="Add students to your roster to see skill intelligence." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Skills tracked" value={bySkill.length} icon={Layers} />
        <StatCard
          label="Verified skill entries"
          value={`${rows.length ? Math.round((totalVerified / rows.length) * 100) : 0}%`}
          icon={BadgeCheck}
          tone="success"
          hint={`${totalVerified} of ${rows.length}`}
        />
        <StatCard label="Avg proficiency score" value={`${rows.length ? Math.round(rows.reduce((a, r) => a + r.proficiency_score, 0) / rows.length) : 0}%`} icon={Percent} />
        <StatCard label="Students" value={total} icon={Users} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Verified vs. claimed skills</CardTitle></CardHeader>
          <CardContent>
            {rows.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={verifiedVsClaimed} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                    {verifiedVsClaimed.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No skill data yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Proficiency distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={proficiencyBuckets}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Department comparison — avg proficiency</CardTitle></CardHeader>
          <CardContent>
            {byDept.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byDept}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="dept" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Bar dataKey="avgScore" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No department data yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Skill coverage drill-down</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search skill" value={search} onChange={(e) => setSearch(e.target.value)} className="w-48" />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-6"><EmptyState title="No skills match" description="Try clearing your filters." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Coverage</TableHead>
                    <TableHead>Verified</TableHead>
                    <TableHead>Avg. score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="secondary">{s.category || "—"}</Badge></TableCell>
                      <TableCell>{s.coveragePct}% ({s.claimed}/{total})</TableCell>
                      <TableCell>{s.verifiedPct}%</TableCell>
                      <TableCell>{s.avgScore}%</TableCell>
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
