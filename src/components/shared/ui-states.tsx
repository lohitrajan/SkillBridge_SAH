import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string | undefined;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: {
  title: string;
  description?: string | undefined;
  icon?: LucideIcon | undefined;
  action?: ReactNode;
  className?: string | undefined;
}) {
  return (
    <Card className={cn("border-dashed shadow-none", className)}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <span className="rounded-full bg-muted p-3 text-muted-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <span className="rounded-full bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="size-6" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {message ?? "We could not load this data right now."}
          </p>
        </div>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function LoadingCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}
