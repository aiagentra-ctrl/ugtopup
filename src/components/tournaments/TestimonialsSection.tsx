import { Quote, Star } from "lucide-react";
import { initials, nameToColor } from "@/lib/tournamentsUtils";

const items = [
  { name: "Aakash R.",  game: "Free Fire", text: "Won 3 tournaments back-to-back. Withdrawal hit my eSewa in under 2 hours. This is the real deal." },
  { name: "Sujan K.",   game: "PUBG",      text: "Custom rooms are smooth, prize pools are fair. Finally a Nepali esports platform that actually works." },
  { name: "Pratima T.", game: "Mobile Legends", text: "The leaderboard is addictive. I climbed top 10 in a week. Love the dispute system — felt safe playing." },
];

export const TestimonialsSection = () => (
  <div className="grid gap-3 sm:grid-cols-3">
    {items.map((t, i) => (
      <div key={i} className="card-premium sheen relative p-5">
        <Quote className="absolute right-4 top-4 h-6 w-6 text-primary/20" />
        <div className="mb-2 flex items-center gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="h-3.5 w-3.5 fill-current" />)}
        </div>
        <p className="text-[13px] leading-relaxed text-foreground/90">"{t.text}"</p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: nameToColor(t.name) }}>
            {initials(t.name)}
          </div>
          <div>
            <div className="text-[12px] font-semibold text-foreground">{t.name}</div>
            <div className="text-[10px] text-muted-foreground">{t.game} player</div>
          </div>
        </div>
      </div>
    ))}
  </div>
);
