import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { downloadCsv } from "@/components/admin/csv";
import { SkillBadge } from "@/components/shared/skill-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import {
  fetchColleges,
  fetchProjects,
  fetchStudentSkills,
  fetchStudents,
  type StudentRow,
} from "@/lib/data";

export const Route = createFileRoute("/admin/students")({
  head: () => ({
    meta: [
      { title: "Students | SkillBridge" },
      { name: "description", content: "Students on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Students | SkillBridge" },
      { property: "og:description", content: "Students on SkillBridge." },
    ],
  }),
  component: AdminStudentsPage,
});

function AdminStudentsPage() {
  const studentsQuery = useQuery({ queryKey: ["admin-all-students"], queryFn: () => fetchStudents() });
  const collegesQuery = useQuery({ queryKey: ["admin-colleges"], queryFn: fetchColleges });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [collegeId, setCollegeId] = useState("all");
  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("all");
  const [minReadiness, setMinReadiness] = useState("0");
  const [selected, setSelected] = useState<StudentRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const students = studentsQuery.data ?? [];
  const colleges = collegesQuery.data ?? [];
  const collegeName = useMemo(() => new Map(colleges.map((c) => [c.id, c.name])), [colleges]);

  const departments = useMemo(() => Array.from(new Set(students.map((s) => s.department))).sort(), [students]);
  const years = useMemo(() => Array.from(new Set(students.map((s) => s.year))).sort(), [students]);

  const filtered = students.filter((s) => {
    if (debounced && !`${s.full_name} ${s.email}`.toLowerCase().includes(debounced.toLowerCase())) return false;
    if (collegeId !== "all" && s.college_id !== collegeId) return false;
    if (department !== "all" && s.department !== department) return false;
    if (year !== "all" && String(s.year) !== year) return false;
    if (s.readiness_score < Number(minReadiness)) return false;
    return true;
  });

  const exportCsv = () => {
    downloadCsv(
      "students.csv",
      filtered.map((s) => ({
        Name: s.full_name,
        Email: s.email,
        College: collegeName.get(s.college_id ?? "") ?? "",
        Department: s.department,
        Year: s.year,
        Readiness: s.readiness_score,
      })),
    );
  };

  if (studentsQuery.isLoading) return <LoadingRows count={6} />;
  if (studentsQuery.isError) return <ErrorState message={studentsQuery.error.message} onRetry={() => studentsQuery.refetch()} />;

  return (
    <div className="space-y-6">
      <PageHeading title="Students" description="Every student profile across all colleges on the platform." />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input id="search" className="pl-8" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>College</Label>
          <Select value={collegeId} onValueChange={setCollegeId}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All colleges</SelectItem>
              {colleges.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {years.map((y) => <SelectItem key={y} value={String(y)}>Year {y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Min. readiness</Label>
          <Input type="number" className="w-24" min={0} max={100} value={minReadiness} onChange={(e) => setMinReadiness(e.target.value)} />
        </div>
        <Button variant="outline" onClick={exportCsv} className="ml-auto gap-1.5">
          <ArrowDownToLine className="size-4" /> Export CSV
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No students match these filters" description="Try widening your search or clearing filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>College</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Readiness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{collegeName.get(s.college_id ?? "") ?? "—"}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.year}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={s.readiness_score >= 75 ? "bg-success/15 text-success" : ""}>
                      {s.readiness_score}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <StudentSheet student={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function StudentSheet({ student, onClose }: { student: StudentRow | null; onClose: () => void }) {
  const skillsQuery = useQuery({
    queryKey: ["admin-student-skills", student?.id],
    queryFn: () => fetchStudentSkills(student!.id),
    enabled: !!student,
  });
  const projectsQuery = useQuery({
    queryKey: ["admin-student-projects", student?.id],
    queryFn: () => fetchProjects(student!.id),
    enabled: !!student,
  });

  return (
    <Sheet open={!!student} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {student ? (
          <>
            <SheetHeader>
              <SheetTitle>{student.full_name}</SheetTitle>
              <SheetDescription>
                {student.department} · {student.degree} · Year {student.year} · Readiness {student.readiness_score}%
              </SheetDescription>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium">Skills</p>
                {skillsQuery.isLoading ? <LoadingRows count={2} /> : (skillsQuery.data ?? []).length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(skillsQuery.data ?? []).map((s) => (
                      <SkillBadge key={s.id} name={s.skills?.name ?? ""} verified={s.verified} score={s.proficiency_score} source={s.verification_source} />
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No skills recorded yet.</p>}
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">Projects ({(projectsQuery.data ?? []).length})</p>
                {(projectsQuery.data ?? []).length ? (
                  <ul className="space-y-1.5 text-sm">
                    {(projectsQuery.data ?? []).map((p) => <li key={p.id} className="rounded-md bg-muted p-2">{p.title}</li>)}
                  </ul>
                ) : <p className="text-xs text-muted-foreground">None yet.</p>}
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
