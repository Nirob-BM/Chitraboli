import { Skeleton } from "@/components/ui/skeleton";

export const HeroSkeleton = () => (
  <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-muted/50 to-background animate-pulse">
    <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
      <Skeleton className="h-16 md:h-24 w-3/4 mx-auto mb-4" />
      <Skeleton className="h-8 w-1/2 mx-auto mb-8" />
      <Skeleton className="h-4 w-2/3 mx-auto mb-4" />
      <Skeleton className="h-4 w-1/2 mx-auto mb-12" />
      <div className="flex gap-4 justify-center">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-12 w-40" />
      </div>
    </div>
  </section>
);

export const ProductGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="space-y-4 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
        <Skeleton className="aspect-square w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-10 w-full" />
      </div>
    ))}
  </div>
);

export const FeaturesSkeleton = () => (
  <section className="py-20 bg-card">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="text-center p-8 rounded-lg bg-background/50 border border-border/50 animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-6" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

export const CategoryFilterSkeleton = () => (
  <div className="flex flex-wrap gap-3 justify-center mb-12">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-24 rounded-full" style={{ animationDelay: `${i * 0.1}s` }} />
    ))}
  </div>
);

export const ShopPageSkeleton = () => (
  <>
    <section className="py-16 bg-card">
      <div className="container mx-auto px-4 text-center">
        <Skeleton className="h-12 w-64 mx-auto mb-4" />
        <Skeleton className="h-4 w-96 max-w-full mx-auto" />
      </div>
    </section>
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        <CategoryFilterSkeleton />
        <ProductGridSkeleton count={8} />
      </div>
    </section>
  </>
);

export const PageHeaderSkeleton = () => (
  <section className="py-16 bg-card">
    <div className="container mx-auto px-4 text-center">
      <Skeleton className="h-12 w-64 mx-auto mb-4" />
      <Skeleton className="h-4 w-80 max-w-full mx-auto" />
    </div>
  </section>
);

export const CollectionGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      </div>
    ))}
  </div>
);

// Generic page skeleton for lazy loading fallback
export const PageSkeleton = () => (
  <div className="min-h-screen bg-background">
    <HeroSkeleton />
    <FeaturesSkeleton />
  </div>
);
