import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, Sparkles, Target, Users, XCircle } from "lucide-react";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { DemandBadge, SkillBadge } from "@/components/shared/skill-badge";
import { MatchExplainer } from "@/components/shared/match-explainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchProjects,
  fetchRoleTemplates,
  fetchSkillDemand,
  fetchStudent,
  fetchStudents,
  fetchStudentSkills,
} from "@/lib/data";
import { matchRoleForStudent, resolveRoleTemplate } from "@/components/student/shared";

export const Route = createFileRoute("/student/skill-gap")({
  head: () => ({
    meta: [
      { title: "Skill Gap Analysis | SkillBridge" },
      { name: "description", content: "Skill Gap Analysis on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Skill Gap Analysis | SkillBridge" },
      { property: "og:description", content: "Skill Gap Analysis on SkillBridge." },
    ],
  }),
  component: StudentSkillGapPage,
});

const priorityTone: Record<string, string> = {
  HIGH: "bg-destructive/10 text-destructive",
  MEDIUM: "bg-warning/20 text-warning-foreground",
  LOW: "bg-muted text-muted-foreground",
};

function StudentSkillGapPage() {
  const { studentId } = useAuth();
  const enabled = !!studentId;
  const [roleId, setRoleId] = useState<string>("");

  const studentQuery = useQuery({ queryKey: ["student", studentId], queryFn: () => fetchStudent(studentId as string), enabled });
  const skillsQuery = useQuery({ queryKey: ["student-skills", studentId], queryFn: () => fetchStudentSkills(studentId as string), enabled });
  const projectsQuery = useQuery({ queryKey: ["projects", studentId], queryFn: () => fetchProjects(studentId as string), enabled });
  const rolesQuery = useQuery({ queryKey: ["role-templates"], queryFn: fetchRoleTemplates, enabled: true });
  const demandQuery = useQuery({ queryKey: ["skill-demand"], queryFn: fetchSkillDemand, enabled: true });
  const peersQuery = useQuery({
    queryKey: ["students", studentQuery.data?.college_id ?? "all"],
    queryFn: () => fetchStudents({ collegeId: studentQuery.data?.college_id ?? undefined, limit: 200 }),
    enabled: !!studentQuery.data,
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Gap Analysis" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="Set a target role to see your skill gap analysis."
          action={<Button asChild><Link to="/student/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const anyLoading = studentQuery.isLoading || skillsQuery.isLoading || projectsQuery.isLoading || rolesQuery.isLoading || demandQuery.isLoading;
  const anyError = studentQuery.isError || skillsQuery.isError || projectsQuery.isError || rolesQuery.isError || demandQuery.isError;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Gap Analysis" />
        <LoadingRows count={6} />
      </div>
    );
  }
  if (anyError || !studentQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Gap Analysis" />
        <ErrorState onRetry={() => { void studentQuery.refetch(); void skillsQuery.refetch(); void rolesQuery.refetch(); }} />
      </div>
    );
  }

  const student = studentQuery.data;
  const skills = skillsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const demand = demandQuery.data ?? [];
  const peers = peersQuery.data ?? [];

  const role = roleId ? roles.find((r) => r.id === roleId) ?? null : resolveRoleTemplate(roles, student.target_role);

  if (!role) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Gap Analysis" />
        <EmptyState icon={Target} title="No role templates available" description="Check back once role templates are configured." />
      </div>
    );
  }

  const result = matchRoleForStudent(student, skills, projects, role);
  const demandFor = (skillName: string) =>
    demand.find((d) => d.skills?.name.toLowerCase() === skillName.toLowerCase());

  const peerAvg = peers.length
    ? Math.round(peers.reduce((a, p) => a + p.readiness_score, 0) / peers.length)
    : null;

  const sortedMissing = [...result.missing].sort((a, b) => {
    const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Skill Gap Analysis"
        description="See exactly which skills stand between you and your target role."
        actions={
          <Select value={role.id} onValueChange={setRoleId}>
            <SelectTrigger className="w-64"><SelectValue placeholder="Select target role" /></SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Overall match</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg gradient-accent p-4 text-primary-foreground">
              <p className="font-display text-4xl font-bold">{result.score}%</p>
              <p className="text-sm opacity-90">Match for {role.title}</p>
            </div>
            <MatchExplainer result={result} title={role.title} subject={student.full_name} />
            {peerAvg != null ? (
              <div className="rounded-md bg-muted p-3 text-sm">
                <p className="flex items-center gap-1.5 font-medium"><Users className="size-4" /> Peer comparison</p>
                <p className="mt-1 text-muted-foreground">
                  Your readiness is <span className="font-semibold text-foreground">{student.readiness_score}%</span> vs. peer average{" "}
                  <span className="font-semibold text-foreground">{peerAvg}%</span> ({peers.length} students).
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Matched skills ({result.matched.length}/{result.requiredCount})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {result.matched.length === 0 ? (
              <p className="text-sm text-muted-foreground">No required skills matched yet.</p>
            ) : (
              result.matched.map((m) => (
                <div key={m.skill} className="space-y-1 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-sm font-medium">
                      <CheckCircle2 className="size-4 text-success" /> {m.skill}
                    </span>
                    <div className="flex items-center gap-2">
                      {demandFor(m.skill) ? <DemandBadge level={demandFor(m.skill)!.skills?.category ? demandLabel(demandFor(m.skill)!.demand_score) : "Medium"} /> : null}
                      <SkillBadge name={`${m.score}%`} verified={m.verified} />
                    </div>
                  </div>
                  <Progress value={m.score} className="h-1.5" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Missing skills, prioritised</h2>
        {sortedMissing.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No gaps found" description="You match every skill required for this role." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sortedMissing.map((m) => {
              const d = demandFor(m.skill);
              return (
                <Card key={m.skill}>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <XCircle className="size-4 text-destructive" /> {m.skill}
                      </span>
                      <Badge className={priorityTone[m.priority]} variant="secondary">{m.priority}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{m.required ? "Required for this role" : "Preferred skill"}</p>
                    {d ? (
                      <p className="text-xs text-muted-foreground">
                        Market demand: {d.demand_score}/100 · {d.openings} open roles ({d.industry})
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button asChild>
          <Link to="/student/roadmap">Build my learning roadmap</Link>
        </Button>
      </div>
    </div>
  );
}

function demandLabel(score: number): string {
  if (score >= 85) return "Very High";
  if (score >= 65) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}
