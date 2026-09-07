import {
  fetchProjectsFor,
  fetchStudentSkillsFor,
  fetchStudents,
  toMatchSkills,
  type ProjectRow,
  type StudentRow,
  type StudentSkillRow,
} from "@/lib/data";
import { computeMatch, type MatchResult, type RoleRequirementInput } from "@/lib/matching";

export interface RankedStudent {
  student: StudentRow;
  match: MatchResult;
  skills: StudentSkillRow[];
  projects: ProjectRow[];
}

/** Loads every student plus their skills/projects, ready for bulk matching. */
export async function loadStudentPool() {
  const students = await fetchStudents();
  const ids = students.map((s) => s.id);
  const [skills, projects] = await Promise.all([fetchStudentSkillsFor(ids), fetchProjectsFor(ids)]);
  return { students, skills, projects };
}

export function rankStudents(
  students: StudentRow[],
  skillsByStudent: (StudentSkillRow & { student_id: string })[],
  projectsByStudent: ProjectRow[],
  role: RoleRequirementInput,
): RankedStudent[] {
  return students
    .map((student) => {
      const skills = skillsByStudent.filter((s) => s.student_id === student.id);
      const projects = projectsByStudent.filter((p) => p.student_id === student.id);
      const match = computeMatch(
        {
          skills: toMatchSkills(skills),
          projectSkillNames: projects.flatMap((p) => p.technologies ?? []),
          graduationYear: student.graduation_year,
          readinessScore: student.readiness_score,
          internshipCount: 0,
        },
        role,
      );
      return { student, match, skills, projects };
    })
    .sort((a, b) => b.match.score - a.match.score);
}
