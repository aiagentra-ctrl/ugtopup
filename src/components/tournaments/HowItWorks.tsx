const steps = [
  { n: 1, title: "Register", desc: "Create your account and get a player ID." },
  { n: 2, title: "Add Coins", desc: "Top up via eSewa, Khalti, or bank transfer." },
  { n: 3, title: "Join Tournament", desc: "Browse open rooms and enter using IG Coins." },
  { n: 4, title: "Win Prizes", desc: "Compete, win, and earn IG Coins." },
];

export const HowItWorks = () => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {steps.map((s) => (
      <div key={s.n} className="rounded-lg bg-muted/40 p-4 text-center">
        <div className="mx-auto mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-medium text-primary-foreground">
          {s.n}
        </div>
        <div className="text-[12px] font-medium text-foreground">{s.title}</div>
        <div className="mt-1 text-[10px] leading-snug text-muted-foreground">{s.desc}</div>
      </div>
    ))}
  </div>
);
