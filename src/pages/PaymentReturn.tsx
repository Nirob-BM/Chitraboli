import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { safeStorage } from "@/lib/safeStorage";
import { paymentIsVerified } from "@/lib/commerce";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
interface PendingOrder {id:string;number:string;token:string;provider:string;}
interface PaymentResult {payment_status:string;transaction_status:string;environment:string;order_number:string;transaction_id?:string;}
const PaymentReturn=()=>{
 const {clearCart}=useCart();
 const [pending]=useState<PendingOrder|null>(()=>{try{return JSON.parse(safeStorage.get("chitraboli-payment-order",true)||"null");}catch{return null;}});
 const [result,setResult]=useState<PaymentResult|null>(null);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [cod,setCod]=useState(false);
 const cleared=useRef(false);
 useEffect(()=>{
  let active=true;
  if(!pending){setLoading(false);return;}
  supabase.functions.invoke("payment-initiate",{body:{action:"status",order_id:pending.id,provider:pending.provider,checkout_token:pending.token}}).then(async({data,error})=>{
   if(!active)return;
   if(error||!data?.payment_status){setError("Could not verify this payment. Please check your order before paying again.");return;}
   setResult(data);
   if(paymentIsVerified(data)&&data.environment==="live"&&!cleared.current&&safeStorage.get(`payment-cleared-${pending.id}`,true)!=="yes"){
    cleared.current=true; await clearCart(); safeStorage.set(`payment-cleared-${pending.id}`,"yes",true);
   }
  }).catch(()=>{if(active)setError("Payment verification is unavailable. Please try again.");}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[pending,clearCart]);
 const success=result ? paymentIsVerified(result) : false;
 const sandbox=success&&result?.environment!=="live";
 const recover=async(action:"retry"|"cod")=>{
  if(!pending)return;setBusy(true);setError("");
  try{
   const {data,error}=await supabase.functions.invoke("payment-initiate",{body:{action:action==="cod"?"cod":undefined,order_id:pending.id,provider:pending.provider,checkout_token:pending.token,return_origin:window.location.origin}});
   if(error||!data?.success&&action==="cod"||!data?.redirect_url&&action==="retry")throw new Error(data?.error||"Could not update this payment. Please try again.");
   if(action==="retry")window.location.assign(data.redirect_url);else setCod(true);
  }catch(e){setError(e instanceof Error?e.message:"Could not update payment");}finally{setBusy(false);}
 };
 const title=loading?"Checking Payment":cod?"Cash on Delivery Confirmed":sandbox?"Test Payment Completed":success?"Payment Successful":"Payment Not Confirmed";
 return <Layout><SEO title={title} description="Verified payment result for your Chitraboli order." url="/payment/return" />
 <section className="container mx-auto px-4 py-16 sm:py-24"><div className="mx-auto max-w-md rounded-lg border border-gold/20 bg-card p-6 sm:p-8 text-center">
 <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
 {loading?<Loader2 className="h-11 w-11 text-primary animate-spin"/>:success||cod?<CheckCircle className="h-11 w-11 text-primary"/>:<AlertCircle className="h-11 w-11 text-destructive"/>}</div>
 <h1 className="font-display text-2xl text-foreground">{title}</h1>
 <p className="mt-3 text-sm text-muted-foreground">{loading?"Checking the saved payment record…":cod?"Your existing order will be paid on delivery.":sandbox?"This was a sandbox transaction. No real payment was collected; your cart has not been cleared.":success?"Your payment has been verified and your order is confirmed.":pending?"Payment has not been confirmed. Retry for the same order or choose cash on delivery.":"No verifiable payment reference is available in this tab. A payment-result link alone does not confirm payment."}</p>
 {pending&&<p className="mt-5 break-all text-sm">Order ID: {result?.order_number||pending.number}</p>}
 {result?.transaction_id&&<p className="mt-2 break-all text-sm">Transaction ID: {result.transaction_id}</p>}
 {error&&<p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
 {!loading&&pending&&result&&!success&&!cod&&<div className="mt-6 flex flex-col gap-3"><Button disabled={busy} onClick={()=>recover("retry")}>Retry Payment</Button><Button variant="outline" disabled={busy||result.payment_status!=="unpaid"} onClick={()=>recover("cod")}>Pay on Delivery</Button></div>}
 <div className="mt-6 flex flex-col gap-3"><Button asChild><Link to={pending?`/track-order?id=${encodeURIComponent(result?.order_number||pending.number)}`:"/track-order"}>Track My Order</Link></Button><Button asChild variant="outline"><Link to="/shop">Continue Shopping</Link></Button></div>
 </div></section></Layout>;
};
export default PaymentReturn;
