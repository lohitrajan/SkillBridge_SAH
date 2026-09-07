import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { downloadCsv } from "@/components/admin/csv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllApplications, fetchJobs } from "@/lib/data";

export const Route = createFileRoute("/admin/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities | SkillBridge" },
      { name: "description", content: "Opportunities on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Opportunities | SkillBridge" },
      { property: "og:description", content: "Opportunities on SkillBridge." },
    ],
  }),
  component: AdminOpportunitiesPage,
});

function AdminOpportunitiesPage() {
  const queryClient = useQueryClient();
  const jobsQuery = useQuery({ queryKey: ["admin-jobs"], queryFn: () => fetchJobs() });
  const appsQuery = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchAllApplications(2000) });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const jobs = jobsQuery.data ?? [];
  const applications = appsQuery.data ?? [];

  const appCountByJob = useMemo(() => {
    const m = new Map<string, number>();
    applications.forEach((a) => m.set(a.job_id, (m.get(a.job_id) ?? 0) + 1));
    return m;
  }, [applications]);

  const types = useMemo(() => Array.from(new Set(jobs.map((j) => j.opportunity_type))).sort(), [jobs]);

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status: current }: { id: string; status: string }) => {
      const next = current === "open" ? "closed" : "open";
      const { error } = await supabase.from("job_postings").update({ status: next }).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Posting status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = jobs.filter((j) => {
    if (debounced && !`${j.title} ${j.companies?.name ?? ""}`.toLowerCase().includes(debounced.toLowerCase())) return false;
    if (status !== "all" && j.status !== status) return false;
    if (type !== "all" && j.opportunity_type !== type) return false;
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      "opportunities.csv",
      filtered.map((j) => ({
        Title: j.title,
        Company: j.companies?.name ?? "",
        Type: j.opportunity_type,
        Location: j.location,
        Status: j.status,
        Applicants: appCountByJob.get(j.id) ?? 0,
        Posted: j.created_at,
      })),
    );
  };

  if (jobsQuery.isLoading || appsQuery.isLoading) return <LoadingRows count={6} />;
  if (jobsQuery.isError) return <ErrorState message={jobsQuery.error.message} onRetry={() => jobsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading title="Opportunities" description="Every job, internship, and gig posted across the platform." />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input id="search" className="pl-8" placeholder="Title or company" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} className="ml-auto gap-1.5">
          <ArrowDownToLine className="size-4" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No opportunities match these filters" description="Try widening your search or clearing filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Applicants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">{j.title}</TableCell>
                  <TableCell>{j.companies?.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{j.opportunity_type}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={j.status === "open" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                      {j.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{appCountByJob.get(j.id) ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={toggleStatus.isPending}
                      onClick={() => toggleStatus.mutate({ id: j.id, status: j.status })}
                    >
                      {j.status === "open" ? "Close" : "Reopen"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
