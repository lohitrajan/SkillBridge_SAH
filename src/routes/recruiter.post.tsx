import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Loader2, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { OpportunityForm } from "@/components/recruiter/opportunity-form";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchApplicationsForCompany, fetchJobs, type JobWithSkills } from "@/lib/data";

export const Route = createFileRoute("/recruiter/post")({
  validateSearch: (search: Record<string, unknown>): { skills?: string } => {
    const out: { skills?: string } = {};
    if (typeof search["skills"] === "string") out.skills = search["skills"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Post Opportunity | SkillBridge" },
      { name: "description", content: "Post Opportunity on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Post Opportunity | SkillBridge" },
      { property: "og:description", content: "Post Opportunity on SkillBridge." },
    ],
  }),
  component: RecruiterPostPage,
});

function RecruiterPostPage() {
  const { companyId } = useAuth();
  const search = useSearch({ from: "/recruiter/post" });
  const queryClient = useQueryClient();
  const [editingJob, setEditingJob] = useState<JobWithSkills | null>(null);

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

  const applicantCounts = useMemo(() => {
    const map = new Map<string, number>();
    (appsQ.data ?? []).forEach((a) => map.set(a.job_id, (map.get(a.job_id) ?? 0) + 1));
    return map;
  }, [appsQ.data]);

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("job_postings").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Posting updated");
      void queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("job_postings").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Posting deleted");
      void queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Post Opportunity" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile before posting opportunities."
          action={
            <Button asChild>
              <Link to="/recruiter/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading
        title="Post Opportunity"
        description="Publish internships and jobs, and manage your existing postings."
      />

      <OpportunityForm
        companyId={companyId}
        job={editingJob}
        initialSkillIds={search.skills ? search.skills.split(",").filter(Boolean) : undefined}
        onDone={() => setEditingJob(null)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Your postings</CardTitle>
        </CardHeader>
        <CardContent>
          {jobsQ.isLoading ? (
            <LoadingRows />
          ) : jobsQ.isError ? (
            <ErrorState message={jobsQ.error?.message} onRetry={() => jobsQ.refetch()} />
          ) : jobsQ.data?.length ? (
            <div className="space-y-3">
              {jobsQ.data.map((job) => (
                <div key={job.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{job.title}</p>
                      <Badge variant={job.status === "published" ? "default" : "secondary"}>{job.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {job.opportunity_type} · {job.location} · {job.openings} opening{job.openings === 1 ? "" : "s"} ·{" "}
                      {applicantCounts.get(job.id) ?? 0} applicant{(applicantCounts.get(job.id) ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditingJob(job)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    {job.status === "closed" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: job.id, status: "published" })}
                      >
                        Reopen
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={statusMutation.isPending}
                        onClick={() => statusMutation.mutate({ id: job.id, status: "closed" })}
                      >
                        Close
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          {deleteMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this posting?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove "{job.title}" and its required-skill data. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(job.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Briefcase} title="No postings yet" description="Use the form above to publish your first opportunity." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
