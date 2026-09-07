# SkillBridge build roadmap

## Done
- [x] Database schema + RLS policies, tightened SECURITY DEFINER grants
- [x] Seeded demo data (skills, colleges, companies, students, postings, assessments, applications, projects, certifications, training, drives, demand)
- [x] Shared data layer `src/lib/data.ts`
- [x] Landing page + About / Contact / Privacy / Terms
- [x] Student workspace: dashboard, passport, assessments runner, skill gap, roadmap, projects, internships, applications tracker, readiness simulator, notifications, settings, onboarding
- [x] Typecheck clean (exactOptionalPropertyTypes fixes across shared components)

## In progress
- [ ] Recruiter: company profile, notifications, settings
- [ ] College: gaps, training, internships, drives, analytics, notifications, settings
- [ ] Admin: industries, skills, opportunities, assessments, reports, settings

## Remaining
- [ ] Final build + typecheck pass
- [ ] Browser verification of student -> recruiter -> college demo flow
