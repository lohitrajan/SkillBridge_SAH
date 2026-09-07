import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Briefcase, ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchPill } from "@/components/shared/skill-badge";
import { StatusBadge } from "@/components/shared/skill-badge";
import { ReadinessRing } from "@/components/shared/readiness-ring";
import { SkillPassportDialog } from "@/components/recruiter/skill-passport-dialog";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import {
  APPLICATION_STATUSES,
  createNotification,
  fetchApplicationsForCompany,
  fetchJobs,
  statusLabel,
  updateApplicationStatus,
  type StudentRow,
} from "@/lib/data";

export const Route = createFileRoute("/recruiter/applications")({
  validateSearch: (search: Record<string, unknown>): { job?: string; status?: string } => {
    const out: { job?: string; status?: string } = {};
    if (typeof search["job"] === "string") out.job = search["job"];
    if (typeof search["status"] === "string") out.status = search["status"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Applications | SkillBridge" },
      { name: "description", content: "Applications on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Applications | SkillBridge" },
      { property: "og:description", content: "Applications on SkillBridge." },
    ],
  }),
  component: RecruiterApplicationsPage,
});

const nextStatus: Record<string, string | null> = {
  applied: "under_review",
  under_review: "shortlisted",
  shortlisted: "interview",
  interview: "selected",
  selected: null,
  rejected: null,
};

function RecruiterApplicationsPage() {
  const { companyId } = useAuth();
  const search = useSearch({ from: "/recruiter/applications" });
  const queryClient = useQueryClient();
  const [jobFilter, setJobFilter] = useState(search.job ?? "all");
  const [statusFilter, setStatusFilter] = useState(search.status ?? "all");
  const [passportStudent, setPassportStudent] = useState<StudentRow | null>(null);

  const jobsQ = useQuery({
    queryKey: ["recruiter-jobs", companyId],
    queryFn: () => fetchJobs({ companyId: companyId! }),
    enabled: !!companyId,
  });
  const appsQ = useQuery({
    queryKey: ["recruiter-applications", companyId],
    queryFn: () => fetchApplicationsForCompany(companyId!),
    enabled: !!companyId,
  });

  const advanceMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      studentUserId,
      jobTitle,
    }: {
      id: string;
      status: string;
      studentUserId: string | null;
      jobTitle: string;
    }) => {
      await updateApplicationStatus(id, status as (typeof APPLICATION_STATUSES)[number]);
      if (studentUserId) {
        await createNotification({
          user_id: studentUserId,
          title: `Application update: ${jobTitle}`,
          body: `Your application status changed to "${statusLabel(status)}".`,
          category: "application",
          link: "/student/applications",
        });
      }
    },
    onSuccess: () => {
      toast.success("Status updated and student notified");
      void queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Applications" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile to view applications."
          action={
            <Button asChild>
              <Link to="/recruiter/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const isLoading = jobsQ.isLoading || appsQ.isLoading;
  const isError = jobsQ.isError || appsQ.isError;

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Applications" />
        <ErrorState
          message={(jobsQ.error ?? appsQ.error)?.message}
          onRetry={() => {
            void jobsQ.refetch();
            void appsQ.refetch();
          }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Applications" />
        <LoadingRows />
      </div>
    );
  }

  const jobs = jobsQ.data ?? [];
  const apps = (appsQ.data ?? []).filter((a) => {
    if (jobFilter !== "all" && a.job_id !== jobFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="Applications"
        description="Review applicants across your postings and move them through the pipeline."
      />

      <div className="flex flex-wrap gap-3">
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by posting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All postings</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{statusLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{apps.length} application{apps.length === 1 ? "" : "s"}</CardTitle>
        </CardHeader>
        <CardContent>
          {apps.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Posting</TableHead>
                    <TableHead>Match</TableHead>
                    <TableHead>Readiness</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a) => {
                    const next = nextStatus[a.status];
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <button
                            className="font-medium text-primary hover:underline"
                            onClick={() => a.students && setPassportStudent(a.students)}
                          >
                            {a.students?.full_name ?? "Unknown"}
                          </button>
                          <p className="text-xs text-muted-foreground">{a.students?.department}</p>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{a.job_postings?.title}</TableCell>
                        <TableCell><MatchPill score={a.match_score} /></TableCell>
                        <TableCell>
                          <ReadinessRing value={a.students?.readiness_score ?? 0} size={44} label="" />
                        </TableCell>
                        <TableCell><StatusBadge status={statusLabel(a.status)} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {next ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={advanceMutation.isPending}
                                onClick={() =>
                                  advanceMutation.mutate({
                                    id: a.id,
                                    status: next,
                                    studentUserId: a.students?.user_id ?? null,
                                    jobTitle: a.job_postings?.title ?? "your application",
                                  })
                                }
                              >
                                Move to {statusLabel(next)}
                              </Button>
                            ) : null}
                            {a.status !== "rejected" && a.status !== "selected" ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                disabled={advanceMutation.isPending}
                                onClick={() =>
                                  advanceMutation.mutate({
                                    id: a.id,
                                    status: "rejected",
                                    studentUserId: a.students?.user_id ?? null,
                                    jobTitle: a.job_postings?.title ?? "your application",
                                  })
                                }
                              >
                                Reject
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState icon={ClipboardList} title="No applications found" description="Try changing your filters, or wait for students to apply." />
          )}
        </CardContent>
      </Card>

      <SkillPassportDialog
        student={passportStudent}
        open={!!passportStudent}
        onOpenChange={(o) => !o && setPassportStudent(null)}
      />
    </div>
  );
}
