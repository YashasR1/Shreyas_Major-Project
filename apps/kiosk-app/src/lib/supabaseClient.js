import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demo-placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key-placeholder';

// Shared Supabase client instance for Kiosk app
export const supabase = createClient(supabaseUrl, supabaseKey);
