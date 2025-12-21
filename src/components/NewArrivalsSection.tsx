import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

export function NewArrivalsSection() {
  const { products, loading } = useProducts();
  
  // Get the 4 most recently added products
  const newArrivals = products.slice(0, 4);

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <div className="absolute top-20 right-0 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 left-0 w-64 h-64 rounded-full bg-secondary/10 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Just Dropped</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-foreground">
              New{" "}
              <span className="text-gold font-medium italic">Arrivals</span>
            </h2>
            <p className="text-muted-foreground max-w-md text-lg">
              Discover our latest handcrafted pieces, fresh from our artisans' workshop
            </p>
          </div>
          
          <Button variant="outline" size="lg" className="group self-start md:self-auto" asChild>
            <Link to="/shop">
              <Clock className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
              Shop All New
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : newArrivals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {newArrivals.map((product, index) => (
              <div
                key={product.id}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="relative group">
                  {/* "New" Badge */}
                  <div className="absolute top-4 left-4 z-20 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold uppercase tracking-wider shadow-lg">
                    New
                  </div>
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image_url || "/placeholder.svg"}
                    category={product.category}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card/50 rounded-2xl border border-border/50">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">New arrivals coming soon!</p>
            <p className="text-muted-foreground/70 text-sm mt-2">Check back for our latest creations</p>
          </div>
        )}

        {/* Bottom decorative line */}
        <div className="mt-16 flex items-center justify-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-primary/30" />
          <Sparkles className="h-5 w-5 text-primary/50" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-primary/30" />
        </div>
      </div>
    </section>
  );
}
