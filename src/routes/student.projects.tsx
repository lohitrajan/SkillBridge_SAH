import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Award, Github, Globe, Loader2, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchCertifications, fetchProjects, recomputeReadiness, type CertificationRow, type ProjectRow } from "@/lib/data";

export const Route = createFileRoute("/student/projects")({
  head: () => ({
    meta: [
      { title: "Projects | SkillBridge" },
      { name: "description", content: "Projects on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Projects | SkillBridge" },
      { property: "og:description", content: "Projects on SkillBridge." },
    ],
  }),
  component: StudentProjectsPage,
});

const projectSchema = z.object({
  title: z.string().min(2, "Title is required"),
  description: z.string().min(10, "Add a short description (10+ characters)"),
  technologies: z.string().min(1, "List at least one technology"),
  github_url: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  demo_url: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  role: z.string().optional(),
  duration: z.string().optional(),
});
type ProjectFormValues = z.infer<typeof projectSchema>;

const certSchema = z.object({
  name: z.string().min(2, "Name is required"),
  issuer: z.string().min(2, "Issuer is required"),
  issued_on: z.string().optional(),
  credential_url: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
});
type CertFormValues = z.infer<typeof certSchema>;

function StudentProjectsPage() {
  const { studentId } = useAuth();
  const queryClient = useQueryClient();
  const enabled = !!studentId;

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [certDialogOpen, setCertDialogOpen] = useState(false);

  const projectsQuery = useQuery({ queryKey: ["projects", studentId], queryFn: () => fetchProjects(studentId as string), enabled });
  const certsQuery = useQuery({ queryKey: ["certifications", studentId], queryFn: () => fetchCertifications(studentId as string), enabled });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["projects", studentId] }),
      queryClient.invalidateQueries({ queryKey: ["certifications", studentId] }),
      queryClient.invalidateQueries({ queryKey: ["student", studentId] }),
    ]);
  };

  const saveProjectMutation = useMutation({
    mutationFn: async (values: ProjectFormValues & { id?: string | undefined }) => {
      const payload = {
        student_id: studentId as string,
        title: values.title,
        description: values.description,
        technologies: values.technologies.split(",").map((t) => t.trim()).filter(Boolean),
        github_url: values.github_url || null,
        demo_url: values.demo_url || null,
        role: values.role || null,
        duration: values.duration || null,
      };
      if (values.id) {
        const { error } = await supabase.from("projects").update(payload).eq("id", values.id);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("projects").insert(payload);
        if (error) throw new Error(error.message);
      }
      await recomputeReadiness(studentId as string);
    },
    onSuccess: async () => {
      toast.success(editingProject ? "Project updated." : "Project added.");
      setProjectDialogOpen(false);
      setEditingProject(null);
      await invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await recomputeReadiness(studentId as string);
    },
    onSuccess: async () => {
      toast.success("Project deleted.");
      await invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const addCertMutation = useMutation({
    mutationFn: async (values: CertFormValues) => {
      const { error } = await supabase.from("certifications").insert({
        student_id: studentId as string,
        name: values.name,
        issuer: values.issuer,
        issued_on: values.issued_on || null,
        credential_url: values.credential_url || null,
      });
      if (error) throw new Error(error.message);
      await recomputeReadiness(studentId as string);
    },
    onSuccess: async () => {
      toast.success("Certification added.");
      setCertDialogOpen(false);
      await invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteCertMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw new Error(error.message);
      await recomputeReadiness(studentId as string);
    },
    onSuccess: async () => {
      toast.success("Certification deleted.");
      await invalidateAll();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!studentId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Projects" />
        <EmptyState
          icon={Sparkles}
          title="Complete onboarding first"
          description="Set up your student profile to add projects and certifications."
          action={<Button asChild><Link to="/student/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const anyLoading = projectsQuery.isLoading || certsQuery.isLoading;
  const anyError = projectsQuery.isError || certsQuery.isError;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Projects" />
        <LoadingRows count={4} />
      </div>
    );
  }
  if (anyError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Projects" />
        <ErrorState onRetry={() => { void projectsQuery.refetch(); void certsQuery.refetch(); }} />
      </div>
    );
  }

  const projects = projectsQuery.data ?? [];
  const certs = certsQuery.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeading
        title="Projects"
        description="Showcase your hands-on work — projects strengthen your placement readiness and match score."
        actions={
          <Button
            onClick={() => {
              setEditingProject(null);
              setProjectDialogOpen(true);
            }}
          >
            <Plus className="size-4" /> Add project
          </Button>
        }
      />

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Add your first project to showcase your work." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base">{p.title}</CardTitle>
                {p.role || p.duration ? (
                  <p className="text-xs text-muted-foreground">{[p.role, p.duration].filter(Boolean).join(" · ")}</p>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="line-clamp-3 text-sm text-muted-foreground">{p.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.technologies.map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
                <div className="flex gap-3 text-sm">
                  {p.github_url ? (
                    <a href={p.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Github className="size-3.5" /> Code
                    </a>
                  ) : null}
                  {p.demo_url ? (
                    <a href={p.demo_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <Globe className="size-3.5" /> Demo
                    </a>
                  ) : null}
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProject(p);
                    setProjectDialogOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                      <Trash2 className="size-3.5" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{p.title}"?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteProjectMutation.mutate(p.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Certifications</h2>
          <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Plus className="size-4" /> Add certification</Button>
            </DialogTrigger>
            <CertDialogContent onSubmit={(values) => addCertMutation.mutate(values)} pending={addCertMutation.isPending} />
          </Dialog>
        </div>
        {certs.length === 0 ? (
          <EmptyState icon={Award} title="No certifications yet" description="Add certifications to strengthen your profile." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {certs.map((c: CertificationRow) => (
              <Card key={c.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">{c.issuer}{c.issued_on ? ` · ${new Date(c.issued_on).toLocaleDateString()}` : ""}</p>
                    {c.credential_url ? (
                      <a href={c.credential_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                        View credential
                      </a>
                    ) : null}
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteCertMutation.mutate(c.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={projectDialogOpen}
        onOpenChange={(open) => {
          setProjectDialogOpen(open);
          if (!open) setEditingProject(null);
        }}
      >
        <ProjectDialogContent
          project={editingProject}
          onSubmit={(values) => saveProjectMutation.mutate({ ...values, id: editingProject?.id })}
          pending={saveProjectMutation.isPending}
        />
      </Dialog>
    </div>
  );
}

function ProjectDialogContent({
  project,
  onSubmit,
  pending,
}: {
  project: ProjectRow | null;
  onSubmit: (values: ProjectFormValues) => void;
  pending: boolean;
}) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    values: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      technologies: project?.technologies.join(", ") ?? "",
      github_url: project?.github_url ?? "",
      demo_url: project?.demo_url ?? "",
      role: project?.role ?? "",
      duration: project?.duration ?? "",
    },
  });

  return (
    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{project ? "Edit project" : "Add project"}</DialogTitle>
        <DialogDescription>Highlight the technologies and outcomes recruiters care about.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl><Input placeholder="Campus Placement Tracker" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl><Textarea rows={3} placeholder="What did you build and what was the impact?" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="technologies" render={({ field }) => (
            <FormItem>
              <FormLabel>Technologies (comma separated)</FormLabel>
              <FormControl><Input placeholder="React, Node.js, PostgreSQL" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Your role</FormLabel>
                <FormControl><Input placeholder="Full-stack developer" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="duration" render={({ field }) => (
              <FormItem>
                <FormLabel>Duration</FormLabel>
                <FormControl><Input placeholder="6 weeks" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="github_url" render={({ field }) => (
              <FormItem>
                <FormLabel>GitHub URL</FormLabel>
                <FormControl><Input placeholder="https://github.com/..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="demo_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Demo URL</FormLabel>
                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {project ? "Save changes" : "Add project"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function CertDialogContent({
  onSubmit,
  pending,
}: {
  onSubmit: (values: CertFormValues) => void;
  pending: boolean;
}) {
  const form = useForm<CertFormValues>({
    resolver: zodResolver(certSchema),
    defaultValues: { name: "", issuer: "", issued_on: "", credential_url: "" },
  });

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add certification</DialogTitle>
        <DialogDescription>Add certifications from courses, bootcamps, or vendors.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            onSubmit(values);
            form.reset();
          })}
          className="space-y-4"
        >
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl><Input placeholder="AWS Cloud Practitioner" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="issuer" render={({ field }) => (
            <FormItem>
              <FormLabel>Issuer</FormLabel>
              <FormControl><Input placeholder="Amazon Web Services" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="issued_on" render={({ field }) => (
            <FormItem>
              <FormLabel>Issued on</FormLabel>
              <FormControl><Input type="date" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="credential_url" render={({ field }) => (
            <FormItem>
              <FormLabel>Credential URL</FormLabel>
              <FormControl><Input placeholder="https://..." {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Add certification
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
