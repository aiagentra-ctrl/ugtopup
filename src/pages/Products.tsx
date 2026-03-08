import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Recommendations } from "@/components/Recommendations";
import { useDynamicProducts } from "@/hooks/useDynamicProducts";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Products = () => {
  const { products, categories, loading } = useDynamicProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const filtered = useMemo(() => {
    let result = [...products];

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category_id === selectedCategory);
    }

    // Sort
    switch (sortBy) {
      case "name-asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "price-low":
        result.sort((a, b) => (a.discount_price ?? a.price) - (b.discount_price ?? b.price));
        break;
      case "price-high":
        result.sort((a, b) => (b.discount_price ?? b.price) - (a.discount_price ?? a.price));
        break;
      case "newest":
        result.sort((a, b) => b.display_order - a.display_order);
        break;
      default:
        break;
    }

    return result;
  }, [products, search, selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">All Products</h1>
          <p className="text-muted-foreground text-sm mt-1">Browse our full catalog of games, subscriptions, and services.</p>
        </div>

        {/* Trending Section */}
        <Recommendations type="trending" />

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px] bg-card border-border">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No products found.</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                image={product.image_url || "/placeholder.svg"}
                title={product.title}
                link={product.link || undefined}
                badgeText={product.offers?.badge_text || product.offer_badge_text || undefined}
                badgeColor={product.offers?.badge_color || product.offer_badge_color || undefined}
                badgeTextColor={product.offers?.badge_text_color || undefined}
                badgeAnimation={product.offers?.animation_type || undefined}
              />
            ))}
          </div>
        )}

        {/* Popular Section */}
        <Recommendations type="popular" />
      </main>
      <Footer />
    </div>
  );
};

export default Products;
