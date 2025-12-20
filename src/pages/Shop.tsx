import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const Shop = () => {
  const { products, loading, getCategories } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = getCategories();
  
  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

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
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-gold" />
            </div>
          ) : (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-3 justify-center mb-12">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={cn(
                    "px-6 py-2 rounded-full font-body text-sm transition-all duration-300",
                    selectedCategory === "All"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  All
                </button>
                {categories.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cn(
                      "px-6 py-2 rounded-full font-body text-sm transition-all duration-300",
                      selectedCategory === category.name
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image_url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600"}
                    category={product.category}
                  />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">No products found in this category.</p>
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
