import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { SkillBadge } from "@/components/shared/skill-badge";
import type { MatchResult } from "@/lib/matching";

export function MatchExplainer({
  result,
  title,
  subject,
}: {
  result: MatchResult;
  title: string;
  subject?: string | undefined;
}) {
  const topMissing = result.missing.filter((m) => m.required).slice(0, 3);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-primary">
          <HelpCircle className="size-4" /> Why {result.score}%?
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Match breakdown — {title}</DialogTitle>
          <DialogDescription>
            {subject ? `${subject} · ` : ""}Every point is traceable. No black box.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg gradient-accent p-4 text-primary-foreground">
            <p className="font-display text-3xl font-bold">{result.score}%</p>
            <p className="text-sm opacity-90">
              {result.matched.length}/{result.requiredCount} required skills ·{" "}
              {result.verifiedRequiredCount} verified
            </p>
          </div>

          <ul className="space-y-3">
            {result.components.map((c) => (
              <li key={c.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{c.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {c.earned}/{c.max}
                  </span>
                </div>
                <Progress value={(c.earned / c.max) * 100} className="h-1.5" />
                <p className="text-xs text-muted-foreground">{c.detail}</p>
              </li>
            ))}
          </ul>

          <div>
            <p className="mb-2 text-sm font-medium">Matched skills</p>
            <div className="flex flex-wrap gap-1.5">
              {result.matched.length ? (
                result.matched.map((m) => (
                  <SkillBadge key={m.skill} name={m.skill} verified={m.verified} score={m.score} />
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No required skills matched yet.</p>
              )}
            </div>
          </div>

          {topMissing.length ? (
            <div>
              <p className="mb-2 text-sm font-medium">Missing required skills</p>
              <div className="flex flex-wrap gap-1.5">
                {topMissing.map((m) => (
                  <SkillBadge key={m.skill} name={m.skill} />
                ))}
              </div>
              <p className="mt-2 rounded-md bg-muted p-3 text-xs text-muted-foreground">
                Improve {topMissing.map((m) => m.skill).join(", ")} proficiency to increase this
                estimated match.
              </p>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
