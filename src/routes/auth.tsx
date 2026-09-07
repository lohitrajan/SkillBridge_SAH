import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { GraduationCap, Building2, Landmark, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleHome, useAuth, type AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Mode = "login" | "register" | "forgot" | "reset";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode?: Mode; role?: AppRole } => {
    const out: { mode?: Mode; role?: AppRole } = {};
    if (typeof search["mode"] === "string") out.mode = search["mode"] as Mode;
    if (typeof search["role"] === "string") out.role = search["role"] as AppRole;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Sign in to SkillBridge — Skill-first careers portal" },
      {
        name: "description",
        content:
          "Sign in or create your SkillBridge account as a student, college or industry recruiter to map skills, close gaps and hire verified talent.",
      },
      { property: "og:title", content: "Sign in to SkillBridge" },
      {
        property: "og:description",
        content: "Access your SkillBridge student, college, recruiter or admin workspace.",
      },
    ],
  }),
  component: AuthPage,
});

const roleOptions: { value: AppRole; label: string; icon: typeof GraduationCap }[] = [
  { value: "student", label: "Student", icon: GraduationCap },
  { value: "college", label: "College / Academia", icon: Landmark },
  { value: "industry", label: "Industry / Recruiter", icon: Building2 },
];

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [role, setRole] = useState<AppRole>(search.role ?? "student");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);


  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function goToRoleHome(uid: string) {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();
    const r = (data?.role as AppRole | undefined) ?? "student";
    await navigate({ to: roleHome[r] });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Enter your email and password");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
    toast.success("Welcome back to SkillBridge");
    if (data.user) await goToRoleHome(data.user.id);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const fullName =
      role === "student"
        ? form["name"]
        : role === "college"
          ? form["contact_person"]
          : form["recruiter_name"];
    if (!email || password.length < 6) {
      toast.error("Provide an email and a password of at least 6 characters");
      return;
    }
    if (!fullName) {
      toast.error("Please complete the required fields");
      return;
    }
    setBusy(true);
    const metadata: Record<string, string> = {
      full_name: fullName,
      role,
    };
    const carry = [
      "phone",
      "department",
      "degree",
      "year",
      "graduation_year",
      "location",
      "interests",
      "institution",
      "institution_type",
      "official_email",
      "website",
      "company",
      "sector",
      "company_size",
    ];
    for (const key of carry) {
      const value = form[key];
      if (value) metadata[key] = value;
    }
    if (role === "college" && !metadata["institution_type"]) {
      metadata["institution_type"] = "Engineering College";
    }
    if (role === "industry" && !metadata["company_size"]) {
      metadata["company_size"] = "51-200";
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth`,
        data: metadata,
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      await refresh();
      toast.success("Account created — welcome to SkillBridge");
      await navigate({ to: `${roleHome[role]}/onboarding` });
      return;
    }
    setConfirmSent(true);
    toast.success("Check your inbox to confirm your email address");
  }


  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      toast.error("Enter the email linked to your account");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Password reset link sent to your inbox");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated. You can sign in now.");
      setMode("login");
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="gradient-hero relative hidden flex-col justify-between p-12 text-navy-foreground lg:flex">
        <Link to="/" className="font-display text-xl font-bold">
          SkillBridge
        </Link>
        <div className="max-w-md space-y-6">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Close the gap between what students learn and what industries need.
          </h1>
          <p className="text-navy-foreground/80">
            Verified skills, measured gaps, personalised roadmaps and transparent matching —
            for students, colleges and recruiters.
          </p>
          <ul className="space-y-2 text-sm text-navy-foreground/80">
            <li>• Industry-driven skill mapping</li>
            <li>• Explainable match scores, never a black box</li>
            <li>• Institution-level skill intelligence</li>
          </ul>
        </div>
        <p className="text-xs text-navy-foreground/60">
          SIH 2026 · Problem Statement SIH26044
        </p>
      </section>

      <section className="flex items-center justify-center bg-background px-4 py-10">
        <div className="w-full max-w-lg">
          <Link
            to="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to home
          </Link>

          <Card className="shadow-lift">
            <CardHeader>
              <CardTitle className="font-display text-2xl">
                {mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create your account"
                    : mode === "forgot"
                      ? "Reset your password"
                      : "Set a new password"}
              </CardTitle>
              <CardDescription>
                {mode === "register"
                  ? "Tell us who you are so we can tailor your workspace."
                  : "SkillBridge — bridging campus skills with industry needs."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mode === "login" ? (
                <form className="space-y-4" onSubmit={handleLogin}>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
                  </Button>
                  <div className="flex items-center justify-between text-sm">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => setMode("forgot")}
                    >
                      Forgot password?
                    </button>
                    <button
                      type="button"
                      className="font-medium text-primary hover:underline"
                      onClick={() => setMode("register")}
                    >
                      Create an account
                    </button>
                  </div>
                </form>
              ) : null}

              {mode === "forgot" ? (
                <form className="space-y-4" onSubmit={handleForgot}>
                  <div className="space-y-2">
                    <Label htmlFor="fp-email">Email</Label>
                    <Input
                      id="fp-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Send reset link
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setMode("login")}
                  >
                    Back to sign in
                  </Button>
                </form>
              ) : null}

              {mode === "reset" ? (
                <form className="space-y-4" onSubmit={handleReset}>
                  <div className="space-y-2">
                    <Label htmlFor="np">New password</Label>
                    <Input
                      id="np"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Update password
                  </Button>
                </form>
              ) : null}

              {mode === "register" && confirmSent ? (
                <div className="space-y-4 text-sm">
                  <p className="text-foreground">
                    We've sent a confirmation link to <strong>{email}</strong>. Open it to
                    activate your account, then sign in to reach your workspace.
                  </p>
                  <p className="text-muted-foreground">
                    Nothing in your inbox after a few minutes? Check the spam folder, or sign
                    up again with a different address.
                  </p>
                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setConfirmSent(false);
                      setPassword("");
                      setMode("login");
                    }}
                  >
                    Go to sign in
                  </Button>
                </div>
              ) : null}

              {mode === "register" && !confirmSent ? (
                <form className="space-y-5" onSubmit={handleRegister}>

                  <Tabs value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <TabsList className="grid w-full grid-cols-3">
                      {roleOptions.map((r) => (
                        <TabsTrigger key={r.value} value={r.value} className="text-xs sm:text-sm">
                          {r.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    <TabsContent value="student" className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field id="name" label="Full name" value={form["name"]} onChange={set} required />
                      <Field id="phone" label="Phone" value={form["phone"]} onChange={set} />
                      <Field id="department" label="Department" value={form["department"]} onChange={set} />
                      <Field id="degree" label="Degree" value={form["degree"]} onChange={set} />
                      <Field id="year" label="Current year" type="number" value={form["year"]} onChange={set} />
                      <Field
                        id="graduation_year"
                        label="Graduation year"
                        type="number"
                        value={form["graduation_year"]}
                        onChange={set}
                      />
                      <Field id="location" label="Location" value={form["location"]} onChange={set} />
                      <Field
                        id="interests"
                        label="Areas of interest (comma separated)"
                        value={form["interests"]}
                        onChange={set}
                        className="sm:col-span-2"
                      />
                    </TabsContent>

                    <TabsContent value="college" className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field id="institution" label="Institution name" value={form["institution"]} onChange={set} required className="sm:col-span-2" />
                      <div className="space-y-2">
                        <Label htmlFor="institution_type">Institution type</Label>
                        <Select
                          value={form["institution_type"] ?? "Engineering College"}
                          onValueChange={(v) => set("institution_type", v)}
                        >
                          <SelectTrigger id="institution_type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Engineering College", "Autonomous Institute", "Deemed University", "Polytechnic", "University"].map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Field id="location" label="Location" value={form["location"]} onChange={set} />
                      <Field id="contact_person" label="Contact person" value={form["contact_person"]} onChange={set} required />
                      <Field id="official_email" label="Official email" value={form["official_email"]} onChange={set} />
                      <Field id="website" label="Website" value={form["website"]} onChange={set} className="sm:col-span-2" />
                    </TabsContent>

                    <TabsContent value="industry" className="mt-4 grid gap-4 sm:grid-cols-2">
                      <Field id="company" label="Company name" value={form["company"]} onChange={set} required className="sm:col-span-2" />
                      <Field id="sector" label="Industry sector" value={form["sector"]} onChange={set} />
                      <div className="space-y-2">
                        <Label htmlFor="company_size">Company size</Label>
                        <Select
                          value={form["company_size"] ?? "51-200"}
                          onValueChange={(v) => set("company_size", v)}
                        >
                          <SelectTrigger id="company_size">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Field id="location" label="Location" value={form["location"]} onChange={set} />
                      <Field id="recruiter_name" label="Recruiter name" value={form["recruiter_name"]} onChange={set} required />
                      <Field id="website" label="Website" value={form["website"]} onChange={set} className="sm:col-span-2" />
                    </TabsContent>
                  </Tabs>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="r-email">Email</Label>
                      <Input
                        id="r-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="r-password">Password</Label>
                      <Input
                        id="r-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Create account
                  </Button>
                  <button
                    type="button"
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setMode("login")}
                  >
                    Already have an account? Sign in
                  </button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
  className,
}: {
  id: string;
  label: string;
  value?: string | undefined;
  onChange: (k: string, v: string) => void;
  type?: string | undefined;
  required?: boolean | undefined;
  className?: string | undefined;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value ?? ""}
        required={required}
        onChange={(e) => onChange(id, e.target.value)}
      />
    </div>
  );
}
