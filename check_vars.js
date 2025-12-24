require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Type ' + typeof process.env.NEXT_PUBLIC_SUPABASE_URL : 'MISSING');
console.log('KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Type ' + typeof process.env.SUPABASE_SERVICE_ROLE_KEY : 'MISSING');
