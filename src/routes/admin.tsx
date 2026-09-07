import { createFileRoute } from "@tanstack/react-router";

import { RoleLayout } from "@/components/layout/role-guard";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: () => <RoleLayout allow="admin" />,
});
