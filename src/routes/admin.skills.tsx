import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { supabase } from "@/integrations/supabase/client";
import { fetchSkills, type SkillRow } from "@/lib/data";

export const Route = createFileRoute("/admin/skills")({
  head: () => ({
    meta: [
      { title: "Skills | SkillBridge" },
      { name: "description", content: "Skills on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Skills | SkillBridge" },
      { property: "og:description", content: "Skills on SkillBridge." },
    ],
  }),
  component: AdminSkillsPage,
});

interface SkillForm {
  name: string;
  category: string;
  demand_level: string;
  demand_score: string;
}

const emptyForm: SkillForm = { name: "", category: "", demand_level: "medium", demand_score: "50" };

async function fetchSkillHolderCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from("student_skills").select("skill_id");
  if (error) throw new Error(error.message);
  return (data ?? []).reduce<Record<string, number>>((acc, r) => {
    acc[r.skill_id] = (acc[r.skill_id] ?? 0) + 1;
    return acc;
  }, {});
}

function AdminSkillsPage() {
  const queryClient = useQueryClient();
  const skillsQuery = useQuery({ queryKey: ["admin-skills"], queryFn: fetchSkills });
  const countsQuery = useQuery({ queryKey: ["admin-skill-holder-counts"], queryFn: fetchSkillHolderCounts });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [category, setCategory] = useState("all");
  const [demand, setDemand] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SkillRow | null>(null);
  const [form, setForm] = useState<SkillForm>(emptyForm);
  const [toDelete, setToDelete] = useState<SkillRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const skills = skillsQuery.data ?? [];
  const counts = countsQuery.data ?? {};
  const categories = useMemo(() => Array.from(new Set(skills.map((s) => s.category))).sort(), [skills]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim() || "General",
        demand_level: form.demand_level,
        demand_score: Number(form.demand_score) || 0,
      };
      if (editing) {
        const { error } = await supabase.from("skills").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("skills").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Skill updated" : "Skill added");
      void queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (s: SkillRow) => {
      const { error } = await supabase.from("skills").delete().eq("id", s.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Skill deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = skills.filter((s) => {
    if (debounced && !s.name.toLowerCase().includes(debounced.toLowerCase())) return false;
    if (category !== "all" && s.category !== category) return false;
    if (demand !== "all" && s.demand_level !== demand) return false;
    return true;
  });

  const openEdit = (s: SkillRow) => {
    setEditing(s);
    setForm({ name: s.name, category: s.category, demand_level: s.demand_level, demand_score: String(s.demand_score) });
    setOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  if (skillsQuery.isLoading) return <LoadingRows count={6} />;
  if (skillsQuery.isError) return <ErrorState message={skillsQuery.error.message} onRetry={() => skillsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Skills"
        description="The skills taxonomy powering matching, assessments, and analytics."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="gap-1.5"><Plus className="size-4" /> Add skill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit skill" : "Add skill"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Programming" />
                </div>
                <div className="space-y-1.5">
                  <Label>Demand level</Label>
                  <Select value={form.demand_level} onValueChange={(v) => setForm((f) => ({ ...f, demand_level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Demand score (0-100)</Label>
                  <Input type="number" min={0} max={100} value={form.demand_score} onChange={(e) => setForm((f) => ({ ...f, demand_score: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={!form.name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Add skill"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input id="search" className="pl-8" placeholder="Skill name" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Demand</Label>
          <Select value={demand} onValueChange={setDemand}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No skills match these filters" description="Try widening your search or add a new skill." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Demand</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="secondary">{s.category}</Badge></TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={s.demand_level === "high" ? "bg-success/15 text-success" : s.demand_level === "low" ? "bg-muted text-muted-foreground" : "bg-warning/20 text-warning-foreground"}>
                      {s.demand_level}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.demand_score}</TableCell>
                  <TableCell className="text-right tabular-nums">{counts[s.id] ?? 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setToDelete(s)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete skill"
        description={`This will permanently remove ${toDelete?.name} from the taxonomy. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete)}
      />
    </div>
  );
}
