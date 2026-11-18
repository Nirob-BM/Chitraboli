// Starts an automated bKash / Nagad payment for an existing order and returns
// the gateway checkout URL. If gateway credentials are not configured yet, it
// responds with { configured: false } so checkout can fall back to the manual
// "send money + paste transaction ID" flow.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import forge from "https://esm.sh/node-forge@1.3.1";
import {
  PAYMENT_ENV,
  type Provider,
  bkashGrantToken,
  bkashHeaders,
  functionsBaseUrl,
  getBkashConfig,
  getNagadConfig,
  invoiceNumber,
  nagadTimestamp,
  normalizePem,
} from "../_shared/payments.ts";
import { normalizePaymentReturnOrigin } from "../_shared/security-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
    );

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.order_id === "string" ? body.order_id : "";
    const provider = body?.provider as Provider;
    const checkoutToken = typeof body?.checkout_token === "string" ? body.checkout_token : "";
    const requestedReturnOrigin = typeof body?.return_origin === "string" ? body.return_origin : "";

    // Availability probe used by checkout to decide between automatic payment
    // and the manual "send money + paste transaction ID" fallback.
    if (body?.check === true) {
      const available = provider === "nagad" ? getNagadConfig() !== null : getBkashConfig() !== null;
      return json({ configured: available, environment: PAYMENT_ENV });
    }


    if (!orderId || !/^[0-9a-f-]{36}$/i.test(orderId)) {
      return json({ error: "A valid order_id is required" }, 400);
    }
    if (provider !== "bkash" && provider !== "nagad") {
      return json({ error: "provider must be bkash or nagad" }, 400);
    }
    const returnOrigin = body.action === "status" || body.action === "cod"
      ? null
      : normalizePaymentReturnOrigin(requestedReturnOrigin);
    if (body.action !== "status" && body.action !== "cod" && !returnOrigin) {
      return json({ error: "A trusted storefront return_origin is required" }, 400);
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total_amount, payment_status, customer_phone, checkout_token_hash, payment_method")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {

      return json({ error: "Failed to load order" }, 500);
    }
    if (!order) return json({ error: "Order not found" }, 404);
    const tokenHash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(checkoutToken)))).map(b => b.toString(16).padStart(2,"0")).join("");
    if (!checkoutToken || tokenHash !== order.checkout_token_hash) return json({error:"Order access denied"},403);
    if(body.action === "status") {
      const {data:tx,error}=await supabase.from("payment_transactions").select("status,environment,gateway_transaction_id,provider").eq("order_id",order.id).order("created_at",{ascending:false}).limit(1).maybeSingle();
      if(error)return json({error:"Could not verify payment"},503);
      return json({payment_status:order.payment_status,transaction_status:tx?.status,environment:tx?.environment,transaction_id:tx?.gateway_transaction_id,provider:tx?.provider,order_number:order.order_number,total_amount:order.total_amount});
    }
    if(body.action === "cod") {
      if(order.payment_status !== "unpaid")return json({error:"This payment cannot be changed"},400);
      const {error}=await supabase.from("orders").update({payment_method:"cod",payment_gateway:null,transaction_id:null}).eq("id",order.id).eq("payment_status","unpaid");
      if(error)return json({error:"Could not update payment method"},503);
      return json({success:true,order_number:order.order_number});
    }
    if (order.payment_status === "verified") {
      return json({ error: "This order is already paid" }, 400);
    }

    const configured = provider === "bkash" ? getBkashConfig() : getNagadConfig();
    if (!configured) {

      return json({
        configured: false,
        provider,
        environment: PAYMENT_ENV,
        message: `${provider === "bkash" ? "bKash" : "Nagad"} gateway is not connected yet.`,
      });
    }

    const {data:active}=await supabase.from("payment_transactions").select("raw_response").eq("order_id",order.id).eq("provider",provider).eq("status","initiated").order("created_at",{ascending:false}).limit(1).maybeSingle();
    const activeRaw=active?.raw_response as {bkashURL?:string;callBackUrl?:string}|null;
    const activeUrl=activeRaw?.bkashURL||activeRaw?.callBackUrl;
    if(activeUrl)return json({configured:true,redirect_url:activeUrl});
    const invoice = invoiceNumber();
    const amount = Number(order.total_amount).toFixed(2);

    const { data: tx, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order.id,
        provider,
        environment: PAYMENT_ENV,
        amount: order.total_amount,
        status: "created",
        invoice_number: invoice,
        payer_reference: order.customer_phone,
        return_url: returnOrigin,
      })
      .select("id")
      .single();

    if (txError || !tx) {

      return json({ error: "Failed to start payment" }, 500);
    }

    const callbackUrl = `${functionsBaseUrl()}/payment-callback?tx=${tx.id}`;

    let redirectUrl: string;
    let gatewayPaymentId: string | null = null;
    let raw: unknown;

    if (provider === "bkash") {
      const cfg = getBkashConfig();
      if (!cfg) return json({error:"Payment unavailable"},503);
      const token = await bkashGrantToken(cfg);
      const res = await fetch(`${cfg.baseUrl}/tokenized/checkout/create`, {
        method: "POST",
        headers: bkashHeaders(cfg, token),
        body: JSON.stringify({
          mode: "0011",
          payerReference: order.customer_phone,
          callbackURL: callbackUrl,
          amount,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: invoice,
        }),
      });
      raw = await res.json().catch(() => ({}));
      const created = raw as { bkashURL?: string; paymentID?: string; statusMessage?: string };
      if (!res.ok || !created?.bkashURL || !created?.paymentID) {

        await supabase.from("payment_transactions").update({
          status: "failed",
          failure_reason: created?.statusMessage || `bKash create failed (${res.status})`,
          raw_response: raw,
        }).eq("id", tx.id);
        return json({ error: created?.statusMessage || "bKash could not start this payment" }, 502);
      }
      redirectUrl = created.bkashURL;
      gatewayPaymentId = created.paymentID;
    } else {
      const cfg = getNagadConfig();
      if (!cfg) return json({error:"Payment unavailable"},503);
      const dateTime = nagadTimestamp();
      const privateKey = forge.pki.privateKeyFromPem(normalizePem(cfg.privateKey, "PRIVATE"));
      const publicKey = forge.pki.publicKeyFromPem(normalizePem(cfg.publicKey, "PUBLIC"));

      const encrypt = (payload: unknown) =>
        forge.util.encode64(
          publicKey.encrypt(forge.util.encodeUtf8(JSON.stringify(payload)), "RSAES-PKCS1-V1_5"),
        );
      const sign = (payload: unknown) => {
        const md = forge.md.sha256.create();
        md.update(forge.util.encodeUtf8(JSON.stringify(payload)), "utf8");
        return forge.util.encode64(privateKey.sign(md));
      };
      const signRaw = (value: string) => {
        const md = forge.md.sha256.create();
        md.update(value, "utf8");
        return forge.util.encode64(privateKey.sign(md));
      };

      const initChallenge = crypto.randomUUID().replace(/-/g, "").slice(0,20);
      const initRes = await fetch(
        `${cfg.baseUrl}/check-out/initialize/${cfg.merchantId}/${invoice}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-KM-Api-Version": "v-0.2.0",
            "X-KM-IP-V4": "127.0.0.1",
            "X-KM-Client-Type": "PC_WEB",
          },
          body: JSON.stringify({
            accountNumber: cfg.merchantNumber,
            dateTime,
            sensitiveData: encrypt({
              merchantId: cfg.merchantId,
              datetime: dateTime,
              orderId: invoice,
              challenge: initChallenge,
            }),
            signature: signRaw(
              JSON.stringify({
                merchantId: cfg.merchantId,
                datetime: dateTime,
                orderId: invoice,
                challenge: initChallenge,
              }),
            ),
          }),
        },
      );
      const initBody = await initRes.json().catch(() => ({}));
      const challenge = (initBody as { sensitiveData?: string })?.sensitiveData;
      if (!initRes.ok || !challenge) {

        await supabase.from("payment_transactions").update({
          status: "failed",
          failure_reason: `Nagad initialize failed (${initRes.status})`,
          raw_response: initBody,
        }).eq("id", tx.id);
        return json({ error: "Nagad could not start this payment" }, 502);
      }

      const decrypted = JSON.parse(
        forge.util.decodeUtf8(privateKey.decrypt(forge.util.decode64(challenge), "RSAES-PKCS1-V1_5")),
      ) as { paymentReferenceId: string; challenge: string };

      const completePayload = {
        merchantId: cfg.merchantId,
        orderId: invoice,
        currencyCode: "050",
        amount,
        challenge: decrypted.challenge,
      };

      const completeRes = await fetch(
        `${cfg.baseUrl}/check-out/complete/${decrypted.paymentReferenceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-KM-Api-Version": "v-0.2.0",
            "X-KM-IP-V4": "127.0.0.1",
            "X-KM-Client-Type": "PC_WEB",
          },
          body: JSON.stringify({
            sensitiveData: encrypt(completePayload),
            signature: sign(completePayload),
            merchantCallbackURL: callbackUrl,
            additionalMerchantInfo: { orderReference: order.id },
          }),
        },
      );
      raw = await completeRes.json().catch(() => ({}));
      const completed = raw as { callBackUrl?: string; status?: string; message?: string };
      if (!completeRes.ok || !completed?.callBackUrl) {

        await supabase.from("payment_transactions").update({
          status: "failed",
          failure_reason: completed?.message || `Nagad complete failed (${completeRes.status})`,
          raw_response: raw,
        }).eq("id", tx.id);
        return json({ error: completed?.message || "Nagad could not start this payment" }, 502);
      }
      redirectUrl = completed.callBackUrl;
      gatewayPaymentId = decrypted.paymentReferenceId;
    }

    await supabase.from("payment_transactions").update({
      status: "initiated",
      gateway_payment_id: gatewayPaymentId,
      raw_response: raw as Record<string, unknown>,
    }).eq("id", tx.id);

    await supabase.from("orders").update({
      payment_status: "pending_verification",
      payment_gateway: provider,
    }).eq("id", order.id);

    return json({
      configured: true,
      provider,
      environment: PAYMENT_ENV,
      transaction_id: tx.id,
      invoice_number: invoice,
      redirect_url: redirectUrl,
    });
  } catch (error) {

    return json({ error: "An unexpected error occurred while starting the payment" }, 500);
  }
});
