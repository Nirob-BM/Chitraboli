import { ProductCard } from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Percent, Flame } from "lucide-react";
import { ProductGridSkeleton } from "@/components/PageSkeleton";

export const SpecialOffersSection = () => {
  const { products, loading } = useProducts();
  
  // Get featured products as "special offers" (first 4 featured items)
  const specialOffers = products.filter(p => p.featured).slice(0, 4);

  if (loading) {
    return (
      <section className="py-20 bg-card relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground mb-4">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-medium">Hot Deals</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
              Special <span className="text-gold">Offers</span>
            </h2>
          </div>
          <ProductGridSkeleton count={4} />
        </div>
      </section>
    );
  }

  if (specialOffers.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-card relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-32 h-32 rounded-full bg-destructive/10 blur-3xl" />
      <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground mb-4 animate-pulse">
            <Flame className="h-4 w-4" />
            <span className="text-sm font-medium">Hot Deals</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
            Special <span className="text-gold">Offers</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Don't miss out on our exclusive deals and limited-time offers on handcrafted jewellery.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {specialOffers.map((product, index) => (
            <div
              key={product.id}
              className="relative animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Deal Badge */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                <Percent className="h-3 w-3" />
                Special
              </div>
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

        <div className="text-center mt-12">
          <Button variant="hero" size="lg" asChild>
            <Link to="/shop">
              View All Deals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
