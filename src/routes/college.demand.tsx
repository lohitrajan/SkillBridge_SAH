import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Factory, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CollegeGate } from "@/components/college/college-gate";
import { DemandBadge } from "@/components/shared/skill-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingCards, PageHeading } from "@/components/shared/ui-states";
import { fetchSkillDemand, fetchStudentSkillsFor, fetchStudents } from "@/lib/data";

export const Route = createFileRoute("/college/demand")({
  head: () => ({
    meta: [
      { title: "Industry Demand | SkillBridge" },
      { name: "description", content: "Industry Demand on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Industry Demand | SkillBridge" },
      { property: "og:description", content: "Industry Demand on SkillBridge." },
    ],
  }),
  component: CollegeDemandPage,
});

function CollegeDemandPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Industry Demand"
        description="See how industry skill demand compares to what your students already have."
      />
      <CollegeGate>{(collegeId) => <Demand collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

function Demand({ collegeId }: { collegeId: string }) {
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

  const [industry, setIndustry] = useState("all");

  const isLoading = studentsQuery.isLoading || demandQuery.isLoading;
  const isError = studentsQuery.isError || demandQuery.isError || skillsQuery.isError;

  const demand = demandQuery.data ?? [];
  const skillRows = skillsQuery.data ?? [];
  const total = students.length;

  const industries = useMemo(() => Array.from(new Set(demand.map((d) => d.industry))).sort(), [demand]);
  const filteredDemand = industry === "all" ? demand : demand.filter((d) => d.industry === industry);

  const supplyBySkill = useMemo(() => {
    const map = new Map<string, number>();
    skillRows.forEach((r) => {
      if (r.proficiency_score >= 60) {
        const name = r.skills?.name ?? "Unknown";
        map.set(name, (map.get(name) ?? 0) + 1);
      }
    });
    return map;
  }, [skillRows]);

  const bySkillAgg = useMemo(() => {
    const map = new Map<string, { skill: string; category: string; demandScore: number; openings: number }>();
    filteredDemand.forEach((d) => {
      const name = d.skills?.name ?? "Unknown";
      const existing = map.get(name);
      const score = Math.max(existing?.demandScore ?? 0, d.demand_score);
      map.set(name, {
        skill: name,
        category: d.skills?.category ?? "",
        demandScore: score,
        openings: (existing?.openings ?? 0) + d.openings,
      });
    });
    return Array.from(map.values())
      .map((d) => {
        const proficient = supplyBySkill.get(d.skill) ?? 0;
        const supplyPct = total ? Math.round((proficient / total) * 100) : 0;
        const demandLevel = d.demandScore >= 85 ? "Very High" : d.demandScore >= 70 ? "High" : d.demandScore >= 50 ? "Medium" : "Low";
        return { ...d, supplyPct, demandLevel, gap: Math.max(0, d.demandScore - supplyPct) };
      })
      .sort((a, b) => b.demandScore - a.demandScore);
  }, [filteredDemand, supplyBySkill, total]);

  const topLacking = [...bySkillAgg].sort((a, b) => b.gap - a.gap).filter((d) => d.gap > 0).slice(0, 10);

  const byIndustry = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    demand.forEach((d) => {
      const e = map.get(d.industry) ?? { sum: 0, count: 0 };
      e.sum += d.demand_score;
      e.count += 1;
      map.set(d.industry, e);
    });
    return Array.from(map.entries())
      .map(([ind, v]) => ({ industry: ind, avgDemand: v.count ? Math.round(v.sum / v.count) : 0 }))
      .sort((a, b) => b.avgDemand - a.avgDemand);
  }, [demand]);

  const byPeriod = useMemo(() => {
    const map = new Map<string, { sum: number; count: number }>();
    filteredDemand.forEach((d) => {
      const e = map.get(d.period) ?? { sum: 0, count: 0 };
      e.sum += d.demand_score;
      e.count += 1;
      map.set(d.period, e);
    });
    return Array.from(map.entries())
      .map(([period, v]) => ({ period, avgDemand: v.count ? Math.round(v.sum / v.count) : 0 }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [filteredDemand]);

  if (isLoading) return <LoadingCards />;
  if (isError)
    return (
      <ErrorState
        message={studentsQuery.error?.message ?? demandQuery.error?.message}
        onRetry={() => {
          void studentsQuery.refetch();
          void demandQuery.refetch();
        }}
      />
    );

  if (!demand.length)
    return <EmptyState icon={Factory} title="No demand data yet" description="Industry skill demand data will appear here once available." />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Skills tracked" value={bySkillAgg.length} icon={TrendingUp} />
        <StatCard label="High-gap skills" value={topLacking.length} icon={AlertTriangle} tone="warning" />
        <StatCard label="Industries" value={industries.length} icon={Factory} />
      </div>

      <div className="flex justify-end">
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filter by industry" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All industries</SelectItem>
            {industries.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Demand by industry</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={byIndustry}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="industry" tick={{ fontSize: 11 }} className="fill-muted-foreground" interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                <Bar dataKey="avgDemand" fill="var(--chart-3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Demand trend by period</CardTitle></CardHeader>
          <CardContent>
            {byPeriod.length > 1 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={byPeriod}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="avgDemand" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Not enough period data to chart a trend.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Top demanded skills your college lacks</CardTitle></CardHeader>
        <CardContent className="p-0">
          {topLacking.length === 0 ? (
            <div className="p-6"><EmptyState title="No major gaps" description="Your students' skill supply keeps up with demand." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Skill</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Demand</TableHead>
                    <TableHead>Supply in college</TableHead>
                    <TableHead>Gap</TableHead>
                    <TableHead>Openings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topLacking.map((d) => (
                    <TableRow key={d.skill}>
                      <TableCell className="font-medium">{d.skill}</TableCell>
                      <TableCell><Badge variant="secondary">{d.category || "—"}</Badge></TableCell>
                      <TableCell><DemandBadge level={d.demandLevel} /></TableCell>
                      <TableCell>{d.supplyPct}%</TableCell>
                      <TableCell className="font-semibold text-destructive">{d.gap} pts</TableCell>
                      <TableCell>{d.openings}</TableCell>
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
