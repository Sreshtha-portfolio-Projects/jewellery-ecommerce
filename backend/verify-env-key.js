// Script to verify if you're using the correct Supabase key
require('dotenv').config();

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env');
  process.exit(1);
}

try {
  // Decode JWT token to check the role
  const parts = SUPABASE_SERVICE_ROLE_KEY.split('.');
  if (parts.length !== 3) {
    console.log('❌ Invalid JWT token format');
    process.exit(1);
  }
  
  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
  const role = payload.role;
  
  console.log('\n=== Supabase Key Verification ===\n');
  console.log(`Key role: ${role}`);
  console.log(`Project ref: ${payload.ref || 'N/A'}`);
  
  if (role === 'service_role') {
    console.log('\n✅ CORRECT! You are using the service_role key.');
    console.log('   This key has admin privileges and bypasses RLS policies.');
    console.log('   Perfect for backend operations.\n');
    process.exit(0);
  } else if (role === 'anon') {
    console.log('\n❌ WRONG KEY! You are using the anon key instead of service_role.');
    console.log('\n   This will cause errors like:');
    console.log('   - "permission denied"');
    console.log('   - "new row violates row-level security policy"');
    console.log('   - User creation failures');
    console.log('\n   How to fix:');
    console.log('   1. Go to Supabase Dashboard → Settings → API');
    console.log('   2. Find "Project API keys" section');
    console.log('   3. Look for the key labeled "service_role" (NOT "anon")');
    console.log('   4. Copy that key and update SUPABASE_SERVICE_ROLE_KEY in .env');
    console.log('   5. Restart your server\n');
    process.exit(1);
  } else {
    console.log(`\n⚠️  Unknown role: ${role}`);
    console.log('   Expected: service_role\n');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error decoding token:', error.message);
  console.log('   Make sure SUPABASE_SERVICE_ROLE_KEY is a valid JWT token\n');
  process.exit(1);
}
