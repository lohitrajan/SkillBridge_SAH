import { Link } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/ui-states";
import { useAuth } from "@/hooks/useAuth";

/**
 * Wraps every college workspace page. A signed-in college admin has no
 * `colleges` row until they finish onboarding — collegeId is null in that
 * window. Renders a clear call-to-action instead of crashing / querying with
 * a null id.
 */
export function CollegeGate({ children }: { children: (collegeId: string) => ReactNode }) {
  const { collegeId, loading } = useAuth();

  if (loading) return null;

  if (!collegeId) {
    return (
      <EmptyState
        icon={Building2}
        title="Finish setting up your institution"
        description="Complete a short onboarding flow to link your account to your college before you can see students, gaps and drives."
        action={
          <Button asChild>
            <Link to="/college/onboarding">Start onboarding</Link>
          </Button>
        }
      />
    );
  }

  return <>{children(collegeId)}</>;
}
