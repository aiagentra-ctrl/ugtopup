import { useState, useEffect } from "react";
import { fetchProductById, updateProduct, Product } from "@/lib/productApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export const EditProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_id: "",
    name: "",
    category: "",
    description: "",
    price: "",
    original_price: "",
    quantity: "",
    stock_status: "in_stock",
    image_url: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productId) {
      loadProduct();
    } else {
      navigate("/admin?section=products");
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      const data = await fetchProductById(productId!);
      if (data) {
        setProduct(data);
        setFormData({
          product_id: data.product_id,
          name: data.name,
          category: data.category,
          description: data.description || "",
          price: String(data.price),
          original_price: data.original_price ? String(data.original_price) : "",
          quantity: data.quantity ? String(data.quantity) : "",
          stock_status: data.stock_status,
          image_url: data.image_url || "",
          is_active: data.is_active,
        });
      } else {
        toast.error("Product not found");
        navigate("/admin?section=products");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load product");
      navigate("/admin?section=products");
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.product_id.trim()) newErrors.product_id = "Product ID is required";
    if (!formData.name.trim() || formData.name.length < 3) newErrors.name = "Name must be at least 3 characters";
    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.price || Number(formData.price) <= 0) newErrors.price = "Price must be a positive number";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !product) {
      toast.error("Please fix form errors");
      return;
    }

    setLoading(true);
    try {
      await updateProduct(product.id, {
        product_id: formData.product_id,
        name: formData.name,
        category: formData.category,
        description: formData.description || undefined,
        price: Number(formData.price),
        original_price: formData.original_price ? Number(formData.original_price) : undefined,
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
        stock_status: formData.stock_status as any,
        image_url: formData.image_url || undefined,
        is_active: formData.is_active,
      });

      toast.success("✅ Product updated successfully");
      navigate("/admin?section=products");
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/admin?section=products")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold text-foreground">Edit Product</h2>
          <p className="text-muted-foreground">Update product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>Modify the information below to update the product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Product ID */}
              <div className="space-y-2">
                <Label htmlFor="product_id">Product ID *</Label>
                <Input
                  id="product_id"
                  placeholder="e.g., ml-1000, design-logo"
                  value={formData.product_id}
                  onChange={(e) => handleChange("product_id", e.target.value)}
                  className={errors.product_id ? "border-destructive" : ""}
                />
                {errors.product_id && <p className="text-sm text-destructive">{errors.product_id}</p>}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 1000 Diamonds"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={errors.name ? "border-destructive" : ""}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(val) => handleChange("category", val)}>
                  <SelectTrigger className={errors.category ? "border-destructive" : ""}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freefire">Free Fire</SelectItem>
                    <SelectItem value="mobile_legends">Mobile Legends</SelectItem>
                    <SelectItem value="roblox">Roblox</SelectItem>
                    <SelectItem value="design">Design Services</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="netflix">Netflix</SelectItem>
                    <SelectItem value="garena">Garena Shell</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="smilecoin">Smile Coin</SelectItem>
                    <SelectItem value="chatgpt">ChatGPT</SelectItem>
                    <SelectItem value="unipin">Unipin UC</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="997"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className={errors.price ? "border-destructive" : ""}
                />
                {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
              </div>

              {/* Original Price */}
              <div className="space-y-2">
                <Label htmlFor="original_price">Original Price (₹) - Optional</Label>
                <Input
                  id="original_price"
                  type="number"
                  placeholder="1499"
                  value={formData.original_price}
                  onChange={(e) => handleChange("original_price", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">For showing discounts</p>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity - Optional</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="1000"
                  value={formData.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">For diamonds, robux, etc.</p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Product description..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
              />
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                type="url"
                placeholder="https://..."
                value={formData.image_url}
                onChange={(e) => handleChange("image_url", e.target.value)}
              />
            </div>

            {/* Stock Status */}
            <div className="space-y-2">
              <Label>Stock Status</Label>
              <RadioGroup value={formData.stock_status} onValueChange={(val) => handleChange("stock_status", val)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="in_stock" id="in_stock" />
                  <Label htmlFor="in_stock" className="font-normal">In Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="out_of_stock" id="out_of_stock" />
                  <Label htmlFor="out_of_stock" className="font-normal">Out of Stock</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="coming_soon" id="coming_soon" />
                  <Label htmlFor="coming_soon" className="font-normal">Coming Soon</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin?section=products")}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
