import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { downloadCsv } from "@/components/admin/csv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Users | SkillBridge" },
      { name: "description", content: "Users on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Users | SkillBridge" },
      { property: "og:description", content: "Users on SkillBridge." },
    ],
  }),
  component: AdminUsersPage,
});

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  role: AppRole | null;
}

async function fetchUsers(): Promise<UserRow[]> {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);
  if (profilesRes.error) throw new Error(profilesRes.error.message);
  if (rolesRes.error) throw new Error(rolesRes.error.message);
  const roleMap = new Map((rolesRes.data ?? []).map((r) => [r.user_id, r.role as AppRole]));
  return (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    is_active: p.is_active,
    created_at: p.created_at,
    role: roleMap.get(p.id) ?? null,
  }));
}

const roleTone: Record<string, string> = {
  student: "bg-primary/10 text-primary",
  college: "bg-accent/15 text-accent-foreground",
  industry: "bg-warning/20 text-warning-foreground",
  admin: "bg-success/15 text-success",
};

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [target, setTarget] = useState<UserRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleActive = useMutation({
    mutationFn: async (u: UserRow) => {
      const { error } = await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, u) => {
      toast.success(u.is_active ? "User deactivated" : "User activated");
      void queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const users = usersQuery.data ?? [];
  const filtered = users.filter((u) => {
    if (debounced && !`${u.full_name} ${u.email}`.toLowerCase().includes(debounced.toLowerCase())) return false;
    if (role !== "all" && u.role !== role) return false;
    if (status !== "all" && (status === "active") !== u.is_active) return false;
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      "users.csv",
      filtered.map((u) => ({
        Name: u.full_name,
        Email: u.email,
        Phone: u.phone ?? "",
        Role: u.role ?? "",
        Status: u.is_active ? "Active" : "Inactive",
        "Joined": u.created_at,
      })),
    );
  };

  if (usersQuery.isLoading) return <LoadingRows count={6} />;
  if (usersQuery.isError) return <ErrorState message={usersQuery.error.message} onRetry={() => usersQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading title="Users" description="All registered accounts across every role." />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input id="search" className="pl-8" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="industry">Industry</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} className="ml-auto gap-1.5">
          <ArrowDownToLine className="size-4" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No users match these filters" description="Try widening your search or clearing filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={roleTone[u.role ?? ""] ?? ""}>{u.role ?? "unassigned"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={u.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setTarget(u)}>
                      {u.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setTarget(null)}
        title={target?.is_active ? "Deactivate user" : "Activate user"}
        description={`Are you sure you want to ${target?.is_active ? "deactivate" : "activate"} ${target?.full_name}?`}
        confirmLabel={target?.is_active ? "Deactivate" : "Activate"}
        destructive={target?.is_active}
        loading={toggleActive.isPending}
        onConfirm={() => target && toggleActive.mutate(target)}
      />
    </div>
  );
}
