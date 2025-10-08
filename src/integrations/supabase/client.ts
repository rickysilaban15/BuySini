// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Ambil dari environment variables (Vite)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Debug log untuk memastikan env terbaca
console.log('🔍 Supabase Config Check:', {
  url: SUPABASE_URL ? '✅ Set' : '❌ Missing',
  key: SUPABASE_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing',
  hasWindow: typeof window !== 'undefined',
  hasDocument: typeof document !== 'undefined',
});

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const errorMsg =
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your environment.';
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
