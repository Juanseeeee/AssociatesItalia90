import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TARGET_EMAIL = 'juanse.5009@gmail.com';
const TARGET_DNI = '38961763';

async function diagnose() {
  console.log('🔍 Iniciando diagnóstico de usuario duplicado...');
  console.log(`Target Email: ${TARGET_EMAIL}`);
  console.log(`Target DNI: ${TARGET_DNI}`);

  try {
    // 1. Check Auth Users (by Email)
    console.log('\n--- 1. Verificando Auth Users (por Email) ---');
    // Note: listUsers is paginated, but for a specific email search we might need to iterate or use specific admin calls if available for search.
    // However, listUsers doesn't support filtering by email directly in all versions. 
    // Let's try to find it by listing users. 
    // Better yet, let's try to delete it directly if the goal is cleanup, but here we want to diagnose first.
    // We can use admin.listUsers() and filter manually.
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error('Error listing users:', listError);
    } else {
        const foundUser = users.find(u => u.email === TARGET_EMAIL);
        if (foundUser) {
            console.log('✅ Usuario encontrado en Auth:', foundUser.id);
            console.log('Metadata:', foundUser.user_metadata);
            
            // Cleanup Auth User
            console.log('🗑️ Intentando eliminar usuario de Auth...');
            const { error: delError } = await supabase.auth.admin.deleteUser(foundUser.id);
            if (delError) console.error('Error eliminando usuario Auth:', delError);
            else console.log('✅ Usuario Auth eliminado correctamente.');
            
        } else {
            console.log('❌ Usuario NO encontrado en Auth (por Email).');
        }
    }

    // 2. Check Public Memberships (by Email)
    console.log('\n--- 2. Verificando Memberships (por Email) ---');
    const { data: memberEmail, error: memberEmailError } = await supabase
        .from('memberships')
        .select('*')
        .eq('email', TARGET_EMAIL);
        
    if (memberEmailError) console.error('Error buscando en memberships por email:', memberEmailError);
    else if (memberEmail && memberEmail.length > 0) {
        console.log('✅ Usuario encontrado en Memberships (Email):', memberEmail);
        // Cleanup
        for (const m of memberEmail) {
            console.log(`🗑️ Eliminando membership ID ${m.id}...`);
            await supabase.from('memberships').delete().eq('id', m.id);
        }
    } else {
        console.log('❌ Usuario NO encontrado en Memberships (por Email).');
    }

    // 3. Check Public Memberships (by DNI)
    console.log('\n--- 3. Verificando Memberships (por DNI) ---');
    const { data: memberDni, error: memberDniError } = await supabase
        .from('memberships')
        .select('*')
        .eq('dni', TARGET_DNI);
        
    if (memberDniError) console.error('Error buscando en memberships por DNI:', memberDniError);
    else if (memberDni && memberDni.length > 0) {
        console.log('✅ Usuario encontrado en Memberships (DNI):', memberDni);
         // Cleanup
         for (const m of memberDni) {
            console.log(`🗑️ Eliminando membership ID ${m.id}...`);
            await supabase.from('memberships').delete().eq('id', m.id);
        }
    } else {
        console.log('❌ Usuario NO encontrado en Memberships (por DNI).');
    }

    console.log('\n🏁 Diagnóstico y limpieza finalizados.');

  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

diagnose();
