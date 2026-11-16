import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildDeliverySms, type DeliveryNotificationType } from "../_shared/security-rules.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SMSRequest {
  orderId: string;
  notificationType: DeliveryNotificationType;
  riderName: string;
  etaMinutes?: number;
}

// Rate limiting: 10 requests per minute per IP
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT) {
    return true;
  }
  
  record.count++;
  return false;
}

// Cleanup old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    if (isRateLimited(clientIP)) {

      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {

      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {

      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user has admin role
    const { data: roleData, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin", "order_manager"])
      .limit(1)
      .maybeSingle();

    if (roleError || !roleData) {

      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json() as Partial<SMSRequest>;
    const { orderId, notificationType, riderName, etaMinutes } = body;
    if (typeof orderId !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(orderId) ||
        typeof riderName !== "string" || riderName.trim().length < 1 || riderName.length > 80 ||
        (notificationType !== "delivery_nearby" && notificationType !== "delivery_arrived")) {
      return new Response(
        JSON.stringify({ error: "A valid order, delivery update, and rider name are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (notificationType === "delivery_nearby" && (typeof etaMinutes !== "number" || !Number.isInteger(etaMinutes))) {
      return new Response(JSON.stringify({ error: "A valid delivery ETA is required" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!serviceRoleKey) {
      return new Response(JSON.stringify({ error: "SMS service is temporarily unavailable" }), {
        status: 503, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Read trusted recipient and message data after verifying the caller's role.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: orderData, error: orderError } = await adminClient
      .from("orders")
      .select("id, order_number, customer_name, customer_phone")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !orderData) {

      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const deliverySms = buildDeliverySms(
      orderData,
      notificationType,
      riderName,
      etaMinutes,
    );
    if (!deliverySms) {
      return new Response(JSON.stringify({ error: "The order does not have a valid Bangladesh delivery phone number" }), {
        status: 400, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!accountSid || !authToken || !twilioPhoneNumber) {
      return new Response(JSON.stringify({ error: "SMS service not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Twilio API call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", deliverySms.recipient);
    formData.append("From", twilioPhoneNumber);
    formData.append("Body", deliverySms.message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${accountSid}:${authToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      // Any provider rejection (e.g. 21659 sender/country mismatch) must not break checkout

      return new Response(
        JSON.stringify({
          success: true,
          skipped: true,
          reason: "SMS service limitation - order completed without SMS notification",
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {

    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
