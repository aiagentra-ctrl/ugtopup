import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fetchWishlist, removeFromWishlist, type WishlistItem } from "@/lib/wishlistApi";

const Wishlist = () => {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setItems(await fetchWishlist()); }
    catch { toast.error('Failed to load wishlist'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (productId: string) => {
    try {
      await removeFromWishlist(productId);
      toast.success('Removed from wishlist');
      load();
    } catch { toast.error('Failed to remove'); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Heart className="h-6 w-6 text-destructive" /> My Wishlist
          </h1>
          <p className="text-sm text-muted-foreground">Products you've saved for later</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-1">Wishlist is empty</h3>
              <p className="text-muted-foreground text-sm">Save products you like and they'll appear here</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <Card key={item.id}>
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">Added {format(new Date(item.created_at), 'MMM dd, yyyy')}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.product_id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Wishlist;
