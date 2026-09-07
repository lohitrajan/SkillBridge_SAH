import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeading, EmptyState, ErrorState, LoadingRows } from "@/components/shared/ui-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { relativeTime } from "@/components/student/shared";
import { useAuth } from "@/hooks/useAuth";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/data";

export const Route = createFileRoute("/college/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | SkillBridge" },
      { name: "description", content: "Notifications on SkillBridge, the academia-industry skill collaboration portal." },
      { property: "og:title", content: "Notifications | SkillBridge" },
      { property: "og:description", content: "Notifications on SkillBridge." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CollegeNotificationsPage,
});

function CollegeNotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("all");
  const userId = user?.id;

  const notificationsQuery = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId as string),
    enabled: !!userId,
  });

  const readMutation = useMutation({
    mutationFn: (input: { id: string; isRead: boolean }) => markNotificationRead(input.id, input.isRead),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const readAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(userId as string),
    onSuccess: async () => {
      toast.success("All notifications marked as read");
      await queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (notificationsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeading title="Notifications" />
        <LoadingRows count={5} />
      </div>
    );
  }

  if (notificationsQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeading title="Notifications" />
        <ErrorState message={(notificationsQuery.error as Error).message} onRetry={() => void notificationsQuery.refetch()} />
      </div>
    );
  }

  const notifications = notificationsQuery.data ?? [];
  const unread = notifications.filter((n) => !n.is_read);
  const visible = tab === "unread" ? unread : notifications;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Notifications"
        description="Updates on students, drives, training programs and platform activity."
        actions={
          unread.length ? (
            <Button variant="outline" onClick={() => readAllMutation.mutate()} disabled={readAllMutation.isPending}>
              <CheckCheck className="size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unread.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {visible.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={tab === "unread" ? "You're all caught up" : "No notifications yet"}
          description="We'll let you know about student activity, drives and training updates here."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((n) => (
            <Card key={n.id} className={n.is_read ? "" : "border-primary/40 bg-primary/5"}>
              <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    <Badge variant="secondary" className="text-xs capitalize">{n.category.replace(/_/g, " ")}</Badge>
                    {!n.is_read ? <span className="size-2 rounded-full bg-primary" aria-label="Unread" /> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="text-xs text-muted-foreground">{relativeTime(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {n.link ? (
                    <Button asChild size="sm" variant="ghost">
                      <a href={n.link}>Open</a>
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={readMutation.isPending}
                    onClick={() => readMutation.mutate({ id: n.id, isRead: !n.is_read })}
                  >
                    {n.is_read ? "Mark unread" : "Mark read"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
