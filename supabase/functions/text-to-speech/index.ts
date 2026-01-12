import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // 20 requests per window
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
  if (req.method === 'OPTIONS') {
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
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { text, language } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    // Choose voice based on language
    // alloy - neutral, echo - male, fable - British, onyx - deep male, nova - female, shimmer - female soft
    let voice = 'nova'; // Default voice
    if (language === 'bn') {
      voice = 'nova'; // Nova works well for Bangla
    } else if (language === 'hi') {
      voice = 'nova'; // Nova for Hindi
    } else {
      voice = 'nova'; // Nova for English
    }

    console.log(`Generating TTS for language: ${language}, voice: ${voice}, text length: ${text.length}`);

    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.substring(0, 4096), // OpenAI TTS has a 4096 character limit
        voice: voice,
        response_format: 'mp3',
        speed: 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI TTS error:', error);
      throw new Error(error.error?.message || 'Failed to generate speech');
    }

    // Get the audio as array buffer
    const audioBuffer = await response.arrayBuffer();
    
    // Convert to base64
    const uint8Array = new Uint8Array(audioBuffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, [...chunk]);
    }
    
    const base64Audio = btoa(binary);

    console.log('TTS generated successfully, audio size:', audioBuffer.byteLength);

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
