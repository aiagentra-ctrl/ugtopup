import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAllTournamentBanners,
  createTournamentBanner,
  updateTournamentBanner,
  deleteTournamentBanner,
  type TournamentBanner,
} from "@/lib/tournamentBannerApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, AlertTriangle, Info, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const VARIANT_OPTIONS = [
  { value: "warning", label: "Warning", icon: AlertTriangle },
  { value: "info", label: "Info", icon: Info },
  { value: "success", label: "Success", icon: CheckCircle2 },
  { value: "promo", label: "Promo", icon: Sparkles },
];

type FormState = {
  title: string;
  message: string;
  image_url: string;
  variant: string;
  cta_text: string;
  cta_link: string;
  is_active: boolean;
  display_order: number;
};

const emptyForm: FormState = {
  title: "",
  message: "",
  image_url: "",
  variant: "warning",
  cta_text: "",
  cta_link: "",
  is_active: true,
  display_order: 0,
};

export const TournamentBannerManager = () => {
  const qc = useQueryClient();
  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["tournament-banners-all"],
    queryFn: fetchAllTournamentBanners,
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TournamentBanner | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("admin-tournament-banners")
      .on("postgres_changes", { event: "*", schema: "public", table: "tournament_banners" }, () => {
        qc.invalidateQueries({ queryKey: ["tournament-banners-all"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: banners.length });
    setOpen(true);
  };

  const openEdit = (b: TournamentBanner) => {
    setEditing(b);
    setForm({
      title: b.title || "",
      message: b.message,
      image_url: b.image_url || "",
      variant: b.variant || "warning",
      cta_text: b.cta_text || "",
      cta_link: b.cta_link || "",
      is_active: b.is_active,
      display_order: b.display_order,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.message.trim()) {
      toast.error("Message is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim() || null,
        message: form.message.trim(),
        image_url: form.image_url.trim() || null,
        variant: form.variant,
        cta_text: form.cta_text.trim() || null,
        cta_link: form.cta_link.trim() || null,
        is_active: form.is_active,
        display_order: form.display_order,
      };
      if (editing) {
        await updateTournamentBanner(editing.id, payload);
        toast.success("Banner updated");
      } else {
        await createTournamentBanner(payload);
        toast.success("Banner created");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["tournament-banners-all"] });
      qc.invalidateQueries({ queryKey: ["tournament-banners-active"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (b: TournamentBanner, value: boolean) => {
    try {
      await updateTournamentBanner(b.id, { is_active: value });
      qc.invalidateQueries({ queryKey: ["tournament-banners-all"] });
      qc.invalidateQueries({ queryKey: ["tournament-banners-active"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      await deleteTournamentBanner(id);
      toast.success("Banner deleted");
      qc.invalidateQueries({ queryKey: ["tournament-banners-all"] });
      qc.invalidateQueries({ queryKey: ["tournament-banners-active"] });
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tournament Banners</h2>
          <p className="text-sm text-muted-foreground">Manage banners shown on the Tournaments page.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> New Banner
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">No banners yet. Create one above.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {banners.map((b) => {
            const variantMeta = VARIANT_OPTIONS.find((v) => v.value === b.variant) || VARIANT_OPTIONS[0];
            const Icon = variantMeta.icon;
            return (
              <Card key={b.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-4 w-4 text-primary" />
                    {b.title || "(No title)"}
                    <span className="ml-auto flex items-center gap-2 text-xs font-normal text-muted-foreground">
                      {b.is_active ? "Visible" : "Hidden"}
                      <Switch checked={b.is_active} onCheckedChange={(v) => handleToggle(b, v)} />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{b.message}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded bg-muted px-2 py-0.5">{variantMeta.label}</span>
                    <span>Order: {b.display_order}</span>
                    {b.cta_text && <span>CTA: {b.cta_text}</span>}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => openEdit(b)}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Banner" : "New Banner"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title (optional)</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Beta Notice" />
            </div>
            <div>
              <Label>Message *</Label>
              <Textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tournament feature is still in development phase. Use at your own risk."
                rows={3}
              />
            </div>
            <div>
              <Label>Image URL (optional)</Label>
              <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Variant</Label>
                <Select value={form.variant} onValueChange={(v) => setForm({ ...form, variant: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VARIANT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CTA Text</Label>
                <Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Learn more" />
              </div>
              <div>
                <Label>CTA Link</Label>
                <Input value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/help" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label className="cursor-pointer">Visible on Tournaments page</Label>
                <p className="text-xs text-muted-foreground">Turn off to hide without deleting.</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentBannerManager;
