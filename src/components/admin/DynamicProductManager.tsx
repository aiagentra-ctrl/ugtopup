import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, Search, Image, X, ArrowUp, ArrowDown, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  fetchDynamicProducts,
  createDynamicProduct,
  updateDynamicProduct,
  deleteDynamicProduct,
  uploadProductImage,
  fetchCategories,
} from "@/lib/dynamicProductApi";

interface Plan {
  name: string;
  price: number;
  discount_price: number | null;
  api_code: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  category_id: string | null;
  price: number;
  discount_price: number | null;
  features: any[];
  tags: string[];
  plans: any[];
  display_order: number;
  is_active: boolean;
  product_categories?: { id: string; name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const emptyForm = {
  title: "",
  description: "",
  image_url: "",
  link: "",
  category_id: "",
  price: 0,
  discount_price: null as number | null,
  features: [] as string[],
  tags: [] as string[],
  plans: [] as Plan[],
  is_active: true,
  offer_id: "" as string,
  offer_badge_text: "",
  offer_badge_color: "",
};

const emptyPlan: Plan = { name: "", price: 0, discount_price: null, api_code: "" };

function DescriptionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(!!value);

  return (
    <div>
      {!open ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          <FileText className="h-4 w-4" />
          Add Description
        </Button>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <Label>Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-muted-foreground"
                onClick={() => { onChange(""); setOpen(false); }}
              >
                <X className="h-3 w-3 mr-1" /> Remove
              </Button>
            </div>
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Enter product description..."
              rows={3}
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

export function DynamicProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [featureInput, setFeatureInput] = useState("");
  const [tagInput, setTagInput] = useState("");

  const load = async () => {
    try {
      const [prods, cats] = await Promise.all([fetchDynamicProducts(), fetchCategories()]);
      setProducts(prods as any);
      setCategories(cats);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const duplicateImageUrls = useMemo(() => {
    const urlCount: Record<string, number> = {};
    products.forEach((p) => {
      if (p.image_url) urlCount[p.image_url] = (urlCount[p.image_url] || 0) + 1;
    });
    return new Set(Object.entries(urlCount).filter(([, c]) => c > 1).map(([url]) => url));
  }, [products]);

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || p.category_id === filterCategory;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const parsePlans = (raw: any): Plan[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map((p: any) => ({
      name: p.name || "",
      price: Number(p.price) || 0,
      discount_price: p.discount_price != null ? Number(p.discount_price) : null,
      api_code: p.api_code || "",
    }));
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      title: p.title,
      description: p.description || "",
      image_url: p.image_url || "",
      link: p.link || "",
      category_id: p.category_id || "",
      price: p.price,
      discount_price: p.discount_price,
      features: Array.isArray(p.features) ? p.features : [],
      tags: Array.isArray(p.tags) ? p.tags : [],
      plans: parsePlans(p.plans),
      is_active: p.is_active,
      offer_id: (p as any).offer_id || "",
      offer_badge_text: (p as any).offer_badge_text || "",
      offer_badge_color: (p as any).offer_badge_color || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    try {
      const payload: any = {
        title: form.title,
        description: form.description || null,
        image_url: form.image_url || null,
        link: form.link || null,
        category_id: form.category_id || null,
        price: form.price,
        discount_price: form.discount_price,
        features: form.features,
        tags: form.tags,
        plans: form.plans.filter((p) => p.name.trim()),
        is_active: form.is_active,
        offer_id: form.offer_id || null,
        offer_badge_text: form.offer_badge_text || null,
        offer_badge_color: form.offer_badge_color || null,
      };
      if (editingId) {
        await updateDynamicProduct(editingId, payload);
        toast.success("Product updated");
      } else {
        await createDynamicProduct(payload);
        toast.success("Product created");
      }
      setDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDynamicProduct(id);
      toast.success("Deleted");
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

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = filtered.findIndex((p) => p.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= filtered.length) return;
    try {
      const currentOrder = filtered[idx].display_order;
      const swapOrder = filtered[swapIdx].display_order;
      await Promise.all([
        updateDynamicProduct(filtered[idx].id, { display_order: swapOrder }),
        updateDynamicProduct(filtered[swapIdx].id, { display_order: currentOrder }),
      ]);
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm((f) => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput("");
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    setForm((f) => ({ ...f, tags: [...f.tags, tagInput.trim()] }));
    setTagInput("");
  };

  // Plan helpers
  const addPlan = () => {
    setForm((f) => ({ ...f, plans: [...f.plans, { ...emptyPlan }] }));
  };

  const updatePlan = (index: number, field: keyof Plan, value: string | number | null) => {
    setForm((f) => ({
      ...f,
      plans: f.plans.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const removePlan = (index: number) => {
    setForm((f) => ({ ...f, plans: f.plans.filter((_, i) => i !== index) }));
  };

  if (loading) return <div className="text-center py-10">Loading products...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openAdd}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      <div className="grid gap-4">
        {filtered.map((p, idx) => (
          <Card key={p.id} className="overflow-hidden">
            <CardContent className="p-4 flex gap-4 items-center">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Image className="h-6 w-6 text-muted-foreground" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{p.title}</h3>
                  {!p.is_active && <Badge variant="secondary">Inactive</Badge>}
                  {p.image_url && duplicateImageUrls.has(p.image_url) && (
                    <Badge variant="destructive" className="gap-1 text-[10px]">
                      <AlertTriangle className="h-3 w-3" /> Duplicate Image
                    </Badge>
                  )}
                  {Array.isArray(p.plans) && p.plans.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">{p.plans.length} plans</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {p.product_categories?.name || "No category"} • {p.link || "No link"}
                </p>
                {p.description && (
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-1 flex items-center gap-1">
                    <FileText className="h-3 w-3 flex-shrink-0" />
                    {p.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => handleReorder(p.id, "up")} disabled={idx === 0}><ArrowUp className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleReorder(p.id, "down")} disabled={idx === filtered.length - 1}><ArrowDown className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No products found.</p>}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            {/* Image */}
            <div>
              <Label>Image</Label>
              <div className="flex gap-2 items-center">
                <Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="URL or upload" className="flex-1" />
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="outline" size="sm" disabled={uploading} asChild><span>{uploading ? "Uploading..." : "Upload"}</span></Button>
                </label>
              </div>
              {form.image_url && <img src={form.image_url} alt="Preview" className="mt-2 h-20 rounded-lg object-cover" />}
            </div>
            {/* Category */}
            <div>
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => setForm((f) => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Description */}
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            {/* Link */}
            <div>
              <Label>Link</Label>
              <Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="/product/..." />
            </div>
            {/* Base Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Base Price</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))} />
              </div>
              <div>
                <Label>Discount Price</Label>
                <Input type="number" value={form.discount_price ?? ""} onChange={(e) => setForm((f) => ({ ...f, discount_price: e.target.value ? Number(e.target.value) : null }))} />
              </div>
            </div>

            {/* Pricing Plans */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Pricing Plans</Label>
                <Button variant="outline" size="sm" onClick={addPlan}>
                  <Plus className="h-3 w-3 mr-1" /> Add Plan
                </Button>
              </div>
              {form.plans.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No plans yet. Add pricing plans for this product.
                </p>
              ) : (
                <div className="space-y-2">
                  {/* Header */}
                  <div className="grid grid-cols-[1fr_80px_80px_100px_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                    <span>Plan Name</span>
                    <span>Price</span>
                    <span>Disc. Price</span>
                    <span>API Code</span>
                    <span></span>
                  </div>
                  {form.plans.map((plan, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_80px_100px_32px] gap-2 items-center">
                      <Input
                        value={plan.name}
                        onChange={(e) => updatePlan(i, "name", e.target.value)}
                        placeholder="e.g. 110 Diamonds"
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={plan.price}
                        onChange={(e) => updatePlan(i, "price", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <Input
                        type="number"
                        value={plan.discount_price ?? ""}
                        onChange={(e) => updatePlan(i, "discount_price", e.target.value ? Number(e.target.value) : null)}
                        placeholder="—"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={plan.api_code}
                        onChange={(e) => updatePlan(i, "api_code", e.target.value)}
                        placeholder="Optional"
                        className="h-8 text-sm"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removePlan(i)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div>
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} placeholder="Add feature" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())} />
                <Button variant="outline" size="sm" onClick={addFeature}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.features.map((f, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {String(f)} <X className="h-3 w-3 cursor-pointer" onClick={() => setForm((prev) => ({ ...prev, features: prev.features.filter((_, j) => j !== i) }))} />
                  </Badge>
                ))}
              </div>
            </div>
            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} />
                <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {form.tags.map((t, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {t} <X className="h-3 w-3 cursor-pointer" onClick={() => setForm((prev) => ({ ...prev, tags: prev.tags.filter((_, j) => j !== i) }))} />
                  </Badge>
                ))}
              </div>
            </div>
            {/* Offer Badge */}
            <div className="border rounded-lg p-3 space-y-3">
              <Label className="text-sm font-semibold">Offer Badge (optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Badge Text</Label>
                  <Input value={form.offer_badge_text} onChange={(e) => setForm((f) => ({ ...f, offer_badge_text: e.target.value }))} placeholder="20% OFF" />
                </div>
                <div>
                  <Label className="text-xs">Badge Color</Label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.offer_badge_color || "#ef4444"} onChange={(e) => setForm((f) => ({ ...f, offer_badge_color: e.target.value }))} className="w-8 h-8 rounded border cursor-pointer" />
                    <Input value={form.offer_badge_color} onChange={(e) => setForm((f) => ({ ...f, offer_badge_color: e.target.value }))} className="flex-1" />
                  </div>
                </div>
              </div>
              {form.offer_badge_text && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Preview:</span>
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold text-white" style={{ backgroundColor: form.offer_badge_color || "#ef4444" }}>
                    {form.offer_badge_text}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} className="w-full">{editingId ? "Update Product" : "Create Product"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
