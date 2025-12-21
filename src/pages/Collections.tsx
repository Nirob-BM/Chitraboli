import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Collections = () => {
  const { data: collections, isLoading } = useQuery({
    queryKey: ['collections-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Get product count for each collection category
  const { data: productCounts } = useQuery({
    queryKey: ['product-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('category');
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(product => {
        const cat = product.category.toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <Layout>
      {/* Header */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
            Our <span className="text-gold">Collections</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Explore our curated collections, each telling a unique story of craftsmanship and beauty.
          </p>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : collections && collections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {collections.map((collection) => {
                const categoryLink = collection.link_category 
                  ? `/shop?category=${collection.link_category.toLowerCase()}`
                  : '/shop';
                const itemCount = collection.link_category 
                  ? productCounts?.[collection.link_category.toLowerCase()] || 0
                  : 0;

                return (
                  <Link
                    key={collection.id}
                    to={categoryLink}
                    className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-card border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold"
                  >
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8">
                      <p className="text-primary text-sm font-medium mb-2">
                        {itemCount} Items
                      </p>
                      <h3 className="font-display text-2xl md:text-3xl font-medium text-foreground mb-2 group-hover:text-gold transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {collection.description}
                      </p>
                      <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
                        <span className="font-medium text-sm">Explore Collection</span>
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No collections available yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            We also create custom pieces. Contact us to discuss your unique jewellery vision.
          </p>
          <Button variant="gold" size="lg" asChild>
            <Link to="/contact">
              Contact Us
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Collections;
