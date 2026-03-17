import supabase from './src/supabase.js';

async function test() {
    const res = await supabase.from('memberships').select('*');
    console.log('Count:', res.data?.length);
    console.log('Data:', res.data);
    console.log('Error:', res.error);
    process.exit(0);
}

test();
