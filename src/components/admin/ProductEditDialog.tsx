import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product, updateProduct } from "@/lib/productApi";
import { toast } from "sonner";

interface ProductEditDialogProps {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSaved?: () => void;
}

const CATEGORIES = [
  { value: "freefire", label: "Free Fire" },
  { value: "mobile_legends", label: "Mobile Legends" },
  { value: "roblox", label: "Roblox" },
  { value: "tiktok", label: "TikTok" },
  { value: "netflix", label: "Netflix" },
  { value: "design", label: "Design Services" },
] as const;

export function ProductEditDialog({ open, product, onClose, onSaved }: ProductEditDialogProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "freefire" as Product["category"],
    image_url: "",
    price: "",
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || "",
        description: product.description || "",
        category: product.category,
        image_url: product.image_url || "",
        price: String(product.price ?? ""),
      });
    }
  }, [product]);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!product) return;
    const priceNum = Number(form.price);
    if (!form.name.trim()) return toast.error("Name is required");
    if (isNaN(priceNum) || priceNum <= 0) return toast.error("Enter a valid price");

    setSaving(true);
    try {
      await updateProduct(product.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        category: form.category,
        image_url: form.image_url.trim() || null,
        price: priceNum,
      });
      toast.success("Product updated successfully");
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Product Name</label>
              <Input value={form.name} onChange={(e) => handleChange("name", e.target.value)} className="mt-1 bg-background border-border" />
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Description</label>
              <Textarea value={form.description} onChange={(e) => handleChange("description", e.target.value)} className="mt-1 bg-background border-border" rows={4} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Category</label>
                <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
                  <SelectTrigger className="mt-1 bg-background border-border">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Price</label>
                <Input type="number" value={form.price} onChange={(e) => handleChange("price", e.target.value)} className="mt-1 bg-background border-border" />
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Image URL</label>
              <Input value={form.image_url} onChange={(e) => handleChange("image_url", e.target.value)} placeholder="https://..." className="mt-1 bg-background border-border" />
              {form.image_url && (
                <div className="mt-2 h-28 w-full rounded-md overflow-hidden border border-border bg-muted/20">
                  <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-primary via-red-600 to-secondary">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
