const { createClient } = require("@supabase/supabase-js");

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Quick connectivity check (Hostinger Supabase wizard).
 * Uses the Prisma "User" table after migrations/seed.
 */
async function testConnection() {
  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, error: "SUPABASE_URL or API key not set" };
  }

  const { error } = await supabase.from("User").select("id").limit(1);
  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

module.exports = { supabase, testConnection };
