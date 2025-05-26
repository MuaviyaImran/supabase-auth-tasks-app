import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Check if the environment variables are set
if (!supabaseUrl) {
  console.error('Supabase URL is not set in environment variables');
}
if (!supabaseKey) {
  console.error('Supabase Key is not set in environment variables');
}
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be set in environment variables');
}
export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

