import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "college" | "industry" | "admin";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  role: AppRole | null;
  studentId: string | null;
  collegeId: string | null;
  companyId: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const roleHome: Record<AppRole, string> = {
  student: "/student",
  industry: "/recruiter",
  college: "/college",
  admin: "/admin",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [collegeId, setCollegeId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const loadContext = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setRole(null);
      setStudentId(null);
      setCollegeId(null);
      setCompanyId(null);
      return;
    }
    const [profileRes, roleRes, studentRes, collegeRes, companyRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid).limit(1).maybeSingle(),
      supabase.from("students").select("id").eq("user_id", uid).maybeSingle(),
      supabase.from("colleges").select("id").eq("owner_id", uid).limit(1).maybeSingle(),
      supabase.from("companies").select("id").eq("owner_id", uid).limit(1).maybeSingle(),
    ]);
    setProfile((profileRes.data as Profile | null) ?? null);
    setRole(((roleRes.data?.role as AppRole | undefined) ?? null) as AppRole | null);
    setStudentId(studentRes.data?.id ?? null);
    setCollegeId(collegeRes.data?.id ?? null);
    setCompanyId(companyRes.data?.id ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadContext(data.session?.user.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void loadContext(newSession?.user.id).then(() => {
          router.invalidate();
          if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
        });
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadContext, router, queryClient]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadContext(data.session?.user.id);
  }, [loadContext]);

  const signOut = useCallback(async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    void router.navigate({ to: "/auth", search: {}, replace: true });
  }, [queryClient, router]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      role,
      studentId,
      collegeId,
      companyId,
      loading,
      refresh,
      signOut,
    }),
    [session, profile, role, studentId, collegeId, companyId, loading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
