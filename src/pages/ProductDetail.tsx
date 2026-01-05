import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ShoppingCart, ArrowLeft, Star, Minus, Plus, Check, Truck, Shield, RotateCcw } from "lucide-react";
import { ReviewsSection } from "@/components/ReviewsSection";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  description: string | null;
  featured: boolean;
  in_stock: boolean;
  colors: string[] | null;
  sizes: string[] | null;
}

const ProductDetailSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
    <div className="space-y-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-md" />
        ))}
      </div>
    </div>
    <div className="space-y-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-10 w-3/4" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProduct(data);
        
        // Set default selections
        if (data?.colors?.length) setSelectedColor(data.colors[0]);
        if (data?.sizes?.length) setSelectedSize(data.sizes[0]);
      } catch (err) {
        console.error("Error fetching product:", err);
        toast({
          title: "Error",
          description: "Failed to load product details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    
    for (let i = 0; i < quantity; i++) {
      addItem({
        product_id: product.id,
        product_name: product.name,
        product_price: product.price,
        product_image: product.image_url,
      });
    }
    
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
  };

  // Generate multiple image views from single image (simulated gallery)
  const getProductImages = () => {
    if (!product?.image_url) return [];
    // For now, use the same image for gallery - can be extended for multiple images
    return [product.image_url, product.image_url, product.image_url, product.image_url];
  };

  const images = getProductImages();

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Button variant="ghost" size="sm" asChild className="group">
              <Link to="/shop">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Shop
              </Link>
            </Button>
          </nav>

          {loading ? (
            <ProductDetailSkeleton />
          ) : !product ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-display text-foreground mb-4">Product Not Found</h2>
              <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/shop">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Image Gallery */}
                <div className="space-y-4">
                  <div className="aspect-square overflow-hidden rounded-lg bg-muted border border-border/50">
                    <img
                      src={images[selectedImageIndex] || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800"}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square overflow-hidden rounded-md border-2 transition-all ${
                          selectedImageIndex === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} view ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                  {/* Category & Stock */}
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="uppercase tracking-wider">
                      {product.category}
                    </Badge>
                    {product.in_stock ? (
                      <Badge variant="outline" className="text-green-600 border-green-600/30">
                        <Check className="h-3 w-3 mr-1" />
                        In Stock
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-destructive border-destructive/30">
                        Out of Stock
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                    {product.name}
                  </h1>

                  {/* Price */}
                  <p className="text-3xl font-bold text-primary">
                    ৳ {product.price.toLocaleString()}
                  </p>

                  {/* Description */}
                  {product.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  <Separator />

                  {/* Color Selection */}
                  {product.colors && product.colors.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Color: <span className="text-muted-foreground">{selectedColor}</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 rounded-md border text-sm transition-all ${
                              selectedColor === color
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Size Selection */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-foreground">
                        Size: <span className="text-muted-foreground">{selectedSize}</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 rounded-md border text-sm transition-all ${
                              selectedSize === size
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">Quantity</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium text-lg">{quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Add to Cart */}
                  <Button
                    variant="gold"
                    size="lg"
                    className="w-full text-lg py-6"
                    onClick={handleAddToCart}
                    disabled={!product.in_stock}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Add to Cart - ৳ {(product.price * quantity).toLocaleString()}
                  </Button>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Truck className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Fast Delivery</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <Shield className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Secure Payment</span>
                    </div>
                    <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                      <RotateCcw className="h-5 w-5 text-primary mb-2" />
                      <span className="text-xs text-muted-foreground">Easy Returns</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-16">
                <Separator className="mb-12" />
                <ReviewsSection />
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
