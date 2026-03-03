import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Zap, Clock, Tag, Gift } from "lucide-react";
import { toast } from "sonner";
import { fetchOffers, createOffer, updateOffer, deleteOffer } from "@/lib/offerApi";
import { uploadProductImage } from "@/lib/dynamicProductApi";

interface Offer {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  offer_type: string;
  timer_enabled: boolean;
  timer_type: string | null;
  timer_end_date: string | null;
  product_link: string | null;
  custom_icon_url: string | null;
  display_order: number;
  is_active: boolean;
  show_on_homepage: boolean;
  show_on_product_page: boolean;
}

const offerTypeIcons: Record<string, any> = {
  flash_sale: Zap,
  limited_time: Clock,
  daily_deal: Tag,
  discount_bundle: Gift,
};

const offerTypeLabels: Record<string, string> = {
  flash_sale: "Flash Sale",
  limited_time: "Limited Time",
  daily_deal: "Daily Deal",
  discount_bundle: "Discount Bundle",
};

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  offer_type: "flash_sale",
  timer_enabled: false,
  timer_type: "none",
  timer_end_date: "",
  product_link: "",
  custom_icon_url: "",
  show_on_homepage: true,
  show_on_product_page: false,
  is_active: true,
};

export function OfferManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const data = await fetchOffers();
      setOffers(data as any);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (o: Offer) => {
    setEditingId(o.id);
    setForm({
      title: o.title,
      subtitle: o.subtitle || "",
      description: o.description || "",
      image_url: o.image_url || "",
      offer_type: o.offer_type,
      timer_enabled: o.timer_enabled,
      timer_type: o.timer_type || "none",
      timer_end_date: o.timer_end_date ? new Date(o.timer_end_date).toISOString().slice(0, 16) : "",
      product_link: o.product_link || "",
      custom_icon_url: o.custom_icon_url || "",
      show_on_homepage: o.show_on_homepage,
      show_on_product_page: o.show_on_product_page,
      is_active: o.is_active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    try {
      const payload: any = {
        title: form.title,
        subtitle: form.subtitle || null,
        description: form.description || null,
        image_url: form.image_url || null,
        offer_type: form.offer_type,
        timer_enabled: form.timer_enabled,
        timer_type: form.timer_type,
        timer_end_date: form.timer_end_date ? new Date(form.timer_end_date).toISOString() : null,
        product_link: form.product_link || null,
        custom_icon_url: form.custom_icon_url || null,
        show_on_homepage: form.show_on_homepage,
        show_on_product_page: form.show_on_product_page,
        is_active: form.is_active,
      };
      if (editingId) {
        await updateOffer(editingId, payload);
        toast.success("Offer updated");
      } else {
        await createOffer(payload);
        toast.success("Offer created");
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await deleteOffer(id);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleToggle = async (o: Offer) => {
    try {
      await updateOffer(o.id, { is_active: !o.is_active });
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = offers.findIndex((o) => o.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= offers.length) return;
    try {
      await Promise.all([
        updateOffer(offers[idx].id, { display_order: offers[swapIdx].display_order }),
        updateOffer(offers[swapIdx].id, { display_order: offers[idx].display_order }),
      ]);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, image_url: url }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading offers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Offers ({offers.length})</h2>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Offer</Button>
      </div>

      <div className="grid gap-4">
        {offers.map((o, idx) => {
          const Icon = offerTypeIcons[o.offer_type] || Zap;
          return (
            <Card key={o.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{o.title}</h3>
                    <Badge variant={o.is_active ? "default" : "secondary"}>{o.is_active ? "Active" : "Inactive"}</Badge>
                    <Badge variant="outline">{offerTypeLabels[o.offer_type] || o.offer_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {o.subtitle || "No subtitle"} • {o.timer_enabled ? `Timer: ${o.timer_type}` : "No timer"}
                    {o.show_on_homepage && " • Homepage"}
                    {o.show_on_product_page && " • Product Page"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={o.is_active} onCheckedChange={() => handleToggle(o)} />
                  <Button variant="ghost" size="icon" onClick={() => handleReorder(o.id, "up")} disabled={idx === 0}><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleReorder(o.id, "down")} disabled={idx === offers.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(o)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {offers.length === 0 && <p className="text-center text-muted-foreground py-8">No offers yet.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Offer" : "Add Offer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <Label>Offer Type</Label>
              <Select value={form.offer_type} onValueChange={(v) => setForm((f) => ({ ...f, offer_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="flash_sale">Flash Sale</SelectItem>
                  <SelectItem value="limited_time">Limited Time</SelectItem>
                  <SelectItem value="daily_deal">Daily Deal</SelectItem>
                  <SelectItem value="discount_bundle">Discount Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Image</Label>
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="URL or upload" className="flex-1" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" disabled={uploading} asChild><span>{uploading ? "..." : "Upload"}</span></Button>
                </label>
              </div>
            </div>
            <div>
              <Label>Product Link</Label>
              <Input value={form.product_link} onChange={(e) => setForm((f) => ({ ...f, product_link: e.target.value }))} placeholder="/product/..." />
            </div>
            {/* Timer Controls */}
            <div className="border rounded-lg p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={form.timer_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, timer_enabled: v }))} />
                <Label>Enable Countdown Timer</Label>
              </div>
              {form.timer_enabled && (
                <>
                  <div>
                    <Label>Timer Type</Label>
                    <Select value={form.timer_type} onValueChange={(v) => setForm((f) => ({ ...f, timer_type: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours only</SelectItem>
                        <SelectItem value="days">Days only</SelectItem>
                        <SelectItem value="both">Days + Hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>End Date & Time</Label>
                    <Input type="datetime-local" value={form.timer_end_date} onChange={(e) => setForm((f) => ({ ...f, timer_end_date: e.target.value }))} />
                  </div>
                </>
              )}
            </div>
            {/* Visibility */}
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.show_on_homepage} onCheckedChange={(v) => setForm((f) => ({ ...f, show_on_homepage: v }))} />
                <Label>Show on Homepage</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.show_on_product_page} onCheckedChange={(v) => setForm((f) => ({ ...f, show_on_product_page: v }))} />
                <Label>Show on Product Page</Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{editingId ? "Update Offer" : "Create Offer"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
