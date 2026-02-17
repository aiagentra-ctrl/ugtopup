import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, Save, CheckCircle2, Loader2, AlertCircle, Gem, Zap, Hand } from "lucide-react";
import { fetchAllGamePrices, updateGamePackage, togglePackageActive } from "@/lib/gamePricingApi";
import type { GamePrice } from "@/hooks/useGamePrices";
import { supabase } from "@/integrations/supabase/client";

interface RowState {
  quantity: string;
  price: string;
  status: 'idle' | 'saving' | 'saved' | 'error';
  originalQuantity: number;
  originalPrice: number;
}

export const MobileLegendsPricing = () => {
  const [prices, setPrices] = useState<GamePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [savingAll, setSavingAll] = useState(false);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await fetchAllGamePrices('mobile_legends');
      setPrices(data);
      const states: Record<string, RowState> = {};
      data.forEach((p) => {
        states[p.id] = {
          quantity: String(p.quantity),
          price: String(p.price),
          status: 'idle',
          originalQuantity: p.quantity,
          originalPrice: p.price,
        };
      });
      setRowStates(states);
    } catch (error) {
      toast.error('Failed to load prices');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-mobilelegends-prices')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'game_product_prices',
        filter: 'game=eq.mobile_legends',
      }, (payload) => {
        const updated = payload.new as GamePrice;
        setPrices((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        setRowStates((prev) => ({
          ...prev,
          [updated.id]: {
            quantity: String(updated.quantity), price: String(updated.price),
            status: 'saved', originalQuantity: updated.quantity, originalPrice: updated.price,
          },
        }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleQuantityChange = (id: string, value: string) => {
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], quantity: value, status: 'idle' } }));
  };

  const handlePriceChange = (id: string, value: string) => {
    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], price: value, status: 'idle' } }));
  };

  const handleSaveRow = async (id: string, pkg: GamePrice) => {
    const state = rowStates[id];
    const newQuantity = parseInt(state.quantity, 10);
    const newPrice = parseFloat(state.price);
    if (isNaN(newQuantity) || newQuantity < 1) { toast.error('Invalid quantity'); return; }
    if (isNaN(newPrice) || newPrice < 0) { toast.error('Invalid price'); return; }

    setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], status: 'saving' } }));
    try {
      const updates: { quantity?: number; price?: number; package_name?: string } = {};
      if (newQuantity !== state.originalQuantity) {
        updates.quantity = newQuantity;
        if (pkg.package_type === 'topup') updates.package_name = `${newQuantity} Diamonds`;
      }
      if (newPrice !== state.originalPrice) updates.price = newPrice;
      await updateGamePackage(id, updates);
      setRowStates((prev) => ({
        ...prev, [id]: { ...prev[id], status: 'saved', originalQuantity: newQuantity, originalPrice: newPrice },
      }));
      toast.success('Package updated');
    } catch (error) {
      setRowStates((prev) => ({ ...prev, [id]: { ...prev[id], status: 'error' } }));
      toast.error('Failed to update package');
    }
  };

  const hasChanges = (id: string) => {
    const state = rowStates[id];
    if (!state) return false;
    return parseInt(state.quantity, 10) !== state.originalQuantity || parseFloat(state.price) !== state.originalPrice;
  };

  const handleSaveAll = async () => {
    const changedRows = prices.filter((pkg) => hasChanges(pkg.id));
    if (changedRows.length === 0) { toast.info('No changes to save'); return; }
    setSavingAll(true);
    let successCount = 0;
    for (const pkg of changedRows) {
      const state = rowStates[pkg.id];
      const newQuantity = parseInt(state.quantity, 10);
      const newPrice = parseFloat(state.price);
      if (!isNaN(newQuantity) && newQuantity >= 1 && !isNaN(newPrice) && newPrice >= 0) {
        try {
          const updates: { quantity?: number; price?: number; package_name?: string } = {};
          if (newQuantity !== state.originalQuantity) {
            updates.quantity = newQuantity;
            if (pkg.package_type === 'topup') updates.package_name = `${newQuantity} Diamonds`;
          }
          if (newPrice !== state.originalPrice) updates.price = newPrice;
          await updateGamePackage(pkg.id, updates);
          successCount++;
        } catch (error) { console.error(`Failed to update ${pkg.id}:`, error); }
      }
    }
    setSavingAll(false);
    toast.success(`Updated ${successCount} package(s)`);
    fetchPrices();
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await togglePackageActive(id, isActive);
      setPrices((prev) => prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p)));
      toast.success(isActive ? 'Package enabled' : 'Package disabled');
    } catch (error) { toast.error('Failed to update status'); }
  };

  // Split packages by API vs Non-API
  const apiTopUpPackages = prices.filter((p) => p.package_type === 'topup' && (p as any).is_api_product === true);
  const nonApiTopUpPackages = prices.filter((p) => p.package_type === 'topup' && (p as any).is_api_product !== true);
  const apiSpecialPackages = prices.filter((p) => p.package_type === 'special' && (p as any).is_api_product === true);
  const nonApiSpecialPackages = prices.filter((p) => p.package_type === 'special' && (p as any).is_api_product !== true);

  const renderStatus = (id: string) => {
    const state = rowStates[id];
    if (!state) return null;
    switch (state.status) {
      case 'saving': return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'saved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return hasChanges(id) ? <Badge variant="outline" className="text-xs">Modified</Badge> : null;
    }
  };

  const renderPackageTable = (packages: GamePrice[], showQuantityEdit: boolean = true) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-2 font-medium text-muted-foreground">Package</th>
            {showQuantityEdit && <th className="text-center py-3 px-2 font-medium text-muted-foreground">💎 Value</th>}
            <th className="text-center py-3 px-2 font-medium text-muted-foreground">💰 Price (₹)</th>
            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Active</th>
            <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
            <th className="text-right py-3 px-2 font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{pkg.package_type === 'topup' ? '💎' : '⭐'}</span>
                  <span className="font-medium">{pkg.package_name}</span>
                </div>
              </td>
              {showQuantityEdit && (
                <td className="py-3 px-2">
                  <div className="flex justify-center">
                    <Input type="number" value={rowStates[pkg.id]?.quantity || ''} onChange={(e) => handleQuantityChange(pkg.id, e.target.value)} className="w-24 text-center font-mono" min="1" />
                  </div>
                </td>
              )}
              <td className="py-3 px-2">
                <div className="flex justify-center">
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                    <Input type="number" value={rowStates[pkg.id]?.price || ''} onChange={(e) => handlePriceChange(pkg.id, e.target.value)} className="pl-7 text-center" min="0" />
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-center">
                <Switch checked={pkg.is_active} onCheckedChange={(checked) => handleToggleActive(pkg.id, checked)} />
              </td>
              <td className="py-3 px-2"><div className="flex justify-center">{renderStatus(pkg.id)}</div></td>
              <td className="py-3 px-2 text-right">
                <Button size="sm" variant={hasChanges(pkg.id) ? "default" : "outline"} onClick={() => handleSaveRow(pkg.id, pkg)} disabled={!hasChanges(pkg.id) || rowStates[pkg.id]?.status === 'saving'}>
                  {rowStates[pkg.id]?.status === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </Button>
              </td>
            </tr>
          ))}
          {packages.length === 0 && (
            <tr><td colSpan={showQuantityEdit ? 6 : 5} className="py-6 text-center text-muted-foreground">No packages in this section</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap gap-3 justify-between items-center">
        <div className="flex items-center gap-2">
          <Gem className="h-5 w-5 text-primary" />
          <span className="font-medium">Mobile Legends Diamond Pricing</span>
          <Badge variant="secondary">{prices.length} packages</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPrices}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* API Packages Section */}
      <Card className="border-green-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-green-500" />
            API Packages (Auto-fulfilled via Liana)
          </CardTitle>
          <CardDescription>
            These packages are automatically processed through the Liana API. Orders are fulfilled instantly.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiTopUpPackages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">💎 Diamond Packages</h4>
              {renderPackageTable(apiTopUpPackages)}
            </div>
          )}
          {apiSpecialPackages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">⭐ Special Passes</h4>
              {renderPackageTable(apiSpecialPackages, false)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Non-API Packages Section */}
      <Card className="border-orange-500/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Hand className="h-5 w-5 text-orange-500" />
            Non-API Packages (Manual Processing)
          </CardTitle>
          <CardDescription>
            These packages are NOT connected to the Liana API. Orders go through the normal order management system for manual fulfillment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {nonApiTopUpPackages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">💎 Diamond Packages</h4>
              {renderPackageTable(nonApiTopUpPackages)}
            </div>
          )}
          {nonApiSpecialPackages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">⭐ Special Deals</h4>
              {renderPackageTable(nonApiSpecialPackages, false)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};