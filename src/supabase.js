import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://sakavddoclshgsavmrim.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNha2F2ZGRvY2xzaGdzYXZtcmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTY4NzYsImV4cCI6MjA5NDg3Mjg3Nn0.EvTufh5jSk1kd2dDLg1Hl3JWJdZSdvzNA2HGhwif4Fk";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    detectSessionInUrl: false,
  },
});
