import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Briefcase, Search, Send, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MatchExplainer } from "@/components/shared/match-explainer";
import { MatchPill, SkillBadge } from "@/components/shared/skill-badge";
import { ReadinessRing } from "@/components/shared/readiness-ring";
import { SkillPassportDialog } from "@/components/recruiter/skill-passport-dialog";
import { loadStudentPool, rankStudents } from "@/components/recruiter/match-utils";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { createNotification, fetchJobs, fetchRoleTemplates, type StudentRow } from "@/lib/data";

export const Route = createFileRoute("/recruiter/talent")({
  head: () => ({
    meta: [
      { title: "Find Talent | SkillBridge" },
      { name: "description", content: "Find Talent on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Find Talent | SkillBridge" },
      { property: "og:description", content: "Find Talent on SkillBridge." },
    ],
  }),
  component: RecruiterTalentPage,
});

function RecruiterTalentPage() {
  const { companyId, user } = useAuth();
  const [skillQuery, setSkillQuery] = useState("");
  const [department, setDepartment] = useState("all");
  const [collegeQuery, setCollegeQuery] = useState("");
  const [gradYear, setGradYear] = useState("all");
  const [location, setLocation] = useState("");
  const [minReadiness, setMinReadiness] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [roleTarget, setRoleTarget] = useState("none");
  const [passportStudent, setPassportStudent] = useState<StudentRow | null>(null);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const poolQ = useQuery({ queryKey: ["student-pool"], queryFn: loadStudentPool, enabled: !!companyId });
  const jobsQ = useQuery({
    queryKey: ["recruiter-jobs", companyId],
    queryFn: () => fetchJobs({ companyId: companyId! }),
    enabled: !!companyId,
  });
  const templatesQ = useQuery({ queryKey: ["role-templates"], queryFn: fetchRoleTemplates, enabled: !!companyId });

  const inviteMutation = useMutation({
    mutationFn: async ({ student, jobId, jobTitle }: { student: StudentRow; jobId?: string | undefined; jobTitle: string }) => {
      if (!student.user_id) throw new Error("This student hasn't linked an account yet.");
      await createNotification({
        user_id: student.user_id,
        title: `You've been shortlisted by a recruiter`,
        body: jobId
          ? `A recruiter shortlisted you for "${jobTitle}". Check your applications.`
          : `A recruiter is interested in your profile for a ${jobTitle} role. Keep an eye on new postings.`,
        category: "invite",
        link: "/student/opportunities",
      });
    },
    onSuccess: (_data, vars) => {
      toast.success(`Invitation sent to ${vars.student.full_name}`);
      setInvited((prev) => new Set(prev).add(vars.student.id));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const role = useMemo(() => {
    if (roleTarget === "none") return null;
    if (roleTarget.startsWith("job:")) {
      const job = (jobsQ.data ?? []).find((j) => j.id === roleTarget.slice(4));
      if (!job) return null;
      return { requiredSkills: job.requiredSkills, preferredSkills: job.preferredSkills, graduationYear: job.graduation_year, label: job.title };
    }
    const tmpl = (templatesQ.data ?? []).find((t) => t.id === roleTarget.slice(9));
    if (!tmpl) return null;
    return { requiredSkills: tmpl.required_skills, preferredSkills: tmpl.preferred_skills, graduationYear: null, label: tmpl.title };
  }, [roleTarget, jobsQ.data, templatesQ.data]);

  const departments = useMemo(
    () => [...new Set((poolQ.data?.students ?? []).map((s) => s.department))].sort(),
    [poolQ.data],
  );

  const results = useMemo(() => {
    if (!poolQ.data) return [];
    const roleForMatch = role ?? { requiredSkills: [] as string[], preferredSkills: [] as string[], graduationYear: null };
    let ranked = rankStudents(poolQ.data.students, poolQ.data.skills, poolQ.data.projects, roleForMatch);

    ranked = ranked.filter(({ student, skills }) => {
      if (department !== "all" && student.department !== department) return false;
      if (gradYear !== "all" && String(student.graduation_year) !== gradYear) return false;
      if (location && !student.location.toLowerCase().includes(location.toLowerCase())) return false;
      if (student.readiness_score < minReadiness) return false;
      if (skillQuery) {
        const q = skillQuery.toLowerCase();
        const hasSkill = skills.some((s) => s.skills?.name.toLowerCase().includes(q));
        if (!hasSkill) return false;
      }
      if (verifiedOnly && !skills.some((s) => s.verified)) return false;
      return true;
    });

    return ranked;
  }, [poolQ.data, role, department, gradYear, location, minReadiness, skillQuery, verifiedOnly]);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Find Talent" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile to search for talent."
          action={
            <Button asChild>
              <Link to="/recruiter/onboarding">Complete onboarding</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const gradYears = [...new Set((poolQ.data?.students ?? []).map((s) => s.graduation_year))].sort();

  return (
    <div className="space-y-6">
      <PageHeading
        title="Find Talent"
        description="Search verified student profiles and match them against your roles."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="size-5" /> Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Skill</Label>
            <Input value={skillQuery} onChange={(e) => setSkillQuery(e.target.value)} placeholder="e.g. React" />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bengaluru" />
          </div>
          <div className="space-y-1.5">
            <Label>Graduation year</Label>
            <Select value={gradYear} onValueChange={setGradYear}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any year</SelectItem>
                {gradYears.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Minimum readiness — {minReadiness}%</Label>
            <Slider value={[minReadiness]} onValueChange={([v]) => setMinReadiness(v ?? 0)} max={100} step={5} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Match against</Label>
            <Select value={roleTarget} onValueChange={setRoleTarget}>
              <SelectTrigger><SelectValue placeholder="Select a posting or role template" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific role</SelectItem>
                {(jobsQ.data ?? []).map((j) => <SelectItem key={j.id} value={`job:${j.id}`}>{j.title} (your posting)</SelectItem>)}
                {(templatesQ.data ?? []).map((t) => <SelectItem key={t.id} value={`template:${t.id}`}>{t.title} (template)</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Checkbox id="verified" checked={verifiedOnly} onCheckedChange={(v) => setVerifiedOnly(!!v)} />
            <Label htmlFor="verified" className="cursor-pointer font-normal">Verified skills only</Label>
          </div>
        </CardContent>
      </Card>

      {poolQ.isLoading ? (
        <LoadingRows />
      ) : poolQ.isError ? (
        <ErrorState message={poolQ.error?.message} onRetry={() => poolQ.refetch()} />
      ) : results.length ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{results.length} student{results.length === 1 ? "" : "s"} found</p>
          {results.map(({ student, match, skills }) => (
            <Card key={student.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <ReadinessRing value={student.readiness_score} size={64} label="" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{student.full_name}</p>
                    {role ? <MatchPill score={match.score} /> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {student.target_role} · {student.department} · {student.location} · Class of {student.graduation_year}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 6).map((s) => (
                      <SkillBadge key={s.id} name={s.skills?.name ?? ""} verified={s.verified} score={s.proficiency_score} />
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                  {role ? <MatchExplainer result={match} title={role.label} subject={student.full_name} /> : null}
                  <Button variant="outline" size="sm" onClick={() => setPassportStudent(student)}>View skill passport</Button>
                  <Button
                    size="sm"
                    disabled={inviteMutation.isPending || invited.has(student.id)}
                    onClick={() =>
                      inviteMutation.mutate({
                        student,
                        jobId: roleTarget.startsWith("job:") ? roleTarget.slice(4) : undefined,
                        jobTitle: role?.label ?? student.target_role,
                      })
                    }
                  >
                    <Send className="size-3.5" />
                    {invited.has(student.id) ? "Invited" : "Shortlist & invite"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No students match these filters" description="Try widening your search criteria." />
      )}

      <SkillPassportDialog
        student={passportStudent}
        open={!!passportStudent}
        onOpenChange={(o) => !o && setPassportStudent(null)}
      />
    </div>
  );
}
