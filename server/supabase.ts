import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://vcyxfffrhuaznqzbsqnj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjeXhmZmZyaHVhem5xemJzcW5qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODY4MTMsImV4cCI6MjA1OTE2MjgxM30.69D84lCbWPEhc3Qci3csJ6wnDg9e-37YDei2uG8MBPo';

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);