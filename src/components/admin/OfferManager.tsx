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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown, Zap, Clock, Tag, Gift, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { fetchOffers, createOffer, updateOffer, deleteOffer } from "@/lib/offerApi";
import { uploadProductImage } from "@/lib/dynamicProductApi";
import { OfferTemplatePreview } from "@/components/offers/OfferTemplatePreview";
import { OfferLivePreview } from "@/components/admin/OfferLivePreview";
import { cn } from "@/lib/utils";

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
  design_template: string;
  badge_text: string | null;
  badge_color: string | null;
  badge_text_color: string | null;
  animation_type: string | null;
  seasonal_theme: string | null;
  background_gradient: string | null;
  timer_start_date: string | null;
}

const offerTypeIcons: Record<string, any> = {
  flash_sale: Zap, limited_time: Clock, daily_deal: Tag, discount_bundle: Gift,
};

const offerTypeLabels: Record<string, string> = {
  flash_sale: "Flash Sale", limited_time: "Limited Time", daily_deal: "Daily Deal", discount_bundle: "Discount Bundle",
};

const gradientPresets = [
  { name: "Purple Haze", value: "linear-gradient(135deg, #667eea, #764ba2)" },
  { name: "Sunset", value: "linear-gradient(135deg, #f093fb, #f5576c)" },
  { name: "Ocean", value: "linear-gradient(135deg, #4facfe, #00f2fe)" },
  { name: "Forest", value: "linear-gradient(135deg, #11998e, #38ef7d)" },
  { name: "Fire", value: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { name: "Night", value: "linear-gradient(135deg, #0f0c29, #302b63)" },
];

const animationOptions = [
  { id: "none", label: "None" },
  { id: "pulse", label: "Pulse" },
  { id: "flash", label: "Flash" },
  { id: "bounce", label: "Bounce" },
  { id: "slide-in", label: "Slide In" },
];

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  offer_type: "flash_sale",
  timer_enabled: false,
  timer_type: "none",
  timer_end_date: "",
  timer_start_date: "",
  product_link: "",
  custom_icon_url: "",
  show_on_homepage: true,
  show_on_product_page: false,
  is_active: true,
  design_template: "badge",
  badge_text: "",
  badge_color: "#ef4444",
  badge_text_color: "#ffffff",
  animation_type: "none",
  seasonal_theme: "",
  background_gradient: "",
};

export function OfferManager() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [customGradient, setCustomGradient] = useState(false);

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
    setCustomGradient(false);
    setDialogOpen(true);
  };

  const openEdit = (o: Offer) => {
    setEditingId(o.id);
    const isPreset = gradientPresets.some(p => p.value === (o.background_gradient || ""));
    setCustomGradient(!isPreset && !!o.background_gradient);
    setForm({
      title: o.title,
      subtitle: o.subtitle || "",
      description: o.description || "",
      image_url: o.image_url || "",
      offer_type: o.offer_type,
      timer_enabled: o.timer_enabled,
      timer_type: o.timer_type || "none",
      timer_end_date: o.timer_end_date ? new Date(o.timer_end_date).toISOString().slice(0, 16) : "",
      timer_start_date: o.timer_start_date ? new Date(o.timer_start_date).toISOString().slice(0, 16) : "",
      product_link: o.product_link || "",
      custom_icon_url: o.custom_icon_url || "",
      show_on_homepage: o.show_on_homepage,
      show_on_product_page: o.show_on_product_page,
      is_active: o.is_active,
      design_template: o.design_template || "badge",
      badge_text: o.badge_text || "",
      badge_color: o.badge_color || "#ef4444",
      badge_text_color: o.badge_text_color || "#ffffff",
      animation_type: o.animation_type || "none",
      seasonal_theme: o.seasonal_theme || "",
      background_gradient: o.background_gradient || "",
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
        timer_start_date: form.timer_start_date ? new Date(form.timer_start_date).toISOString() : null,
        product_link: form.product_link || null,
        custom_icon_url: form.custom_icon_url || null,
        show_on_homepage: form.show_on_homepage,
        show_on_product_page: form.show_on_product_page,
        is_active: form.is_active,
        design_template: form.design_template,
        badge_text: form.badge_text || null,
        badge_color: form.badge_color || null,
        badge_text_color: form.badge_text_color || null,
        animation_type: form.animation_type,
        seasonal_theme: form.seasonal_theme || null,
        background_gradient: form.background_gradient || null,
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

      {/* Simplified Offer List */}
      <div className="grid gap-3">
        {offers.map((o, idx) => {
          const Icon = offerTypeIcons[o.offer_type] || Zap;
          return (
            <Card key={o.id} className={cn(!o.is_active && "opacity-60")}>
              <CardContent className="p-4 flex items-center gap-3">
                <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{o.title}</h3>
                    <Badge variant={o.is_active ? "default" : "secondary"} className="text-[10px]">
                      {o.is_active ? "Active" : "Off"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {offerTypeLabels[o.offer_type] || o.offer_type}
                    {o.show_on_homepage && " · Homepage"}
                    {o.show_on_product_page && " · Product"}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Switch checked={o.is_active} onCheckedChange={() => handleToggle(o)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReorder(o.id, "up")} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleReorder(o.id, "down")} disabled={idx === offers.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(o.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {offers.length === 0 && <p className="text-center text-muted-foreground py-8">No offers yet.</p>}
      </div>

      {/* Simplified 2-Tab Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle>{editingId ? "Edit Offer" : "Create Offer"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col lg:flex-row h-[calc(90vh-80px)] overflow-hidden">
            {/* Left: Form */}
            <div className="flex-1 lg:w-[60%] overflow-y-auto p-6 border-r">
              <Tabs defaultValue="content" className="space-y-4">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* CONTENT TAB */}
                <TabsContent value="content" className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm font-semibold">Design Template</Label>
                    <OfferTemplatePreview selected={form.design_template} onSelect={(t) => setForm((f) => ({ ...f, design_template: t }))} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Title *</Label>
                      <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. 50% Off Diamond Top-Up" />
                    </div>
                    <div>
                      <Label className="text-xs">Subtitle</Label>
                      <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="Limited time only!" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Description</Label>
                    <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short description..." />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Offer Type</Label>
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
                      <Label className="text-xs">Product Link</Label>
                      <Input value={form.product_link} onChange={(e) => setForm((f) => ({ ...f, product_link: e.target.value }))} placeholder="/freefire, /pubg..." />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Image</Label>
                    <div className="flex gap-2">
                      <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="URL or upload" className="flex-1" />
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <Button variant="outline" size="sm" disabled={uploading} asChild><span>{uploading ? "..." : "Upload"}</span></Button>
                      </label>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Badge Text</Label>
                      <Input value={form.badge_text} onChange={(e) => setForm((f) => ({ ...f, badge_text: e.target.value }))} placeholder="20% OFF" />
                    </div>
                    <div>
                      <Label className="text-xs">Badge Color</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={form.badge_color} onChange={(e) => setForm((f) => ({ ...f, badge_color: e.target.value }))} className="w-8 h-8 rounded border cursor-pointer" />
                        <Input value={form.badge_color} onChange={(e) => setForm((f) => ({ ...f, badge_color: e.target.value }))} className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Text Color</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={form.badge_text_color} onChange={(e) => setForm((f) => ({ ...f, badge_text_color: e.target.value }))} className="w-8 h-8 rounded border cursor-pointer" />
                        <Input value={form.badge_text_color} onChange={(e) => setForm((f) => ({ ...f, badge_text_color: e.target.value }))} className="flex-1" />
                      </div>
                    </div>
                  </div>
                  {form.badge_text && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Preview:</span>
                      <span className="px-2 py-0.5 rounded-md text-xs font-bold" style={{ backgroundColor: form.badge_color, color: form.badge_text_color }}>
                        {form.badge_text}
                      </span>
                    </div>
                  )}
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings" className="space-y-4">
                  {/* Timer */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={form.timer_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, timer_enabled: v }))} />
                      <Label className="text-sm font-semibold">Countdown Timer</Label>
                    </div>
                    {form.timer_enabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs">Timer Type</Label>
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
                          <Label className="text-xs">Start Date</Label>
                          <Input type="datetime-local" value={form.timer_start_date} onChange={(e) => setForm((f) => ({ ...f, timer_start_date: e.target.value }))} />
                        </div>
                        <div>
                          <Label className="text-xs">End Date</Label>
                          <Input type="datetime-local" value={form.timer_end_date} onChange={(e) => setForm((f) => ({ ...f, timer_end_date: e.target.value }))} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Visibility */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <Label className="text-sm font-semibold">Visibility</Label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={form.show_on_homepage} onCheckedChange={(v) => setForm((f) => ({ ...f, show_on_homepage: v }))} />
                        <Label className="text-sm">Homepage</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={form.show_on_product_page} onCheckedChange={(v) => setForm((f) => ({ ...f, show_on_product_page: v }))} />
                        <Label className="text-sm">Product Page</Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                        <Label className="text-sm">Active</Label>
                      </div>
                    </div>
                  </div>

                  {/* Advanced — Collapsible */}
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between text-sm font-semibold">
                        Advanced Options
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-3">
                      {/* Animation */}
                      <div>
                        <Label className="text-xs mb-2 block">Animation</Label>
                        <Select value={form.animation_type} onValueChange={(v) => setForm((f) => ({ ...f, animation_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {animationOptions.map(a => (
                              <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Gradient */}
                      {(form.design_template === "animated_banner" || form.design_template === "homepage_highlight" || form.design_template === "seasonal") && (
                        <div className="space-y-3">
                          <Label className="text-xs">Background Gradient</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {gradientPresets.map((p) => (
                              <button
                                key={p.name}
                                type="button"
                                onClick={() => { setForm((f) => ({ ...f, background_gradient: p.value })); setCustomGradient(false); }}
                                className={cn(
                                  "h-10 rounded-lg border-2 transition-all text-[10px] font-bold text-white flex items-end justify-center pb-1",
                                  form.background_gradient === p.value && !customGradient ? "border-primary ring-2 ring-primary/30" : "border-transparent"
                                )}
                                style={{ background: p.value }}
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={customGradient} onCheckedChange={(v) => setCustomGradient(v)} />
                            <Label className="text-xs">Custom gradient</Label>
                          </div>
                          {customGradient && (
                            <Input value={form.background_gradient} onChange={(e) => setForm((f) => ({ ...f, background_gradient: e.target.value }))} placeholder="linear-gradient(135deg, #667eea, #764ba2)" />
                          )}
                        </div>
                      )}

                      {/* Seasonal */}
                      {form.design_template === "seasonal" && (
                        <div>
                          <Label className="text-xs">Seasonal Theme</Label>
                          <Select value={form.seasonal_theme} onValueChange={(v) => setForm((f) => ({ ...f, seasonal_theme: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select theme" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="holi">Holi</SelectItem>
                              <SelectItem value="diwali">Diwali</SelectItem>
                              <SelectItem value="christmas">Christmas</SelectItem>
                              <SelectItem value="new_year">New Year</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                </TabsContent>
              </Tabs>

              <Button onClick={handleSave} className="w-full mt-6">{editingId ? "Update Offer" : "Create Offer"}</Button>
            </div>

            {/* Right: Live Preview */}
            <div className="hidden lg:flex lg:w-[40%] bg-muted/20">
              <OfferLivePreview form={form} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
