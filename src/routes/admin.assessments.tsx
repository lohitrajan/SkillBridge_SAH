import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { fetchAllAttempts, fetchAssessmentQuestions, fetchAssessments, type AssessmentRow } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/assessments")({
  head: () => ({
    meta: [
      { title: "Assessments | SkillBridge" },
      { name: "description", content: "Assessments on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Assessments | SkillBridge" },
      { property: "og:description", content: "Assessments on SkillBridge." },
    ],
  }),
  component: AdminAssessmentsPage,
});

async function fetchQuestionCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("assessment_questions").select("assessment_id");
  if (error) throw new Error(error.message);
  return (data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.assessment_id] = (acc[r.assessment_id] ?? 0) + 1;
    return acc;
  }, {});
}

function AdminAssessmentsPage() {
  const assessmentsQuery = useQuery({ queryKey: ["admin-assessments"], queryFn: fetchAssessments });
  const questionCountsQuery = useQuery({ queryKey: ["admin-assessment-question-counts"], queryFn: fetchQuestionCounts });
  const attemptsQuery = useQuery({ queryKey: ["admin-attempts"], queryFn: () => fetchAllAttempts(5000) });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<AssessmentRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const assessments = assessmentsQuery.data ?? [];
  const questionCounts = questionCountsQuery.data ?? {};
  const attempts = attemptsQuery.data ?? [];

  const statsByAssessment = useMemo(() => {
    const m = new Map<string, { count: number; avgScore: number; passRate: number }>();
    assessments.forEach((a) => {
      const rows = attempts.filter((at) => at.assessment_id === a.id);
      const count = rows.length;
      const avgScore = count ? Math.round(rows.reduce((s, r) => s + r.score, 0) / count) : 0;
      const passRate = count ? Math.round((rows.filter((r) => r.score >= 60).length / count) * 100) : 0;
      m.set(a.id, { count, avgScore, passRate });
    });
    return m;
  }, [assessments, attempts]);

  const filtered = assessments.filter((a) => !debounced || `${a.title} ${a.category}`.toLowerCase().includes(debounced.toLowerCase()));

  if (assessmentsQuery.isLoading || attemptsQuery.isLoading) return <LoadingRows count={6} />;
  if (assessmentsQuery.isError) return <ErrorState message={assessmentsQuery.error.message} onRetry={() => assessmentsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading title="Assessments" description="The assessment catalogue and how students are performing on it." />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search assessments" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No assessments found" description="Try clearing your search." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Questions</TableHead>
                <TableHead className="text-right">Attempts</TableHead>
                <TableHead className="text-right">Avg. score</TableHead>
                <TableHead className="text-right">Pass rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => {
                const stats = statsByAssessment.get(a.id) ?? { count: 0, avgScore: 0, passRate: 0 };
                return (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelected(a)}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell><Badge variant="secondary">{a.category}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{questionCounts[a.id] ?? 0}</TableCell>
                    <TableCell className="text-right tabular-nums">{stats.count}</TableCell>
                    <TableCell className="text-right tabular-nums">{stats.avgScore}%</TableCell>
                    <TableCell className="text-right tabular-nums">{stats.passRate}%</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AssessmentSheet assessment={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AssessmentSheet({ assessment, onClose }: { assessment: AssessmentRow | null; onClose: () => void }) {
  const questionsQuery = useQuery({
    queryKey: ["admin-assessment-questions", assessment?.id],
    queryFn: () => fetchAssessmentQuestions(assessment!.id),
    enabled: !!assessment,
  });

  return (
    <Sheet open={!!assessment} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {assessment ? (
          <>
            <SheetHeader>
              <SheetTitle>{assessment.title}</SheetTitle>
              <SheetDescription>
                {assessment.category} · {assessment.duration_minutes} min
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-muted-foreground">{assessment.description}</p>
              <div>
                <p className="mb-1.5 text-sm font-medium">Questions ({(questionsQuery.data ?? []).length})</p>
                {questionsQuery.isLoading ? (
                  <LoadingRows count={2} />
                ) : (questionsQuery.data ?? []).length ? (
                  <ul className="space-y-1.5">
                    {(questionsQuery.data ?? []).map((q) => (
                      <li key={q.id} className="flex items-center justify-between rounded-md bg-muted p-2 text-sm">
                        <span className="truncate">{q.question}</span>
                        <Badge variant="secondary" className="ml-2 shrink-0">{q.topic}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No questions yet.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
