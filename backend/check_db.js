
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
  console.log('Checking memberships table structure...');
  // We can query information_schema to get column types
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns') // This might not work with Supabase JS client directly depending on permissions, but let's try RPC or just inspecting a returned row usually tells us, but types are JSONified.
    // Better approach: Insert a dummy row with nanoid and see if it fails? No, don't want to pollute.
    // Let's just check one row and infer, or trust the error message.
    // Actually, querying a system view is the best way if allowed.
    // Supabase JS client doesn't support selecting from information_schema easily unless exposing it.
    // Let's try to select 'id' from memberships and see the format.
    .from('memberships')
    .select('id')
    .limit(1);

  if (columnsError) {
    console.error('Error fetching memberships:', columnsError);
  } else if (columns && columns.length > 0) {
    console.log('Sample ID:', columns[0].id);
    const id = columns[0].id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    console.log('Is ID a UUID?', isUuid);
  } else {
    console.log('No members found to check ID type.');
  }
}

checkColumns();
