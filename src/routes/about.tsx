import { createFileRoute } from "@tanstack/react-router";
import { Target, Users, Workflow } from "lucide-react";

import { SiteLayout } from "@/components/layout/site-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About SkillBridge — Skill mapping for academia and industry" },
      {
        name: "description",
        content:
          "SkillBridge is a skill-first academia–industry portal built for SIH 2026 problem statement SIH26044, connecting students, colleges and recruiters through verified skill mapping.",
      },
      { property: "og:title", content: "About SkillBridge" },
      {
        property: "og:description",
        content:
          "Why SkillBridge exists: turning industry skill demand into measurable student capability, verified skills and real placements.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

const pillars = [
  {
    icon: Target,
    title: "Start from industry demand",
    body: "Every skill in SkillBridge exists because a recruiter asked for it. Role templates and live postings define the taxonomy, so student effort is always pointed at real hiring criteria.",
  },
  {
    icon: Workflow,
    title: "Measure, then close the gap",
    body: "Assessments, faculty sign-off and project evidence produce a verified skill profile. The gap engine compares that profile to a target role and returns a prioritised, week-by-week roadmap.",
  },
  {
    icon: Users,
    title: "Serve all three stakeholders",
    body: "Students see what to learn next. Colleges see which skills their cohort is missing and can launch training against it. Recruiters see ranked, explainable, evidence-backed shortlists.",
  },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:py-20">
        <p className="text-sm font-semibold text-primary">About SkillBridge</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Close the gap between what students learn and what industries need.
        </h1>
        <p className="mt-5 text-base text-muted-foreground">
          SkillBridge transforms industry requirements into measurable skills, personalised learning
          paths, verified capabilities and meaningful career opportunities. It was built for Smart
          India Hackathon 2026, problem statement SIH26044 — Portal for Academia–Industry
          Collaboration for Skill Mapping, Internships and Placement.
        </p>
        <p className="mt-4 text-base text-muted-foreground">
          It is deliberately not a professional social network. There is no feed, no follower count
          and no connection graph. The product is a closed loop: industry defines demand, skills are
          mapped, gaps are exposed, learning is targeted, capability is verified, and placement-ready
          students are matched to opportunities.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <Card key={p.title} className="h-full shadow-card">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <p.icon className="size-5" aria-hidden="true" />
                </span>
                <CardTitle className="mt-3 text-lg">{p.title}</CardTitle>
                <CardDescription>{p.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="mt-12 shadow-card">
          <CardHeader>
            <CardTitle>Demonstration data</CardTitle>
            <CardDescription>
              This deployment is seeded with clearly marked demo institutions, companies and student
              profiles so the full workflow can be evaluated end to end. Demo organisations use
              fictional names and <code>.demo.in</code> contact addresses and do not represent real
              partnerships.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Every number shown in the product is computed from these records — no placeholder charts
            and no invented statistics.
          </CardContent>
        </Card>
      </section>
    </SiteLayout>
  );
}
