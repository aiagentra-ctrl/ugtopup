import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "How do tournaments work?", a: "Pick a room, pay the entry fee in IG Coins, play the match using the room ID & password, and the winner is paid out automatically by the room creator after the match." },
  { q: "How do I get IG Coins?", a: "Top up via eSewa, Khalti, Bank transfer, or API Nepal in your wallet. Coins are credited instantly after confirmation." },
  { q: "Can I withdraw my deposited credits?", a: "No. Only winnings earned from tournaments can be withdrawn to NPR. Deposited credits are reserved for entry fees and store purchases." },
  { q: "How are winners decided?", a: "The room creator marks the winner after the match. If you suspect foul play, you can file a dispute under Reports — admins review every report." },
  { q: "What is the platform fee?", a: "10% of the entry fee × player count is retained as a platform fee. The remaining 90% becomes the prize pool the winner takes." },
  { q: "When can I withdraw my winnings?", a: "Anytime your withdrawable balance is greater than zero. Withdrawals are processed within 24 hours via your chosen payment method." },
];

export const FAQSection = () => (
  <div className="rounded-xl border border-border/60 bg-card p-2 sm:p-4">
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((f, i) => (
        <AccordionItem key={i} value={`item-${i}`} className="border-border/40">
          <AccordionTrigger className="text-left text-[13px] font-semibold hover:text-primary sm:text-sm">
            {f.q}
          </AccordionTrigger>
          <AccordionContent className="text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">
            {f.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);
