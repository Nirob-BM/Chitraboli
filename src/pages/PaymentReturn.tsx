import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

const PROVIDER_LABELS: Record<string, string> = { bkash: "bKash", nagad: "Nagad" };

const PaymentReturn = () => {
  const [params] = useSearchParams();
  const { clearCart } = useCart();

  const status = (params.get("status") || "failed").toLowerCase();
  const orderId = params.get("order") || "";
  const provider = params.get("provider") || "";
  const txn = params.get("txn") || "";
  const providerLabel = PROVIDER_LABELS[provider] || "Mobile banking";
  const isSuccess = status === "success";
  const isCancelled = status === "cancelled";

  // A completed gateway payment means the order is placed — empty the cart.
  useEffect(() => {
    if (isSuccess) clearCart();
  }, [isSuccess, clearCart]);

  return (
    <Layout>
      <SEO
        title={isSuccess ? "Payment Successful" : "Payment Not Completed"}
        description="Payment result for your Chitraboli order."
        url="/payment/return"
      />
      <section className="container mx-auto px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-md rounded-2xl border border-gold/20 bg-card p-8 text-center">
          <div
            className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
              isSuccess ? "bg-green-500/15" : isCancelled ? "bg-amber-500/15" : "bg-destructive/15"
            }`}
          >
            {isSuccess ? (
              <CheckCircle className="h-11 w-11 text-green-500" />
            ) : isCancelled ? (
              <AlertCircle className="h-11 w-11 text-amber-500" />
            ) : (
              <XCircle className="h-11 w-11 text-destructive" />
            )}
          </div>

          <h1 className="font-display text-2xl text-foreground">
            {isSuccess
              ? "Payment Successful"
              : isCancelled
              ? "Payment Cancelled"
              : "Payment Not Completed"}
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {isSuccess
              ? `Your ${providerLabel} payment was received and your order is confirmed.`
              : isCancelled
              ? `You cancelled the ${providerLabel} payment. Your order is still saved as unpaid.`
              : `We could not confirm your ${providerLabel} payment. Your order is saved as unpaid — you can try again or pay on delivery.`}
          </p>

          <div className="mt-6 space-y-2 rounded-lg bg-muted/50 p-4 text-left text-sm">
            {orderId && (
              <p className="break-all">
                <span className="text-muted-foreground">Order ID:</span> {orderId}
              </p>
            )}
            {txn && (
              <p className="break-all">
                <span className="text-muted-foreground">Transaction ID:</span> {txn}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1 bg-gradient-to-r from-gold to-gold-light text-background hover:opacity-90">
              <Link to="/track-order">Track My Order</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 border-gold/30 hover:bg-gold/10">
              <Link to="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentReturn;
