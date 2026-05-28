import { createClient } from '@supabase/supabase-js';

// Load keys from Vite environment or hardcoded fallback from active keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jistynpxxbmpizikcjbp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppc3R5bnB4eGJtcGl6aWtjamJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NDYyMzAsImV4cCI6MjA5NTUyMjIzMH0.Wd3WjWhMYPa2jUEfjsPi-B5PLWKGrqL_0QCHvbLCXaA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
