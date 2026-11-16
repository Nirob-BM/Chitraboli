import { createClient } from "npm:@supabase/supabase-js@2";

export async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return null;

  const token = authorization.slice("Bearer ".length).trim();
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!token || !supabaseUrl || !anonKey) return null;

  try {
    const client = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await client.auth.getClaims(token);
    const subject = data?.claims?.sub;
    if (error || typeof subject !== "string" || subject.length === 0) return null;
    return subject;
  } catch {
    return null;
  }
}