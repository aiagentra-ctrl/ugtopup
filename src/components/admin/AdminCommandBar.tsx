import { useEffect, useMemo, useState } from "react";
import { Sparkles, Search, ArrowRight } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AdminCommandItem {
  id: string;
  title: string;
  keywords?: string[];
  group?: string;
}

interface AdminCommandBarProps {
  items: AdminCommandItem[];
  onSelect: (id: string) => void;
}

/**
 * Floating AI-style command bar.
 * - Bottom fixed pill on mobile (touch-friendly).
 * - Cmd/Ctrl+K to open on desktop.
 * - Smart fuzzy matching across title + keywords + group.
 */
export function AdminCommandBar({ items, onSelect }: AdminCommandBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, AdminCommandItem[]>();
    for (const it of items) {
      const g = it.group || "Navigation";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(it);
    }
    return Array.from(map.entries());
  }, [items]);

  const handleSelect = (id: string) => {
    setOpen(false);
    setQuery("");
    onSelect(id);
  };

  // Smart suggestions based on intent words
  const suggestions = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const intents: { match: RegExp; ids: string[]; label: string }[] = [
      { match: /profit|margin|calc/, ids: ["profit-calculator"], label: "Open Profit Calculator" },
      { match: /order|sale/, ids: ["orders"], label: "Go to Orders" },
      { match: /payment|credit|topup|top-up/, ids: ["payments", "online-payments"], label: "Payments & Credits" },
      { match: /user|customer/, ids: ["users", "user-analytics"], label: "Users & Analytics" },
      { match: /tournament/, ids: ["tournaments-hub", "tournament-banners"], label: "Tournaments" },
      { match: /chat|bot|whatsapp|ai/, ids: ["chatbot", "whatsapp", "knowledge-base"], label: "AI & Chatbot" },
      { match: /health|status|maintenance/, ids: ["system-health", "service-status", "maintenance-log"], label: "System Status" },
    ];
    const matched = intents.find((i) => i.match.test(q));
    if (!matched) return [];
    return matched.ids
      .map((id) => items.find((i) => i.id === id))
      .filter(Boolean) as AdminCommandItem[];
  }, [query, items]);

  return (
    <>
      {/* Floating trigger - mobile bottom, desktop top-right hint */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-40",
          "flex items-center gap-2 px-4 h-11 rounded-full",
          "bg-primary text-primary-foreground shadow-xl shadow-primary/30",
          "active:scale-95 transition-transform"
        )}
        aria-label="Open AI search"
      >
        <Sparkles className="h-4 w-4" />
        <span className="text-sm font-medium">Ask or jump to…</span>
      </button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex gap-2 text-muted-foreground"
      >
        <Search className="h-4 w-4" />
        <span>Search admin…</span>
        <kbd className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-muted border border-border">⌘K</kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Ask AI or type a section… (e.g. 'profit', 'pending orders')"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No matches. Try keywords like "profit", "users", or "tournaments".</CommandEmpty>

          {suggestions.length > 0 && (
            <CommandGroup heading="✨ Smart Suggestions">
              {suggestions.map((s) => (
                <CommandItem key={`sug-${s.id}`} value={`smart ${s.title}`} onSelect={() => handleSelect(s.id)}>
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  <span>{s.title}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-50" />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {grouped.map(([group, list]) => (
            <CommandGroup key={group} heading={group}>
              {list.map((it) => (
                <CommandItem
                  key={it.id}
                  value={`${it.title} ${(it.keywords || []).join(" ")} ${group}`}
                  onSelect={() => handleSelect(it.id)}
                >
                  <span>{it.title}</span>
                  <ArrowRight className="ml-auto h-4 w-4 opacity-30" />
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
