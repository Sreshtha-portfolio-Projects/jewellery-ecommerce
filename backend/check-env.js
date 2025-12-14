// Quick script to check if environment variables are set
require('dotenv').config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

console.log('\n=== Environment Variables Check ===\n');

let allSet = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Mask sensitive values
    const masked = varName.includes('KEY') || varName.includes('SECRET') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`✅ ${varName}: ${masked}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

console.log('\n=== Optional Variables ===\n');

const optionalVars = [
  'FRONTEND_URL',
  'BACKEND_URL',
  'PORT',
  'NODE_ENV'
];

optionalVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚠️  ${varName}: Not set (using default)`);
  }
});

if (!allSet) {
  console.log('\n❌ Missing required environment variables!');
  console.log('Please set them in backend/.env file\n');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!\n');
  process.exit(0);
}
