import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Ticket, Plus, Save, Loader2, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface CouponRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: string;
  conditions: Record<string, any>;
  discount_type: string;
  discount_value: number;
  max_discount_amount: number | null;
  max_uses_per_user: number | null;
  max_total_uses: number | null;
  total_used: number;
  coupon_code: string | null;
  applicable_categories: string[] | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const emptyRule = {
  name: "",
  description: "",
  rule_type: "global_code",
  conditions: {},
  discount_type: "percent",
  discount_value: 0,
  max_discount_amount: null as number | null,
  max_uses_per_user: 1,
  max_total_uses: null as number | null,
  coupon_code: "",
  applicable_categories: [] as string[],
  starts_at: "",
  expires_at: "",
  is_active: true,
};

export function CouponRulesManager() {
  const [rules, setRules] = useState<CouponRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyRule);

  const fetchRules = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("coupon_rules")
      .select("*")
      .order("created_at", { ascending: false });
    setRules((data as CouponRule[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchRules(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (form.rule_type === "global_code" && !form.coupon_code?.trim()) { toast.error("Coupon code is required for global codes"); return; }

    setSaving(true);
    const payload: any = {
      name: form.name,
      description: form.description || null,
      rule_type: form.rule_type,
      conditions: form.conditions,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_discount_amount: form.max_discount_amount || null,
      max_uses_per_user: form.max_uses_per_user || null,
      max_total_uses: form.max_total_uses || null,
      coupon_code: form.coupon_code?.toUpperCase() || null,
      applicable_categories: form.applicable_categories?.length ? form.applicable_categories : null,
      starts_at: form.starts_at || null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("coupon_rules").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("coupon_rules").insert(payload));
    }

    if (error) toast.error(error.message);
    else { toast.success(editingId ? "Rule updated" : "Rule created"); setShowDialog(false); fetchRules(); }
    setSaving(false);
  };

  const handleEdit = (rule: CouponRule) => {
    setEditingId(rule.id);
    setForm({
      name: rule.name,
      description: rule.description || "",
      rule_type: rule.rule_type,
      conditions: rule.conditions || {},
      discount_type: rule.discount_type,
      discount_value: rule.discount_value,
      max_discount_amount: rule.max_discount_amount,
      max_uses_per_user: rule.max_uses_per_user,
      max_total_uses: rule.max_total_uses,
      coupon_code: rule.coupon_code || "",
      applicable_categories: rule.applicable_categories || [],
      starts_at: rule.starts_at ? rule.starts_at.slice(0, 16) : "",
      expires_at: rule.expires_at ? rule.expires_at.slice(0, 16) : "",
      is_active: rule.is_active,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon rule?")) return;
    const { error } = await supabase.from("coupon_rules").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); fetchRules(); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("coupon_rules").update({ is_active: active }).eq("id", id);
    fetchRules();
  };

  const categories = ["freefire", "tiktok", "netflix", "garena", "youtube", "smilecoin", "chatgpt", "unipin", "mobile_legends", "roblox", "pubg", "design"];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2"><Ticket className="h-5 w-5 text-primary" /> Coupon Rules</CardTitle>
          <Button onClick={() => { setEditingId(null); setForm(emptyRule); setShowDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Create Rule
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : rules.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No coupon rules created yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map(rule => (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-xs text-muted-foreground">{rule.rule_type}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {rule.coupon_code ? (
                          <Badge variant="outline" className="font-mono">{rule.coupon_code}</Badge>
                        ) : <span className="text-muted-foreground text-xs">Auto</span>}
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-primary">
                          {rule.discount_type === "percent" ? `${rule.discount_value}%` : `₹${rule.discount_value}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rule.total_used}{rule.max_total_uses ? `/${rule.max_total_uses}` : ""}
                      </TableCell>
                      <TableCell>
                        <Switch checked={rule.is_active} onCheckedChange={v => handleToggle(rule.id, v)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(rule)}><Edit className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(rule.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Coupon Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rule Name *</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend 10% OFF" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={form.rule_type} onValueChange={v => setForm({ ...form, rule_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global_code">Global Code</SelectItem>
                    <SelectItem value="auto_generate">Auto Generate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.rule_type === "global_code" && (
              <div>
                <Label>Coupon Code *</Label>
                <Input value={form.coupon_code || ""} onChange={e => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })} placeholder="e.g. WEEKEND10" className="uppercase font-mono" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Value</Label>
                <Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: +e.target.value })} />
              </div>
              <div>
                <Label>Max Discount (cap)</Label>
                <Input type="number" value={form.max_discount_amount ?? ""} onChange={e => setForm({ ...form, max_discount_amount: e.target.value ? +e.target.value : null })} placeholder="No cap" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Uses / User</Label>
                <Input type="number" value={form.max_uses_per_user ?? ""} onChange={e => setForm({ ...form, max_uses_per_user: e.target.value ? +e.target.value : null })} />
              </div>
              <div>
                <Label>Max Total Uses</Label>
                <Input type="number" value={form.max_total_uses ?? ""} onChange={e => setForm({ ...form, max_total_uses: e.target.value ? +e.target.value : null })} placeholder="Unlimited" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Starts At</Label>
                <Input type="datetime-local" value={form.starts_at || ""} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <Label>Expires At</Label>
                <Input type="datetime-local" value={form.expires_at || ""} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Applicable Categories</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {categories.map(cat => (
                  <Badge
                    key={cat}
                    variant={form.applicable_categories?.includes(cat) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      const cats = form.applicable_categories || [];
                      setForm({
                        ...form,
                        applicable_categories: cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat],
                      });
                    }}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Leave empty for all categories</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
