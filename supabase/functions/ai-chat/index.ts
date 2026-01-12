import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 30; // 30 requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

function isRateLimited(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= RATE_LIMIT_MAX) return true;
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
}, 60 * 1000);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (isRateLimited(clientIp)) {
      console.log(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, language = "bn" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Processing chat request with messages:", messages.length, "language:", language);

    // Fetch products from database for auto-sync
    let productCatalog = "";
    try {
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: products, error } = await supabase
          .from("products")
          .select("name, price, category, description, in_stock")
          .order("category", { ascending: true })
          .order("name", { ascending: true });

        if (!error && products && products.length > 0) {
          // Group products by category
          const grouped: Record<string, typeof products> = {};
          for (const product of products) {
            if (!grouped[product.category]) {
              grouped[product.category] = [];
            }
            grouped[product.category].push(product);
          }

          // Build catalog string
          productCatalog = "\n\n## LIVE PRODUCT CATALOG (Auto-synced from database):\n\n";
          for (const [category, items] of Object.entries(grouped)) {
            productCatalog += `### ${category}:\n`;
            for (const item of items) {
              const stockStatus = item.in_stock === false ? " (OUT OF STOCK)" : "";
              productCatalog += `- "${item.name}" - ৳${item.price.toLocaleString()}${stockStatus}\n`;
              if (item.description) {
                productCatalog += `  ${item.description.substring(0, 100)}\n`;
              }
            }
            productCatalog += "\n";
          }
          console.log("Loaded", products.length, "products from database");
        }
      }
    } catch (dbError) {
      console.error("Error fetching products:", dbError);
      // Continue with hardcoded fallback
    }

    // Fallback catalog if database fetch fails
    if (!productCatalog) {
      productCatalog = `

## PRODUCT CATALOG WITH PRICES (in BDT ৳):

### Clay Jewellery (মাটির গয়না):
- "বীণা পলাশ" 🌿 - ৳300
- "রংধনু" 🌈 - ৳349
- Product 2.0 - ৳250

### Bangles:
- Crystal Bangles Set - ৳3,800
- Traditional Bangles - ৳4,500

### Earrings:
- Elegant Earrings - ৳2,800
- Pearl Drop Earrings - ৳1,800

### Necklaces:
- Gold Necklace - ৳12,500
- Statement Necklace - ৳8,500

### Rings:
- Rose Gold Ring - ৳4,200
- Silver Ring - ৳3,200
`;
    }

    // Language-specific instructions
    const languageInstructions: Record<string, string> = {
      bn: `IMPORTANT: You MUST respond in Bengali (বাংলা) language only. Use Bengali script for all responses.`,
      en: `IMPORTANT: You MUST respond in English language only.`,
      hi: `IMPORTANT: You MUST respond in Hindi (हिंदी) language only. Use Devanagari script for all responses.`
    };

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant for Chitraboli চিত্রাবলী, a handmade jewelry brand. You help customers with:
- Product information about our handcrafted jewelry (necklaces, earrings, rings, bangles, clay jewelry)
- Order inquiries and tracking
- Sizing and care instructions
- Gift recommendations
- General jewelry advice

${languageInstructions[language] || languageInstructions.bn}
${productCatalog}

IMPORTANT: Always quote prices accurately from this catalog. If a product is not listed, say you'll need to check and suggest contacting us on WhatsApp.

Be friendly, professional, and helpful. Keep responses concise but informative.
If asked about specific orders, ask for their order ID.
Our jewelry is handmade with love and crafted with passion in Bangladesh.
Contact: WhatsApp +880 1308697630, Instagram @chitraboli.shop`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
