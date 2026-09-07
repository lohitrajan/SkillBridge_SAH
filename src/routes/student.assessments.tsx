import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  RotateCcw,
  Sparkles,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchAssessmentQuestions,
  fetchAssessments,
  fetchAttempts,
  fetchStudentSkills,
  recomputeReadiness,
  saveAttempt,
  type AssessmentRow,
  type QuestionRow,
} from "@/lib/data";
import { levelFromScore } from "@/lib/matching";

export const Route = createFileRoute("/student/assessments")({
  head: () => ({
    meta: [
      { title: "Skill Assessments | SkillBridge" },
      { name: "description", content: "Skill Assessments on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Skill Assessments | SkillBridge" },
      { property: "og:description", content: "Skill Assessments on SkillBridge." },
    ],
  }),
  component: StudentAssessmentsPage,
});

interface AttemptResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  level: string;
  strongAreas: string[];
  weakAreas: string[];
  recommendation: string;
  timeTakenSeconds: number;
}

function StudentAssessmentsPage() {
  const { studentId } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!studentId;

  const [activeAssessment, setActiveAssessment] = useState<AssessmentRow | null>(null);
  const [category, setCategory] = useState<string>("All");
  const [lastResult, setLastResult] = useState<{ result: AttemptResult; assessment: AssessmentRow } | null>(null);

  const assessmentsQuery = useQuery({ queryKey: ["assessments"], queryFn: fetchAssessments, enabled: true });
  const attemptsQuery = useQuery({
    queryKey: ["attempts", studentId],
    queryFn: () => fetchAttempts(studentId as string),
    enabled,
  });
  const skillsQuery = useQuery({
    queryKey: ["student-skills", studentId],
    queryFn: () => fetchStudentSkills(studentId as string),
    enabled,
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Assessments" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="Set up your student profile to take assessments."
          action={<Button asChild><Link to="/student/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const anyLoading = assessmentsQuery.isLoading || attemptsQuery.isLoading || skillsQuery.isLoading;
  const anyError = assessmentsQuery.isError || attemptsQuery.isError || skillsQuery.isError;

  if (activeAssessment) {
    return (
      <AssessmentRunner
        assessment={activeAssessment}
        skillId={activeAssessment.skill_id}
        onExit={() => setActiveAssessment(null)}
        onComplete={async (result) => {
          if (!studentId) return;
          try {
            await saveAttempt({
              assessmentId: activeAssessment.id,
              studentId,
              skillId: activeAssessment.skill_id,
              score: result.score,
              correctCount: result.correctCount,
              totalQuestions: result.totalQuestions,
              timeTakenSeconds: result.timeTakenSeconds,
              level: result.level,
              strongAreas: result.strongAreas,
              weakAreas: result.weakAreas,
              recommendation: result.recommendation,
            });
            await recomputeReadiness(studentId);
            await queryClient.invalidateQueries({ queryKey: ["attempts", studentId] });
            await queryClient.invalidateQueries({ queryKey: ["student-skills", studentId] });
            await queryClient.invalidateQueries({ queryKey: ["student", studentId] });
            toast.success("Assessment submitted and skills updated!");
            setLastResult({ result, assessment: activeAssessment });
            setActiveAssessment(null);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to save attempt.");
          }
        }}
      />
    );
  }

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Assessments" />
        <LoadingRows count={6} />
      </div>
    );
  }
  if (anyError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Assessments" />
        <ErrorState
          onRetry={() => {
            void assessmentsQuery.refetch();
            void attemptsQuery.refetch();
          }}
        />
      </div>
    );
  }

  const assessments = assessmentsQuery.data ?? [];
  const attempts = attemptsQuery.data ?? [];
  const categories = ["All", ...Array.from(new Set(assessments.map((a) => a.category)))];
  const filtered = category === "All" ? assessments : assessments.filter((a) => a.category === category);

  const bestAttemptFor = (assessmentId: string) =>
    attempts
      .filter((a) => a.assessment_id === assessmentId)
      .sort((a, b) => b.score - a.score)[0];

  return (
    <div className="space-y-6">
      <PageHeading
        title="Skill Assessments"
        description="Take timed assessments to verify your skills and boost your placement readiness."
      />

      {lastResult ? (
        <ResultsCard
          assessment={lastResult.assessment}
          result={lastResult.result}
          onRetake={() => {
            setActiveAssessment(lastResult.assessment);
            setLastResult(null);
          }}
          onDismiss={() => setLastResult(null)}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <Button key={c} size="sm" variant={c === category ? "default" : "outline"} onClick={() => setCategory(c)}>
            {c}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No assessments found" description="Try a different category." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => {
            const best = bestAttemptFor(a.id);
            const attemptCount = attempts.filter((at) => at.assessment_id === a.id).length;
            return (
              <Card key={a.id}>
                <CardHeader className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{a.title}</CardTitle>
                    <Badge variant="secondary">{a.category}</Badge>
                  </div>
                  <CardDescription>{a.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" /> {a.duration_minutes} minutes
                  </p>
                  {best ? (
                    <div className="rounded-md bg-muted p-2.5 text-xs">
                      <p className="flex items-center gap-1 font-medium text-foreground">
                        <Award className="size-3.5 text-primary" /> Best score: {best.score}% ({best.level})
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {attemptCount} attempt{attemptCount === 1 ? "" : "s"} so far
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Not attempted yet.</p>
                  )}
                  <Button className="w-full" size="sm" onClick={() => setActiveAssessment(a)}>
                    {best ? "Retake assessment" : "Start assessment"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="font-display text-lg font-semibold">Past attempts</h2>
        {attempts.length === 0 ? (
          <EmptyState title="No attempts yet" description="Your assessment history will appear here." />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Correct</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.assessments?.title ?? "—"}</TableCell>
                    <TableCell>{a.score}%</TableCell>
                    <TableCell>{a.level}</TableCell>
                    <TableCell>{a.correct_count}/{a.total_questions}</TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}

function ResultsCard({
  assessment,
  result,
  onRetake,
  onDismiss,
}: {
  assessment: AssessmentRow;
  result: AttemptResult;
  onRetake: () => void;
  onDismiss: () => void;
}) {
  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="size-4 text-success" /> Results — {assessment.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg gradient-accent p-4 text-primary-foreground">
            <p className="font-display text-3xl font-bold">{result.score}%</p>
            <p className="text-sm opacity-90">{result.level}</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-2xl font-semibold tabular-nums">{result.correctCount}/{result.totalQuestions}</p>
            <p className="text-sm text-muted-foreground">Correct answers</p>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <p className="text-2xl font-semibold tabular-nums">{Math.round(result.timeTakenSeconds / 60)}m</p>
            <p className="text-sm text-muted-foreground">Time taken</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-success">
              <TrendingUp className="size-4" /> Strong areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.strongAreas.length ? (
                result.strongAreas.map((t) => <Badge key={t} variant="secondary" className="bg-success/10 text-success">{t}</Badge>)
              ) : (
                <p className="text-xs text-muted-foreground">None yet.</p>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-destructive">
              <TrendingDown className="size-4" /> Weak areas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {result.weakAreas.length ? (
                result.weakAreas.map((t) => <Badge key={t} variant="secondary" className="bg-destructive/10 text-destructive">{t}</Badge>)
              ) : (
                <p className="text-xs text-muted-foreground">None — great job!</p>
              )}
            </div>
          </div>
        </div>
        <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{result.recommendation}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRetake}>
            <RotateCcw className="size-4" /> Retake assessment
          </Button>
          <Button variant="ghost" onClick={onDismiss}>Dismiss</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AssessmentRunner({
  assessment,
  onComplete,
  onExit,
}: {
  assessment: AssessmentRow;
  skillId: string | null;
  onComplete: (result: AttemptResult) => void | Promise<void>;
  onExit: () => void;
}) {
  const questionsQuery = useQuery({
    queryKey: ["assessment-questions", assessment.id],
    queryFn: () => fetchAssessmentQuestions(assessment.id),
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(assessment.duration_minutes * 60);
  const [submitting, setSubmitting] = useState(false);
  const startedAt = useMemo(() => Date.now(), []);

  const questions = questionsQuery.data ?? [];

  const finish = useMemo(
    () => (opts?: { auto?: boolean }) => {
      if (submitting) return;
      setSubmitting(true);
      const result = scoreAttempt(questions, answers, startedAt);
      void onComplete(result);
      if (opts?.auto) toast.message("Time's up — assessment submitted automatically.");
    },
    [answers, onComplete, questions, startedAt, submitting],
  );

  useEffect(() => {
    if (!questions.length) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          finish({ auto: true });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [questions.length, finish]);

  if (questionsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title={assessment.title} />
        <LoadingRows count={4} />
      </div>
    );
  }
  if (questionsQuery.isError || questions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeading title={assessment.title} />
        <ErrorState message="Could not load questions for this assessment." onRetry={() => questionsQuery.refetch()} />
        <Button variant="outline" onClick={onExit}>Back to assessments</Button>
      </div>
    );
  }

  const q = questions[current] as QuestionRow;
  const progress = ((current + 1) / questions.length) * 100;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title={assessment.title}
        description={`Question ${current + 1} of ${questions.length}`}
        actions={
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm font-medium tabular-nums">
            <Timer className="size-4" /> {mins}:{secs.toString().padStart(2, "0")}
          </span>
        }
      />
      <Progress value={progress} className="h-1.5" />

      <Card>
        <CardHeader>
          <Badge variant="secondary" className="w-fit">{q.topic}</Badge>
          <CardTitle className="text-base">{q.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {q.options.map((opt, idx) => {
            const selected = answers[q.id] === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: idx }))}
                className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  selected ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}>
          Previous
        </Button>
        <Button variant="ghost" onClick={onExit}>Exit</Button>
        {current === questions.length - 1 ? (
          <Button onClick={() => finish()} disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit
          </Button>
        ) : (
          <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>Next</Button>
        )}
      </div>
    </div>
  );
}

function scoreAttempt(
  questions: QuestionRow[],
  answers: Record<string, number>,
  startedAt: number,
): AttemptResult {
  const topicStats = new Map<string, { correct: number; total: number }>();
  let correctCount = 0;
  for (const q of questions) {
    const stat = topicStats.get(q.topic) ?? { correct: 0, total: 0 };
    stat.total += 1;
    if (answers[q.id] === q.correct_index) {
      stat.correct += 1;
      correctCount += 1;
    }
    topicStats.set(q.topic, stat);
  }
  const score = Math.round((correctCount / questions.length) * 100);
  const level = levelFromScore(score);
  const strongAreas = Array.from(topicStats.entries())
    .filter(([, s]) => s.correct / s.total >= 0.7)
    .map(([topic]) => topic);
  const weakAreas = Array.from(topicStats.entries())
    .filter(([, s]) => s.correct / s.total < 0.5)
    .map(([topic]) => topic);
  const recommendation =
    score >= 75
      ? "Excellent performance — consider taking a more advanced assessment or adding this skill to a project."
      : score >= 50
        ? "Solid foundation. Focus on your weak topic areas with targeted practice before retaking."
        : "Review the fundamentals for this skill and revisit the roadmap before retaking this assessment.";
  return {
    score,
    correctCount,
    totalQuestions: questions.length,
    level,
    strongAreas,
    weakAreas,
    recommendation,
    timeTakenSeconds: Math.round((Date.now() - startedAt) / 1000),
  };
}
