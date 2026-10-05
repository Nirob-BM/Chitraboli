import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface RelatedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  images: string[] | null;
  category: string;
  colors: string[] | null;
  featured: boolean | null;
  in_stock: boolean | null;
}

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
  /** Tag-like attributes (colors/sizes) used to rank relevance */
  tags?: (string | null)[] | null;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400";

export const RelatedProducts = ({
  currentProductId,
  category,
  tags,
}: RelatedProductsProps) => {
  const [products, setProducts] = useState<RelatedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRelated = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("id, slug, name, price, image_url, images, category, colors, featured, in_stock")
          .eq("category", category)
          .neq("id", currentProductId)
          .limit(12);

        if (error) throw error;

        const tagSet = new Set(
          (tags ?? []).filter((t): t is string => Boolean(t))
        );

        // Rank by shared tag/color overlap, then featured, then newest
        const ranked = (data ?? [])
          .map((p) => ({
            ...p,
            _score:
              (p.colors?.filter((c) => tagSet.has(c)).length ?? 0) * 2 +
              (p.featured ? 1 : 0),
          }))
          .sort((a, b) => b._score - a._score);

        setProducts(ranked);
      } catch (err) {
        console.error("Error fetching related products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelated();
  }, [currentProductId, category, JSON.stringify(tags)]);

  const scrollBy = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!loading && products.length === 0) return null;

  return (
    <section className="mt-16" aria-label="Related products">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground">
          You May Also <span className="text-gradient-gold">Like</span>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy("left")}
            aria-label="Scroll related products left"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollBy("right")}
            aria-label="Scroll related products right"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Related products carousel"
      >
        {loading
          ? [...Array(4)].map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-[46%] sm:w-[31%] lg:w-[23%] snap-start"
              >
                <Skeleton className="aspect-square w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))
          : products.map((p) => (
              <div
                key={p.id}
                className="shrink-0 w-[46%] sm:w-[31%] lg:w-[23%] snap-start"
              >
                <ProductCard
                  id={p.id}
                  slug={p.slug}
                  name={p.name}
                  price={p.price}
                  image={p.image_url || p.images?.[0] || FALLBACK_IMAGE}
                  category={p.category}
                />
              </div>
            ))}
      </div>
    </section>
  );
};
