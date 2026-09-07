import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { downloadCsv } from "@/components/admin/csv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { fetchAllApplications, fetchCompanies, fetchJobs, type CompanyRow } from "@/lib/data";

export const Route = createFileRoute("/admin/industries")({
  head: () => ({
    meta: [
      { title: "Industries | SkillBridge" },
      { name: "description", content: "Industries on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Industries | SkillBridge" },
      { property: "og:description", content: "Industries on SkillBridge." },
    ],
  }),
  component: AdminIndustriesPage,
});

function AdminIndustriesPage() {
  const companiesQuery = useQuery({ queryKey: ["admin-companies"], queryFn: fetchCompanies });
  const jobsQuery = useQuery({ queryKey: ["admin-jobs"], queryFn: () => fetchJobs() });
  const appsQuery = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchAllApplications(2000) });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sector, setSector] = useState("all");
  const [selected, setSelected] = useState<CompanyRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const companies = companiesQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const applications = appsQuery.data ?? [];

  const sectors = useMemo(() => Array.from(new Set(companies.map((c) => c.sector))).sort(), [companies]);

  const jobCountByCompany = useMemo(() => {
    const m = new Map<string, number>();
    jobs.forEach((j) => m.set(j.company_id, (m.get(j.company_id) ?? 0) + 1));
    return m;
  }, [jobs]);

  const appCountByCompany = useMemo(() => {
    const jobToCompany = new Map(jobs.map((j) => [j.id, j.company_id]));
    const m = new Map<string, number>();
    applications.forEach((a) => {
      const companyId = jobToCompany.get(a.job_id);
      if (companyId) m.set(companyId, (m.get(companyId) ?? 0) + 1);
    });
    return m;
  }, [jobs, applications]);

  const filtered = companies.filter((c) => {
    if (debounced && !`${c.name} ${c.recruiter_name ?? ""}`.toLowerCase().includes(debounced.toLowerCase())) return false;
    if (sector !== "all" && c.sector !== sector) return false;
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      "companies.csv",
      filtered.map((c) => ({
        Name: c.name,
        Sector: c.sector,
        Size: c.company_size,
        Location: c.location,
        Postings: jobCountByCompany.get(c.id) ?? 0,
        Applications: appCountByCompany.get(c.id) ?? 0,
      })),
    );
  };

  if (companiesQuery.isLoading || jobsQuery.isLoading || appsQuery.isLoading) return <LoadingRows count={6} />;
  if (companiesQuery.isError) return <ErrorState message={companiesQuery.error.message} onRetry={() => companiesQuery.refetch()} />;
  if (jobsQuery.isError) return <ErrorState message={jobsQuery.error.message} onRetry={() => jobsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading title="Industries" description="Every company partnered with SkillBridge, with postings and application volume." />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input id="search" className="pl-8" placeholder="Company or recruiter" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Sector</Label>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sectors</SelectItem>
              {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} className="ml-auto gap-1.5">
          <ArrowDownToLine className="size-4" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No companies match these filters" description="Try widening your search or clearing filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Postings</TableHead>
                <TableHead className="text-right">Applications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="secondary">{c.sector}</Badge></TableCell>
                  <TableCell>{c.location}</TableCell>
                  <TableCell className="text-right tabular-nums">{jobCountByCompany.get(c.id) ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{appCountByCompany.get(c.id) ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>
                  {selected.sector} · {selected.company_size} · {selected.location}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-3 text-sm">
                <p><span className="font-medium">Recruiter:</span> {selected.recruiter_name ?? "—"}</p>
                <p><span className="font-medium">Email:</span> {selected.recruiter_email ?? "—"}</p>
                <p><span className="font-medium">Website:</span> {selected.website ?? "—"}</p>
                {selected.about ? <p className="text-muted-foreground">{selected.about}</p> : null}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Postings</p>
                    <p className="text-lg font-semibold tabular-nums">{jobCountByCompany.get(selected.id) ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Applications</p>
                    <p className="text-lg font-semibold tabular-nums">{appCountByCompany.get(selected.id) ?? 0}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
