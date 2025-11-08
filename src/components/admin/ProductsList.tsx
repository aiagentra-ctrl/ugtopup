import { useState, useEffect } from "react";
import { fetchAllProducts, deleteProduct, updateProduct, Product } from "@/lib/productApi";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, Search, Plus, Package, Check, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductsListProps {
  initialCategory?: string;
}

export const ProductsList = ({ initialCategory }: ProductsListProps = {}) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || "all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");

  const loadProducts = async () => {
    setLoading(true);
    try {
      const filters = {
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        stock_status: stockFilter !== "all" ? stockFilter : undefined,
        search: search || undefined,
      };
      const data = await fetchAllProducts(filters);
      setProducts(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [categoryFilter, stockFilter, search]);

  // Real-time subscription for product changes
  useEffect(() => {
    const channel = supabase
      .channel("admin-products-realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "products",
      }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [categoryFilter, stockFilter, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      toast.success("Product deleted successfully");
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeleteId(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      toast.success(`Product ${product.is_active ? 'deactivated' : 'activated'}`);
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product");
    }
  };

  const handlePriceEdit = (product: Product) => {
    setEditingPriceId(product.id);
    setEditingPrice(product.price.toString());
  };

  const handlePriceSave = async (productId: string) => {
    try {
      const newPrice = parseFloat(editingPrice);
      if (isNaN(newPrice) || newPrice <= 0) {
        toast.error("Please enter a valid price");
        return;
      }
      await updateProduct(productId, { price: newPrice });
      toast.success("✅ Price updated successfully");
      setEditingPriceId(null);
      setEditingPrice("");
      loadProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update price");
    }
  };

  const handlePriceCancel = () => {
    setEditingPriceId(null);
    setEditingPrice("");
  };

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      freefire: "bg-red-500/20 text-red-400 border-red-500/30",
      mobile_legends: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      roblox: "bg-green-500/20 text-green-400 border-green-500/30",
      design: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      tiktok: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      netflix: "bg-red-600/20 text-red-500 border-red-600/30",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  const getStockBadge = (status: string) => {
    const variants: Record<string, string> = {
      in_stock: "bg-green-500/20 text-green-400 border-green-500/30",
      out_of_stock: "bg-red-500/20 text-red-400 border-red-500/30",
      coming_soon: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    };
    return variants[status] || "bg-muted";
  };

  const paginatedProducts = products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Products Management</h2>
          <p className="text-muted-foreground">Manage all products across categories</p>
        </div>
        <Button
          onClick={() => navigate("/admin?section=add-product")}
          className="bg-gradient-to-r from-primary via-red-600 to-secondary hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card className="bg-slate-950/50 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Products List
          </CardTitle>
          <CardDescription>Browse and manage all products</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or product ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background border-border"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="freefire">Free Fire</SelectItem>
                <SelectItem value="mobile_legends">Mobile Legends</SelectItem>
                <SelectItem value="roblox">Roblox</SelectItem>
                <SelectItem value="design">Design Services</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="netflix">Netflix</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border">
                <SelectValue placeholder="All Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                <SelectItem value="coming_soon">Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No products found</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-primary/20 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-900/50 hover:bg-slate-900/50">
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="max-w-xs">Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => (
                      <TableRow key={product.id} className="hover:bg-slate-900/30 border-primary/10">
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-900 border border-primary/20 flex items-center justify-center group hover:border-primary/50 transition-all">
                                  {product.image_url ? (
                                    <img 
                                      src={product.image_url} 
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                  ) : (
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="bg-slate-900 border-primary/20">
                                <div className="space-y-1 text-xs">
                                  <p><strong>ID:</strong> {product.product_id}</p>
                                  <p><strong>Created:</strong> {new Date(product.created_at).toLocaleDateString()}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryBadge(product.category)}>
                            {product.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <p className="text-sm text-muted-foreground truncate cursor-help">
                                  {product.description || "No description"}
                                </p>
                              </TooltipTrigger>
                              {product.description && (
                                <TooltipContent className="max-w-sm bg-slate-900 border-primary/20">
                                  <p className="text-xs">{product.description}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          {editingPriceId === product.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                className="w-24 h-8 text-sm bg-slate-900 border-primary/30"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-green-500/20 hover:text-green-400"
                                onClick={() => handlePriceSave(product.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 hover:bg-destructive/20 hover:text-destructive"
                                onClick={handlePriceCancel}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePriceEdit(product)}
                              className="font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-2 group"
                            >
                              ₹{product.price}
                              <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={product.is_active ? "default" : "secondary"}
                            className={product.is_active ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(product)}
                              className="hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              {product.is_active ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/admin?section=edit-product&id=${product.id}`)}
                              className="hover:bg-blue-500/10 hover:text-blue-400 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(product.id)}
                              className="hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
