import { useState, useMemo, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, MessageCircle, Banknote, Copy, ChevronLeft, ChevronRight, User, CreditCard, ClipboardCheck } from "lucide-react";
import { formatOrderForWhatsApp } from "@/utils/orderNotification";
import { z } from "zod";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.svg";

const CHECKOUT_STORAGE_KEY = "chitraboli-checkout-progress";

// Zod schemas for validation
const OrderItemSchema = z.object({
  product_id: z.string().min(1),
  product_name: z.string().min(1).max(200),
  product_price: z.number().positive(),
  quantity: z.number().int().positive(),
  product_image: z.string().nullable().optional()
});

const OrderItemsSchema = z.array(OrderItemSchema).min(1);

const CustomerDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number is too long"),
  address: z.string().min(10, "Please enter a complete address").max(500, "Address is too long"),
});

interface CheckoutProgress {
  formData: { name: string; email: string; phone: string; address: string };
  paymentMethod: "cod" | "bkash" | "nagad";
  transactionId: string;
  currentStep: number;
  savedAt: number;
}

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 0 | 1 | 2;

const STEPS = [
  { label: "Details", icon: User },
  { label: "Payment", icon: CreditCard },
  { label: "Confirm", icon: ClipboardCheck },
];

const PROGRESS_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export const CheckoutModal = ({ open, onOpenChange }: CheckoutModalProps) => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);

  const PAYMENT_NUMBER = "01308697630";

  // Load saved progress on mount
  useEffect(() => {
    if (open && !hasRestoredProgress) {
      try {
        const saved = localStorage.getItem(CHECKOUT_STORAGE_KEY);
        if (saved) {
          const progress: CheckoutProgress = JSON.parse(saved);
          const isExpired = Date.now() - progress.savedAt > PROGRESS_EXPIRY_MS;
          
          if (!isExpired) {
            setFormData(progress.formData);
            setPaymentMethod(progress.paymentMethod);
            setTransactionId(progress.transactionId);
            setCurrentStep(progress.currentStep as Step);
            toast({
              title: "Progress restored",
              description: "Your checkout progress has been restored.",
            });
          } else {
            localStorage.removeItem(CHECKOUT_STORAGE_KEY);
          }
        }
      } catch (e) {
        console.error("Failed to restore checkout progress:", e);
        localStorage.removeItem(CHECKOUT_STORAGE_KEY);
      }
      setHasRestoredProgress(true);
    }
  }, [open, hasRestoredProgress, toast]);

  // Save progress whenever form data changes
  const saveProgress = useCallback(() => {
    const progress: CheckoutProgress = {
      formData,
      paymentMethod,
      transactionId,
      currentStep,
      savedAt: Date.now(),
    };
    try {
      localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error("Failed to save checkout progress:", e);
    }
  }, [formData, paymentMethod, transactionId, currentStep]);

  useEffect(() => {
    if (open && hasRestoredProgress && !orderPlaced) {
      saveProgress();
    }
  }, [open, formData, paymentMethod, transactionId, currentStep, hasRestoredProgress, orderPlaced, saveProgress]);

  const clearProgress = useCallback(() => {
    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  }, []);

  // Validate current step
  const validateStep = (step: Step): boolean => {
    if (step === 0) {
      const result = CustomerDetailsSchema.safeParse(formData);
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFieldErrors(errors);
        return false;
      }
      setFieldErrors({});
      return true;
    }
    if (step === 1) {
      if ((paymentMethod === "bkash" || paymentMethod === "nagad") && !transactionId.trim()) {
        setFieldErrors({ transactionId: "Transaction ID is required for mobile banking" });
        return false;
      }
      setFieldErrors({});
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 2) as Step);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0) as Step);
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(1)) return;
    
    setIsSubmitting(true);

    try {
      const sessionId = localStorage.getItem("chitraboli-session") || "";
      
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

        // SMS notification - fails silently if Twilio isn't configured for Bangladesh
        try {
          const paymentMethodLabel = paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "bkash" ? "bKash" : "Nagad";
          const smsResponse = await supabase.functions.invoke("send-order-sms", {
            body: {
              to: formData.phone,
              orderId: orderData.id,
              customerName: formData.name,
              totalAmount: totalPrice,
              paymentMethod: paymentMethodLabel,
            },
          });
          if (smsResponse.error) {
            console.warn("SMS notification skipped:", smsResponse.error);
          }
        } catch (smsError) {
          // SMS is optional - order still succeeded
          console.warn("SMS notification unavailable:", smsError);
        }
      }

      setOrderPlaced(true);
      clearCart();
      clearProgress();
      
      toast({
        title: "অর্ডার সফল হয়েছে! ✨",
        description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।",
      });
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
    setCurrentStep(0);
    setFieldErrors({});
    setHasRestoredProgress(false);
    clearProgress();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Number copied to clipboard",
    });
  };

  const paymentMethodLabel = useMemo(() => {
    switch (paymentMethod) {
      case "bkash": return "bKash";
      case "nagad": return "Nagad";
      default: return "Cash on Delivery";
    }
  }, [paymentMethod]);

  // Order success view
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
      <DialogContent className="bg-card border-gold/20 max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0 sm:p-6 sm:pb-0">
          <DialogTitle className="font-display text-xl sm:text-2xl text-foreground">Checkout</DialogTitle>
          <DialogDescription className="text-sm">Complete your order in 3 easy steps</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;
              
              return (
                <div key={step.label} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                          ? "bg-gold text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      ) : (
                        <StepIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <span
                      className={`text-xs sm:text-sm mt-1.5 font-medium transition-colors ${
                        isActive ? "text-gold" : isCompleted ? "text-green-500" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 sm:mx-3 transition-colors ${
                        index < currentStep ? "bg-green-500" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-6 sm:pb-6">
          {/* Step 1: Customer Details */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                  }}
                  className={`bg-background border-gold/20 focus:border-gold ${fieldErrors.name ? "border-destructive" : ""}`}
                  placeholder="Enter your full name"
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                  }}
                  className={`bg-background border-gold/20 focus:border-gold ${fieldErrors.email ? "border-destructive" : ""}`}
                  placeholder="Enter your email"
                />
                {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone Number *</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                  }}
                  className={`bg-background border-gold/20 focus:border-gold ${fieldErrors.phone ? "border-destructive" : ""}`}
                  placeholder="01XXXXXXXXX"
                />
                {fieldErrors.phone && <p className="text-xs text-destructive">{fieldErrors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Delivery Address *</label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value });
                    if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: "" });
                  }}
                  className={`bg-background border-gold/20 focus:border-gold min-h-[80px] ${fieldErrors.address ? "border-destructive" : ""}`}
                  placeholder="House, Street, Area, City"
                />
                {fieldErrors.address && <p className="text-xs text-destructive">{fieldErrors.address}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => {
                  setPaymentMethod(value as "cod" | "bkash" | "nagad");
                  setFieldErrors({});
                }}
                className="space-y-3"
              >
                {/* Cash on Delivery */}
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                  paymentMethod === "cod" ? "border-gold bg-gold/5" : "border-gold/20 hover:border-gold/40"
                }`}>
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Banknote className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="font-medium">Cash on Delivery</span>
                  </Label>
                </div>

                {/* bKash */}
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                  paymentMethod === "bkash" ? "border-[#E2136E] bg-[#E2136E]/5" : "border-gold/20 hover:border-gold/40"
                }`}>
                  <RadioGroupItem value="bkash" id="bkash" />
                  <Label htmlFor="bkash" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#E2136E] flex items-center justify-center p-1">
                      <img src={bkashLogo} alt="bKash" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-[#E2136E]">bKash</span>
                      <span className="text-xs text-muted-foreground">Mobile Banking</span>
                    </div>
                  </Label>
                </div>

                {/* Nagad */}
                <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                  paymentMethod === "nagad" ? "border-[#F6921E] bg-[#F6921E]/5" : "border-gold/20 hover:border-gold/40"
                }`}>
                  <RadioGroupItem value="nagad" id="nagad" />
                  <Label htmlFor="nagad" className="flex items-center gap-3 cursor-pointer flex-1">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                      <img src={nagadLogo} alt="Nagad" className="w-full h-full object-contain" />
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
                <div className={`p-4 rounded-lg border ${
                  paymentMethod === "bkash" 
                    ? "bg-[#E2136E]/5 border-[#E2136E]/20" 
                    : "bg-[#F6921E]/5 border-[#F6921E]/20"
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden p-1 ${
                      paymentMethod === "bkash" ? "bg-[#E2136E]" : "bg-white"
                    }`}>
                      <img 
                        src={paymentMethod === "bkash" ? bkashLogo : nagadLogo} 
                        alt={paymentMethod === "bkash" ? "bKash" : "Nagad"} 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <span className={`font-semibold ${
                      paymentMethod === "bkash" ? "text-[#E2136E]" : "text-[#F6921E]"
                    }`}>
                      {paymentMethod === "bkash" ? "bKash" : "Nagad"} Payment
                    </span>
                  </div>
                  
                  <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside mb-4">
                    <li>Open your {paymentMethod === "bkash" ? "bKash" : "Nagad"} app</li>
                    <li>Select <strong>"Send Money"</strong></li>
                    <li>Send <strong className={paymentMethod === "bkash" ? "text-[#E2136E]" : "text-[#F6921E]"}>৳{totalPrice.toLocaleString()}</strong> to:</li>
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

                  <div className="mt-4 space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Transaction ID *</label>
                    <Input
                      value={transactionId}
                      onChange={(e) => {
                        setTransactionId(e.target.value);
                        if (fieldErrors.transactionId) setFieldErrors({});
                      }}
                      className={`bg-background ${
                        paymentMethod === "bkash" 
                          ? "border-[#E2136E]/30 focus:border-[#E2136E]" 
                          : "border-[#F6921E]/30 focus:border-[#F6921E]"
                      } ${fieldErrors.transactionId ? "border-destructive" : ""}`}
                      placeholder="e.g., TXN123456789"
                    />
                    {fieldErrors.transactionId && <p className="text-xs text-destructive">{fieldErrors.transactionId}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Order Summary / Confirm */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Customer Details</h3>
                <div className="text-sm space-y-1">
                  <p><span className="text-muted-foreground">Name:</span> {formData.name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {formData.email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {formData.phone}</p>
                  <p><span className="text-muted-foreground">Address:</span> {formData.address}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Payment Method</h3>
                <div className="flex items-center gap-2">
                  {paymentMethod === "cod" ? (
                    <Banknote className="w-5 h-5 text-green-600" />
                  ) : (
                    <img 
                      src={paymentMethod === "bkash" ? bkashLogo : nagadLogo} 
                      alt={paymentMethodLabel}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className={`font-medium ${
                    paymentMethod === "bkash" ? "text-[#E2136E]" : 
                    paymentMethod === "nagad" ? "text-[#F6921E]" : "text-green-600"
                  }`}>
                    {paymentMethodLabel}
                  </span>
                </div>
                {transactionId && (
                  <p className="text-sm"><span className="text-muted-foreground">Transaction ID:</span> {transactionId}</p>
                )}
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-foreground">Order Items</h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span className="text-gold">৳{(item.product_price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-gold text-lg">৳{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-gold/20">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 border-gold/30 hover:bg-gold/10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            
            {currentStep < 2 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 bg-gradient-to-r from-gold to-gold-light text-background hover:opacity-90"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-gold to-gold-light text-background hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Place Order
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
