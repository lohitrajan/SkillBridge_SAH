import { useQuery } from "@tanstack/react-query";
import { Award, FolderGit2, GraduationCap, Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReadinessRing } from "@/components/shared/readiness-ring";
import { SkillBadge } from "@/components/shared/skill-badge";
import {
  fetchAttempts,
  fetchCertifications,
  fetchProjects,
  fetchStudentSkills,
  type StudentRow,
} from "@/lib/data";

export function SkillPassportDialog({
  student,
  open,
  onOpenChange,
}: {
  student: StudentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const studentId = student?.id ?? "";
  const skillsQ = useQuery({
    queryKey: ["passport-skills", studentId],
    queryFn: () => fetchStudentSkills(studentId),
    enabled: open && !!studentId,
  });
  const projectsQ = useQuery({
    queryKey: ["passport-projects", studentId],
    queryFn: () => fetchProjects(studentId),
    enabled: open && !!studentId,
  });
  const certsQ = useQuery({
    queryKey: ["passport-certs", studentId],
    queryFn: () => fetchCertifications(studentId),
    enabled: open && !!studentId,
  });
  const attemptsQ = useQuery({
    queryKey: ["passport-attempts", studentId],
    queryFn: () => fetchAttempts(studentId),
    enabled: open && !!studentId,
  });

  const loading = skillsQ.isLoading || projectsQ.isLoading || certsQ.isLoading || attemptsQ.isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student?.full_name ?? "Skill Passport"}</DialogTitle>
          <DialogDescription>
            {student?.headline ?? student?.target_role} · {student?.department}, {student?.degree}{" "}
            (Class of {student?.graduation_year})
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ReadinessRing value={student?.readiness_score ?? 0} size={110} />
              <div className="grid flex-1 grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{student?.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Target role</p>
                  <p className="font-medium">{student?.target_role}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{student?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Year</p>
                  <p className="font-medium">Year {student?.year}</p>
                </div>
              </div>
            </div>

            {student?.bio ? <p className="text-sm text-muted-foreground">{student.bio}</p> : null}

            <section>
              <h3 className="mb-2 text-sm font-semibold">Skills ({skillsQ.data?.length ?? 0})</h3>
              <div className="flex flex-wrap gap-1.5">
                {skillsQ.data?.length ? (
                  skillsQ.data.map((s) => (
                    <SkillBadge
                      key={s.id}
                      name={s.skills?.name ?? "Unknown"}
                      verified={s.verified}
                      score={s.proficiency_score}
                      source={s.verification_source}
                    />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills recorded yet.</p>
                )}
              </div>
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <FolderGit2 className="size-4" /> Projects ({projectsQ.data?.length ?? 0})
              </h3>
              {projectsQ.data?.length ? (
                <ul className="space-y-2">
                  {projectsQ.data.map((p) => (
                    <li key={p.id} className="rounded-lg border p-3 text-sm">
                      <p className="font-medium">{p.title}</p>
                      <p className="mt-0.5 text-muted-foreground">{p.description}</p>
                      {p.technologies?.length ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {p.technologies.join(", ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No projects recorded yet.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <Award className="size-4" /> Certifications ({certsQ.data?.length ?? 0})
              </h3>
              {certsQ.data?.length ? (
                <ul className="space-y-1.5">
                  {certsQ.data.map((c) => (
                    <li key={c.id} className="text-sm">
                      <span className="font-medium">{c.name}</span>{" "}
                      <span className="text-muted-foreground">— {c.issuer}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No certifications recorded yet.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                <GraduationCap className="size-4" /> Assessment attempts ({attemptsQ.data?.length ?? 0})
              </h3>
              {attemptsQ.data?.length ? (
                <ul className="space-y-1.5">
                  {attemptsQ.data.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span>{a.assessments?.title ?? "Assessment"}</span>
                      <span className="tabular-nums text-muted-foreground">{a.score}% · {a.level}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No assessments taken yet.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
