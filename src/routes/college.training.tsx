import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GraduationCap, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { fetchEnrollmentCounts, fetchSkills, fetchTrainingPrograms, type TrainingProgramRow } from "@/lib/data";

export const Route = createFileRoute("/college/training")({
  head: () => ({
    meta: [
      { title: "Training Programs | SkillBridge" },
      { name: "description", content: "Training programs on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Training Programs | SkillBridge" },
      { property: "og:description", content: "Training programs on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeTrainingPage,
});

function CollegeTrainingPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Training Programs" description="Run targeted upskilling programs to close your students' skill gaps." />
      <CollegeGate>{(collegeId) => <Training collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

const STATUS_OPTIONS = ["draft", "open", "ongoing", "completed", "cancelled"];

interface FormState {
  title: string;
  target_skill_id: string;
  description: string;
  eligibility: string;
  duration_weeks: string;
  starts_on: string;
  status: string;
}

const emptyForm: FormState = {
  title: "",
  target_skill_id: "",
  description: "",
  eligibility: "",
  duration_weeks: "4",
  starts_on: "",
  status: "draft",
};

function Training({ collegeId }: { collegeId: string }) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TrainingProgramRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<TrainingProgramRow | null>(null);

  const programsQuery = useQuery({
    queryKey: ["training-programs", collegeId],
    queryFn: () => fetchTrainingPrograms(collegeId),
  });
  const skillsQuery = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });
  const programs = programsQuery.data ?? [];
  const programIds = programs.map((p) => p.id);

  const enrollmentsQuery = useQuery({
    queryKey: ["training-enrollments", programIds],
    queryFn: () => fetchEnrollmentCounts(programIds),
    enabled: programIds.length > 0,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: FormState) => {
      const payload = {
        college_id: collegeId,
        title: values.title,
        target_skill_id: values.target_skill_id || null,
        description: values.description,
        eligibility: values.eligibility,
        duration_weeks: Number(values.duration_weeks) || 1,
        starts_on: values.starts_on || null,
        status: values.status,
      };
      if (editing) {
        const { error } = await supabase.from("training_programs").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("training_programs").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: async () => {
      toast.success(editing ? "Program updated" : "Program created");
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await queryClient.invalidateQueries({ queryKey: ["training-programs", collegeId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_programs").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Program deleted");
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["training-programs", collegeId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: TrainingProgramRow) => {
    setEditing(p);
    setForm({
      title: p.title,
      target_skill_id: p.target_skill_id ?? "",
      description: p.description,
      eligibility: p.eligibility,
      duration_weeks: String(p.duration_weeks),
      starts_on: p.starts_on ?? "",
      status: p.status,
    });
    setDialogOpen(true);
  };

  if (programsQuery.isLoading) return <LoadingRows count={4} />;
  if (programsQuery.isError)
    return <ErrorState message={programsQuery.error.message} onRetry={() => programsQuery.refetch()} />;

  const totalEnrolled = Object.values(enrollmentsQuery.data ?? {}).reduce((a, b) => a + b, 0);
  const activeCount = programs.filter((p) => p.status === "open" || p.status === "ongoing").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Programs" value={programs.length} icon={GraduationCap} />
        <StatCard label="Active programs" value={activeCount} tone="success" />
        <StatCard label="Total enrollments" value={totalEnrolled} icon={Users} />
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-1.5"><Plus className="size-4" /> New program</Button>
      </div>

      {programs.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="No training programs yet"
          description="Create a program to help students close skill gaps identified in your analysis."
          action={<Button onClick={openCreate}>Create your first program</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Target skill</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Enrolled</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell>{p.skills?.name ?? "—"}</TableCell>
                  <TableCell>{p.duration_weeks}w</TableCell>
                  <TableCell>{p.starts_on ?? "TBD"}</TableCell>
                  <TableCell><StatusPill status={p.status} /></TableCell>
                  <TableCell className="text-right tabular-nums">{enrollmentsQuery.data?.[p.id] ?? 0}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="size-4" /></Button>
                      <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleteTarget(p)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit training program" : "New training program"}</DialogTitle>
            <DialogDescription>Define a program to help students build in-demand skills.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Advanced React Bootcamp" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Target skill</Label>
                <Select value={form.target_skill_id || "none"} onValueChange={(v) => setForm((f) => ({ ...f, target_skill_id: v === "none" ? "" : v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {(skillsQuery.data ?? []).map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <div className="space-y-1.5">
                <Label>Duration (weeks)</Label>
                <Input type="number" min={1} value={form.duration_weeks} onChange={(e) => setForm((f) => ({ ...f, duration_weeks: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Starts on</Label>
                <Input type="date" value={form.starts_on} onChange={(e) => setForm((f) => ({ ...f, starts_on: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Eligibility</Label>
              <Input value={form.eligibility} onChange={(e) => setForm((f) => ({ ...f, eligibility: e.target.value }))} placeholder="2nd/3rd year CSE, IT" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button disabled={!form.title || saveMutation.isPending} onClick={() => saveMutation.mutate(form)}>
              {editing ? "Save changes" : "Create program"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this program?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.title}". This action cannot be undone.
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

function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    open: "bg-primary/10 text-primary",
    ongoing: "bg-accent/20 text-accent-foreground",
    completed: "bg-success/15 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };
  return <Badge variant="secondary" className={`capitalize ${tone[status] ?? ""}`}>{status}</Badge>;
}
