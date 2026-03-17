import 'dotenv/config';
import supabase from './src/supabase.js';
async function test() {
    const res = await supabase.from('memberships').select('*').limit(1);
    console.log('DATA:', res.data);
    console.log('ERROR:', res.error);
    process.exit(0);
}
test();