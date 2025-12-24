
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: Missing Supabase environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setAdmin(email: string) {
    if (!email) {
        console.error('Please provide an email address.');
        console.log('Usage: npx tsx scripts/set-admin.ts <email>');
        process.exit(1);
    }

    console.log(`Promoting ${email} to admin...`);

    // 1. Get User
    const { data: user, error: userError } = await supabase
        .from('User')
        .select('id, name, role')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.error(`Error: User with email ${email} not found.`);
        process.exit(1);
    }

    // 2. Update Role
    const { error: updateError } = await supabase
        .from('User')
        .update({ role: 'admin' })
        .eq('id', user.id);

    if (updateError) {
        console.error('Error updating user role:', updateError);
        process.exit(1);
    }

    console.log(`✅ Success! User ${user.name} (${email}) is now an Admin.`);
}

const email = process.argv[2];
setAdmin(email);
