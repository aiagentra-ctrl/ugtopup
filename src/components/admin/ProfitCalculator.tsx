import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Calculator, TrendingUp, TrendingDown, RotateCcw, Percent, DollarSign } from "lucide-react";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0);

export function ProfitCalculator() {
  const [cost, setCost] = useState<number>(100);
  const [sell, setSell] = useState<number>(150);
  const [qty, setQty] = useState<number>(1);
  const [feePct, setFeePct] = useState<number>(2); // payment gateway %
  const [discountPct, setDiscountPct] = useState<number>(0);

  const result = useMemo(() => {
    const grossPerUnit = sell * (1 - discountPct / 100);
    const feePerUnit = grossPerUnit * (feePct / 100);
    const netPerUnit = grossPerUnit - feePerUnit;
    const profitPerUnit = netPerUnit - cost;
    const totalRevenue = grossPerUnit * qty;
    const totalCost = cost * qty;
    const totalFee = feePerUnit * qty;
    const totalProfit = profitPerUnit * qty;
    const margin = grossPerUnit > 0 ? (profitPerUnit / grossPerUnit) * 100 : 0;
    const roi = cost > 0 ? (profitPerUnit / cost) * 100 : 0;
    return {
      profitPerUnit,
      totalRevenue,
      totalCost,
      totalFee,
      totalProfit,
      margin,
      roi,
      breakeven: cost > 0 && netPerUnit > 0 ? Math.ceil(cost / netPerUnit) : 0,
    };
  }, [cost, sell, qty, feePct, discountPct]);

  const isProfit = result.totalProfit >= 0;

  const reset = () => {
    setCost(100);
    setSell(150);
    setQty(1);
    setFeePct(2);
    setDiscountPct(0);
  };

  return (
    <div className="space-y-4 lg:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
            <Calculator className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg lg:text-2xl font-bold truncate">Profit Calculator</h2>
            <p className="text-xs lg:text-sm text-muted-foreground">Instantly compute margin, ROI & break-even</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={reset} className="shrink-0">
          <RotateCcw className="h-4 w-4 lg:mr-2" />
          <span className="hidden lg:inline">Reset</span>
        </Button>
      </div>

      {/* Hero result card */}
      <Card
        className={`border-2 ${
          isProfit ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/40 bg-rose-500/5"
        }`}
      >
        <CardContent className="p-5 lg:p-7">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Profit</p>
              <p
                className={`text-3xl lg:text-5xl font-extrabold tabular-nums ${
                  isProfit ? "text-emerald-500" : "text-rose-500"
                }`}
              >
                {isProfit ? "+" : ""}
                {fmt(result.totalProfit)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">for {qty} unit{qty > 1 ? "s" : ""}</p>
            </div>
            <div
              className={`h-14 w-14 lg:h-16 lg:w-16 rounded-2xl flex items-center justify-center ${
                isProfit ? "bg-emerald-500/15" : "bg-rose-500/15"
              }`}
            >
              {isProfit ? (
                <TrendingUp className="h-7 w-7 lg:h-8 lg:w-8 text-emerald-500" />
              ) : (
                <TrendingDown className="h-7 w-7 lg:h-8 lg:w-8 text-rose-500" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-5">
            <Stat label="Margin" value={`${fmt(result.margin)}%`} />
            <Stat label="ROI" value={`${fmt(result.roi)}%`} />
            <Stat label="Break-even" value={`${result.breakeven || "—"}`} suffix="units" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Inputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Inputs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <NumberField label="Cost price (per unit)" value={cost} onChange={setCost} prefix="₹" />
            <NumberField label="Selling price (per unit)" value={sell} onChange={setSell} prefix="₹" />
            <NumberField label="Quantity" value={qty} onChange={(v) => setQty(Math.max(1, Math.floor(v)))} step={1} min={1} />

            <SliderField
              label="Discount"
              value={discountPct}
              onChange={setDiscountPct}
              max={90}
              suffix="%"
              icon={<Percent className="h-3.5 w-3.5" />}
            />
            <SliderField
              label="Payment gateway fee"
              value={feePct}
              onChange={setFeePct}
              max={15}
              step={0.1}
              suffix="%"
              icon={<Percent className="h-3.5 w-3.5" />}
            />
          </CardContent>
        </Card>

        {/* Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Row label="Revenue (after discount)" value={`₹${fmt(result.totalRevenue)}`} />
            <Row label="Gateway fees" value={`− ₹${fmt(result.totalFee)}`} muted />
            <Row label="Total cost" value={`− ₹${fmt(result.totalCost)}`} muted />
            <div className="h-px bg-border my-2" />
            <Row
              label="Net profit"
              value={`${isProfit ? "+" : ""}₹${fmt(result.totalProfit)}`}
              highlight={isProfit ? "good" : "bad"}
            />
            <Row label="Profit per unit" value={`₹${fmt(result.profitPerUnit)}`} />
            <div className="pt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">Margin {fmt(result.margin)}%</Badge>
              <Badge variant="secondary">ROI {fmt(result.roi)}%</Badge>
              {result.breakeven > 0 && <Badge variant="outline">BE {result.breakeven} units</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border/60 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base lg:text-lg font-bold tabular-nums">{value}</p>
      {suffix && <p className="text-[10px] text-muted-foreground">{suffix}</p>}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  prefix,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  step?: number;
  min?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{prefix}</span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className={`h-11 text-base tabular-nums ${prefix ? "pl-7" : ""}`}
        />
      </div>
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  max,
  step = 1,
  suffix,
  icon,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max: number;
  step?: number;
  suffix?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1">
          {icon}
          {label}
        </Label>
        <span className="text-sm font-semibold tabular-nums">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="touch-none"
      />
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: "good" | "bad";
}) {
  const color =
    highlight === "good" ? "text-emerald-500" : highlight === "bad" ? "text-rose-500" : "text-foreground";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
