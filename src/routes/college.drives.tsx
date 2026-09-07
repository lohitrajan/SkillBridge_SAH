import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Pencil, Plus, TrendingUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CollegeGate } from "@/components/college/college-gate";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchCompanies, fetchDrives, type DriveRow } from "@/lib/data";

export const Route = createFileRoute("/college/drives")({
  head: () => ({
    meta: [
      { title: "Placement Drives | SkillBridge" },
      { name: "description", content: "Placement drives on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Placement Drives | SkillBridge" },
      { property: "og:description", content: "Placement drives on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeDrivesPage,
});

function CollegeDrivesPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Placement Drives" description="Track on-campus recruiting drives from eligibility through selection." />
      <CollegeGate>{(collegeId) => <Drives collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

const STATUS_OPTIONS = ["upcoming", "ongoing", "completed", "cancelled"];

interface FormState {
  role_title: string;
  company_id: string;
  drive_date: string;
  eligible_count: string;
  applied_count: string;
  shortlisted_count: string;
  selected_count: string;
  status: string;
}

const emptyForm: FormState = {
  role_title: "",
  company_id: "",
  drive_date: "",
  eligible_count: "0",
  applied_count: "0",
  shortlisted_count: "0",
  selected_count: "0",
  status: "upcoming",
};

function Drives({ collegeId }: { collegeId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DriveRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<DriveRow | null>(null);

  const drivesQuery = useQuery({ queryKey: ["college-drives", collegeId], queryFn: () => fetchDrives(collegeId) });
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: fetchCompanies });
  const drives = drivesQuery.data ?? [];

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const payload = {
        college_id: collegeId,
        company_id: values.company_id || null,
        role_title: values.role_title,
        drive_date: values.drive_date || null,
        eligible_count: Number(values.eligible_count) || 0,
        applied_count: Number(values.applied_count) || 0,
        shortlisted_count: Number(values.shortlisted_count) || 0,
        selected_count: Number(values.selected_count) || 0,
        status: values.status,
      };
      if (editing) {
        const { error } = await supabase.from("placement_drives").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("placement_drives").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      toast.success(editing ? "Drive updated" : "Drive created");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["college-drives", collegeId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("placement_drives").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Drive deleted");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["college-drives", collegeId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (d: DriveRow) => {
    setEditing(d);
    setForm({
      role_title: d.role_title,
      company_id: d.company_id ?? "",
      drive_date: d.drive_date ?? "",
      eligible_count: String(d.eligible_count),
      applied_count: String(d.applied_count),
      shortlisted_count: String(d.shortlisted_count),
      selected_count: String(d.selected_count),
      status: d.status,
    });
    setDialogOpen(true);
  };

  if (drivesQuery.isLoading) return <LoadingRows count={4} />;
  if (drivesQuery.isError) return <ErrorState message={drivesQuery.error.message} onRetry={() => drivesQuery.refetch()} />;

  const totalSelected = drives.reduce((a, d) => a + d.selected_count, 0);
  const totalApplied = drives.reduce((a, d) => a + d.applied_count, 0);
  const conversionRate = totalApplied ? Math.round((totalSelected / totalApplied) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Drives" value={drives.length} icon={CalendarClock} />
        <StatCard label="Total selected" value={totalSelected} tone="success" />
        <StatCard label="Applied → Selected" value={`${conversionRate}%`} icon={TrendingUp} />
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-1.5"><Plus className="size-4" /> New drive</Button>
      </div>

      {drives.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No placement drives yet"
          description="Schedule a drive to track eligibility, applications, shortlists and selections."
          action={<Button onClick={openCreate}>Create your first drive</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {drives.map((d) => (
            <Card key={d.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="text-base">{d.role_title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{d.companies?.name ?? "Company TBD"} · {d.drive_date ?? "Date TBD"}</p>
                </div>
                <div className="flex items-center gap-1">
                  <StatusPill status={d.status} />
                  <Button size="icon" variant="ghost" onClick={() => openEdit(d)}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(d)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Funnel drive={d} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit placement drive" : "New placement drive"}</DialogTitle>
            <DialogDescription>Track the funnel from eligible students through to selection.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Role title</Label>
                <Input value={form.role_title} onChange={(e) => setForm((f) => ({ ...f, role_title: e.target.value }))} placeholder="Software Engineer" />
              </div>
              <div className="space-y-1.5">
                <Label>Company</Label>
                <Select value={form.company_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, company_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(companiesQuery.data ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Drive date</Label>
                <Input type="date" value={form.drive_date} onChange={(e) => setForm((f) => ({ ...f, drive_date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Eligible</Label>
                <Input type="number" min={0} value={form.eligible_count} onChange={(e) => setForm((f) => ({ ...f, eligible_count: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Applied</Label>
                <Input type="number" min={0} value={form.applied_count} onChange={(e) => setForm((f) => ({ ...f, applied_count: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Shortlisted</Label>
                <Input type="number" min={0} value={form.shortlisted_count} onChange={(e) => setForm((f) => ({ ...f, shortlisted_count: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Selected</Label>
                <Input type="number" min={0} value={form.selected_count} onChange={(e) => setForm((f) => ({ ...f, selected_count: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!form.role_title || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {editing ? "Save changes" : "Create drive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this drive?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.role_title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Funnel({ drive }: { drive: DriveRow }) {
  const stages: { label: string; value: number }[] = [
    { label: "Eligible", value: drive.eligible_count },
    { label: "Applied", value: drive.applied_count },
    { label: "Shortlisted", value: drive.shortlisted_count },
    { label: "Selected", value: drive.selected_count },
  ];
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.label} className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{s.label}</span>
            <span className="tabular-nums">{s.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(s.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    upcoming: "bg-primary/10 text-primary",
    ongoing: "bg-accent/20 text-accent-foreground",
    completed: "bg-success/15 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return <Badge variant="secondary" className={`capitalize ${tone[status] ?? ""}`}>{status}</Badge>;
}
