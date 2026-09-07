import { createFileRoute } from "@tanstack/react-router";
import { Building2, GraduationCap, Mail, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SiteLayout } from "@/components/layout/site-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SkillBridge — Talk to the team" },
      {
        name: "description",
        content:
          "Reach the SkillBridge team about bringing your institution, company or student cohort onto the skill mapping, internship and placement portal.",
      },
      { property: "og:title", content: "Contact SkillBridge" },
      {
        property: "og:description",
        content: "Get in touch about institution onboarding, hiring on verified skills, or the SIH 2026 demo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

const routes = [
  {
    icon: GraduationCap,
    title: "Students",
    body: "Create an account, build your skill passport and start closing gaps against real roles.",
  },
  {
    icon: Users,
    title: "Colleges",
    body: "Onboard your institution to see cohort skill intelligence and curriculum gap signals.",
  },
  {
    icon: Building2,
    title: "Industry",
    body: "Post skill-based roles and search verified, evidence-backed talent.",
  },
];

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Please enter a valid email address.";
    if (message.trim().length < 20) next.message = "Please give us at least 20 characters of context.";
    setErrors(next);
    if (Object.keys(next).length) return;

    const subject = encodeURIComponent(`SkillBridge enquiry from ${name.trim()}`);
    const body = encodeURIComponent(`${message.trim()}\n\n— ${name.trim()} (${email.trim()})`);
    window.location.href = `mailto:hello@skillbridge.demo.in?subject=${subject}&body=${body}`;
    toast.success("Opening your email client with the message drafted.");
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:py-20">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Contact us</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tell us who you are and what you want SkillBridge to solve. Messages open in your own email
          client — nothing is stored on this demo deployment.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Send a message</CardTitle>
              <CardDescription>We reply to institution and hiring enquiries first.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit} noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-name">Your name</Label>
                  <Input
                    id="contact-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "contact-name-error" : undefined}
                  />
                  {errors.name ? (
                    <p id="contact-name-error" className="text-xs text-destructive">
                      {errors.name}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "contact-email-error" : undefined}
                  />
                  {errors.email ? (
                    <p id="contact-email-error" className="text-xs text-destructive">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-message">How can we help?</Label>
                  <Textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                  />
                  {errors.message ? (
                    <p id="contact-message-error" className="text-xs text-destructive">
                      {errors.message}
                    </p>
                  ) : null}
                </div>
                <Button type="submit" className="w-full sm:w-auto">
                  <Mail className="size-4" /> Draft email
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {routes.map((r) => (
              <Card key={r.title} className="shadow-card">
                <CardHeader>
                  <span className="grid size-9 place-items-center rounded-lg bg-accent/15 text-accent">
                    <r.icon className="size-4" aria-hidden="true" />
                  </span>
                  <CardTitle className="mt-2 text-base">{r.title}</CardTitle>
                  <CardDescription>{r.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
