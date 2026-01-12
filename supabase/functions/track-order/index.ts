import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory rate limiting store (per instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_MAX = 5; // Max 5 tracking attempts
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // Per 5 minutes

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    // Reset or create new record
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  
  record.count++;
  return false;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log(`Order tracking request from IP: ${clientIp}`);

    // Check rate limit
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many tracking attempts. Please wait a few minutes before trying again.',
          code: 'RATE_LIMITED' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.json();
    const { orderId, phoneNumber } = body;

    // Server-side validation
    const errors: string[] = [];

    if (!orderId || typeof orderId !== 'string' || orderId.trim().length < 10) {
      errors.push('Order ID must be at least 10 characters');
    }

    if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.trim().length < 10) {
      errors.push('Phone number must be at least 10 characters');
    }

    // Basic format validation
    const orderIdRegex = /^[a-f0-9-]{10,}$/i;
    if (orderId && !orderIdRegex.test(orderId.trim())) {
      errors.push('Invalid order ID format');
    }

    const phoneRegex = /^[+]?[\d\s-()]{10,20}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber.trim())) {
      errors.push('Invalid phone number format');
    }

    if (errors.length > 0) {
      console.warn(`Validation errors for IP ${clientIp}:`, errors);
      return new Response(
        JSON.stringify({ error: errors.join(', '), code: 'VALIDATION_ERROR' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query order with rider info
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        items,
        total_amount,
        created_at,
        customer_name,
        rider_assigned_at,
        assigned_rider_id,
        delivery_riders (
          id,
          name,
          phone,
          vehicle_type
        )
      `)
      .eq('id', orderId.trim())
      .eq('customer_phone', phoneNumber.trim())
      .single();

    if (error || !data) {
      console.log(`Order not found for ID: ${orderId.trim().substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ 
          error: 'Order not found. Please check your order ID and phone number.',
          code: 'NOT_FOUND' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format response (only include safe fields, no sensitive data exposure)
    const riderInfo = data.delivery_riders as any;
    const response = {
      id: data.id,
      status: data.status,
      items: data.items,
      total_amount: data.total_amount,
      created_at: data.created_at,
      customer_name: data.customer_name,
      rider_assigned_at: data.rider_assigned_at,
      rider_id: riderInfo?.id || null,
      rider_name: riderInfo?.name || null,
      rider_phone: riderInfo?.phone || null,
      rider_vehicle_type: riderInfo?.vehicle_type || null
    };

    console.log(`Order found successfully for ID: ${orderId.trim().substring(0, 8)}***`);

    return new Response(
      JSON.stringify({ success: true, order: response }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', code: 'SERVER_ERROR' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
