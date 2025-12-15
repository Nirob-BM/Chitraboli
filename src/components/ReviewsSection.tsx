import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  reviewer_name: string;
  rating: number;
  review_text: string;
  images: string[];
  created_at: string;
}

export const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const reviewsPerPage = 6;

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setReviews(data);
    }
  };

  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const currentReviews = reviews.slice(
    currentPage * reviewsPerPage,
    (currentPage + 1) * reviewsPerPage
  );

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-4 h-4",
            i < rating ? "text-gold fill-gold" : "text-muted-foreground"
          )}
        />
      ));
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            What Our <span className="text-gold">Customers</span> Say
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Real reviews from our beloved customers who cherish their Chitraboli jewellery
          </p>
        </div>

        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground">Loading reviews...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-background/50 backdrop-blur-sm rounded-xl p-6 border border-gold/10 hover:border-gold/30 transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-rose-gold flex items-center justify-center text-background font-display text-lg">
                      {review.reviewer_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-display text-foreground">{review.reviewer_name}</h4>
                      <div className="flex gap-0.5">{renderStars(review.rating)}</div>
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                    {review.review_text}
                  </p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.slice(0, 4).map((image, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(image)}
                          className="relative w-16 h-16 rounded-lg overflow-hidden group"
                        >
                          <img
                            src={image}
                            alt={`Review by ${review.reviewer_name}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                          />
                          {idx === 3 && review.images.length > 4 && (
                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                              <span className="text-foreground text-sm">+{review.images.length - 4}</span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-50 hover:bg-gold/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-muted-foreground">
                  {currentPage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-50 hover:bg-gold/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-xl flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={selectedImage}
            alt="Review"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};
