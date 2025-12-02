import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { RefreshCw, Save, CheckCircle2, Loader2, AlertCircle, Diamond } from "lucide-react";
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

export const FreefirePricing = () => {
  const [prices, setPrices] = useState<GamePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [savingAll, setSavingAll] = useState(false);

  // Fetch prices
  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await fetchAllGamePrices('freefire');
      setPrices(data);
      
      // Initialize row states
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

  useEffect(() => {
    fetchPrices();
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-freefire-prices')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_product_prices',
          filter: 'game=eq.freefire',
        },
        (payload) => {
          const updated = payload.new as GamePrice;
          setPrices((prev) =>
            prev.map((p) => (p.id === updated.id ? updated : p))
          );
          setRowStates((prev) => ({
            ...prev,
            [updated.id]: {
              quantity: String(updated.quantity),
              price: String(updated.price),
              status: 'saved',
              originalQuantity: updated.quantity,
              originalPrice: updated.price,
            },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle quantity input change
  const handleQuantityChange = (id: string, value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], quantity: value, status: 'idle' },
    }));
  };

  // Handle price input change
  const handlePriceChange = (id: string, value: string) => {
    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], price: value, status: 'idle' },
    }));
  };

  // Save single row (quantity + price)
  const handleSaveRow = async (id: string, pkg: GamePrice) => {
    const state = rowStates[id];
    const newQuantity = parseInt(state.quantity, 10);
    const newPrice = parseFloat(state.price);
    
    if (isNaN(newQuantity) || newQuantity < 1) {
      toast.error('Please enter a valid quantity (min 1)');
      return;
    }
    
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setRowStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: 'saving' },
    }));

    try {
      // Build updates object
      const updates: { quantity?: number; price?: number; package_name?: string } = {};
      
      if (newQuantity !== state.originalQuantity) {
        updates.quantity = newQuantity;
        // Auto-update package name for diamond packages
        if (pkg.package_type === 'topup') {
          updates.package_name = `${newQuantity} Diamonds`;
        }
      }
      
      if (newPrice !== state.originalPrice) {
        updates.price = newPrice;
      }

      await updateGamePackage(id, updates);
      
      setRowStates((prev) => ({
        ...prev,
        [id]: {
          ...prev[id],
          status: 'saved',
          originalQuantity: newQuantity,
          originalPrice: newPrice,
        },
      }));
      toast.success('Package updated');
    } catch (error) {
      setRowStates((prev) => ({
        ...prev,
        [id]: { ...prev[id], status: 'error' },
      }));
      toast.error('Failed to update package');
    }
  };

  // Save all changed rows
  const handleSaveAll = async () => {
    const changedRows = prices.filter((pkg) => hasChanges(pkg.id));

    if (changedRows.length === 0) {
      toast.info('No changes to save');
      return;
    }

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
            if (pkg.package_type === 'topup') {
              updates.package_name = `${newQuantity} Diamonds`;
            }
          }
          
          if (newPrice !== state.originalPrice) {
            updates.price = newPrice;
          }
          
          await updateGamePackage(pkg.id, updates);
          successCount++;
        } catch (error) {
          console.error(`Failed to update ${pkg.id}:`, error);
        }
      }
    }

    setSavingAll(false);
    toast.success(`Updated ${successCount} package(s)`);
    fetchPrices();
  };

  // Toggle active status
  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await togglePackageActive(id, isActive);
      setPrices((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: isActive } : p))
      );
      toast.success(isActive ? 'Package enabled' : 'Package disabled');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Get packages by type
  const topUpPackages = prices.filter((p) => p.package_type === 'topup');
  const specialPackages = prices.filter((p) => p.package_type === 'special');

  // Check if row has changes
  const hasChanges = (id: string) => {
    const state = rowStates[id];
    if (!state) return false;
    const qtyChanged = parseInt(state.quantity, 10) !== state.originalQuantity;
    const priceChanged = parseFloat(state.price) !== state.originalPrice;
    return qtyChanged || priceChanged;
  };

  // Render status indicator
  const renderStatus = (id: string) => {
    const state = rowStates[id];
    if (!state) return null;

    switch (state.status) {
      case 'saving':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'saved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return hasChanges(id) ? (
          <Badge variant="outline" className="text-xs">Modified</Badge>
        ) : null;
    }
  };

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
          <Diamond className="h-5 w-5 text-primary" />
          <span className="font-medium">Free Fire Diamond Pricing</span>
          <Badge variant="secondary">{prices.length} packages</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPrices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSaveAll} disabled={savingAll}>
            {savingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save All Changes
          </Button>
        </div>
      </div>

      {/* Top-Up Packages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            💎 Top-Up Packages
          </CardTitle>
          <CardDescription>
            Diamond packages - edit quantity and price values
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Package</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">💎 Diamond Value</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">💰 Price (₹)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Active</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {topUpPackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💎</span>
                        <span className="font-medium">{pkg.package_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        <Input
                          type="number"
                          value={rowStates[pkg.id]?.quantity || ''}
                          onChange={(e) => handleQuantityChange(pkg.id, e.target.value)}
                          className="w-24 text-center font-mono"
                          min="1"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={rowStates[pkg.id]?.price || ''}
                            onChange={(e) => handlePriceChange(pkg.id, e.target.value)}
                            className="pl-7 text-center"
                            min="0"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={(checked) => handleToggleActive(pkg.id, checked)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        {renderStatus(pkg.id)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        size="sm"
                        variant={hasChanges(pkg.id) ? "default" : "outline"}
                        onClick={() => handleSaveRow(pkg.id, pkg)}
                        disabled={!hasChanges(pkg.id) || rowStates[pkg.id]?.status === 'saving'}
                      >
                        {rowStates[pkg.id]?.status === 'saving' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Special Deals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            ⭐ Special Deals
          </CardTitle>
          <CardDescription>
            Memberships - only price can be edited
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Package</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">💰 Price (₹)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Active</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {specialPackages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⭐</span>
                        <span className="font-medium">{pkg.package_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge variant="outline">Membership</Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                          <Input
                            type="number"
                            value={rowStates[pkg.id]?.price || ''}
                            onChange={(e) => handlePriceChange(pkg.id, e.target.value)}
                            className="pl-7 text-center"
                            min="0"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Switch
                        checked={pkg.is_active}
                        onCheckedChange={(checked) => handleToggleActive(pkg.id, checked)}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex justify-center">
                        {renderStatus(pkg.id)}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        size="sm"
                        variant={hasChanges(pkg.id) ? "default" : "outline"}
                        onClick={() => handleSaveRow(pkg.id, pkg)}
                        disabled={!hasChanges(pkg.id) || rowStates[pkg.id]?.status === 'saving'}
                      >
                        {rowStates[pkg.id]?.status === 'saving' ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Save'
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
