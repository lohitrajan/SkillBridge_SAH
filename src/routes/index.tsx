import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Briefcase,
  Building2,
  GraduationCap,
  LineChart,
  Route as RouteIcon,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkillBridge — Academia–Industry Skill Collaboration Portal" },
      {
        name: "description",
        content:
          "SkillBridge maps industry skill demand to student capability: verified skill passports, gap analysis, learning roadmaps, internship matching and placement readiness.",
      },
      { property: "og:title", content: "SkillBridge — Academia–Industry Skill Collaboration" },
      {
        property: "og:description",
        content:
          "Close the gap between what students learn and what industries need — skill mapping, internships and placements in one portal.",
      },
    ],
  }),
  component: Landing,
});

const flow = [
  { icon: Building2, title: "Industry defines demand", text: "Recruiters post roles with the exact skills, levels and volumes they hire for." },
  { icon: ScanSearch, title: "Skills get mapped", text: "Student profiles, projects and certifications are mapped to a shared skill taxonomy." },
  { icon: Target, title: "Gaps are exposed", text: "Explainable gap analysis shows precisely which skills block which roles." },
  { icon: RouteIcon, title: "Learning is targeted", text: "Personalised roadmaps sequence the highest-impact skills first." },
  { icon: BadgeCheck, title: "Skills are verified", text: "Assessments, faculty approval and project evidence turn claims into proof." },
  { icon: Briefcase, title: "Matching & placement", text: "Transparent match scores drive internships, interviews and placement readiness." },
];

const audiences = [
  {
    icon: GraduationCap,
    title: "For Students",
    points: ["Verified skill passport", "Gap analysis against real roles", "Roadmaps & micro-projects", "Internship matches with reasons"],
    to: "/auth" as const,
    cta: "Build my skill passport",
  },
  {
    icon: Building2,
    title: "For Industry",
    points: ["Post skill-based roles", "Search verified talent", "Explainable ranked shortlists", "Pipeline & interview tracking"],
    to: "/auth" as const,
    cta: "Hire on skills",
  },
  {
    icon: Users,
    title: "For Colleges",
    points: ["Cohort skill intelligence", "Curriculum gap signals", "Training programs & drives", "Placement analytics"],
    to: "/auth" as const,
    cta: "Bring my institution",
  },
];

const stats = [
  { value: "34+", label: "Mapped industry skills" },
  { value: "6", label: "Verification signals" },
  { value: "100%", label: "Explainable match scores" },
  { value: "4", label: "Connected stakeholders" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <span className="grid size-9 place-items-center rounded-lg gradient-accent font-display text-sm font-bold text-primary-foreground">
            SB
          </span>
          <span className="font-display text-lg font-bold">SkillBridge</span>
          <nav className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth" search={{ mode: "login" }}>
                Sign in
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth" search={{ mode: "register" }}>
                Get started
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5" /> Smart India Hackathon 2026 · SIH26044
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-extrabold leading-tight sm:text-6xl">
              Close the gap between what students learn and what industries need.
            </h1>
            <p className="mt-5 max-w-2xl text-base opacity-90 sm:text-lg">
              SkillBridge is the academia–industry collaboration portal for skill mapping,
              internships and placement — turning industry requirements into verified student
              capability with a transparent, explainable workflow.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/auth" search={{ mode: "register", role: "student" }}>
                  Start as a student <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/auth" search={{ mode: "register", role: "industry" }}>
                  I'm hiring
                </Link>
              </Button>
            </div>

            <dl className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="font-display text-3xl font-bold">{s.value}</dd>
                  <p className="mt-1 text-xs opacity-80">{s.label}</p>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <h2 className="font-display text-3xl font-bold">The end-to-end workflow</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Not a social network. A closed loop from industry requirement to verified placement
            readiness.
          </p>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {flow.map((f, i) => (
              <li key={f.title}>
                <Card className="h-full shadow-card transition-shadow hover:shadow-lift">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                        <f.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        STEP {i + 1}
                      </span>
                    </div>
                    <CardTitle className="mt-3 text-lg">{f.title}</CardTitle>
                    <CardDescription>{f.text}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y bg-muted/40">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="font-display text-3xl font-bold">Built for every stakeholder</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {audiences.map((a) => (
                <Card key={a.title} className="flex flex-col shadow-card">
                  <CardHeader>
                    <span className="grid size-11 place-items-center rounded-xl gradient-accent text-primary-foreground">
                      <a.icon className="size-5" aria-hidden="true" />
                    </span>
                    <CardTitle className="mt-4">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {a.points.map((p) => (
                        <li key={p} className="flex gap-2">
                          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-success" />
                          {p}
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-6 w-full" variant="outline" asChild>
                      <Link to={a.to} search={{ mode: "register" }}>
                        {a.cta}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold">Explainable by design</h2>
              <p className="mt-3 text-muted-foreground">
                Every match score breaks down into required-skill coverage, verification strength,
                assessment performance, project relevance and eligibility — so students know what to
                fix and recruiters know why someone ranks where they do.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                {[
                  { icon: ShieldCheck, t: "Verified, not claimed", d: "Assessments, faculty sign-off and project evidence." },
                  { icon: LineChart, t: "Live demand signals", d: "Role templates and hiring data drive the taxonomy." },
                  { icon: BarChart3, t: "Institution intelligence", d: "Cohort-level gaps guide curriculum and training." },
                ].map((r) => (
                  <li key={r.t} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent/15 text-accent">
                      <r.icon className="size-4" aria-hidden="true" />
                    </span>
                    <span>
                      <span className="font-medium">{r.t}</span>
                      <span className="block text-muted-foreground">{r.d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <Card className="gradient-surface shadow-lift">
              <CardHeader>
                <CardTitle>Sample match breakdown</CardTitle>
                <CardDescription>Full Stack Developer Intern · TechNova Solutions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  ["Required skill coverage", "40 / 50"],
                  ["Verification strength", "12 / 15"],
                  ["Assessment performance", "11 / 15"],
                  ["Project relevance", "8 / 10"],
                  ["Eligibility", "5 / 5"],
                  ["Readiness", "4 / 5"],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold tabular-nums">{v}</span>
                  </div>
                ))}
                <p className="pt-2 font-display text-2xl font-bold text-primary">80% match</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="gradient-hero text-primary-foreground">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Ready to bridge the skill gap?
            </h2>
            <p className="mt-3 opacity-90">
              Join students, colleges and recruiters working from one shared skill language.
            </p>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link to="/auth" search={{ mode: "register" }}>
                Create your account <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SkillBridge · SIH 2026 · Problem Statement SIH26044</p>
          <p>Academia–industry collaboration for skill mapping, internships and placement.</p>
        </div>
      </footer>
    </div>
  );
}
