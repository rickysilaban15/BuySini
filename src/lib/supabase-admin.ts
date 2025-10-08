// src/lib/supabase-admin.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fallback untuk development
const supabaseUrlFinal = supabaseUrl || 'https://onpbszgldatcnnzodmtg.supabase.co';
const anonKeyFinal = anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ucGJzemdsZGF0Y25uem9kbXRnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDI1Mjg2MTMsImV4cCI6MjAxODEwNDYxM30.6Pfk6QcSoTCfO0v0d9JqJYFrdRlqXv6v7yK4TkLzL7A';

export const supabaseAdmin = createClient(supabaseUrlFinal, anonKeyFinal);
