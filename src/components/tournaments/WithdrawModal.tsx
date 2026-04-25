import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2 } from "lucide-react";
import { formatCoins } from "@/lib/tournamentsUtils";

const MIN = 500;
const RATE = 1; // 1 coin = 1 NPR (mock)

export const WithdrawModal = ({
  open,
  onOpenChange,
  balance,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  balance: number;
}) => {
  const [amount, setAmount] = useState(balance.toString());
  const [method, setMethod] = useState("");
  const [destination, setDestination] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const amt = Number(amount) || 0;
  const valid = amt >= MIN && amt <= balance && method && destination.trim().length >= 3;

  const submit = () => {
    if (!valid) return;
    const ref = "WD-" + Math.random().toString(36).slice(2, 8).toUpperCase();
    setSuccess(ref);
  };

  const close = (v: boolean) => {
    if (!v) {
      setSuccess(null);
      setMethod("");
      setDestination("");
      setAmount(balance.toString());
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw winnings</DialogTitle>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <div className="text-[14px] font-medium">Withdrawal requested</div>
            <div className="text-[12px] text-muted-foreground">Reference: <span className="font-mono">{success}</span></div>
            <div className="text-[12px] text-muted-foreground">Estimated processing: 1–24 hours</div>
            <Button className="mt-2" onClick={() => close(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-[12px] text-muted-foreground">
              Available: <span className="text-emerald-400">{formatCoins(balance)} IG Coins</span>
            </div>

            <div>
              <Label>Amount (IG Coins)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN}
                max={balance}
              />
              <div className="mt-1 text-[11px] text-muted-foreground">Minimum: {MIN} IG Coins</div>
              {amt > 0 && amt < MIN && (
                <div className="mt-1 text-[11px] text-destructive">Below minimum</div>
              )}
              {amt > balance && (
                <div className="mt-1 text-[11px] text-destructive">Exceeds balance</div>
              )}
            </div>

            <div>
              <Label>Method</Label>
              <div className="mt-1 flex flex-wrap gap-2">
                {["eSewa", "Khalti", "Bank"].map((m) => (
                  <Button
                    key={m}
                    type="button"
                    size="sm"
                    variant={method === m ? "default" : "outline"}
                    onClick={() => setMethod(m)}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label>Destination account / number</Label>
              <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>

            <div className="rounded-md bg-muted/40 p-3 text-[12px] text-muted-foreground">
              You will receive: <span className="text-foreground">NPR {formatCoins(Math.max(0, amt) * RATE)}</span>
            </div>

            <Button onClick={submit} disabled={!valid} className="w-full">
              Confirm withdrawal
            </Button>
            <button
              type="button"
              onClick={() => close(false)}
              className="block w-full text-center text-[12px] text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
