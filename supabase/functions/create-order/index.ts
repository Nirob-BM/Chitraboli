import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  quantity: number;
  product_name?: string;
  product_image?: string | null;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  customer_details: CustomerDetails;
  payment_method: 'cod' | 'bkash' | 'nagad';
  transaction_id?: string;
  session_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Use service role to bypass RLS for product price validation
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    const body: CreateOrderRequest = await req.json();
    const { items, customer_details, payment_method, transaction_id, session_id } = body;

    console.log('Received order request:', { 
      itemCount: items?.length, 
      payment_method,
      customer: customer_details?.name 
    });

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Validation failed: No items provided');
      return new Response(
        JSON.stringify({ error: 'At least one item is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!customer_details?.name || !customer_details?.email || !customer_details?.phone || !customer_details?.address) {
      console.error('Validation failed: Missing customer details');
      return new Response(
        JSON.stringify({ error: 'All customer details are required (name, email, phone, address)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate customer details format
    if (customer_details.name.length < 2 || customer_details.name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Name must be between 2 and 100 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_details.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (customer_details.phone.length < 10 || customer_details.phone.length > 15) {
      return new Response(
        JSON.stringify({ error: 'Phone number must be between 10 and 15 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (customer_details.address.length < 10 || customer_details.address.length > 500) {
      return new Response(
        JSON.stringify({ error: 'Address must be between 10 and 500 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate payment method
    if (!['cod', 'bkash', 'nagad'].includes(payment_method)) {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Require transaction ID for mobile payments
    if ((payment_method === 'bkash' || payment_method === 'nagad') && (!transaction_id || transaction_id.trim().length === 0)) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID is required for mobile payments' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract product IDs and validate quantities
    const productIds = items.map(item => item.product_id);
    for (const item of items) {
      if (!item.product_id || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
        console.error('Validation failed: Invalid item data', item);
        return new Response(
          JSON.stringify({ error: 'Each item must have a valid product_id and positive integer quantity' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log('Fetching product prices from database for:', productIds);

    // Fetch real prices from products table - SERVER-SIDE VALIDATION
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, image_url, in_stock')
      .in('id', productIds);

    if (productsError) {
      console.error('Database error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate products' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!products || products.length === 0) {
      console.error('No products found for IDs:', productIds);
      return new Response(
        JSON.stringify({ error: 'No valid products found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate all products exist and calculate total using SERVER prices
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      
      if (!product) {
        console.error('Product not found:', item.product_id);
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (product.in_stock === false) {
        console.error('Product out of stock:', product.name);
        return new Response(
          JSON.stringify({ error: `Product is out of stock: ${product.name}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use SERVER-SIDE price, not client-provided price
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        product_name: product.name, // Use database name
        product_price: product.price, // Use DATABASE price, not client price
        quantity: item.quantity,
        product_image: product.image_url || null
      });

      console.log(`Validated item: ${product.name} x${item.quantity} @ ৳${product.price} = ৳${itemTotal}`);
    }

    console.log('Total order amount (server-calculated):', totalAmount);

    // Create order with validated data
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert([{
        session_id: session_id || null,
        customer_name: customer_details.name.trim(),
        customer_email: customer_details.email.trim().toLowerCase(),
        customer_phone: customer_details.phone.trim(),
        customer_address: customer_details.address.trim(),
        items: validatedItems,
        total_amount: totalAmount, // Server-calculated total
        status: 'pending',
        payment_method: payment_method,
        transaction_id: payment_method !== 'cod' ? transaction_id?.trim() : null,
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Order created successfully:', order.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        order: {
          id: order.id,
          total_amount: order.total_amount,
          items: order.items,
          status: order.status
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in create-order:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
