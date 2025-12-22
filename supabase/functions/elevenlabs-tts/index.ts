import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, language } = await req.json();
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');

    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    // Use a multilingual voice that supports Bengali, Hindi, and English
    // Sarah - EXAVITQu4vr4xnSDxMaL is a good multilingual voice
    const voiceId = 'EXAVITQu4vr4xnSDxMaL';

    console.log(`Generating ElevenLabs TTS for language: ${language}, text length: ${text.length}`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.substring(0, 5000), // ElevenLabs limit
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      let errJson: any = null;
      try {
        errJson = await response.json();
      } catch {
        // ignore
      }

      console.error('ElevenLabs TTS error:', errJson ?? (await response.text()));

      const code = errJson?.detail?.status as string | undefined;
      const message = (errJson?.detail?.message || errJson?.message || 'Failed to generate speech') as string;

      // ElevenLabs may disable Free Tier due to unusual activity.
      // IMPORTANT: Return HTTP 200 for this specific case so the frontend can fall back
      // without Lovable treating it as a fatal runtime/network error.
      const isUnusualActivity = code === 'detected_unusual_activity';
      const status = isUnusualActivity ? 200 : response.status;

      return new Response(JSON.stringify({ error: message, code, blocked: isUnusualActivity }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the audio directly as binary
    const audioBuffer = await response.arrayBuffer();

    console.log('ElevenLabs TTS generated successfully, audio size:', audioBuffer.byteLength);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });
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
