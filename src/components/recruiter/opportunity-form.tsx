import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkillPicker } from "@/components/recruiter/skill-picker";
import { ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { supabase } from "@/integrations/supabase/client";
import { fetchSkills, type JobWithSkills } from "@/lib/data";

const opportunityTypes = ["Internship", "Full-time", "Part-time", "Contract"];
const workModes = ["On-site", "Remote", "Hybrid"];

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  opportunity_type: z.string().min(1, "Select a type"),
  description: z.string().min(10, "Add a short description"),
  location: z.string().min(1, "Location is required"),
  work_mode: z.string().min(1, "Select a work mode"),
  stipend: z.string().optional(),
  salary: z.string().optional(),
  duration: z.string().optional(),
  deadline: z.string().optional(),
  min_qualification: z.string().optional(),
  graduation_year: z.string().optional(),
  experience: z.string().optional(),
  openings: z.coerce.number().int().min(1, "At least 1 opening"),
  status: z.string().min(1),
});

type FormValues = z.infer<typeof formSchema>;

export function OpportunityForm({
  companyId,
  job,
  initialSkillIds,
  onDone,
}: {
  companyId: string;
  job?: JobWithSkills | null | undefined;
  initialSkillIds?: string[] | undefined;
  onDone?: (() => void) | undefined;
}) {
  const queryClient = useQueryClient();
  const skillsQ = useQuery({ queryKey: ["skills"], queryFn: fetchSkills });
  const [requiredSkillIds, setRequiredSkillIds] = useState<string[]>([]);
  const [preferredSkillIds, setPreferredSkillIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      opportunity_type: "",
      description: "",
      location: "",
      work_mode: "",
      stipend: "",
      salary: "",
      duration: "",
      deadline: "",
      min_qualification: "",
      graduation_year: "",
      experience: "",
      openings: 1,
      status: "published",
    },
  });

  useEffect(() => {
    if (job) {
      reset({
        title: job.title,
        opportunity_type: job.opportunity_type,
        description: job.description,
        location: job.location,
        work_mode: job.work_mode,
        stipend: job.stipend ?? "",
        salary: job.salary ?? "",
        duration: job.duration ?? "",
        deadline: job.deadline ?? "",
        min_qualification: job.min_qualification ?? "",
        graduation_year: job.graduation_year ? String(job.graduation_year) : "",
        experience: job.experience ?? "",
        openings: job.openings,
        status: job.status,
      });
      const bySkill = skillsQ.data ?? [];
      const nameToId = new Map(bySkill.map((s) => [s.name, s.id]));
      setRequiredSkillIds(job.requiredSkills.map((n) => nameToId.get(n)).filter((x): x is string => !!x));
      setPreferredSkillIds(job.preferredSkills.map((n) => nameToId.get(n)).filter((x): x is string => !!x));
    } else if (initialSkillIds?.length) {
      setRequiredSkillIds(initialSkillIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job, skillsQ.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        company_id: companyId,
        title: values.title.trim(),
        opportunity_type: values.opportunity_type,
        description: values.description.trim(),
        location: values.location.trim(),
        work_mode: values.work_mode,
        stipend: values.stipend?.trim() || null,
        salary: values.salary?.trim() || null,
        duration: values.duration?.trim() || null,
        deadline: values.deadline || null,
        min_qualification: values.min_qualification?.trim() || null,
        graduation_year: values.graduation_year ? Number(values.graduation_year) : null,
        experience: values.experience?.trim() || null,
        openings: values.openings,
        status: values.status,
      };

      let jobId = job?.id;
      if (jobId) {
        const { error } = await supabase.from("job_postings").update(payload).eq("id", jobId);
        if (error) throw new Error(error.message);
        const { error: delErr } = await supabase.from("job_skills").delete().eq("job_id", jobId);
        if (delErr) throw new Error(delErr.message);
      } else {
        const { data, error } = await supabase
          .from("job_postings")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        jobId = data.id as string;
      }

      const skillRows = [
        ...requiredSkillIds.map((skill_id) => ({ job_id: jobId, skill_id, is_required: true })),
        ...preferredSkillIds.map((skill_id) => ({ job_id: jobId, skill_id, is_required: false })),
      ];
      if (skillRows.length) {
        const { error: skillErr } = await supabase.from("job_skills").insert(skillRows);
        if (skillErr) throw new Error(skillErr.message);
      }
      return jobId;
    },
    onSuccess: () => {
      toast.success(job ? "Opportunity updated" : "Opportunity posted");
      void queryClient.invalidateQueries({ queryKey: ["recruiter-jobs"] });
      if (!job) {
        reset();
        setRequiredSkillIds([]);
        setPreferredSkillIds([]);
      }
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (skillsQ.isLoading) return <LoadingRows count={3} />;
  if (skillsQ.isError) return <ErrorState onRetry={() => skillsQ.refetch()} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{job ? "Edit opportunity" : "Post a new opportunity"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => saveMutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} placeholder="e.g. Frontend Engineering Intern" />
            {errors.title ? <p className="text-xs text-destructive">{errors.title.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Opportunity type</Label>
              <Select value={watch("opportunity_type")} onValueChange={(v) => setValue("opportunity_type", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {opportunityTypes.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.opportunity_type ? <p className="text-xs text-destructive">{errors.opportunity_type.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label>Work mode</Label>
              <Select value={watch("work_mode")} onValueChange={(v) => setValue("work_mode", v, { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  {workModes.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.work_mode ? <p className="text-xs text-destructive">{errors.work_mode.message}</p> : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
            {errors.description ? <p className="text-xs text-destructive">{errors.description.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} />
              {errors.location ? <p className="text-xs text-destructive">{errors.location.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" {...register("duration")} placeholder="e.g. 6 months" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="stipend">Stipend</Label>
              <Input id="stipend" {...register("stipend")} placeholder="e.g. ₹25,000/month" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" {...register("salary")} placeholder="e.g. ₹8-12 LPA" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="deadline">Application deadline</Label>
              <Input id="deadline" type="date" {...register("deadline")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="openings">Openings</Label>
              <Input id="openings" type="number" min={1} {...register("openings")} />
              {errors.openings ? <p className="text-xs text-destructive">{errors.openings.message}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="min_qualification">Minimum qualification</Label>
              <Input id="min_qualification" {...register("min_qualification")} placeholder="e.g. B.Tech / B.E." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="graduation_year">Graduation year eligibility</Label>
              <Input id="graduation_year" type="number" {...register("graduation_year")} placeholder="e.g. 2025" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="experience">Experience</Label>
              <Input id="experience" {...register("experience")} placeholder="e.g. 0-1 years" />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SkillPicker
            label="Required skills"
            skills={skillsQ.data ?? []}
            selected={requiredSkillIds}
            onChange={setRequiredSkillIds}
            placeholder="Search and select required skills…"
          />
          <SkillPicker
            label="Preferred skills"
            skills={skillsQ.data ?? []}
            selected={preferredSkillIds}
            onChange={setPreferredSkillIds}
            placeholder="Search and select preferred skills…"
          />

          <div className="flex justify-end gap-2">
            {job && onDone ? (
              <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
            ) : null}
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving…" : job ? "Save changes" : "Post opportunity"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
