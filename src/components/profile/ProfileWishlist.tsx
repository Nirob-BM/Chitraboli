import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  TrendingDown, 
  Bell,
  BellOff,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";

export function ProfileWishlist() {
  const { items, loading, removeFromWishlist, updateNotifications, getPriceChanges } = useWishlist();
  const { addItem } = useCart();

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-72 w-full" />
        ))}
      </div>
    );
  }

  const priceDrops = getPriceChanges();

  if (items.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardContent className="py-12 text-center">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Your wishlist is empty</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Save items you love and we'll notify you about price drops
          </p>
          <Button asChild>
            <Link to="/shop">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Drop Alert */}
      {priceDrops.length > 0 && (
        <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-green-500" />
              <h3 className="font-medium text-green-600">Price Drops!</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {priceDrops.length} item{priceDrops.length > 1 ? 's' : ''} in your wishlist 
              {priceDrops.length === 1 ? ' has' : ' have'} dropped in price!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Wishlist Items */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(item => {
          const product = item.product;
          if (!product) return null;

          const hasPriceDrop = item.price_at_add && product.price < item.price_at_add;
          const priceDrop = hasPriceDrop ? item.price_at_add! - product.price : 0;
          const priceDropPercent = hasPriceDrop ? (priceDrop / item.price_at_add!) * 100 : 0;

          return (
            <Card 
              key={item.id} 
              className="bg-card/50 backdrop-blur border-border/50 overflow-hidden group hover:border-primary/30 transition-colors"
            >
              {/* Product Image */}
              <Link to={`/product/${product.id}`} className="block">
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Price Drop Badge */}
                  {hasPriceDrop && (
                    <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      {priceDropPercent.toFixed(0)}% off
                    </Badge>
                  )}

                  {/* Stock Status */}
                  {!product.in_stock && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Badge variant="destructive">Out of Stock</Badge>
                    </div>
                  )}
                </div>
              </Link>

              <CardContent className="p-4 space-y-3">
                {/* Product Info */}
                <div>
                  <Link 
                    to={`/product/${product.id}`}
                    className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground capitalize">{product.category}</p>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-primary">
                    ৳{product.price.toLocaleString()}
                  </span>
                  {hasPriceDrop && (
                    <span className="text-sm text-muted-foreground line-through">
                      ৳{item.price_at_add!.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Notification Toggles */}
                <div className="flex items-center gap-2 text-xs">
                  <Button
                    variant={item.notify_price_drop ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => updateNotifications(item.product_id, !item.notify_price_drop, item.notify_stock)}
                  >
                    {item.notify_price_drop ? (
                      <Bell className="w-3 h-3 mr-1" />
                    ) : (
                      <BellOff className="w-3 h-3 mr-1" />
                    )}
                    Price
                  </Button>
                  <Button
                    variant={item.notify_stock ? "secondary" : "ghost"}
                    size="sm"
                    className="h-7 px-2"
                    onClick={() => updateNotifications(item.product_id, item.notify_price_drop, !item.notify_stock)}
                  >
                    {item.notify_stock ? (
                      <Bell className="w-3 h-3 mr-1" />
                    ) : (
                      <BellOff className="w-3 h-3 mr-1" />
                    )}
                    Stock
                  </Button>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    disabled={!product.in_stock}
                    onClick={() => {
                      addItem({
                        name: product.name,
                        price: product.price,
                        image: product.image_url || undefined
                      });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Add to Cart
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => removeFromWishlist(item.product_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
