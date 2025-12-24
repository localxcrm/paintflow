
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function listUsers() {
    const { data: users, error } = await supabase
        .from('User')
        .select('email, role, name');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Users in DB:');
    console.table(users);
}

listUsers();
