import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/layout/site-layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — SkillBridge" },
      {
        name: "description",
        content:
          "How SkillBridge handles student, college and recruiter data: what is collected, who can see it, and how skill evidence and documents are protected.",
      },
      { property: "og:title", content: "SkillBridge Privacy Policy" },
      {
        property: "og:description",
        content: "Data collection, visibility rules and document storage on the SkillBridge portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <SiteLayout>
      <article className="prose-sb mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Applies to this SkillBridge demonstration deployment.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">What we collect</h2>
            <p className="mt-2">
              Account details (name, email, phone) and role-specific records: for students, education
              details, skills, assessment attempts, projects, certifications, uploaded documents and
              applications; for colleges, institution details, training programs and placement
              drives; for recruiters, company details and job postings.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Who can see what</h2>
            <p className="mt-2">
              Access is enforced in the database with row-level security, not just in the interface.
              Students can read and change only their own records. College administrators can see
              only students belonging to their institution. Recruiters can manage only their own
              company and its postings and applications. Platform administrators have oversight
              access for moderation. Uploaded documents live in a private storage bucket and are
              served only through short-lived signed links.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Skill evidence</h2>
            <p className="mt-2">
              Verified skill status is derived from evidence — platform or college assessments,
              faculty evaluation, project review, industry assessment or a certification. Recruiters
              see the verification source and score behind a claim, not a self-declared label alone.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Demonstration data</h2>
            <p className="mt-2">
              This deployment is seeded with fictional institutions, companies and student profiles
              for evaluation purposes. Demo organisations use <code>.demo.in</code> addresses and do
              not represent real entities or partnerships.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Your choices</h2>
            <p className="mt-2">
              You can edit or remove your profile content, projects, certifications and documents
              from your workspace at any time, and withdraw an application you have submitted.
              Account deactivation is handled by a platform administrator.
            </p>
          </section>
        </div>
      </article>
    </SiteLayout>
  );
}
