import type { RoleTemplateRow, StudentRow, StudentSkillRow, ProjectRow } from "@/lib/data";
import { toMatchSkills, type JobWithSkills } from "@/lib/data";
import { computeMatch, type MatchResult, type StudentMatchInput } from "@/lib/matching";

/** Resolves a role template by exact title match, else closest partial match, else first. */
export function resolveRoleTemplate(
  templates: RoleTemplateRow[],
  title: string | null | undefined,
): RoleTemplateRow | null {
  if (!templates.length) return null;
  const target = (title ?? "").trim().toLowerCase();
  if (!target) return templates[0] ?? null;
  const exact = templates.find((t) => t.title.trim().toLowerCase() === target);
  if (exact) return exact;
  const partial = templates.find(
    (t) => t.title.toLowerCase().includes(target) || target.includes(t.title.toLowerCase()),
  );
  return partial ?? templates[0] ?? null;
}

export function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function buildStudentMatchInput(
  student: StudentRow,
  skills: StudentSkillRow[],
  projects: ProjectRow[],
  internshipCount = 0,
): StudentMatchInput {
  return {
    skills: toMatchSkills(skills),
    projectSkillNames: projects.flatMap((p) => p.technologies ?? []),
    graduationYear: student.graduation_year,
    readinessScore: student.readiness_score,
    internshipCount,
  };
}

export function matchRoleForStudent(
  student: StudentRow,
  skills: StudentSkillRow[],
  projects: ProjectRow[],
  role: RoleTemplateRow,
): MatchResult {
  return computeMatch(buildStudentMatchInput(student, skills, projects), {
    requiredSkills: role.required_skills,
    preferredSkills: role.preferred_skills,
  });
}

export function matchJobForStudent(
  student: StudentRow,
  skills: StudentSkillRow[],
  projects: ProjectRow[],
  job: JobWithSkills,
  internshipCount = 0,
): MatchResult {
  return computeMatch(buildStudentMatchInput(student, skills, projects, internshipCount), {
    requiredSkills: job.requiredSkills,
    preferredSkills: job.preferredSkills,
    graduationYear: job.graduation_year,
  });
}

export function relativeTime(iso: string): string {
  const date = new Date(iso).getTime();
  const diffMs = Date.now() - date;
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.round(months / 12)}y ago`;
}
