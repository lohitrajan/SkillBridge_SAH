import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Search,
  LogOut,
  Menu,
  LayoutDashboard,
  IdCard,
  ClipboardCheck,
  TargetIcon,
  Route as RouteIcon,
  FolderGit2,
  Briefcase,
  Send,
  Gauge,
  Settings,
  Users,
  Building2,
  BarChart3,
  GraduationCap,
  BookOpen,
  Trophy,
  Sparkles,
  PlusCircle,
  UserSearch,
  Workflow,
  TrendingUp,
  ShieldCheck,
  Layers,
  FileText,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { GlobalSearch } from "@/components/layout/global-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, type AppRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

export const navByRole: Record<AppRole, NavItem[]> = {
  student: [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/passport", label: "My Skill Passport", icon: IdCard },
    { to: "/student/assessments", label: "Skill Assessments", icon: ClipboardCheck },
    { to: "/student/skill-gap", label: "Skill Gap", icon: TargetIcon },
    { to: "/student/roadmap", label: "Learning Roadmap", icon: RouteIcon },
    { to: "/student/projects", label: "Projects", icon: FolderGit2 },
    { to: "/student/internships", label: "Internships", icon: Briefcase },
    { to: "/student/applications", label: "Applications", icon: Send },
    { to: "/student/readiness", label: "Placement Readiness", icon: Gauge },
    { to: "/student/notifications", label: "Notifications", icon: Bell },
    { to: "/student/settings", label: "Profile & Settings", icon: Settings },
  ],
  industry: [
    { to: "/recruiter", label: "Dashboard", icon: LayoutDashboard },
    { to: "/recruiter/post", label: "Post Opportunity", icon: PlusCircle },
    { to: "/recruiter/talent", label: "Find Talent", icon: UserSearch },
    { to: "/recruiter/applications", label: "Applications", icon: Send },
    { to: "/recruiter/pipeline", label: "Interview Pipeline", icon: Workflow },
    { to: "/recruiter/demand", label: "Skill Demand", icon: TrendingUp },
    { to: "/recruiter/company", label: "Company Profile", icon: Building2 },
    { to: "/recruiter/notifications", label: "Notifications", icon: Bell },
    { to: "/recruiter/settings", label: "Settings", icon: Settings },
  ],
  college: [
    { to: "/college", label: "Dashboard", icon: LayoutDashboard },
    { to: "/college/students", label: "Students", icon: Users },
    { to: "/college/intelligence", label: "Skill Intelligence", icon: Sparkles },
    { to: "/college/demand", label: "Industry Demand", icon: TrendingUp },
    { to: "/college/gaps", label: "Skill Gaps", icon: TargetIcon },
    { to: "/college/training", label: "Training Programs", icon: BookOpen },
    { to: "/college/internships", label: "Internships", icon: Briefcase },
    { to: "/college/drives", label: "Placement Drives", icon: Trophy },
    { to: "/college/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/college/notifications", label: "Notifications", icon: Bell },
    { to: "/college/settings", label: "Settings", icon: Settings },
  ],
  admin: [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/students", label: "Students", icon: GraduationCap },
    { to: "/admin/colleges", label: "Colleges", icon: Building2 },
    { to: "/admin/industries", label: "Industries", icon: ShieldCheck },
    { to: "/admin/skills", label: "Skills", icon: Layers },
    { to: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
    { to: "/admin/assessments", label: "Assessments", icon: ClipboardCheck },
    { to: "/admin/reports", label: "Reports", icon: FileText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ],
};

const roleLabel: Record<AppRole, string> = {
  student: "Student workspace",
  industry: "Recruiter workspace",
  college: "Institution workspace",
  admin: "Platform administration",
};

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const location = useLocation();
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main navigation">
      {items.map((item) => {
        const active =
          location.pathname === item.to ||
          (item.to.split("/").length > 2 && location.pathname.startsWith(`${item.to}/`));
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, profile, signOut, user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = role ? navByRole[role] : [];

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count ?? 0;
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const brand = (
    <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
      <span className="grid size-8 place-items-center rounded-lg gradient-accent font-display text-sm font-bold text-primary-foreground">
        SB
      </span>
      <div className="min-w-0">
        <p className="font-display text-sm font-bold text-sidebar-foreground">SkillBridge</p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">
          {role ? roleLabel[role] : ""}
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar lg:flex">
        {brand}
        <NavList items={items} />
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-card/90 px-4 py-3 backdrop-blur">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              {brand}
              <NavList items={items} onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            className="h-9 flex-1 justify-start gap-2 text-muted-foreground sm:max-w-sm"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="size-4" />
            <span className="truncate">Search the platform…</span>
            <kbd className="ml-auto hidden rounded border px-1.5 text-[10px] sm:inline">⌘K</kbd>
          </Button>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild aria-label="Notifications">
              <Link to={role === "industry" ? "/recruiter/notifications" : role === "college" ? "/college/notifications" : role === "admin" ? "/admin" : "/student/notifications"}>
                <span className="relative">
                  <Bell className="size-5" />
                  {unread > 0 ? (
                    <Badge className="absolute -right-2 -top-2 h-4 min-w-4 justify-center px-1 text-[10px]">
                      {unread}
                    </Badge>
                  ) : null}
                </span>
              </Link>
            </Button>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{profile?.full_name || "Account"}</p>
              <p className="text-xs text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
