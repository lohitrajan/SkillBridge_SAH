import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { SkillRow } from "@/lib/data";

export function SkillPicker({
  skills,
  selected,
  onChange,
  label,
  placeholder = "Search skills…",
}: {
  skills: SkillRow[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const byId = new Map(skills.map((s) => [s.id, s]));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  return (
    <div className="space-y-2">
      {label ? <p className="text-sm font-medium">{label}</p> : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Type a skill name…" />
            <CommandList>
              <CommandEmpty>No skills found.</CommandEmpty>
              <CommandGroup>
                {skills.map((skill) => (
                  <CommandItem
                    key={skill.id}
                    value={skill.name}
                    onSelect={() => toggle(skill.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 size-4",
                        selected.includes(skill.id) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {skill.name}
                    <span className="ml-auto text-xs text-muted-foreground">{skill.category}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const skill = byId.get(id);
            if (!skill) return null;
            return (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {skill.name}
                <button
                  type="button"
                  aria-label={`Remove ${skill.name}`}
                  onClick={() => toggle(id)}
                  className="rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
