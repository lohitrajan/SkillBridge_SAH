import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, LayoutGrid } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchPill } from "@/components/shared/skill-badge";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { SkillPassportDialog } from "@/components/recruiter/skill-passport-dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  createNotification,
  fetchApplicationsForCompany,
  statusLabel,
  updateApplicationStatus,
  type ApplicationStatus,
  type StudentRow,
} from "@/lib/data";

export const Route = createFileRoute("/recruiter/pipeline")({
  head: () => ({
    meta: [
      { title: "Interview Pipeline | SkillBridge" },
      { name: "description", content: "Interview Pipeline on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Interview Pipeline | SkillBridge" },
      { property: "og:description", content: "Interview Pipeline on SkillBridge." },
    ],
  }),
  component: RecruiterPipelinePage,
});

const stages: { status: ApplicationStatus; nextStatus: ApplicationStatus | null; label: string }[] = [
  { status: "applied", nextStatus: "under_review", label: "Applied" },
  { status: "under_review", nextStatus: "shortlisted", label: "Under Review" },
  { status: "shortlisted", nextStatus: "interview", label: "Shortlisted" },
  { status: "interview", nextStatus: "selected", label: "Interview" },
  { status: "selected", nextStatus: null, label: "Selected" },
  { status: "rejected", nextStatus: null, label: "Rejected" },
];

function RecruiterPipelinePage() {
  const { companyId } = useAuth();
  const queryClient = useQueryClient();
  const [passportStudent, setPassportStudent] = useState<StudentRow | null>(null);

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
      status: ApplicationStatus;
      studentUserId: string | null;
      jobTitle: string;
    }) => {
      await updateApplicationStatus(id, status);
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
      toast.success("Candidate moved");
      void queryClient.invalidateQueries({ queryKey: ["recruiter-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Interview Pipeline" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile to manage your hiring pipeline."
          action={
            <Button asChild>
              <Link to="/recruiter/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (appsQ.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Interview Pipeline" />
        <LoadingRows />
      </div>
    );
  }

  if (appsQ.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Interview Pipeline" />
        <ErrorState message={appsQ.error?.message} onRetry={() => appsQ.refetch()} />
      </div>
    );
  }

  const apps = appsQ.data ?? [];

  if (!apps.length) {
    return (
      <div className="space-y-6">
        <PageHeading title="Interview Pipeline" />
        <EmptyState icon={LayoutGrid} title="No candidates yet" description="Applications will show up here once students apply to your postings." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Interview Pipeline"
        description="Track candidates across every stage of your hiring funnel."
      />

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        {stages.map((stage) => {
          const items = apps.filter((a) => a.status === stage.status);
          return (
            <Card key={stage.status} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  {stage.label}
                  <Badge variant="secondary">{items.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {items.length ? (
                  items.map((a) => (
                    <div key={a.id} className="space-y-2 rounded-lg border p-2.5">
                      <button
                        className="text-left text-sm font-medium text-primary hover:underline"
                        onClick={() => a.students && setPassportStudent(a.students)}
                      >
                        {a.students?.full_name ?? "Unknown"}
                      </button>
                      <p className="truncate text-xs text-muted-foreground">{a.job_postings?.title}</p>
                      <MatchPill score={a.match_score} />
                      {stage.nextStatus ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={advanceMutation.isPending}
                          onClick={() =>
                            advanceMutation.mutate({
                              id: a.id,
                              status: stage.nextStatus!,
                              studentUserId: a.students?.user_id ?? null,
                              jobTitle: a.job_postings?.title ?? "your application",
                            })
                          }
                        >
                          Move to {statusLabel(stage.nextStatus)}
                        </Button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-center text-xs text-muted-foreground">No candidates</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SkillPassportDialog
        student={passportStudent}
        open={!!passportStudent}
        onOpenChange={(o) => !o && setPassportStudent(null)}
      />
    </div>
  );
}
