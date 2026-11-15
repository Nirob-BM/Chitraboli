import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useState, lazy, Suspense } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
const CheckoutModal = lazy(() => import("./CheckoutModal").then(m=>({default:m.CheckoutModal})));

export const CartDrawer = () => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen, syncing } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-gold/20 flex flex-col h-dvh">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-foreground flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-gold" />
              Your Cart ({totalItems})
            </SheetTitle>
            <SheetDescription className="sr-only">Review your items and quantities before checkout.</SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col flex-1 min-h-0">
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                <ShoppingBag className="w-16 h-16 mb-4 opacity-50" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-background/50 rounded-lg border border-gold/10"
                    >
                      <img
                        src={item.product_image}
                        alt={item.product_name}
                        className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-cover rounded-md"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display text-foreground break-words">{item.product_name}</h4>
                        <p className="text-gold font-semibold">৳{(item.product_price * item.quantity).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{item.quantity} × ৳{item.product_price.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button type="button" variant="ghost" size="icon"
                            aria-label={`Decrease quantity of ${item.product_name}`}
                            disabled={syncing}
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-11 h-11 shrink-0 rounded-full bg-muted flex items-center justify-center hover:bg-gold/20 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button type="button" variant="ghost" size="icon"
                            aria-label={`Increase quantity of ${item.product_name}`}
                            disabled={syncing}
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-11 h-11 shrink-0 rounded-full bg-muted flex items-center justify-center hover:bg-gold/20 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon"
                        aria-label={`Remove ${item.product_name} from cart`}
                        disabled={syncing}
                        onClick={() => removeItem(item.product_id)}
                        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gold/20 pt-4 mt-4">
                  <div className="flex justify-between text-lg mb-4">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-display text-gold text-2xl">৳{totalPrice.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Delivery charge confirmed before dispatch; not included here.</p>
                  <Button
                    disabled={syncing}
                    onClick={() => {
                      setIsOpen(false);
                      setCheckoutOpen(true);
                    }}
                    className="w-full bg-gradient-to-r from-gold to-gold-light text-background hover:opacity-90 text-lg py-6"
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {checkoutOpen && <ErrorBoundary><Suspense fallback={<div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">Opening checkout…</div>}><CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} /></Suspense></ErrorBoundary>}
    </>
  );
};
