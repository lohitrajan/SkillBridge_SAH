import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { RefreshCw, Sparkles, Target } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingCards } from "@/components/shared/ui-states";
import { ReadinessRing } from "@/components/shared/readiness-ring";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchApplicationsForStudent,
  fetchAttempts,
  fetchCertifications,
  fetchProjects,
  fetchStudent,
  fetchStudentSkills,
  recomputeReadiness,
} from "@/lib/data";

export const Route = createFileRoute("/student/readiness")({
  head: () => ({
    meta: [
      { title: "Placement Readiness Simulator | SkillBridge" },
      {
        name: "description",
        content:
          "See how your placement readiness score is built and simulate the impact of new projects, certificates and verified skills.",
      },
      { property: "og:title", content: "Placement Readiness Simulator | SkillBridge" },
      {
        property: "og:description",
        content: "Simulate how new projects, certificates and skills lift your placement readiness.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentReadinessPage,
});

const WEIGHTS = {
  technical: 0.35,
  soft: 0.15,
  projects: 0.2,
  certifications: 0.15,
  exposure: 0.15,
} as const;

function StudentReadinessPage() {
  const { studentId } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!studentId;

  const [extraProjects, setExtraProjects] = useState(0);
  const [extraCerts, setExtraCerts] = useState(0);
  const [extraAssessments, setExtraAssessments] = useState(0);
  const [skillBoost, setSkillBoost] = useState(0);

  const studentQuery = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId as string),
    enabled,
  });
  const skillsQuery = useQuery({
    queryKey: ["student-skills", studentId],
    queryFn: () => fetchStudentSkills(studentId as string),
    enabled,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", studentId],
    queryFn: () => fetchProjects(studentId as string),
    enabled,
  });
  const certsQuery = useQuery({
    queryKey: ["certifications", studentId],
    queryFn: () => fetchCertifications(studentId as string),
    enabled,
  });
  const attemptsQuery = useQuery({
    queryKey: ["attempts", studentId],
    queryFn: () => fetchAttempts(studentId as string),
    enabled,
  });
  const appsQuery = useQuery({
    queryKey: ["applications", studentId],
    queryFn: () => fetchApplicationsForStudent(studentId as string),
    enabled,
  });

  const recomputeMutation = useMutation({
    mutationFn: () => recomputeReadiness(studentId as string),
    onSuccess: async (score) => {
      toast.success(`Readiness recalculated: ${score}%`);
      await queryClient.invalidateQueries({ queryKey: ["student", studentId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const student = studentQuery.data;

  const projected = useMemo(() => {
    if (!student) return null;
    const projectCount = (projectsQuery.data ?? []).length + extraProjects;
    const certCount = (certsQuery.data ?? []).length + extraCerts;
    const attemptCount = (attemptsQuery.data ?? []).length + extraAssessments;
    const apps = appsQuery.data ?? [];

    const technical = Math.min(100, student.technical_score + skillBoost);
    const soft = student.soft_skills_score;
    const projectsScore = Math.min(100, projectCount * 25 + (projectCount ? 15 : 0));
    const certificationsScore = Math.min(100, certCount * 30);
    const exposure = Math.min(
      100,
      attemptCount * 8 +
        apps.filter((a) => ["shortlisted", "interview", "selected"].includes(a.status)).length * 15 +
        apps.length * 4,
    );
    const score = Math.round(
      technical * WEIGHTS.technical +
        soft * WEIGHTS.soft +
        projectsScore * WEIGHTS.projects +
        certificationsScore * WEIGHTS.certifications +
        exposure * WEIGHTS.exposure,
    );
    return { technical, soft, projectsScore, certificationsScore, exposure, score };
  }, [
    student,
    projectsQuery.data,
    certsQuery.data,
    attemptsQuery.data,
    appsQuery.data,
    extraProjects,
    extraCerts,
    extraAssessments,
    skillBoost,
  ]);

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Placement Readiness" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="We need your profile to calculate a readiness score."
          action={
            <Button asChild>
              <Link to="/student/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (studentQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Placement Readiness" />
        <LoadingCards count={4} />
      </div>
    );
  }

  if (studentQuery.isError || !student || !projected) {
    return (
      <div className="space-y-6">
        <PageHeading title="Placement Readiness" />
        <ErrorState onRetry={() => void studentQuery.refetch()} />
      </div>
    );
  }

  const pillars = [
    { label: "Technical skills", current: student.technical_score, next: projected.technical, weight: "35%" },
    { label: "Soft skills", current: student.soft_skills_score, next: projected.soft, weight: "15%" },
    { label: "Projects", current: student.projects_score, next: projected.projectsScore, weight: "20%" },
    {
      label: "Certifications",
      current: student.certifications_score,
      next: projected.certificationsScore,
      weight: "15%",
    },
    { label: "Industry exposure", current: student.exposure_score, next: projected.exposure, weight: "15%" },
  ];

  const delta = projected.score - student.readiness_score;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Placement Readiness"
        description="How your score is built today, and what happens if you add more evidence."
        actions={
          <Button
            variant="outline"
            onClick={() => recomputeMutation.mutate()}
            disabled={recomputeMutation.isPending}
          >
            <RefreshCw className="size-4" /> Recalculate from my data
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-6">
            <ReadinessRing value={student.readiness_score} caption="Your score today" />
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Simulated</span>
              <span className="font-display text-2xl font-bold tabular-nums">{projected.score}%</span>
              {delta !== 0 ? (
                <Badge variant={delta > 0 ? "default" : "secondary"}>
                  {delta > 0 ? "+" : ""}
                  {delta} pts
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score breakdown</CardTitle>
            <CardDescription>Weighted pillars, with your simulation applied.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pillars.map((p) => (
              <div key={p.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {p.label} <span className="text-xs text-muted-foreground">({p.weight})</span>
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {p.current}%{p.next !== p.current ? ` → ${p.next}%` : ""}
                  </span>
                </div>
                <Progress value={p.next} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Simulator</CardTitle>
          <CardDescription>
            Drag the levers to see what each kind of effort is worth. Nothing is saved until you actually add
            the evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <SimSlider
            label="New projects"
            value={extraProjects}
            max={5}
            onChange={setExtraProjects}
            hint="Each project adds up to 25 points to your projects pillar."
          />
          <SimSlider
            label="New certifications"
            value={extraCerts}
            max={5}
            onChange={setExtraCerts}
            hint="Each certificate adds 30 points to the certifications pillar."
          />
          <SimSlider
            label="Assessments cleared"
            value={extraAssessments}
            max={10}
            onChange={setExtraAssessments}
            hint="Each attempt adds 8 points of industry exposure."
          />
          <SimSlider
            label="Technical skill lift"
            value={skillBoost}
            max={40}
            step={5}
            suffix=" pts"
            onChange={setSkillBoost}
            hint="Verify skills through assessments to raise your technical average."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="size-4" /> Fastest wins for you
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {pillars
            .slice()
            .sort((a, b) => a.current - b.current)
            .slice(0, 3)
            .map((p) => (
              <p key={p.label}>
                <span className="font-medium text-foreground">{p.label}</span> is your lowest pillar at{" "}
                {p.current}% — worth {p.weight} of the total score.
              </p>
            ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/student/assessments">Take an assessment</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/student/projects">Add a project</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/student/roadmap">See my roadmap</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SimSlider({
  label,
  value,
  max,
  step = 1,
  suffix = "",
  hint,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  step?: number;
  suffix?: string;
  hint: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          +{value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? 0)}
        aria-label={label}
      />
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
