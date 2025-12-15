import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { CheckoutModal } from "./CheckoutModal";

export const CartDrawer = () => {
  const { items, removeItem, updateQuantity, totalItems, totalPrice, isOpen, setIsOpen } = useCart();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg bg-card border-gold/20">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl text-foreground flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-gold" />
              Your Cart ({totalItems})
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 flex flex-col h-[calc(100vh-200px)]">
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
                        className="w-20 h-20 object-cover rounded-md"
                      />
                      <div className="flex-1">
                        <h4 className="font-display text-foreground">{item.product_name}</h4>
                        <p className="text-gold font-semibold">৳{item.product_price.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-gold/20 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-gold/20 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gold/20 pt-4 mt-4">
                  <div className="flex justify-between text-lg mb-4">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-display text-gold text-2xl">৳{totalPrice.toLocaleString()}</span>
                  </div>
                  <Button
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

      <CheckoutModal open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </>
  );
};
