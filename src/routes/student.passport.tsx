import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Download, FileText, Loader2, Printer, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { ReadinessRing } from "@/components/shared/readiness-ring";
import { SkillBadge } from "@/components/shared/skill-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchAttempts,
  fetchCertifications,
  fetchProjects,
  fetchStudent,
  fetchStudentSkills,
} from "@/lib/data";
import { readinessBreakdown } from "@/lib/matching";

export const Route = createFileRoute("/student/passport")({
  head: () => ({
    meta: [
      { title: "My Skill Passport | SkillBridge" },
      { name: "description", content: "My Skill Passport on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "My Skill Passport | SkillBridge" },
      { property: "og:description", content: "My Skill Passport on SkillBridge." },
    ],
  }),
  component: StudentPassportPage,
});

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/png", "image/jpeg"];

function StudentPassportPage() {
  const { studentId } = useAuth();
  const queryClient = useQueryClient();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const enabled = !!studentId;
  const studentQuery = useQuery({ queryKey: ["student", studentId], queryFn: () => fetchStudent(studentId as string), enabled });
  const skillsQuery = useQuery({ queryKey: ["student-skills", studentId], queryFn: () => fetchStudentSkills(studentId as string), enabled });
  const projectsQuery = useQuery({ queryKey: ["projects", studentId], queryFn: () => fetchProjects(studentId as string), enabled });
  const certsQuery = useQuery({ queryKey: ["certifications", studentId], queryFn: () => fetchCertifications(studentId as string), enabled });
  const attemptsQuery = useQuery({ queryKey: ["attempts", studentId], queryFn: () => fetchAttempts(studentId as string), enabled });

  const resumeMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!ALLOWED.includes(file.type)) throw new Error("Only PDF, PNG or JPG files are allowed.");
      if (file.size > MAX_SIZE) throw new Error("File must be under 5MB.");
      const path = `${studentId}/resume-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("student-documents").upload(path, file, { upsert: true });
      if (upErr) throw new Error(upErr.message);
      const { error } = await supabase.from("students").update({ resume_url: path }).eq("id", studentId as string);
      if (error) throw new Error(error.message);
      return path;
    },
    onSuccess: async () => {
      toast.success("Resume uploaded successfully.");
      await queryClient.invalidateQueries({ queryKey: ["student", studentId] });
    },
    onError: (err: Error) => toast.error(err.message),
    onSettled: () => setUploading(false),
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Skill Passport" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="Your skill passport is generated from your student profile."
          action={<Button asChild><Link to="/student/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const anyLoading = studentQuery.isLoading || skillsQuery.isLoading || projectsQuery.isLoading || certsQuery.isLoading || attemptsQuery.isLoading;
  const anyError = studentQuery.isError || skillsQuery.isError || projectsQuery.isError || certsQuery.isError || attemptsQuery.isError;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Skill Passport" />
        <LoadingRows count={6} />
      </div>
    );
  }
  if (anyError || !studentQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeading title="My Skill Passport" />
        <ErrorState onRetry={() => { void studentQuery.refetch(); void skillsQuery.refetch(); }} />
      </div>
    );
  }

  const student = studentQuery.data;
  const skills = skillsQuery.data ?? [];
  const projects = projectsQuery.data ?? [];
  const certs = certsQuery.data ?? [];
  const attempts = attemptsQuery.data ?? [];
  const breakdown = readinessBreakdown(student);

  const projectCountForSkill = (skillName: string) =>
    projects.filter((p) => (p.technologies ?? []).some((t) => t.toLowerCase() === skillName.toLowerCase())).length;

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    resumeMutation.mutate(file);
    e.target.value = "";
  };

  const downloadResume = async () => {
    if (!student.resume_url) return;
    const { data, error } = await supabase.storage.from("student-documents").createSignedUrl(student.resume_url, 300);
    if (error || !data) {
      toast.error("Could not generate download link.");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeading
        title="My Skill Passport"
        description="A single, verifiable record of your skills, projects and certifications."
        actions={
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="size-4" /> Download Skill Passport
          </Button>
        }
      />

      <div id="passport-print" className="hidden print:block space-y-4 p-4">
        <h1 className="text-2xl font-bold">{student.full_name} — Skill Passport</h1>
        <p className="text-sm">{student.headline}</p>
        <p className="text-sm">{student.department} · {student.degree} · Class of {student.graduation_year}</p>
        <h2 className="mt-4 font-semibold">Readiness: {student.readiness_score}%</h2>
        <h2 className="mt-4 font-semibold">Skills</h2>
        <ul className="list-disc pl-5 text-sm">
          {skills.map((s) => (
            <li key={s.id}>{s.skills?.name} — {s.proficiency} {s.verified ? "(Verified)" : ""}</li>
          ))}
        </ul>
        <h2 className="mt-4 font-semibold">Projects</h2>
        <ul className="list-disc pl-5 text-sm">
          {projects.map((p) => (
            <li key={p.id}>{p.title} — {p.technologies.join(", ")}</li>
          ))}
        </ul>
        <h2 className="mt-4 font-semibold">Certifications</h2>
        <ul className="list-disc pl-5 text-sm">
          {certs.map((c) => (
            <li key={c.id}>{c.name} — {c.issuer}</li>
          ))}
        </ul>
      </div>

      <div className="print:hidden">
        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="certifications">Certifications</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="readiness">Readiness</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Personal info</CardTitle></CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Info label="Full name" value={student.full_name} />
                <Info label="Email" value={student.email} />
                <Info label="Department" value={student.department} />
                <Info label="Degree" value={`${student.degree}, Year ${student.year}`} />
                <Info label="Graduation year" value={String(student.graduation_year)} />
                <Info label="Location" value={student.location} />
                <Info label="Target role" value={student.target_role} />
                <Info label="Headline" value={student.headline ?? "—"} />
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground">Bio</p>
                  <p className="mt-1 text-sm">{student.bio || "No bio added yet."}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Resume</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleResumeSelect}
                  aria-label="Upload resume"
                />
                <Button variant="outline" onClick={() => resumeInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Upload resume
                </Button>
                {student.resume_url ? (
                  <Button variant="secondary" onClick={downloadResume}>
                    <Download className="size-4" /> Download current resume
                  </Button>
                ) : (
                  <span className="text-sm text-muted-foreground">No resume uploaded yet.</span>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-3">
            {skills.length === 0 ? (
              <EmptyState title="No skills yet" description="Add skills during onboarding or verify them via assessments." />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Proficiency</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Assessment score</TableHead>
                      <TableHead>Projects</TableHead>
                      <TableHead>Last verified</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.skills?.name ?? "—"}</TableCell>
                        <TableCell>{s.proficiency} ({s.proficiency_score}%)</TableCell>
                        <TableCell><SkillBadge name={s.verified ? "Verified" : "Unverified"} verified={s.verified} source={s.verification_source} /></TableCell>
                        <TableCell>{s.assessment_score != null ? `${s.assessment_score}%` : "—"}</TableCell>
                        <TableCell>{projectCountForSkill(s.skills?.name ?? "")}</TableCell>
                        <TableCell>{s.last_verified_at ? new Date(s.last_verified_at).toLocaleDateString() : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-3">
            {projects.length === 0 ? (
              <EmptyState title="No projects yet" description="Add your first project to showcase your work." action={<Button asChild><Link to="/student/projects">Add a project</Link></Button>} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {projects.map((p) => (
                  <Card key={p.id}>
                    <CardHeader><CardTitle className="text-base">{p.title}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {p.technologies.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certifications" className="space-y-3">
            {certs.length === 0 ? (
              <EmptyState icon={FileText} title="No certifications yet" description="Certifications you add will appear here." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {certs.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-4">
                      <p className="font-medium">{c.name}</p>
                      <p className="text-sm text-muted-foreground">{c.issuer}{c.issued_on ? ` · ${new Date(c.issued_on).toLocaleDateString()}` : ""}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="assessments" className="space-y-3">
            {attempts.length === 0 ? (
              <EmptyState title="No assessments taken" description="Take an assessment to verify your skills." action={<Button asChild><Link to="/student/assessments">Browse assessments</Link></Button>} />
            ) : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attempts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.assessments?.title ?? "—"}</TableCell>
                        <TableCell>{a.score}%</TableCell>
                        <TableCell>{a.level}</TableCell>
                        <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="readiness" className="space-y-4">
            <Card>
              <CardContent className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
                <ReadinessRing value={student.readiness_score} />
                <div className="w-full space-y-2 sm:max-w-sm">
                  {breakdown.map((b) => (
                    <div key={b.label} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-medium tabular-nums">{Math.round(b.value)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm">{value}</p>
    </div>
  );
}
