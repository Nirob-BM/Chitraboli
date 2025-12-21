import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, View, Sparkles } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { Product3DViewer } from "@/components/Product3DViewer";
import { ARTryOn } from "@/components/ARTryOn";

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  image: string;
  category?: string;
}

export function ProductCard({ id, name, price, image, category }: ProductCardProps) {
  const { addItem } = useCart();
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [showARTryOn, setShowARTryOn] = useState(false);

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
    <>
      <div className="group relative bg-card rounded-lg overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-gold">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Quick Action Buttons - Top Right */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShow3DViewer(true)}
              className="h-9 w-9 bg-background/90 backdrop-blur border-primary/30 hover:bg-primary hover:text-primary-foreground"
              title="360° View"
            >
              <View className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowARTryOn(true)}
              className="h-9 w-9 bg-background/90 backdrop-blur border-primary/30 hover:bg-primary hover:text-primary-foreground"
              title="Virtual Try-On"
            >
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>

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

      {/* 3D Viewer Modal */}
      <Product3DViewer
        isOpen={show3DViewer}
        onClose={() => setShow3DViewer(false)}
        productName={name}
        productImage={image}
        category={category}
      />

      {/* AR Try-On Modal */}
      <ARTryOn
        isOpen={showARTryOn}
        onClose={() => setShowARTryOn(false)}
        productName={name}
        productImage={image}
        category={category}
      />
    </>
  );
}
