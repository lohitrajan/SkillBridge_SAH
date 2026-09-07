import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BookOpen, CalendarCheck, ClipboardCheck, Rocket, Sparkles, Target } from "lucide-react";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAssessments,
  fetchProjects,
  fetchRoleTemplates,
  fetchStudent,
  fetchStudentSkills,
  fetchTrainingPrograms,
} from "@/lib/data";
import { buildRoadmap, recommendedProject } from "@/lib/matching";
import { matchRoleForStudent, resolveRoleTemplate } from "@/components/student/shared";

export const Route = createFileRoute("/student/roadmap")({
  head: () => ({
    meta: [
      { title: "Learning Roadmap | SkillBridge" },
      { name: "description", content: "Learning Roadmap on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Learning Roadmap | SkillBridge" },
      { property: "og:description", content: "Learning Roadmap on SkillBridge." },
    ],
  }),
  component: StudentRoadmapPage,
});

function StudentRoadmapPage() {
  const { studentId } = useAuth();
  const enabled = !!studentId;
  const [roleId, setRoleId] = useState<string>("");

  const studentQuery = useQuery({ queryKey: ["student", studentId], queryFn: () => fetchStudent(studentId as string), enabled });
  const skillsQuery = useQuery({ queryKey: ["student-skills", studentId], queryFn: () => fetchStudentSkills(studentId as string), enabled });
  const projectsQuery = useQuery({ queryKey: ["projects", studentId], queryFn: () => fetchProjects(studentId as string), enabled });
  const rolesQuery = useQuery({ queryKey: ["role-templates"], queryFn: fetchRoleTemplates, enabled: true });
  const programsQuery = useQuery({ queryKey: ["training-programs"], queryFn: () => fetchTrainingPrograms(), enabled: true });
  const assessmentsQuery = useQuery({ queryKey: ["assessments"], queryFn: fetchAssessments, enabled: true });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Learning Roadmap" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="We build your roadmap from your target role and skill gaps."
          action={<Button asChild><Link to="/student/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const anyLoading = studentQuery.isLoading || skillsQuery.isLoading || projectsQuery.isLoading || rolesQuery.isLoading || programsQuery.isLoading || assessmentsQuery.isLoading;
  const anyError = studentQuery.isError || skillsQuery.isError || projectsQuery.isError || rolesQuery.isError;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Learning Roadmap" />
        <LoadingRows count={6} />
      </div>
    );
  }
  if (anyError || !studentQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeading title="Learning Roadmap" />
        <ErrorState onRetry={() => { void studentQuery.refetch(); void rolesQuery.refetch(); }} />
      </div>
    );
  }

  const student = studentQuery.data;
  const skills = skillsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const programs = programsQuery.data ?? [];
  const assessments = assessmentsQuery.data ?? [];

  const role = roleId ? roles.find((r) => r.id === roleId) ?? null : resolveRoleTemplate(roles, student.target_role);

  if (!role) {
    return (
      <div className="space-y-6">
        <PageHeading title="Learning Roadmap" />
        <EmptyState icon={Target} title="No role templates available" description="Check back once role templates are configured." />
      </div>
    );
  }

  const result = matchRoleForStudent(student, skills, projects, role);
  const roadmap = buildRoadmap(result.missing);
  const project = recommendedProject(result.missing, role.title);
  const missingSkillNames = new Set(result.missing.map((m) => m.skill.toLowerCase()));

  const relatedPrograms = programs.filter((p) =>
    p.skills ? missingSkillNames.has(p.skills.name.toLowerCase()) : false,
  );
  const relatedAssessments = assessments.filter((a) =>
    roadmap.some((w) => w.focus.toLowerCase().includes(a.title.toLowerCase()) || a.title.toLowerCase().includes(w.focus.split(" ")[0]?.toLowerCase() ?? "")),
  );

  return (
    <div className="space-y-6">
      <PageHeading
        title="Learning Roadmap"
        description={`A phased plan to close your skill gaps for ${role.title}.`}
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

      {roadmap.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title="You're fully on track" description="No skill gaps found for this role — keep building your portfolio." />
      ) : (
        <div className="relative space-y-4 border-l border-border pl-6">
          {roadmap.map((week) => (
            <div key={week.week} className="relative">
              <span className="absolute -left-[31px] flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {week.week}
              </span>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarCheck className="size-4 text-primary" /> Week {week.week}: {week.focus}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{week.outcome}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Rocket className="size-4 text-primary" /> Suggested project</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{project}</p>
          <Button asChild size="sm" variant="outline"><Link to="/student/projects">Add this project</Link></Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BookOpen className="size-4 text-primary" /> Recommended training programs</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {relatedPrograms.length === 0 ? (
              <p className="text-sm text-muted-foreground">No matching college training programs found right now.</p>
            ) : (
              relatedPrograms.slice(0, 5).map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{p.title}</p>
                    {p.skills ? <Badge variant="secondary">{p.skills.name}</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{p.duration_weeks} weeks · {p.eligibility}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4 text-primary" /> Related assessments</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {relatedAssessments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Browse all assessments to verify your roadmap skills.</p>
            ) : (
              relatedAssessments.slice(0, 5).map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{a.category} · {a.duration_minutes} min</p>
                  </div>
                </div>
              ))
            )}
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/student/assessments">Go to assessments</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
