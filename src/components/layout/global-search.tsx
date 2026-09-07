import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

interface Hit {
  id: string;
  label: string;
  sub: string;
  to: string;
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [groups, setGroups] = useState<Record<string, Hit[]>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(t);
  }, [term]);

  useEffect(() => {
    if (debounced.length < 2) {
      setGroups({});
      return;
    }
    let active = true;
    setLoading(true);
    const like = `%${debounced}%`;
    void Promise.all([
      supabase.from("students").select("id, full_name, department").ilike("full_name", like).limit(5),
      supabase.from("job_postings").select("id, title, location").ilike("title", like).limit(5),
      supabase.from("skills").select("id, name, category").ilike("name", like).limit(5),
      supabase.from("companies").select("id, name, sector").ilike("name", like).limit(5),
      supabase.from("training_programs").select("id, title, eligibility").ilike("title", like).limit(5),
    ]).then(([students, jobs, skills, companies, programs]) => {
      if (!active) return;
      setGroups({
        Students: (students.data ?? []).map((s) => ({
          id: s.id,
          label: s.full_name,
          sub: s.department,
          to: `/recruiter/talent?student=${s.id}`,
        })),
        Opportunities: (jobs.data ?? []).map((j) => ({
          id: j.id,
          label: j.title,
          sub: j.location,
          to: `/student/internships?job=${j.id}`,
        })),
        Skills: (skills.data ?? []).map((s) => ({
          id: s.id,
          label: s.name,
          sub: s.category,
          to: `/student/skill-gap`,
        })),
        Companies: (companies.data ?? []).map((c) => ({
          id: c.id,
          label: c.name,
          sub: c.sector,
          to: `/student/internships?company=${c.id}`,
        })),
        "Training Programs": (programs.data ?? []).map((p) => ({
          id: p.id,
          label: p.title,
          sub: p.eligibility,
          to: `/college/training`,
        })),
      });
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [debounced]);

  const hasResults = Object.values(groups).some((g) => g.length > 0);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search students, opportunities, skills, companies…"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList>
        {!hasResults ? (
          <CommandEmpty>
            {loading
              ? "Searching…"
              : debounced.length < 2
                ? "Type at least 2 characters to search."
                : "No results found."}
          </CommandEmpty>
        ) : null}
        {Object.entries(groups).map(([group, hits]) =>
          hits.length ? (
            <CommandGroup key={group} heading={group}>
              {hits.map((h) => (
                <CommandItem
                  key={`${group}-${h.id}`}
                  value={`${group}-${h.label}-${h.id}`}
                  onSelect={() => {
                    onOpenChange(false);
                    void navigate({ to: h.to });
                  }}
                >
                  <Search className="size-4 text-muted-foreground" />
                  <span>{h.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{h.sub}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null,
        )}
      </CommandList>
    </CommandDialog>
  );
}
