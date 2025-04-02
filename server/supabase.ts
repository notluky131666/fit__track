import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Use environment variables if available, otherwise fall back to hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || 'https://vcyxfffrhuaznqzbsqnj.supabase.co';

// Use service key for admin operations if available
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeXhmZmZyaHVhem5xemJzcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODY4MTMsImV4cCI6MjA1OTE2MjgxM30.69D84lCbWPEhc3Qci3csJ6wnDg9e-37YDei2uG8MBPo';

// If we have a service key (admin key), use it for creating tables
// Otherwise use the anon key for regular operations
const supabaseKey = serviceKey || process.env.SUPABASE_KEY || anonKey;

console.log('Connecting to Supabase:', supabaseUrl);
console.log('Using service role key:', !!serviceKey);

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);