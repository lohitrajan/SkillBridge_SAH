import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CollegeGate } from "@/components/college/college-gate";
import { downloadCsv } from "@/components/college/csv";
import { SkillBadge, StatusBadge } from "@/components/shared/skill-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import {
  fetchApplicationsForStudent,
  fetchAttempts,
  fetchCertifications,
  fetchProjects,
  fetchProjectsFor,
  fetchStudentSkills,
  fetchStudentSkillsFor,
  fetchStudents,
  statusLabel,
  type StudentRow,
} from "@/lib/data";

export const Route = createFileRoute("/college/students")({
  head: () => ({
    meta: [
      { title: "Students | SkillBridge" },
      { name: "description", content: "Students on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Students | SkillBridge" },
      { property: "og:description", content: "Students on SkillBridge." },
    ],
  }),
  component: CollegeStudentsPage,
});

function CollegeStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="Students" description="Your institution's student roster and skill passports." />
      <CollegeGate>{(collegeId) => <Roster collegeId={collegeId} />}</CollegeGate>
    </div>
  );
}

type SortKey = "name" | "department" | "year" | "readiness";

function Roster({ collegeId }: { collegeId: string }) {
  const studentsQuery = useQuery({
    queryKey: ["college-students", collegeId],
    queryFn: () => fetchStudents({ collegeId }),
  });

  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [department, setDepartment] = useState("all");
  const [year, setYear] = useState("all");
  const [gradYear, setGradYear] = useState("all");
  const [minReadiness, setMinReadiness] = useState("0");
  const [readyOnly, setReadyOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("readiness");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<StudentRow | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const students = studentsQuery.data ?? [];
  const departments = useMemo(
    () => Array.from(new Set(students.map((s) => s.department))).sort(),
    [students],
  );
  const years = useMemo(() => Array.from(new Set(students.map((s) => s.year))).sort(), [students]);
  const gradYears = useMemo(
    () => Array.from(new Set(students.map((s) => s.graduation_year))).sort(),
    [students],
  );

  const skillCountsQuery = useQuery({
    queryKey: ["college-students-counts", students.map((s) => s.id)],
    queryFn: async () => {
      const ids = students.map((s) => s.id);
      const [skills, apps, projectsByStudent] = await Promise.all([
        fetchStudentSkillsFor(ids),
        Promise.all(ids.map((id) => fetchApplicationsForStudent(id))),
        fetchProjectsFor(ids),
      ]);
      const verifiedCount = new Map<string, number>();
      skills.forEach((s) => {
        if (s.verified) verifiedCount.set(s.student_id, (verifiedCount.get(s.student_id) ?? 0) + 1);
      });
      const projCount = new Map<string, number>();
      projectsByStudent.forEach((p) => projCount.set(p.student_id, (projCount.get(p.student_id) ?? 0) + 1));
      const appCount = new Map<string, number>();
      ids.forEach((id, i) => appCount.set(id, apps[i]?.length ?? 0));
      return { verifiedCount, projCount, appCount };
    },
    enabled: students.length > 0,
  });

  const filtered = students.filter((s) => {
    if (debounced && !`${s.full_name} ${s.email}`.toLowerCase().includes(debounced.toLowerCase())) return false;
    if (department !== "all" && s.department !== department) return false;
    if (year !== "all" && String(s.year) !== year) return false;
    if (gradYear !== "all" && String(s.graduation_year) !== gradYear) return false;
    if (s.readiness_score < Number(minReadiness)) return false;
    if (readyOnly && s.readiness_score < 75) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.full_name.localeCompare(b.full_name);
    else if (sortKey === "department") cmp = a.department.localeCompare(b.department);
    else if (sortKey === "year") cmp = a.year - b.year;
    else cmp = a.readiness_score - b.readiness_score;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const exportCsv = () => {
    downloadCsv(
      "students-roster.csv",
      sorted.map((s) => ({
        Name: s.full_name,
        Email: s.email,
        Department: s.department,
        Degree: s.degree,
        Year: s.year,
        "Graduation Year": s.graduation_year,
        Readiness: s.readiness_score,
        "Verified Skills": skillCountsQuery.data?.verifiedCount.get(s.id) ?? 0,
        Projects: skillCountsQuery.data?.projCount.get(s.id) ?? 0,
        Applications: skillCountsQuery.data?.appCount.get(s.id) ?? 0,
      })),
    );
  };

  if (studentsQuery.isLoading) return <LoadingRows count={6} />;
  if (studentsQuery.isError)
    return <ErrorState message={studentsQuery.error.message} onRetry={() => studentsQuery.refetch()} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="min-w-48 flex-1 space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input id="search" className="pl-8" placeholder="Name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
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
          <Label>Grad. year</Label>
          <Select value={gradYear} onValueChange={setGradYear}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {gradYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Min. readiness</Label>
          <Input type="number" className="w-24" min={0} max={100} value={minReadiness} onChange={(e) => setMinReadiness(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm">
          <input type="checkbox" className="size-4 accent-primary" checked={readyOnly} onChange={(e) => setReadyOnly(e.target.checked)} />
          Placement ready only
        </label>
        <Button variant="outline" onClick={exportCsv} className="ml-auto gap-1.5">
          <ArrowDownToLine className="size-4" /> Export CSV
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState title="No students match these filters" description="Try widening your search or clearing filters." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {([
                  ["name", "Name"],
                  ["department", "Department"],
                  ["year", "Year"],
                ] as [SortKey, string][]).map(([key, label]) => (
                  <TableHead key={key}>
                    <button className="flex items-center gap-1 font-medium" onClick={() => toggleSort(key)}>
                      {label} <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                ))}
                <TableHead>Degree</TableHead>
                <TableHead>
                  <button className="flex items-center gap-1 font-medium" onClick={() => toggleSort("readiness")}>
                    Readiness <ArrowUpDown className="size-3" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Verified skills</TableHead>
                <TableHead className="text-right">Projects</TableHead>
                <TableHead className="text-right">Applications</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((s) => (
                <TableRow key={s.id} className="cursor-pointer" onClick={() => setSelected(s)}>
                  <TableCell className="font-medium">{s.full_name}</TableCell>
                  <TableCell>{s.department}</TableCell>
                  <TableCell>{s.year}</TableCell>
                  <TableCell>{s.degree}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={s.readiness_score >= 75 ? "bg-success/15 text-success" : ""}>
                      {s.readiness_score}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{skillCountsQuery.data?.verifiedCount.get(s.id) ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{skillCountsQuery.data?.projCount.get(s.id) ?? 0}</TableCell>
                  <TableCell className="text-right tabular-nums">{skillCountsQuery.data?.appCount.get(s.id) ?? 0}</TableCell>
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
    queryKey: ["student-skills", student?.id],
    queryFn: () => fetchStudentSkills(student!.id),
    enabled: !!student,
  });
  const projectsQuery = useQuery({
    queryKey: ["student-projects", student?.id],
    queryFn: () => fetchProjects(student!.id),
    enabled: !!student,
  });
  const certsQuery = useQuery({
    queryKey: ["student-certs", student?.id],
    queryFn: () => fetchCertifications(student!.id),
    enabled: !!student,
  });
  const attemptsQuery = useQuery({
    queryKey: ["student-attempts", student?.id],
    queryFn: () => fetchAttempts(student!.id),
    enabled: !!student,
  });
  const appsQuery = useQuery({
    queryKey: ["student-apps", student?.id],
    queryFn: () => fetchApplicationsForStudent(student!.id),
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
            <Tabs defaultValue="skills" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="skills">Skills</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
                <TabsTrigger value="apps">Applications</TabsTrigger>
              </TabsList>
              <TabsContent value="skills" className="space-y-2 pt-3">
                {skillsQuery.isLoading ? <LoadingRows count={3} /> : (skillsQuery.data ?? []).length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(skillsQuery.data ?? []).map((s) => (
                      <SkillBadge key={s.id} name={s.skills?.name ?? ""} verified={s.verified} score={s.proficiency_score} source={s.verification_source} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No skills recorded yet.</p>
                )}
              </TabsContent>
              <TabsContent value="evidence" className="space-y-4 pt-3">
                <div>
                  <p className="mb-1.5 text-sm font-medium">Projects ({(projectsQuery.data ?? []).length})</p>
                  {(projectsQuery.data ?? []).length ? (
                    <ul className="space-y-1.5 text-sm">
                      {(projectsQuery.data ?? []).map((p) => <li key={p.id} className="rounded-md bg-muted p-2">{p.title}</li>)}
                    </ul>
                  ) : <p className="text-xs text-muted-foreground">None yet.</p>}
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium">Certifications ({(certsQuery.data ?? []).length})</p>
                  {(certsQuery.data ?? []).length ? (
                    <ul className="space-y-1.5 text-sm">
                      {(certsQuery.data ?? []).map((c) => <li key={c.id} className="rounded-md bg-muted p-2">{c.name} — {c.issuer}</li>)}
                    </ul>
                  ) : <p className="text-xs text-muted-foreground">None yet.</p>}
                </div>
                <div>
                  <p className="mb-1.5 text-sm font-medium">Assessment attempts ({(attemptsQuery.data ?? []).length})</p>
                  {(attemptsQuery.data ?? []).length ? (
                    <ul className="space-y-1.5 text-sm">
                      {(attemptsQuery.data ?? []).map((a) => (
                        <li key={a.id} className="flex items-center justify-between rounded-md bg-muted p-2">
                          <span>{a.assessments?.title ?? "Assessment"}</span>
                          <span className="tabular-nums text-muted-foreground">{a.score}%</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-muted-foreground">None yet.</p>}
                </div>
              </TabsContent>
              <TabsContent value="apps" className="space-y-2 pt-3">
                {(appsQuery.data ?? []).length ? (
                  <ul className="space-y-2">
                    {(appsQuery.data ?? []).map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-md border border-border p-2 text-sm">
                        <span className="truncate">{a.job_postings?.title ?? "Role"}</span>
                        <StatusBadge status={statusLabel(a.status)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No applications submitted yet.</p>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
