
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

console.log('Script started...');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const tablesToCheck = [
  'activities',
  'memberships',
  'payments',
  'enrollments',
  'news',
  'services',
  'audit_logs',
  'travel_authorizations',
  'membership_requests',
  'fixtures',
  'admins',
  'users',
  'family_members'
];

async function checkDatabase() {
  console.log('🔍 Iniciando diagnóstico de base de datos Supabase...\n');
  
  const results = {};

  // 1. Check Auth Users
  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    results['Auth Users'] = { count: users.length, status: 'OK' };
    console.log(`✅ Auth Users: ${users.length} usuarios encontrados.`);
  } catch (e) {
    results['Auth Users'] = { status: 'Error', error: e.message };
    console.log(`❌ Auth Users: Error - ${e.message}`);
  }

  // 2. Check Public Tables
  for (const table of tablesToCheck) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        // Error code 42P01 means undefined_table (Postgres)
        if (error.code === '42P01') {
          results[table] = { status: 'Missing' };
          console.log(`⚠️  Tabla '${table}': No existe.`);
        } else {
          results[table] = { status: 'Error', error: error.message, code: error.code };
          console.log(`❌ Tabla '${table}': Error - ${error.message}`);
        }
      } else {
        results[table] = { count, status: 'OK' };
        console.log(`✅ Tabla '${table}': ${count} registros.`);
      }
    } catch (e) {
      results[table] = { status: 'Exception', error: e.message };
      console.log(`❌ Tabla '${table}': Excepción - ${e.message}`);
    }
  }

  console.log('\n📊 Resumen Final:');
  console.table(results);
}

checkDatabase();
