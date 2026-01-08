import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Save, Check, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllGamePrices, updateGamePackage, togglePackageActive } from "@/lib/gamePricingApi";
import type { GamePrice } from "@/hooks/useGamePrices";

interface RowState {
  quantity: string;
  price: string;
  saving: boolean;
  saved: boolean;
  error: boolean;
  originalQuantity: number;
  originalPrice: number;
}

export const GarenaPricing = () => {
  const [prices, setPrices] = useState<GamePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [savingAll, setSavingAll] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await fetchAllGamePrices('garena');
      setPrices(data);
      const states: Record<string, RowState> = {};
      data.forEach(p => {
        states[p.id] = {
          quantity: p.quantity.toString(),
          price: p.price.toString(),
          saving: false,
          saved: false,
          error: false,
          originalQuantity: p.quantity,
          originalPrice: p.price
        };
      });
      setRowStates(states);
    } catch (error) {
      toast.error('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-garena-prices')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'game_product_prices',
        filter: 'game=eq.garena'
      }, (payload) => {
        const updated = payload.new as GamePrice;
        setPrices(prev => prev.map(p => p.id === updated.id ? updated : p));
        setRowStates(prev => ({
          ...prev,
          [updated.id]: {
            ...prev[updated.id],
            quantity: updated.quantity.toString(),
            price: updated.price.toString(),
            originalQuantity: updated.quantity,
            originalPrice: updated.price,
            saved: true
          }
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleQuantityChange = (id: string, value: string) => {
    setRowStates(prev => ({ ...prev, [id]: { ...prev[id], quantity: value, saved: false, error: false } }));
  };

  const handlePriceChange = (id: string, value: string) => {
    setRowStates(prev => ({ ...prev, [id]: { ...prev[id], price: value, saved: false, error: false } }));
  };

  const handleSaveRow = async (id: string) => {
    const state = rowStates[id];
    const quantity = parseInt(state.quantity);
    const price = parseFloat(state.price);
    if (isNaN(quantity) || quantity <= 0) { toast.error('Invalid quantity'); return; }
    if (isNaN(price) || price <= 0) { toast.error('Invalid price'); return; }

    setRowStates(prev => ({ ...prev, [id]: { ...prev[id], saving: true, error: false } }));
    try {
      await updateGamePackage(id, { quantity, price });
      setRowStates(prev => ({ ...prev, [id]: { ...prev[id], saving: false, saved: true, originalQuantity: quantity, originalPrice: price } }));
      toast.success('Price updated');
    } catch (error) {
      setRowStates(prev => ({ ...prev, [id]: { ...prev[id], saving: false, error: true } }));
      toast.error('Failed to update price');
    }
  };

  const handleSaveAll = async () => {
    const changedRows = prices.filter(p => {
      const state = rowStates[p.id];
      return state && (parseInt(state.quantity) !== state.originalQuantity || parseFloat(state.price) !== state.originalPrice);
    });
    if (changedRows.length === 0) { toast.info('No changes to save'); return; }
    setSavingAll(true);
    for (const p of changedRows) { await handleSaveRow(p.id); }
    setSavingAll(false);
    toast.success(`Saved ${changedRows.length} changes`);
  };

  const hasChanges = (id: string) => {
    const state = rowStates[id];
    if (!state) return false;
    return parseInt(state.quantity) !== state.originalQuantity || parseFloat(state.price) !== state.originalPrice;
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await togglePackageActive(id, isActive);
      toast.success(isActive ? 'Package activated' : 'Package deactivated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const renderStatus = (id: string) => {
    const state = rowStates[id];
    if (!state) return null;
    if (state.saving) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    if (state.saved && !hasChanges(id)) return <Check className="h-4 w-4 text-green-500" />;
    if (state.error) return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (hasChanges(id)) return <div className="h-2 w-2 rounded-full bg-yellow-500" />;
    return null;
  };

  if (loading) {
    return <Card><CardHeader><Skeleton className="h-6 w-48" /></CardHeader><CardContent className="space-y-4"><Skeleton className="h-12 w-full" /></CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={fetchPrices}><RefreshCw className="h-4 w-4 mr-2" /> Refresh</Button>
        <Button size="sm" onClick={handleSaveAll} disabled={savingAll}>
          {savingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save All Changes
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><span className="text-lg">🎮</span> Garena Shell Packages</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-2">
              <div className="col-span-4">Package</div>
              <div className="col-span-2">Shells</div>
              <div className="col-span-2">Price (₹)</div>
              <div className="col-span-1">Active</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Action</div>
            </div>
            {prices.map(pkg => (
              <div key={pkg.id} className="grid grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="col-span-4 font-medium text-sm">{pkg.package_name}</div>
                <div className="col-span-2"><Input type="number" value={rowStates[pkg.id]?.quantity || ''} onChange={(e) => handleQuantityChange(pkg.id, e.target.value)} className="h-8 text-sm" /></div>
                <div className="col-span-2"><Input type="number" value={rowStates[pkg.id]?.price || ''} onChange={(e) => handlePriceChange(pkg.id, e.target.value)} className="h-8 text-sm" /></div>
                <div className="col-span-1"><Switch checked={pkg.is_active ?? true} onCheckedChange={(checked) => handleToggleActive(pkg.id, checked)} /></div>
                <div className="col-span-1 flex justify-center">{renderStatus(pkg.id)}</div>
                <div className="col-span-2"><Button size="sm" variant={hasChanges(pkg.id) ? "default" : "outline"} onClick={() => handleSaveRow(pkg.id)} disabled={rowStates[pkg.id]?.saving || !hasChanges(pkg.id)} className="h-8 w-full text-xs">{rowStates[pkg.id]?.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}</Button></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
