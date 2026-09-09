# 🌉 SkillBridge

**Bridging campus skills with industry needs.**

Built for **SIH 2026 — Problem Statement SIH26044**: *"Portal for Academia–Industry Collaboration for Skill Mapping, Internships and Placement."*

SkillBridge isn't a LinkedIn clone. There's no feed, no connection requests, no social graph. Instead, it's a pipeline — industry requirements get translated into a skill map, students get measured against it, and the gap between the two drives everything the platform does next: a personalized learning roadmap, skill verification, internship matching, and placement readiness.


## Who it's for

SkillBridge connects three stakeholders who usually only talk to each other through spreadsheets and campus visits:

- **Students** — take skill assessments, see exactly where they fall short of what companies are hiring for, follow a generated roadmap to close the gap, build a verified skill passport, and apply to internships with real placement-readiness scores.
- **Colleges** — see aggregate skill gaps across their student body, run training programs against those gaps, organize placement drives, and track outcomes with real analytics instead of guesswork.
- **Recruiters** — post internships and jobs against specific skill requirements, see a live pipeline of matched candidates, and manage applications without wading through irrelevant resumes.

An **admin** layer sits above all three, managing the master skill taxonomy, industries, opportunities, and platform-wide reporting.

## Tech stack

- **React + TypeScript + Vite** — fast, type-safe frontend
- **TanStack Router** — file-based routing across four separate portals (student, college, recruiter, admin)
- **Tailwind CSS + shadcn/ui + Lucide icons** — consistent, professional SaaS-style UI
- **Recharts** — analytics dashboards and skill-gap visualizations
- **Supabase** — Postgres database, authentication, Row Level Security, and storage

## What's built

- Full **student workspace**: dashboard, skill passport, assessment runner, skill gap analysis, learning roadmap, project tracker, internship browser, application tracker, placement-readiness simulator, notifications, onboarding
- Full **college portal**: skill gap intelligence, training program management, internship oversight, placement drives, demand forecasting, analytics
- Full **recruiter portal**: company profile, job/internship posting, candidate pipeline, applications, demand insights
- **Admin console**: industries, skills taxonomy, opportunities, assessments, colleges, students, users, platform reports
- Seeded demo data across skills, colleges, companies, students, postings, assessments, applications, and training programs — enough to demo the full student → recruiter → college flow end to end

## Database

Schema and Row Level Security policies live in `supabase/migrations/`. Core tables include `applications`, `assessments` / `assessment_questions` / `assessment_attempts`, `job_postings`, `job_skills`, `certifications`, `colleges`, `companies`, `placement_drives`, and `notifications` — modeling the full pipeline from a posted requirement down to a verified, placement-ready student.

## Running locally

```bash
bun install
bun run dev
```

You'll need a `.env` file with your Supabase project credentials:


---

*Built for Smart India Hackathon 2026.*
