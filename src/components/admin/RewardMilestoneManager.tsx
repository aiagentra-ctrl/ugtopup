import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Milestone {
  id: string;
  order_count: number;
  discount_percent: number;
  coupon_validity_days: number;
  is_active: boolean;
  description: string | null;
}

export function RewardMilestoneManager() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ order_count: 0, discount_percent: 5, coupon_validity_days: 30, description: "" });

  const fetchMilestones = async () => {
    setLoading(true);
    const { data } = await supabase.from("reward_milestones").select("*").order("order_count", { ascending: true });
    setMilestones((data as Milestone[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMilestones(); }, []);

  const handleAdd = async () => {
    if (newMilestone.order_count <= 0) { toast.error("Order count must be > 0"); return; }
    setSaving(true);
    const { error } = await supabase.from("reward_milestones").insert({
      order_count: newMilestone.order_count,
      discount_percent: newMilestone.discount_percent,
      coupon_validity_days: newMilestone.coupon_validity_days,
      description: newMilestone.description || `${newMilestone.discount_percent}% OFF after ${newMilestone.order_count} orders`,
    });
    if (error) toast.error(error.message);
    else { toast.success("Milestone added"); fetchMilestones(); setNewMilestone({ order_count: 0, discount_percent: 5, coupon_validity_days: 30, description: "" }); }
    setSaving(false);
  };

  const handleToggle = async (id: string, is_active: boolean) => {
    await supabase.from("reward_milestones").update({ is_active }).eq("id", id);
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, is_active } : m));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reward_milestones").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Milestone deleted"); fetchMilestones(); }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> Order Milestone Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Users automatically receive coupons when they reach these order milestones.</p>
          
          {/* Add New */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6 p-4 rounded-lg border border-dashed border-border">
            <div>
              <Label className="text-xs">Orders Required</Label>
              <Input type="number" value={newMilestone.order_count} onChange={e => setNewMilestone(p => ({ ...p, order_count: +e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Discount %</Label>
              <Input type="number" value={newMilestone.discount_percent} onChange={e => setNewMilestone(p => ({ ...p, discount_percent: +e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Valid Days</Label>
              <Input type="number" value={newMilestone.coupon_validity_days} onChange={e => setNewMilestone(p => ({ ...p, coupon_validity_days: +e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Input value={newMilestone.description} onChange={e => setNewMilestone(p => ({ ...p, description: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" /> Add</>}
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Orders</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Valid Days</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestones.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-bold">{m.order_count}</TableCell>
                    <TableCell>{m.discount_percent}%</TableCell>
                    <TableCell>{m.coupon_validity_days}</TableCell>
                    <TableCell className="text-sm">{m.description}</TableCell>
                    <TableCell>
                      <Switch checked={m.is_active} onCheckedChange={v => handleToggle(m.id, v)} />
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(m.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
