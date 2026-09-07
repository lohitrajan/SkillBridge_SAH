import { BadgeCheck, CircleDashed } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SkillBadge({
  name,
  verified,
  score,
  source,
  className,
}: {
  name: string;
  verified?: boolean;
  score?: number | null;
  source?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        verified
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
      title={source ? `${source} verified` : undefined}
    >
      {verified ? (
        <BadgeCheck className="size-3.5" aria-hidden="true" />
      ) : (
        <CircleDashed className="size-3.5" aria-hidden="true" />
      )}
      {name}
      {typeof score === "number" ? <span className="tabular-nums opacity-80">{score}%</span> : null}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    Applied: "bg-muted text-muted-foreground",
    "Under Review": "bg-primary/10 text-primary",
    Shortlisted: "bg-accent/20 text-accent-foreground",
    Interview: "bg-warning/20 text-warning-foreground",
    Selected: "bg-success/15 text-success",
    Rejected: "bg-destructive/10 text-destructive",
  };
  return (
    <Badge variant="secondary" className={cn("font-medium", tone[status] ?? "")}>
      {status}
    </Badge>
  );
}

export function MatchPill({ score }: { score: number }) {
  const tone =
    score >= 85
      ? "bg-success/15 text-success"
      : score >= 70
        ? "bg-primary/10 text-primary"
        : score >= 50
          ? "bg-warning/20 text-warning-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums", tone)}>
      {score}% Match
    </span>
  );
}

export function DemandBadge({ level }: { level: string }) {
  const tone: Record<string, string> = {
    "Very High": "bg-destructive/10 text-destructive",
    High: "bg-warning/20 text-warning-foreground",
    Medium: "bg-primary/10 text-primary",
    Low: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", tone[level] ?? "bg-muted")}>
      {level}
    </span>
  );
}
