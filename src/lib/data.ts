/**
 * SkillBridge shared data access layer.
 *
 * All role workspaces are client-rendered (`ssr: false`), so these fetchers use
 * the browser Supabase client and run under the signed-in user's RLS context.
 * Pair them with TanStack Query in components.
 */
import { supabase } from "@/integrations/supabase/client";
import type { StudentSkillInput } from "@/lib/matching";

/* ------------------------------------------------------------------ types */

export interface SkillRow {
  id: string;
  name: string;
  category: string;
  demand_level: string;
  demand_score: number;
}

export interface StudentRow {
  id: string;
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  college_id: string | null;
  department: string;
  degree: string;
  year: number;
  graduation_year: number;
  location: string;
  interests: string[];
  target_role: string;
  headline: string | null;
  bio: string | null;
  resume_url: string | null;
  readiness_score: number;
  technical_score: number;
  soft_skills_score: number;
  projects_score: number;
  certifications_score: number;
  exposure_score: number;
  is_demo: boolean;
}

export interface StudentSkillRow {
  id: string;
  skill_id: string;
  proficiency: string;
  proficiency_score: number;
  verified: boolean;
  verification_source: string | null;
  assessment_score: number | null;
  last_verified_at: string | null;
  skills: { id: string; name: string; category: string; demand_level: string } | null;
}

export interface ProjectRow {
  id: string;
  student_id: string;
  title: string;
  description: string;
  technologies: string[];
  github_url: string | null;
  demo_url: string | null;
  role: string | null;
  duration: string | null;
  created_at: string;
}

export interface CertificationRow {
  id: string;
  student_id: string;
  name: string;
  issuer: string;
  issued_on: string | null;
  credential_url: string | null;
  file_url: string | null;
}

export interface CompanyRow {
  id: string;
  name: string;
  sector: string;
  company_size: string;
  location: string;
  recruiter_name: string | null;
  recruiter_email: string | null;
  website: string | null;
  about: string | null;
  owner_id: string | null;
  is_demo: boolean;
}

export interface CollegeRow {
  id: string;
  name: string;
  institution_type: string;
  location: string;
  contact_person: string | null;
  official_email: string | null;
  website: string | null;
  owner_id: string | null;
  is_demo: boolean;
}

export interface JobRow {
  id: string;
  company_id: string;
  title: string;
  opportunity_type: string;
  description: string;
  location: string;
  work_mode: string;
  stipend: string | null;
  salary: string | null;
  duration: string | null;
  deadline: string | null;
  min_qualification: string | null;
  graduation_year: number | null;
  experience: string | null;
  openings: number;
  status: string;
  created_at: string;
  companies: { id: string; name: string; sector: string; location: string } | null;
  job_skills: { is_required: boolean; skills: { id: string; name: string } | null }[];
}

export interface JobWithSkills extends JobRow {
  requiredSkills: string[];
  preferredSkills: string[];
}

export interface ApplicationRow {
  id: string;
  job_id: string;
  student_id: string;
  status: string;
  match_score: number;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentRow {
  id: string;
  title: string;
  category: string;
  skill_id: string | null;
  description: string;
  duration_minutes: number;
}

export interface QuestionRow {
  id: string;
  assessment_id: string;
  question: string;
  options: string[];
  correct_index: number;
  topic: string;
  question_type: string;
  position: number;
}

export interface AttemptRow {
  id: string;
  assessment_id: string;
  student_id: string;
  score: number;
  correct_count: number;
  total_questions: number;
  time_taken_seconds: number;
  level: string;
  strong_areas: string[];
  weak_areas: string[];
  recommendation: string | null;
  created_at: string;
  assessments?: { id: string; title: string; category: string; skill_id: string | null } | null;
}

export interface TrainingProgramRow {
  id: string;
  college_id: string;
  title: string;
  target_skill_id: string | null;
  description: string;
  eligibility: string;
  duration_weeks: number;
  starts_on: string | null;
  status: string;
  created_at: string;
  skills?: { id: string; name: string } | null;
}

export interface DriveRow {
  id: string;
  college_id: string;
  company_id: string | null;
  role_title: string;
  drive_date: string | null;
  eligible_count: number;
  applied_count: number;
  shortlisted_count: number;
  selected_count: number;
  status: string;
  companies?: { id: string; name: string } | null;
}

export interface SkillDemandRow {
  id: string;
  skill_id: string;
  industry: string;
  location: string;
  period: string;
  demand_score: number;
  openings: number;
  skills?: { id: string; name: string; category: string } | null;
}

export interface RoleTemplateRow {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  preferred_skills: string[];
}

export interface NotificationRow {
  id: string;
  user_id: string;
  title: string;
  body: string;
  category: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

/* -------------------------------------------------------------- utilities */

/** Throws Supabase errors so TanStack Query surfaces them to error states. */
function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? []) as T;
}

export const APPLICATION_STATUSES = [
  "applied",
  "under_review",
  "shortlisted",
  "interview",
  "selected",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

const statusLabels: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview: "Interview",
  selected: "Selected",
  rejected: "Rejected",
};

export function statusLabel(status: string) {
  return statusLabels[status] ?? status;
}

export function splitJobSkills<T extends JobRow>(job: T): T & {
  requiredSkills: string[];
  preferredSkills: string[];
} {
  const requiredSkills = (job.job_skills ?? [])
    .filter((js) => js.is_required && js.skills)
    .map((js) => js.skills!.name);
  const preferredSkills = (job.job_skills ?? [])
    .filter((js) => !js.is_required && js.skills)
    .map((js) => js.skills!.name);
  return { ...job, requiredSkills, preferredSkills };
}

/** Maps student skill rows into the matching engine's input shape. */
export function toMatchSkills(rows: StudentSkillRow[]): StudentSkillInput[] {
  return rows.map((r) => ({
    skillName: r.skills?.name ?? "",
    proficiencyScore: r.proficiency_score,
    verified: r.verified,
    assessmentScore: r.assessment_score,
  }));
}

const JOB_SELECT =
  "*, companies(id, name, sector, location), job_skills(is_required, skills(id, name))";

/* --------------------------------------------------------------- fetchers */

export async function fetchSkills() {
  return unwrap<SkillRow[]>(
    await supabase.from("skills").select("*").order("demand_score", { ascending: false }),
  );
}

export async function fetchRoleTemplates() {
  return unwrap<RoleTemplateRow[]>(
    await supabase.from("role_templates").select("*").order("title"),
  );
}

export async function fetchStudent(studentId: string) {
  const res = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data as StudentRow | null;
}

export async function fetchStudents(opts: { collegeId?: string | undefined; limit?: number | undefined } = {}) {
  let q = supabase.from("students").select("*").order("readiness_score", { ascending: false });
  if (opts.collegeId) q = q.eq("college_id", opts.collegeId);
  if (opts.limit) q = q.limit(opts.limit);
  return unwrap<StudentRow[]>(await q);
}

export async function fetchStudentSkills(studentId: string) {
  return unwrap<StudentSkillRow[]>(
    await supabase
      .from("student_skills")
      .select("*, skills(id, name, category, demand_level)")
      .eq("student_id", studentId)
      .order("proficiency_score", { ascending: false }),
  );
}

/** Bulk skill fetch used by recruiter talent search and college analytics. */
export async function fetchStudentSkillsFor(studentIds: string[]) {
  if (!studentIds.length) return [] as (StudentSkillRow & { student_id: string })[];
  return unwrap<(StudentSkillRow & { student_id: string })[]>(
    await supabase
      .from("student_skills")
      .select("*, skills(id, name, category, demand_level)")
      .in("student_id", studentIds),
  );
}

export async function fetchProjects(studentId: string) {
  return unwrap<ProjectRow[]>(
    await supabase
      .from("projects")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchProjectsFor(studentIds: string[]) {
  if (!studentIds.length) return [] as ProjectRow[];
  return unwrap<ProjectRow[]>(
    await supabase.from("projects").select("*").in("student_id", studentIds),
  );
}

export async function fetchCertifications(studentId: string) {
  return unwrap<CertificationRow[]>(
    await supabase
      .from("certifications")
      .select("*")
      .eq("student_id", studentId)
      .order("issued_on", { ascending: false }),
  );
}

export async function fetchJobs(opts: { companyId?: string; status?: string } = {}) {
  let q = supabase.from("job_postings").select(JOB_SELECT).order("created_at", { ascending: false });
  if (opts.companyId) q = q.eq("company_id", opts.companyId);
  if (opts.status) q = q.eq("status", opts.status);
  const rows = unwrap<JobRow[]>(await q);
  return rows.map(splitJobSkills) as JobWithSkills[];
}

export async function fetchJob(jobId: string) {
  const res = await supabase.from("job_postings").select(JOB_SELECT).eq("id", jobId).maybeSingle();
  if (res.error) throw new Error(res.error.message);
  return res.data ? (splitJobSkills(res.data as JobRow) as JobWithSkills) : null;
}

export async function fetchCompanies() {
  return unwrap<CompanyRow[]>(await supabase.from("companies").select("*").order("name"));
}

export async function fetchColleges() {
  return unwrap<CollegeRow[]>(await supabase.from("colleges").select("*").order("name"));
}

export async function fetchApplicationsForStudent(studentId: string) {
  return unwrap<(ApplicationRow & { job_postings: JobRow | null })[]>(
    await supabase
      .from("applications")
      .select(`*, job_postings(${JOB_SELECT})`)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchApplicationsForCompany(companyId: string) {
  return unwrap<
    (ApplicationRow & {
      job_postings: JobRow | null;
      students: StudentRow | null;
    })[]
  >(
    await supabase
      .from("applications")
      .select(`*, job_postings!inner(${JOB_SELECT}), students(*)`)
      .eq("job_postings.company_id", companyId)
      .order("match_score", { ascending: false }),
  );
}

export async function fetchApplicationsForCollege(collegeId: string) {
  return unwrap<(ApplicationRow & { job_postings: JobRow | null; students: StudentRow | null })[]>(
    await supabase
      .from("applications")
      .select(`*, job_postings(${JOB_SELECT}), students!inner(*)`)
      .eq("students.college_id", collegeId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchAllApplications(limit = 500) {
  return unwrap<(ApplicationRow & { job_postings: JobRow | null; students: StudentRow | null })[]>(
    await supabase
      .from("applications")
      .select(`*, job_postings(${JOB_SELECT}), students(*)`)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function fetchApplicationHistory(applicationId: string) {
  return unwrap<{ id: string; status: string; note: string | null; created_at: string }[]>(
    await supabase
      .from("application_status_history")
      .select("*")
      .eq("application_id", applicationId)
      .order("created_at", { ascending: true }),
  );
}

export async function fetchAssessments() {
  return unwrap<AssessmentRow[]>(await supabase.from("assessments").select("*").order("title"));
}

export async function fetchAssessmentQuestions(assessmentId: string) {
  const rows = unwrap<(Omit<QuestionRow, "options"> & { options: unknown })[]>(
    await supabase
      .from("assessment_questions")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("position"),
  );
  return rows.map((r) => ({ ...r, options: (r.options as string[]) ?? [] })) as QuestionRow[];
}

export async function fetchAttempts(studentId: string) {
  return unwrap<AttemptRow[]>(
    await supabase
      .from("assessment_attempts")
      .select("*, assessments(id, title, category, skill_id)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  );
}

export async function fetchAllAttempts(limit = 500) {
  return unwrap<AttemptRow[]>(
    await supabase
      .from("assessment_attempts")
      .select("*, assessments(id, title, category, skill_id)")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

export async function fetchTrainingPrograms(collegeId?: string) {
  let q = supabase
    .from("training_programs")
    .select("*, skills(id, name)")
    .order("created_at", { ascending: false });
  if (collegeId) q = q.eq("college_id", collegeId);
  return unwrap<TrainingProgramRow[]>(await q);
}

export async function fetchEnrollmentCounts(programIds: string[]) {
  if (!programIds.length) return {} as Record<string, number>;
  const rows = unwrap<{ program_id: string }[]>(
    await supabase.from("training_enrollments").select("program_id").in("program_id", programIds),
  );
  return rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.program_id] = (acc[r.program_id] ?? 0) + 1;
    return acc;
  }, {});
}

export async function fetchDrives(collegeId?: string) {
  let q = supabase
    .from("placement_drives")
    .select("*, companies(id, name)")
    .order("drive_date", { ascending: false });
  if (collegeId) q = q.eq("college_id", collegeId);
  return unwrap<DriveRow[]>(await q);
}

export async function fetchSkillDemand() {
  return unwrap<SkillDemandRow[]>(
    await supabase
      .from("skill_demand")
      .select("*, skills(id, name, category)")
      .order("demand_score", { ascending: false }),
  );
}

export async function fetchNotifications(userId: string) {
  return unwrap<NotificationRow[]>(
    await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

/* --------------------------------------------------------------- mutations */

export async function markNotificationRead(id: string, isRead = true) {
  const { error } = await supabase.from("notifications").update({ is_read: isRead }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw new Error(error.message);
}

/** Creates an in-app notification for a user. Safe to call for the current user. */
export async function createNotification(input: {
  user_id: string;
  title: string;
  body: string;
  category: string;
  link?: string | null;
}) {
  const { error } = await supabase.from("notifications").insert({
    user_id: input.user_id,
    title: input.title,
    body: input.body,
    category: input.category,
    link: input.link ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function applyToJob(input: {
  jobId: string;
  studentId: string;
  matchScore: number;
  note?: string | null;
}) {
  const existing = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", input.jobId)
    .eq("student_id", input.studentId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) throw new Error("You have already applied to this opportunity.");

  const { error } = await supabase.from("applications").insert({
    job_id: input.jobId,
    student_id: input.studentId,
    status: "applied",
    match_score: input.matchScore,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, note?: string) {
  const patch: { status: string; note?: string } = { status };
  if (note !== undefined) patch.note = note;
  const { error } = await supabase.from("applications").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Records an assessment attempt and upserts the resulting verified skill level. */
export async function saveAttempt(input: {
  assessmentId: string;
  studentId: string;
  skillId: string | null;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeTakenSeconds: number;
  level: string;
  strongAreas: string[];
  weakAreas: string[];
  recommendation: string;
}) {
  const { error } = await supabase.from("assessment_attempts").insert({
    assessment_id: input.assessmentId,
    student_id: input.studentId,
    score: input.score,
    correct_count: input.correctCount,
    total_questions: input.totalQuestions,
    time_taken_seconds: input.timeTakenSeconds,
    level: input.level,
    strong_areas: input.strongAreas,
    weak_areas: input.weakAreas,
    recommendation: input.recommendation,
  });
  if (error) throw new Error(error.message);

  if (!input.skillId) return;

  const existing = await supabase
    .from("student_skills")
    .select("id, proficiency_score, assessment_score")
    .eq("student_id", input.studentId)
    .eq("skill_id", input.skillId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);

  const verified = input.score >= 60;
  const payload = {
    proficiency: input.level,
    proficiency_score: Math.max(existing.data?.proficiency_score ?? 0, input.score),
    verified,
    verification_source: verified ? "Platform Assessment" : null,
    assessment_score: input.score,
    last_verified_at: verified ? new Date().toISOString() : null,
  };

  if (existing.data) {
    const { error: upErr } = await supabase
      .from("student_skills")
      .update(payload)
      .eq("id", existing.data.id);
    if (upErr) throw new Error(upErr.message);
  } else {
    const { error: insErr } = await supabase
      .from("student_skills")
      .insert({ student_id: input.studentId, skill_id: input.skillId, ...payload });
    if (insErr) throw new Error(insErr.message);
  }
}

/** Recomputes and persists the student's readiness pillars from live evidence. */
export async function recomputeReadiness(studentId: string) {
  const [skills, projects, certs, attempts, apps] = await Promise.all([
    fetchStudentSkills(studentId),
    fetchProjects(studentId),
    fetchCertifications(studentId),
    fetchAttempts(studentId),
    fetchApplicationsForStudent(studentId),
  ]);

  const technicalPool = skills.filter((s) => s.skills?.category !== "Communication");
  const softPool = skills.filter((s) => s.skills?.category === "Communication");
  const avg = (nums: number[], fallback = 0) =>
    nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : fallback;

  const technical = avg(technicalPool.map((s) => s.proficiency_score), 40);
  const soft = avg(softPool.map((s) => s.proficiency_score), 55);
  const projectsScore = Math.min(100, projects.length * 25 + (projects.length ? 15 : 0));
  const certificationsScore = Math.min(100, certs.length * 30);
  const exposure = Math.min(
    100,
    attempts.length * 8 +
      apps.filter((a) => ["shortlisted", "interview", "selected"].includes(a.status)).length * 15 +
      apps.length * 4,
  );

  const readiness = Math.round(
    technical * 0.35 + soft * 0.15 + projectsScore * 0.2 + certificationsScore * 0.15 + exposure * 0.15,
  );

  const { error } = await supabase
    .from("students")
    .update({
      technical_score: technical,
      soft_skills_score: soft,
      projects_score: projectsScore,
      certifications_score: certificationsScore,
      exposure_score: exposure,
      readiness_score: readiness,
    })
    .eq("id", studentId);
  if (error) throw new Error(error.message);
  return readiness;
}
