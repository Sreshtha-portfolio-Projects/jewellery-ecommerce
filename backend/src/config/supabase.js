const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  const errorMsg = 'Missing Supabase environment variables (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)';
  console.error(`FATAL: ${errorMsg}`);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
  throw new Error(errorMsg);
}

// Validate Supabase URL format in production
if (process.env.NODE_ENV === 'production') {
  if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error('FATAL: Invalid SUPABASE_URL format in production');
    process.exit(1);
  }
  if (supabaseServiceKey.length < 100) {
    console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY appears invalid (too short)');
    process.exit(1);
  }
}

// Use service role key for admin operations (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

module.exports = supabase;

