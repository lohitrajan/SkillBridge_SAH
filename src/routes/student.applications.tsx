import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Briefcase, CalendarDays, MapPin, Search } from "lucide-react";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { MatchPill } from "@/components/shared/skill-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  APPLICATION_STATUSES,
  fetchApplicationHistory,
  fetchApplicationsForStudent,
  statusLabel,
} from "@/lib/data";
import { relativeTime } from "@/components/student/shared";

export const Route = createFileRoute("/student/applications")({
  head: () => ({
    meta: [
      { title: "My Applications | SkillBridge" },
      {
        name: "description",
        content: "Track every internship and job application you sent, with live status updates and match scores.",
      },
      { property: "og:title", content: "My Applications | SkillBridge" },
      { property: "og:description", content: "Track your applications and their live status on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentApplicationsPage,
});

const activeStatuses = ["applied", "under_review", "shortlisted", "interview"];

const statusTone: Record<string, string> = {
  applied: "bg-muted text-muted-foreground",
  under_review: "bg-primary/10 text-primary",
  shortlisted: "bg-accent/15 text-accent-foreground",
  interview: "bg-primary/15 text-primary",
  selected: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  rejected: "bg-destructive/10 text-destructive",
};

function StudentApplicationsPage() {
  const { studentId } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const applicationsQuery = useQuery({
    queryKey: ["applications", studentId],
    queryFn: () => fetchApplicationsForStudent(studentId as string),
    enabled: !!studentId,
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Applications" />
        <EmptyState
          icon={Briefcase}
          title="Complete onboarding first"
          description="Set up your profile so we can track your applications."
          action={
            <Button asChild>
              <Link to="/student/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (applicationsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Applications" />
        <LoadingRows count={5} />
      </div>
    );
  }

  if (applicationsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Applications" />
        <ErrorState
          message={(applicationsQuery.error as Error).message}
          onRetry={() => void applicationsQuery.refetch()}
        />
      </div>
    );
  }

  const applications = applicationsQuery.data ?? [];
  const total = applications.length;
  const active = applications.filter((a) => activeStatuses.includes(a.status)).length;
  const shortlisted = applications.filter((a) =>
    ["shortlisted", "interview", "selected"].includes(a.status),
  ).length;
  const selected = applications.filter((a) => a.status === "selected").length;

  const filtered = applications.filter((a) => {
    const job = a.job_postings;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (job?.title ?? "").toLowerCase().includes(q) ||
      (job?.companies?.name ?? "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Applications"
        description="Every opportunity you applied to, with its live progress."
        actions={
          <Button asChild variant="outline">
            <Link to="/student/internships">Find more opportunities</Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total applications" value={total} icon={Briefcase} />
        <StatCard label="In progress" value={active} tone="accent" />
        <StatCard label="Shortlisted+" value={shortlisted} tone="success" />
        <StatCard label="Offers" value={selected} tone="success" />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by role or company"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {APPLICATION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={total === 0 ? "No applications yet" : "No matches for this filter"}
          description={
            total === 0
              ? "Browse opportunities matched to your skills and apply in one click."
              : "Try a different search term or status."
          }
          action={
            total === 0 ? (
              <Button asChild>
                <Link to="/student/internships">Browse internships</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((application) => {
            const job = application.job_postings;
            return (
              <Card key={application.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardTitle className="text-base">{job?.title ?? "Opportunity removed"}</CardTitle>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{job?.companies?.name ?? "—"}</span>
                      {job?.location ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" /> {job.location}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" /> Applied {relativeTime(application.created_at)}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <MatchPill score={application.match_score} />
                    <Badge className={statusTone[application.status] ?? ""} variant="secondary">
                      {statusLabel(application.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-1">
                    {(job?.job_skills ?? [])
                      .filter((js) => js.is_required && js.skills)
                      .slice(0, 4)
                      .map((js) => (
                        <Badge key={js.skills!.id} variant="outline" className="text-xs">
                          {js.skills!.name}
                        </Badge>
                      ))}
                  </div>
                  <TimelineDialog applicationId={application.id} title={job?.title ?? "Application"} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineDialog({ applicationId, title }: { applicationId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const historyQuery = useQuery({
    queryKey: ["application-history", applicationId],
    queryFn: () => fetchApplicationHistory(applicationId),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          View timeline
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Status history for this application.</DialogDescription>
        </DialogHeader>
        {historyQuery.isLoading ? (
          <LoadingRows count={3} />
        ) : historyQuery.isError ? (
          <ErrorState message={(historyQuery.error as Error).message} />
        ) : (historyQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No status changes recorded yet.</p>
        ) : (
          <ol className="space-y-4 border-l pl-5">
            {(historyQuery.data ?? []).map((entry) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.55rem] top-1.5 size-2.5 rounded-full bg-primary" />
                <p className="text-sm font-medium">{statusLabel(entry.status)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.created_at).toLocaleString()}
                </p>
                {entry.note ? <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </DialogContent>
    </Dialog>
  );
}
