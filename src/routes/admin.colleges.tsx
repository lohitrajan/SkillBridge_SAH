import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { supabase } from "@/integrations/supabase/client";
import { fetchColleges, fetchStudents, type CollegeRow } from "@/lib/data";

export const Route = createFileRoute("/admin/colleges")({
  head: () => ({
    meta: [
      { title: "Colleges | SkillBridge" },
      { name: "description", content: "Colleges on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Colleges | SkillBridge" },
      { property: "og:description", content: "Colleges on SkillBridge." },
    ],
  }),
  component: AdminCollegesPage,
});

interface CollegeForm {
  name: string;
  institution_type: string;
  location: string;
  contact_person: string;
  official_email: string;
  website: string;
}

const emptyForm: CollegeForm = { name: "", institution_type: "", location: "", contact_person: "", official_email: "", website: "" };

function AdminCollegesPage() {
  const queryClient = useQueryClient();
  const collegesQuery = useQuery({ queryKey: ["admin-colleges"], queryFn: fetchColleges });
  const studentsQuery = useQuery({ queryKey: ["admin-all-students"], queryFn: () => fetchStudents() });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CollegeRow | null>(null);
  const [form, setForm] = useState<CollegeForm>(emptyForm);
  const [toDelete, setToDelete] = useState<CollegeRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const counts = new Map<string, number>();
  (studentsQuery.data ?? []).forEach((s) => {
    if (s.college_id) counts.set(s.college_id, (counts.get(s.college_id) ?? 0) + 1);
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        institution_type: form.institution_type.trim() || "College",
        location: form.location.trim(),
        contact_person: form.contact_person.trim() || null,
        official_email: form.official_email.trim() || null,
        website: form.website.trim() || null,
      };
      if (editing) {
        const { error } = await supabase.from("colleges").update(payload).eq("id", editing.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("colleges").insert(payload);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "College updated" : "College added");
      void queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (c: CollegeRow) => {
      const { error } = await supabase.from("colleges").delete().eq("id", c.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("College deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin-colleges"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const colleges = collegesQuery.data ?? [];
  const filtered = colleges.filter((c) => !debounced || c.name.toLowerCase().includes(debounced.toLowerCase()));

  const openEdit = (c: CollegeRow) => {
    setEditing(c);
    setForm({
      name: c.name,
      institution_type: c.institution_type,
      location: c.location,
      contact_person: c.contact_person ?? "",
      official_email: c.official_email ?? "",
      website: c.website ?? "",
    });
    setOpen(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  if (collegesQuery.isLoading) return <LoadingRows count={6} />;
  if (collegesQuery.isError) return <ErrorState message={collegesQuery.error.message} onRetry={() => collegesQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Colleges"
        description="Institutions partnered with SkillBridge."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAdd} className="gap-1.5"><Plus className="size-4" /> Add college</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit college" : "Add college"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Institution type</Label>
                  <Input value={form.institution_type} onChange={(e) => setForm((f) => ({ ...f, institution_type: e.target.value }))} placeholder="e.g. University" />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact person</Label>
                  <Input value={form.contact_person} onChange={(e) => setForm((f) => ({ ...f, contact_person: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Official email</Label>
                  <Input type="email" value={form.official_email} onChange={(e) => setForm((f) => ({ ...f, official_email: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button disabled={!form.name.trim() || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  {saveMutation.isPending ? "Saving…" : editing ? "Save changes" : "Add college"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Search colleges" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No colleges found" description="Add a college to get started." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.institution_type}</TableCell>
                  <TableCell>{c.location}</TableCell>
                  <TableCell className="text-right tabular-nums">{counts.get(c.id) ?? 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(c)}>Edit</Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => setToDelete(c)}>Delete</Button>
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
        title="Delete college"
        description={`This will permanently remove ${toDelete?.name}. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => toDelete && deleteMutation.mutate(toDelete)}
      />
    </div>
  );
}
