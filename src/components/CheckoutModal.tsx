import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, MessageCircle, Banknote, Copy } from "lucide-react";
import { formatOrderForWhatsApp } from "@/utils/orderNotification";
import { z } from "zod";

// Zod schema for order item validation
const OrderItemSchema = z.object({
  product_id: z.string().min(1),
  product_name: z.string().min(1).max(200),
  product_price: z.number().positive(),
  quantity: z.number().int().positive(),
  product_image: z.string().nullable().optional()
});

const OrderItemsSchema = z.array(OrderItemSchema).min(1);

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CheckoutModal = ({ open, onOpenChange }: CheckoutModalProps) => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  const PAYMENT_NUMBER = "01308697630";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const sessionId = localStorage.getItem("chitraboli-session") || "";
      
      // Validate and sanitize order items
      const validatedItems = OrderItemsSchema.parse(items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_price: item.product_price,
        quantity: item.quantity,
        product_image: item.product_image || null
      })));
      
      const { data: orderData, error } = await supabase.from("orders").insert([{
        session_id: sessionId,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: formData.address,
        items: validatedItems,
        total_amount: totalPrice,
        status: "pending",
        payment_method: paymentMethod,
        transaction_id: paymentMethod !== "cod" ? transactionId.trim() : null,
      }]).select().single();

      if (error) throw error;

      // Generate WhatsApp URL for user to click (not auto-open which gets blocked)
      if (orderData) {
        const message = formatOrderForWhatsApp({
          orderId: orderData.id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          items: items.map(item => ({
            name: item.product_name,
            price: item.product_price,
            quantity: item.quantity
          })),
          totalAmount: totalPrice
        });
        const encodedMessage = encodeURIComponent(message);
        setWhatsappUrl(`https://wa.me/8801308697630?text=${encodedMessage}`);
      }

      setOrderPlaced(true);
      clearCart();
      
      toast({
        title: "Order Placed Successfully!",
        description: "We'll contact you shortly to confirm your order.",
      });

      // Don't auto-close, let user click WhatsApp button or close manually
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setOrderPlaced(false);
    setWhatsappUrl(null);
    setTransactionId("");
    setPaymentMethod("cod");
    setFormData({ name: "", email: "", phone: "", address: "" });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Number copied to clipboard",
    });
  };

  if (orderPlaced) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="bg-card border-gold/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Order Confirmed</DialogTitle>
            <DialogDescription className="sr-only">Your order has been placed successfully</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4 animate-scale-in">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="font-display text-2xl text-foreground mb-2">Order Confirmed!</h2>
            <p className="text-muted-foreground text-center mb-6">
              Thank you for your order. We'll reach out to you soon.
            </p>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                Send Order via WhatsApp
              </a>
            )}
            <Button variant="ghost" className="mt-4" onClick={handleClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-gold/20 max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-foreground">Checkout</DialogTitle>
          <DialogDescription>Fill in your details to complete your order</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Full Name *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background border-gold/20 focus:border-gold"
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Email *</label>
            <Input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-background border-gold/20 focus:border-gold"
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Phone Number *</label>
            <Input
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-background border-gold/20 focus:border-gold"
              placeholder="Enter your phone number"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Delivery Address *</label>
            <Textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="bg-background border-gold/20 focus:border-gold min-h-[100px]"
              placeholder="Enter your full delivery address"
            />
          </div>

          {/* Payment Method Selection */}
          <div className="border-t border-gold/20 pt-4">
            <label className="text-sm text-muted-foreground mb-3 block">Payment Method *</label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as "cod" | "bkash" | "nagad")}
              className="space-y-3"
            >
              {/* Cash on Delivery */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors">
                <RadioGroupItem value="cod" id="cod" />
                <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Banknote className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="font-medium">Cash on Delivery</span>
                </Label>
              </div>

              {/* bKash */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors">
                <RadioGroupItem value="bkash" id="bkash" />
                <Label htmlFor="bkash" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E2136E] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                      <path d="M20.08 9.32l-3.24-5.22c-.36-.58-1-.93-1.68-.93h-6.3c-.7 0-1.34.35-1.7.95L3.94 9.3c-.34.56-.34 1.26 0 1.82l3.22 5.18c.36.58 1 .93 1.68.93h6.3c.7 0 1.34-.35 1.7-.95l3.22-5.18c.36-.56.36-1.24.02-1.78zm-8.08 4.2c-1.85 0-3.35-1.5-3.35-3.35 0-1.85 1.5-3.35 3.35-3.35 1.85 0 3.35 1.5 3.35 3.35 0 1.85-1.5 3.35-3.35 3.35z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#E2136E]">bKash</span>
                    <span className="text-xs text-muted-foreground">Mobile Banking</span>
                  </div>
                </Label>
              </div>

              {/* Nagad */}
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-gold/20 hover:border-gold/40 transition-colors">
                <RadioGroupItem value="nagad" id="nagad" />
                <Label htmlFor="nagad" className="flex items-center gap-3 cursor-pointer flex-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#F6921E] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="white">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-7v4h4l-5 7z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#F6921E]">Nagad</span>
                    <span className="text-xs text-muted-foreground">Digital Banking</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {/* Mobile Banking Instructions */}
            {(paymentMethod === "bkash" || paymentMethod === "nagad") && (
              <div className={`mt-4 p-4 rounded-lg border ${
                paymentMethod === "bkash" 
                  ? "bg-[#E2136E]/5 border-[#E2136E]/20" 
                  : "bg-[#F6921E]/5 border-[#F6921E]/20"
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    paymentMethod === "bkash" ? "bg-[#E2136E]" : "bg-[#F6921E]"
                  }`}>
                    {paymentMethod === "bkash" ? (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                        <path d="M20.08 9.32l-3.24-5.22c-.36-.58-1-.93-1.68-.93h-6.3c-.7 0-1.34.35-1.7.95L3.94 9.3c-.34.56-.34 1.26 0 1.82l3.22 5.18c.36.58 1 .93 1.68.93h6.3c.7 0 1.34-.35 1.7-.95l3.22-5.18c.36-.56.36-1.24.02-1.78zm-8.08 4.2c-1.85 0-3.35-1.5-3.35-3.35 0-1.85 1.5-3.35 3.35-3.35 1.85 0 3.35 1.5 3.35 3.35 0 1.85-1.5 3.35-3.35 3.35z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H7l5-7v4h4l-5 7z"/>
                      </svg>
                    )}
                  </div>
                  <span className={`font-semibold ${
                    paymentMethod === "bkash" ? "text-[#E2136E]" : "text-[#F6921E]"
                  }`}>
                    {paymentMethod === "bkash" ? "bKash" : "Nagad"} Payment
                  </span>
                </div>
                
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside mb-4">
                  <li>Open your {paymentMethod === "bkash" ? "bKash" : "Nagad"} app</li>
                  <li>Select <strong>"Send Money"</strong></li>
                  <li>Send <strong className={paymentMethod === "bkash" ? "text-[#E2136E]" : "text-[#F6921E]"}>৳{totalPrice.toLocaleString()}</strong> to the number below</li>
                  <li>Enter the Transaction ID after payment</li>
                </ol>

                <div className={`flex items-center gap-2 p-3 rounded-lg border ${
                  paymentMethod === "bkash" 
                    ? "bg-[#E2136E]/10 border-[#E2136E]/30" 
                    : "bg-[#F6921E]/10 border-[#F6921E]/30"
                }`}>
                  <span className={`font-mono font-bold text-lg flex-1 ${
                    paymentMethod === "bkash" ? "text-[#E2136E]" : "text-[#F6921E]"
                  }`}>
                    {PAYMENT_NUMBER}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(PAYMENT_NUMBER)}
                    className="h-8 px-3 hover:bg-background/50"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-foreground">Transaction ID *</label>
                  <Input
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className={`bg-background focus:ring-2 ${
                      paymentMethod === "bkash" 
                        ? "border-[#E2136E]/30 focus:border-[#E2136E] focus:ring-[#E2136E]/20" 
                        : "border-[#F6921E]/30 focus:border-[#F6921E] focus:ring-[#F6921E]/20"
                    }`}
                    placeholder="e.g., TXN123456789"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gold/20 pt-4">
            <div className="flex justify-between mb-4">
              <span className="text-muted-foreground">Total Amount:</span>
              <span className="font-display text-gold text-xl">৳{totalPrice.toLocaleString()}</span>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting || ((paymentMethod === "bkash" || paymentMethod === "nagad") && !transactionId.trim())}
              className="w-full bg-gradient-to-r from-gold to-gold-light text-background hover:opacity-90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
