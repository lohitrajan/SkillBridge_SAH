import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/layout/site-layout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Use — SkillBridge" },
      {
        name: "description",
        content:
          "Terms for using the SkillBridge academia–industry skill mapping portal: acceptable use, accuracy of skill claims, and platform moderation.",
      },
      { property: "og:title", content: "SkillBridge Terms of Use" },
      {
        property: "og:description",
        content: "Acceptable use, skill claim accuracy and moderation rules for the SkillBridge portal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Terms of Use</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Applies to this SkillBridge demonstration deployment.
        </p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Accounts and roles</h2>
            <p className="mt-2">
              You choose a role — student, college administrator, or industry recruiter — when you
              register, and your workspace is scoped to that role. You are responsible for keeping
              your credentials secure and for the accuracy of the information you publish.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Honest skill claims</h2>
            <p className="mt-2">
              Skill levels on SkillBridge are backed by evidence. Submitting another person&apos;s
              work as project evidence, or attempting to manipulate assessment results, is grounds
              for removing verification and deactivating the account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Postings and hiring</h2>
            <p className="mt-2">
              Recruiters must post genuine opportunities with accurate skill requirements,
              compensation and deadlines. Match scores are decision support, not a hiring decision:
              the breakdown is shown so both sides can see how a score was produced.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">Moderation</h2>
            <p className="mt-2">
              Platform administrators may review and close postings, correct the skill taxonomy, and
              deactivate accounts that breach these terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold text-foreground">No warranty</h2>
            <p className="mt-2">
              This deployment is provided for demonstration and evaluation. Seeded institutions,
              companies and student profiles are fictional, and readiness or match figures should not
              be treated as a guarantee of any hiring outcome.
            </p>
          </section>
        </div>
      </article>
    </SiteLayout>
  );
}
