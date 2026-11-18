// Gateway return handler. bKash / Nagad redirect the customer here after they
// approve or cancel a payment. We verify the payment server-side, mark the
// order paid, then redirect the customer back to the storefront.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  bkashGrantToken,
  bkashHeaders,
  getBkashConfig,
  getNagadConfig,
} from "../_shared/payments.ts";
import {
  DEFAULT_PAYMENT_RETURN_ORIGIN,
  normalizePaymentReturnOrigin,
} from "../_shared/security-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function redirect(base: string, params: Record<string, string>) {
  const safeOrigin = normalizePaymentReturnOrigin(base) ?? DEFAULT_PAYMENT_RETURN_ORIGIN;
  const url = new URL(`${safeOrigin}/payment/return`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url.toString() } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
  );

  const url = new URL(req.url);
  const txId = url.searchParams.get("tx") || "";
  let fallbackOrigin = "";

  try {
    if (!txId) {
      return new Response("Missing payment reference", { status: 400, headers: corsHeaders });
    }

    const { data: tx } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", txId)
      .maybeSingle();

    if (!tx) {
      return new Response("Payment not found", { status: 404, headers: corsHeaders });
    }
    fallbackOrigin = normalizePaymentReturnOrigin(tx.return_url) ?? DEFAULT_PAYMENT_RETURN_ORIGIN;

    // Already settled — just bounce the customer to the result page.
    if (tx.status === "succeeded") {
      return redirect(fallbackOrigin, {
        status: "success",
        order: tx.order_id,
        provider: tx.provider,
        txn: tx.gateway_transaction_id || "",
      });
    }

    const gatewayStatus = (url.searchParams.get("status") || "").toLowerCase();
    if (gatewayStatus === "cancel" || gatewayStatus === "failure" || gatewayStatus === "aborted") {
      await supabase.from("payment_transactions").update({
        status: gatewayStatus === "cancel" ? "cancelled" : "failed",
        failure_reason: `Gateway reported: ${gatewayStatus}`,
      }).eq("id", tx.id);
      await supabase.from("orders").update({ payment_status: "unpaid" }).eq("id", tx.order_id).neq("payment_status", "verified");
      return redirect(fallbackOrigin, {
        status: gatewayStatus === "cancel" ? "cancelled" : "failed",
        order: tx.order_id,
        provider: tx.provider,
      });
    }

    let succeeded = false;
    let gatewayTxnId = "";
    let raw: unknown = null;
    let failureReason = "Payment was not completed";

    if (tx.provider === "bkash") {
      const cfg = getBkashConfig();
      const paymentId = tx.gateway_payment_id;
      if (url.searchParams.get("paymentID") && url.searchParams.get("paymentID") !== paymentId) throw new Error("Payment reference mismatch");
      if (!cfg || !paymentId) throw new Error("bKash configuration or paymentID missing");

      const token = await bkashGrantToken(cfg);
      const execRes = await fetch(`${cfg.baseUrl}/tokenized/checkout/execute`, {
        method: "POST",
        headers: bkashHeaders(cfg, token),
        body: JSON.stringify({ paymentID: paymentId }),
      });
      raw = await execRes.json().catch(() => ({}));
      let result = raw as {
        transactionStatus?: string;
        trxID?: string;
        amount?: string;
        statusMessage?: string;
      };

      // bKash returns an error when execute is retried; query the payment instead.
      if (!execRes.ok || !result?.trxID) {
        const queryRes = await fetch(`${cfg.baseUrl}/tokenized/checkout/payment/status`, {
          method: "POST",
          headers: bkashHeaders(cfg, token),
          body: JSON.stringify({ paymentID: paymentId }),
        });
        const queryBody = await queryRes.json().catch(() => ({}));
        raw = queryBody;
        result = queryBody as typeof result;
      }

      const expected = Number(tx.amount).toFixed(2);
      if (result?.transactionStatus === "Completed" && result?.trxID) {
        if (!result.amount || Number(result.amount).toFixed(2) !== expected) {
          failureReason = `Amount mismatch: gateway ${result.amount} vs order ${expected}`;
        } else {
          succeeded = true;
          gatewayTxnId = result.trxID;
        }
      } else {
        failureReason = result?.statusMessage || failureReason;
      }
    } else {
      const cfg = getNagadConfig();
      const reference = tx.gateway_payment_id;
      if (url.searchParams.get("payment_ref_id") && url.searchParams.get("payment_ref_id") !== reference) throw new Error("Payment reference mismatch");
      if (!cfg || !reference) throw new Error("Nagad configuration or payment reference missing");

      const verifyRes = await fetch(`${cfg.baseUrl}/verify/payment/${reference}`, {
        headers: { "X-KM-Api-Version": "v-0.2.0", "X-KM-IP-V4": "127.0.0.1", "X-KM-Client-Type": "PC_WEB" },
      });
      raw = await verifyRes.json().catch(() => ({}));
      const result = raw as { status?: string; issuerPaymentRefNo?: string; amount?: string; statusCode?: string };

      const expected = Number(tx.amount).toFixed(2);
      if (result?.status === "Success") {
        if (!result.amount || Number(result.amount).toFixed(2) !== expected) {
          failureReason = `Amount mismatch: gateway ${result.amount} vs order ${expected}`;
        } else {
          succeeded = true;
          gatewayTxnId = result.issuerPaymentRefNo || reference;
        }
      } else {
        failureReason = `Nagad status: ${result?.status || "unknown"} (${result?.statusCode || "-"})`;
      }
    }

    if (succeeded) {
      await supabase.from("payment_transactions").update({
        status: "succeeded",
        gateway_transaction_id: gatewayTxnId,
        raw_response: raw as Record<string, unknown>,
      }).eq("id", tx.id);

      await supabase.from("orders").update({
        payment_status: "verified",
        payment_verified_at: new Date().toISOString(),
        transaction_id: gatewayTxnId,
        payment_gateway: tx.provider,
        payment_note: `Verified automatically by ${tx.provider === "bkash" ? "bKash" : "Nagad"} (${tx.environment})`,
        status: "confirmed",
      }).eq("id", tx.order_id);

      return redirect(fallbackOrigin, {
        status: "success",
        order: tx.order_id,
        provider: tx.provider,
        txn: gatewayTxnId,
      });
    }

    await supabase.from("payment_transactions").update({
      status: "failed",
      failure_reason: failureReason,
      raw_response: raw as Record<string, unknown>,
    }).eq("id", tx.id);
    await supabase.from("orders").update({ payment_status: "unpaid" }).eq("id", tx.order_id).neq("payment_status", "verified");

    return redirect(fallbackOrigin, {
      status: "failed",
      order: tx.order_id,
      provider: tx.provider,
    });
  } catch (error) {

    if (fallbackOrigin) {
      return redirect(fallbackOrigin, { status: "failed", tx: txId });
    }
    return new Response("Payment could not be verified", { status: 500, headers: corsHeaders });
  }
});
