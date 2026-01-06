import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, Product } from "@/hooks/useProducts";
import { useState, useMemo } from "react";
import { ShopFilters } from "@/components/ShopFilters";
import { CategoryFilterSkeleton, ProductGridSkeleton } from "@/components/PageSkeleton";

const Shop = () => {
  const { products, loading, getCategories } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOption, setSortOption] = useState<string>("newest");

  const categories = getCategories();

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== "All") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
    }

    // Sort products
    switch (sortOption) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "name-az":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "newest":
      default:
        // Already sorted by created_at desc from the hook
        break;
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortOption]);

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
            Our <span className="text-gold">Collection</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover our complete collection of handcrafted jewellery, each piece made with love and passion.
          </p>
        </div>
      </section>

      {/* Filters & Products */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          {loading ? (
            <>
              <CategoryFilterSkeleton />
              <ProductGridSkeleton count={8} />
            </>
          ) : (
            <>
              <ShopFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortOption={sortOption}
                onSortChange={setSortOption}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
              />

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredAndSortedProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image_url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"}
                      category={product.category}
                    />
                  </div>
                ))}
              </div>

              {filteredAndSortedProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    {searchQuery ? "No products found matching your search." : "No products found in this category."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Shop;
