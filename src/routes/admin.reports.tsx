import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Briefcase, Building2, ClipboardCheck, FileText, GraduationCap, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { downloadCsv } from "@/components/admin/csv";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ErrorState, LoadingCards, PageHeading } from "@/components/shared/ui-states";
import {
  fetchAllApplications,
  fetchAllAttempts,
  fetchColleges,
  fetchCompanies,
  fetchJobs,
  fetchSkills,
  fetchStudents,
  statusLabel,
  APPLICATION_STATUSES,
} from "@/lib/data";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports | SkillBridge" },
      { name: "description", content: "Reports on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Reports | SkillBridge" },
      { property: "og:description", content: "Reports on SkillBridge." },
    ],
  }),
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const studentsQ = useQuery({ queryKey: ["admin-students"], queryFn: () => fetchStudents() });
  const collegesQ = useQuery({ queryKey: ["admin-colleges"], queryFn: fetchColleges });
  const companiesQ = useQuery({ queryKey: ["admin-companies"], queryFn: fetchCompanies });
  const jobsQ = useQuery({ queryKey: ["admin-jobs"], queryFn: () => fetchJobs() });
  const appsQ = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchAllApplications(5000) });
  const attemptsQ = useQuery({ queryKey: ["admin-attempts"], queryFn: () => fetchAllAttempts(5000) });
  const skillsQ = useQuery({ queryKey: ["admin-skills"], queryFn: fetchSkills });

  const loading = studentsQ.isLoading || collegesQ.isLoading || companiesQ.isLoading || jobsQ.isLoading || appsQ.isLoading || attemptsQ.isLoading || skillsQ.isLoading;
  const anyError = studentsQ.isError || collegesQ.isError || companiesQ.isError || jobsQ.isError || appsQ.isError || attemptsQ.isError || skillsQ.isError;

  const students = studentsQ.data ?? [];
  const colleges = collegesQ.data ?? [];
  const companies = companiesQ.data ?? [];
  const jobs = jobsQ.data ?? [];
  const applications = appsQ.data ?? [];
  const attempts = attemptsQ.data ?? [];
  const skills = skillsQ.data ?? [];

  const funnel = useMemo(
    () =>
      APPLICATION_STATUSES.map((s) => ({
        status: s,
        label: statusLabel(s),
        count: applications.filter((a) => a.status === s).length,
      })),
    [applications],
  );

  const topSkills = useMemo(
    () =>
      [...skills]
        .sort((a, b) => b.demand_score - a.demand_score)
        .slice(0, 10)
        .map((s) => ({ name: s.name, category: s.category, score: s.demand_score, level: s.demand_level })),
    [skills],
  );

  const readinessBuckets = useMemo(() => {
    const buckets = [
      { label: "0-40", min: 0, max: 40, count: 0 },
      { label: "41-60", min: 41, max: 60, count: 0 },
      { label: "61-80", min: 61, max: 80, count: 0 },
      { label: "81-100", min: 81, max: 100, count: 0 },
    ];
    students.forEach((s) => {
      const b = buckets.find((b) => s.readiness_score >= b.min && s.readiness_score <= b.max);
      if (b) b.count += 1;
    });
    return buckets;
  }, [students]);

  if (loading) return <LoadingCards count={8} />;
  if (anyError) {
    return (
      <ErrorState
        message="Some report data failed to load."
        onRetry={() => {
          void studentsQ.refetch();
          void collegesQ.refetch();
          void companiesQ.refetch();
          void jobsQ.refetch();
          void appsQ.refetch();
          void attemptsQ.refetch();
          void skillsQ.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading title="Reports" description="Platform-wide summary metrics and exportable tables." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Students" value={students.length} icon={GraduationCap} />
        <StatCard label="Colleges" value={colleges.length} icon={Building2} />
        <StatCard label="Companies" value={companies.length} icon={ShieldCheck} />
        <StatCard label="Postings" value={jobs.length} icon={Briefcase} />
        <StatCard label="Applications" value={applications.length} icon={FileText} />
        <StatCard label="Assessment attempts" value={attempts.length} icon={ClipboardCheck} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Application funnel</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadCsv("application-funnel.csv", funnel.map((f) => ({ Status: f.label, Count: f.count })))}
          >
            <ArrowDownToLine className="size-4" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnel.map((f) => (
                <TableRow key={f.status}>
                  <TableCell>{f.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{f.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top in-demand skills</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() =>
              downloadCsv(
                "top-skills.csv",
                topSkills.map((s) => ({ Skill: s.name, Category: s.category, "Demand score": s.score, "Demand level": s.level })),
              )
            }
          >
            <ArrowDownToLine className="size-4" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead className="text-right">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSkills.map((s) => (
                <TableRow key={s.name}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.category}</TableCell>
                  <TableCell>{s.level}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student readiness distribution</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => downloadCsv("readiness-distribution.csv", readinessBuckets.map((b) => ({ Range: b.label, Students: b.count })))}
          >
            <ArrowDownToLine className="size-4" /> Export
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Readiness range</TableHead>
                <TableHead className="text-right">Students</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readinessBuckets.map((b) => (
                <TableRow key={b.label}>
                  <TableCell>{b.label}%</TableCell>
                  <TableCell className="text-right tabular-nums">{b.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
