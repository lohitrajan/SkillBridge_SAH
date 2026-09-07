/**
 * SkillBridge transparent matching + skill gap engine.
 *
 * Deterministic, explainable scoring shared by students, recruiters and colleges.
 * Weights (total 100):
 *   Required skill match 50 | Verification 15 | Assessment 15
 *   Project relevance 10 | Education eligibility 5 | Experience 5
 */

export type ProficiencyLevel =
  | "Beginner"
  | "Developing"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export function levelFromScore(score: number): ProficiencyLevel {
  if (score >= 90) return "Expert";
  if (score >= 75) return "Advanced";
  if (score >= 60) return "Intermediate";
  if (score >= 40) return "Developing";
  return "Beginner";
}

export interface StudentSkillInput {
  skillName: string;
  proficiencyScore: number;
  verified: boolean;
  assessmentScore: number | null;
}

export interface StudentMatchInput {
  skills: StudentSkillInput[];
  projectSkillNames: string[];
  graduationYear: number;
  readinessScore: number;
  internshipCount?: number;
}

export interface RoleRequirementInput {
  requiredSkills: string[];
  preferredSkills: string[];
  graduationYear?: number | null;
}

export interface MatchComponent {
  label: string;
  earned: number;
  max: number;
  detail: string;
}

export interface SkillGapItem {
  skill: string;
  required: boolean;
  have: boolean;
  score: number;
  verified: boolean;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface MatchResult {
  score: number;
  components: MatchComponent[];
  matched: SkillGapItem[];
  missing: SkillGapItem[];
  preferredMatched: string[];
  verifiedRequiredCount: number;
  requiredCount: number;
}

const norm = (s: string) => s.trim().toLowerCase();

export function computeMatch(
  student: StudentMatchInput,
  role: RoleRequirementInput,
): MatchResult {
  const byName = new Map(student.skills.map((s) => [norm(s.skillName), s]));
  const projectSkills = new Set(student.projectSkillNames.map(norm));

  const required = role.requiredSkills.filter(Boolean);
  const preferred = role.preferredSkills.filter(Boolean);

  const matched: SkillGapItem[] = [];
  const missing: SkillGapItem[] = [];

  required.forEach((skill, index) => {
    const s = byName.get(norm(skill));
    if (s && s.proficiencyScore >= 40) {
      matched.push({
        skill,
        required: true,
        have: true,
        score: s.proficiencyScore,
        verified: s.verified,
        priority: "LOW",
      });
    } else {
      missing.push({
        skill,
        required: true,
        have: false,
        score: s?.proficiencyScore ?? 0,
        verified: false,
        priority: index < 2 ? "HIGH" : "MEDIUM",
      });
    }
  });

  preferred.forEach((skill) => {
    const s = byName.get(norm(skill));
    if (!s || s.proficiencyScore < 40) {
      missing.push({
        skill,
        required: false,
        have: false,
        score: s?.proficiencyScore ?? 0,
        verified: false,
        priority: "LOW",
      });
    }
  });

  const preferredMatched = preferred.filter((skill) => {
    const s = byName.get(norm(skill));
    return !!s && s.proficiencyScore >= 40;
  });

  // 1. Required skill coverage — 50
  const coverage = required.length ? matched.length / required.length : 1;
  const preferredBonus = preferred.length
    ? (preferredMatched.length / preferred.length) * 0.08
    : 0;
  const skillsEarned = Math.round(Math.min(1, coverage + preferredBonus) * 50);

  // 2. Verification — 15
  const verifiedRequired = matched.filter((m) => m.verified).length;
  const verificationEarned = required.length
    ? Math.round((verifiedRequired / required.length) * 15)
    : 15;

  // 3. Assessment performance — 15
  const assessed = matched
    .map((m) => byName.get(norm(m.skill)))
    .filter((s): s is StudentSkillInput => !!s && s.assessmentScore != null);
  const avgAssessment = assessed.length
    ? assessed.reduce((a, s) => a + (s.assessmentScore ?? 0), 0) / assessed.length
    : 0;
  const assessmentEarned = Math.round((avgAssessment / 100) * 15);

  // 4. Project relevance — 10
  const relevantProjects = required.filter((s) => projectSkills.has(norm(s))).length;
  const projectEarned = required.length
    ? Math.round(Math.min(1, relevantProjects / Math.max(2, required.length / 2)) * 10)
    : 5;

  // 5. Education eligibility — 5
  const eligible =
    !role.graduationYear || role.graduationYear >= student.graduationYear;
  const educationEarned = eligible ? 5 : 2;

  // 6. Experience / industry exposure — 5
  const experienceEarned = Math.min(
    5,
    Math.round((student.internshipCount ?? 0) * 2 + student.readinessScore / 40),
  );

  const components: MatchComponent[] = [
    {
      label: "Required Skills",
      earned: skillsEarned,
      max: 50,
      detail: `${matched.length}/${required.length} required skills present${
        preferredMatched.length ? `, ${preferredMatched.length} preferred` : ""
      }`,
    },
    {
      label: "Verification",
      earned: verificationEarned,
      max: 15,
      detail: `${verifiedRequired}/${required.length} required skills verified`,
    },
    {
      label: "Assessment",
      earned: assessmentEarned,
      max: 15,
      detail: assessed.length
        ? `Average assessment score ${Math.round(avgAssessment)}%`
        : "No assessments taken yet",
    },
    {
      label: "Projects",
      earned: projectEarned,
      max: 10,
      detail: `${relevantProjects} project skill${relevantProjects === 1 ? "" : "s"} relevant to this role`,
    },
    {
      label: "Education",
      earned: educationEarned,
      max: 5,
      detail: eligible ? "Meets graduation-year criteria" : "Graduation year mismatch",
    },
    {
      label: "Experience",
      earned: experienceEarned,
      max: 5,
      detail: `Industry exposure & readiness signal`,
    },
  ];

  const score = components.reduce((a, c) => a + c.earned, 0);

  return {
    score: Math.max(0, Math.min(100, score)),
    components,
    matched,
    missing,
    preferredMatched,
    verifiedRequiredCount: verifiedRequired,
    requiredCount: required.length,
  };
}

export interface RoadmapWeek {
  week: number;
  focus: string;
  outcome: string;
}

/** Deterministic learning roadmap generated from the prioritised gap list. */
export function buildRoadmap(missing: SkillGapItem[]): RoadmapWeek[] {
  const ordered = [...missing].sort((a, b) => {
    const rank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
    return rank[a.priority] - rank[b.priority];
  });
  return ordered.slice(0, 6).map((item, i) => ({
    week: i + 1,
    focus: `${item.skill} fundamentals & guided practice`,
    outcome: `Complete a hands-on ${item.skill} exercise and take the ${item.skill} assessment`,
  }));
}

export function recommendedProject(missing: SkillGapItem[], targetRole: string): string {
  const names = missing.slice(0, 3).map((m) => m.skill);
  if (!names.length)
    return `Ship a portfolio-grade ${targetRole} project and document your architecture decisions.`;
  return `Build and deploy a ${targetRole.toLowerCase()} project that uses ${names.join(", ")} end to end.`;
}

export function readinessBreakdown(student: {
  technical_score: number;
  soft_skills_score: number;
  projects_score: number;
  certifications_score: number;
  exposure_score: number;
}) {
  return [
    { label: "Technical Skills", value: student.technical_score, weight: 0.35 },
    { label: "Soft Skills", value: student.soft_skills_score, weight: 0.15 },
    { label: "Projects", value: student.projects_score, weight: 0.2 },
    { label: "Certifications", value: student.certifications_score, weight: 0.15 },
    { label: "Industry Exposure", value: student.exposure_score, weight: 0.15 },
  ];
}

export function computeReadiness(parts: {
  technical_score: number;
  soft_skills_score: number;
  projects_score: number;
  certifications_score: number;
  exposure_score: number;
}) {
  return Math.round(
    readinessBreakdown(parts).reduce((a, p) => a + p.value * p.weight, 0),
  );
}
