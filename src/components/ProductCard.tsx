import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";

interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  image: string;
  category?: string;
}

export function ProductCard({ id, name, price, image, category }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = () => {
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
    <div className="group relative bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Quick Add Button */}
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
          <Button
            variant="gold"
            className="w-full"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {category && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
            {category}
          </p>
        )}
        <h3 className="font-display text-lg font-medium text-foreground mb-2 group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-primary font-semibold">
          ৳ {price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
