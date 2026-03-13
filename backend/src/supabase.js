import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const enabled = !!(url && key);
if (enabled) {
    console.log(`Supabase Client Initialized with URL: ${url}`);
} else {
    console.warn('Supabase Client DISABLED (missing env vars)');
}
const client = enabled ? createClient(url, key) : null;
export default client;
