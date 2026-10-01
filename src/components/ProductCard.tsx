import React from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { toast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  image: string;
  category?: string;
  sizes?: string[] | null;
  colors?: string[] | null;
  stockQuantity?: number | null;
}

export const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ id, name, price, image, category, sizes, colors, stockQuantity }, ref) => {
    const { addItem } = useCart();

    const handleAddToCart = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      addItem({
        product_id: String(id),
        product_name: name,
        product_price: price,
        product_image: image,
      });
      toast({
        title: "Added to Cart",
        description: `${name} has been added to your cart.`,
      });
    };

    return (
      <Link to={`/product/${id}`}>
        <div
          ref={ref}
          className="group relative bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold cursor-pointer"
        >
          {/* Image */}
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={image}
              alt={`Handcrafted ${name} jewellery`}
              width={400}
              height={400}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Quick Add Button */}
            <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
              <Button variant="gold" className="w-full" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>

          {/* Info */}
          <div className="p-3 sm:p-4">
            {category && (
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1 truncate">
                {category}
              </p>
            )}
            <h3 className="font-display text-sm sm:text-base md:text-lg font-medium text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5em] leading-snug">
              {name}
            </h3>
            <p className="text-primary font-semibold text-sm sm:text-base">৳ {price.toLocaleString()}</p>
            {(colors?.length || sizes?.length) ? (
              <p className="mt-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                {[colors?.length ? `${colors.length} color${colors.length > 1 ? "s" : ""}` : null, sizes?.length ? `Sizes: ${sizes.join(", ")}` : null].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {typeof stockQuantity === "number" && stockQuantity > 0 && stockQuantity <= 5 && (
              <p className="mt-1 text-[10px] sm:text-xs text-destructive font-medium">Only {stockQuantity} left</p>
            )}
          </div>
        </div>
      </Link>
    );
  }
);

ProductCard.displayName = "ProductCard";
