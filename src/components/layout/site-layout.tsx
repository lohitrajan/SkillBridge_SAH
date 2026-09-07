import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

/** Public marketing chrome shared by the landing page and the footer pages. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2" aria-label="SkillBridge home">
          <span className="grid size-9 place-items-center rounded-lg gradient-accent font-display text-sm font-bold text-primary-foreground">
            SB
          </span>
          <span className="font-display text-lg font-bold">SkillBridge</span>
        </Link>
        <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Site navigation">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/about">About</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link to="/contact">Contact</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/auth" search={{ mode: "login" }}>
              Sign in
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth" search={{ mode: "register" }}>
              Get started
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg gradient-accent font-display text-xs font-bold text-primary-foreground">
                SB
              </span>
              <span className="font-display font-bold">SkillBridge</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Bridging campus skills with industry needs — skill mapping, internships and placement
              in one portal.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm" aria-label="Footer">
            <Link to="/about" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground">
              Contact
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">
              Terms
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" }}
              className="text-muted-foreground hover:text-foreground"
            >
              Create account
            </Link>
            <Link
              to="/auth"
              search={{ mode: "login" }}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SkillBridge. Demonstration deployment.</p>
          <p>Smart India Hackathon 2026 · Problem Statement SIH26044 · Ministry of Ayush</p>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
