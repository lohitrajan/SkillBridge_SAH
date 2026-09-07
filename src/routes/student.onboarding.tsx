import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, GraduationCap, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchColleges, fetchRoleTemplates, fetchSkills } from "@/lib/data";

export const Route = createFileRoute("/student/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete your profile | SkillBridge" },
      { name: "description", content: "Complete your profile on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Complete your profile | SkillBridge" },
      { property: "og:description", content: "Complete your profile on SkillBridge." },
    ],
  }),
  component: StudentOnboardingPage,
});

const DEGREES = ["B.Tech", "B.E.", "B.Sc", "BCA", "M.Tech", "MCA", "M.Sc"];
const YEARS = [1, 2, 3, 4];

function StudentOnboardingPage() {
  const { user, profile, studentId, refresh, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [collegeId, setCollegeId] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState<string>("");
  const [gradYear, setGradYear] = useState<string>(String(new Date().getFullYear() + 1));
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<Record<string, number>>({});

  const collegesQuery = useQuery({ queryKey: ["colleges"], queryFn: fetchColleges });
  const rolesQuery = useQuery({ queryKey: ["role-templates"], queryFn: fetchRoleTemplates });
  const skillsQuery = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { data: student, error } = await supabase
        .from("students")
        .insert({
          user_id: user.id,
          full_name: profile?.full_name ?? user.email ?? "Student",
          email: profile?.email ?? user.email ?? "",
          college_id: collegeId || null,
          department,
          degree,
          year: Number(year),
          graduation_year: Number(gradYear),
          location,
          interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
          target_role: targetRole,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);

      const chosen = Object.entries(selectedSkills);
      if (chosen.length) {
        const rows = chosen.map(([skillId, score]) => ({
          student_id: student.id as string,
          skill_id: skillId,
          proficiency_score: score,
          proficiency:
            score >= 90 ? "Expert" : score >= 75 ? "Advanced" : score >= 60 ? "Intermediate" : score >= 40 ? "Developing" : "Beginner",
          verified: false,
        }));
        const { error: skillErr } = await supabase.from("student_skills").insert(rows);
        if (skillErr) throw new Error(skillErr.message);
      }
      return student.id as string;
    },
    onSuccess: async () => {
      toast.success("Profile created! Welcome to SkillBridge.");
      await refresh();
      await queryClient.invalidateQueries();
      void navigate({ to: "/student" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Complete your profile" />
        <LoadingRows count={4} />
      </div>
    );
  }

  if (studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Complete your profile" />
        <EmptyState
          icon={CheckCircle2}
          title="You're all set"
          description="Your student profile is already complete."
          action={
            <Button asChild>
              <Link to="/student">Go to dashboard</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const step1Valid = department.trim() && degree && year && gradYear && location.trim();
  const step2Valid = targetRole.trim().length > 0;

  const toggleSkill = (skillId: string, checked: boolean) => {
    setSelectedSkills((prev) => {
      const next = { ...prev };
      if (checked) next[skillId] = next[skillId] ?? 50;
      else delete next[skillId];
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeading
        title="Complete your profile"
        description="Tell us about your education and skills so we can personalise your placement journey."
      />

      <div className="flex items-center gap-2" aria-label="Onboarding progress">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`}
          />
        ))}
      </div>

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" /> Education
            </CardTitle>
            <CardDescription>Step 1 of 3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {collegesQuery.isError ? (
              <ErrorState onRetry={() => collegesQuery.refetch()} />
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="college">College</Label>
                <Select value={collegeId} onValueChange={setCollegeId}>
                  <SelectTrigger id="college">
                    <SelectValue placeholder={collegesQuery.isLoading ? "Loading..." : "Select your college"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(collegesQuery.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="department">Department</Label>
                <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="degree">Degree</Label>
                <Select value={degree} onValueChange={setDegree}>
                  <SelectTrigger id="degree">
                    <SelectValue placeholder="Select degree" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEGREES.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year">Current year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        Year {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gradYear">Graduation year</Label>
                <Input
                  id="gradYear"
                  type="number"
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bengaluru, India" />
            </div>
            <div className="flex justify-end">
              <Button disabled={!step1Valid} onClick={() => setStep(2)}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" /> Interests & target role
            </CardTitle>
            <CardDescription>Step 2 of 3</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="targetRole">Target role</Label>
              {rolesQuery.isError ? (
                <ErrorState onRetry={() => rolesQuery.refetch()} />
              ) : (
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger id="targetRole">
                    <SelectValue placeholder={rolesQuery.isLoading ? "Loading..." : "Select target role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(rolesQuery.data ?? []).map((r) => (
                      <SelectItem key={r.id} value={r.title}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="interests">Interests (comma separated)</Label>
              <Input
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Web development, Cloud, Data Science"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="size-4" /> Back
              </Button>
              <Button disabled={!step2Valid} onClick={() => setStep(3)}>
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>Your current skills</CardTitle>
            <CardDescription>Step 3 of 3 — self-rate your proficiency (you can verify with assessments later)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillsQuery.isError ? (
              <ErrorState onRetry={() => skillsQuery.refetch()} />
            ) : skillsQuery.isLoading ? (
              <LoadingRows count={5} />
            ) : (
              <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {(skillsQuery.data ?? []).map((skill) => {
                  const checked = skill.id in selectedSkills;
                  return (
                    <div key={skill.id} className="rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleSkill(skill.id, e.target.checked)}
                            className="size-4 accent-primary"
                          />
                          {skill.name}
                        </label>
                        <Badge variant="secondary">{skill.category}</Badge>
                      </div>
                      {checked ? (
                        <div className="mt-3 flex items-center gap-3">
                          <Slider
                            value={[selectedSkills[skill.id] ?? 50]}
                            min={10}
                            max={100}
                            step={5}
                            onValueChange={([v]) =>
                              setSelectedSkills((prev) => ({ ...prev, [skill.id]: v ?? 50 }))
                            }
                            aria-label={`${skill.name} proficiency`}
                            className="flex-1"
                          />
                          <span className="w-10 text-right text-sm tabular-nums text-muted-foreground">
                            {selectedSkills[skill.id]}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="size-4" /> Back
              </Button>
              <Button onClick={() => finishMutation.mutate()} disabled={finishMutation.isPending}>
                {finishMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                Finish setup
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
