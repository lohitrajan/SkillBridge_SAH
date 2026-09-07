import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Briefcase, TrendingUp } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingRows, PageHeading } from "@/components/shared/ui-states";
import { loadStudentPool } from "@/components/recruiter/match-utils";
import { useAuth } from "@/hooks/useAuth";
import { fetchJobs, fetchSkillDemand } from "@/lib/data";

export const Route = createFileRoute("/recruiter/demand")({
  head: () => ({
    meta: [
      { title: "Skill Demand | SkillBridge" },
      { name: "description", content: "Skill Demand on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Skill Demand | SkillBridge" },
      { property: "og:description", content: "Skill Demand on SkillBridge." },
    ],
  }),
  component: RecruiterDemandPage,
});

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function RecruiterDemandPage() {
  const { companyId } = useAuth();

  const demandQ = useQuery({ queryKey: ["skill-demand"], queryFn: fetchSkillDemand, enabled: !!companyId });
  const jobsQ = useQuery({
    queryKey: ["recruiter-jobs", companyId],
    queryFn: () => fetchJobs({ companyId: companyId! }),
    enabled: !!companyId,
  });
  const poolQ = useQuery({ queryKey: ["student-pool"], queryFn: loadStudentPool, enabled: !!companyId });

  const topSkills = useMemo(() => {
    const map = new Map<string, number>();
    (demandQ.data ?? []).forEach((d) => {
      const name = d.skills?.name ?? "Unknown";
      map.set(name, (map.get(name) ?? 0) + d.demand_score);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, score]) => ({ name, score }));
  }, [demandQ.data]);

  const byIndustry = useMemo(() => {
    const map = new Map<string, number>();
    (demandQ.data ?? []).forEach((d) => map.set(d.industry, (map.get(d.industry) ?? 0) + d.openings));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, openings]) => ({ name, openings }));
  }, [demandQ.data]);

  const byLocation = useMemo(() => {
    const map = new Map<string, number>();
    (demandQ.data ?? []).forEach((d) => map.set(d.location, (map.get(d.location) ?? 0) + d.openings));
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, openings]) => ({ name, openings }));
  }, [demandQ.data]);

  const ownRequiredSkills = useMemo(() => {
    const map = new Map<string, number>();
    (jobsQ.data ?? []).forEach((j) => j.requiredSkills.forEach((s) => map.set(s, (map.get(s) ?? 0) + 1)));
    return map;
  }, [jobsQ.data]);

  const supplyVsDemand = useMemo(() => {
    if (!poolQ.data) return [];
    const supplyCounts = new Map<string, number>();
    poolQ.data.skills.forEach((s) => {
      const name = s.skills?.name;
      if (!name) return;
      supplyCounts.set(name, (supplyCounts.get(name) ?? 0) + 1);
    });
    return [...ownRequiredSkills.keys()].slice(0, 8).map((name) => ({
      name,
      demand: ownRequiredSkills.get(name) ?? 0,
      supply: supplyCounts.get(name) ?? 0,
    }));
  }, [poolQ.data, ownRequiredSkills]);

  if (!companyId) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Demand" />
        <EmptyState
          icon={Briefcase}
          title="Finish setting up your company"
          description="Create your company profile to view skill demand intelligence."
          action={<Button asChild><Link to="/recruiter/onboarding">Complete onboarding</Link></Button>}
        />
      </div>
    );
  }

  const isLoading = demandQ.isLoading || jobsQ.isLoading || poolQ.isLoading;
  const isError = demandQ.isError || jobsQ.isError || poolQ.isError;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Demand" />
        <LoadingRows />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Skill Demand" />
        <ErrorState
          message={(demandQ.error ?? jobsQ.error ?? poolQ.error)?.message}
          onRetry={() => {
            void demandQ.refetch();
            void jobsQ.refetch();
            void poolQ.refetch();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeading title="Skill Demand" description="Market intelligence to plan your hiring and outreach strategy." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" /> Top in-demand skills</CardTitle></CardHeader>
          <CardContent className="h-80">
            {topSkills.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSkills} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} fill="var(--chart-1)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No demand data" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Demand by industry</CardTitle></CardHeader>
          <CardContent className="h-80">
            {byIndustry.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byIndustry}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="openings" radius={[4, 4, 0, 0]}>
                    {byIndustry.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No industry data" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Demand by location</CardTitle></CardHeader>
          <CardContent className="h-80">
            {byLocation.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byLocation}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="openings" radius={[4, 4, 0, 0]} fill="var(--chart-3)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="No location data" />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Supply vs. demand — your required skills</CardTitle></CardHeader>
          <CardContent className="h-80">
            {supplyVsDemand.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={supplyVsDemand}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="demand" name="Your postings requiring" radius={[4, 4, 0, 0]} fill="var(--chart-4)" />
                  <Bar dataKey="supply" name="Students with skill" radius={[4, 4, 0, 0]} fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState title="Post opportunities" description="Add required skills to your postings to compare supply and demand." />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
