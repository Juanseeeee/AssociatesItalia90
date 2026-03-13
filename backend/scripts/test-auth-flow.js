import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import { nanoid } from 'nanoid';

const BASE_URL = 'http://localhost:3003/api';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const testUser = {
  email: `test_auth_${nanoid(6)}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  dni: Math.floor(Math.random() * 100000000).toString(), // Numeric DNI
  phone: '1234567890'
};

async function runTests() {
  console.log('🚀 Iniciando pruebas de integración de Auth...\n');

  try {
    // 1. Verificar duplicados (debería ser falso)
    console.log('1. Verificando disponibilidad de DNI/Email...');
    const checkRes = await fetch(`${BASE_URL}/auth/check-duplicate?email=${testUser.email}&dni=${testUser.dni}`);
    const checkData = await checkRes.json();
    if (checkData.exists) throw new Error(`El usuario de prueba ya existe: ${JSON.stringify(checkData)}`);
    console.log('✅ Usuario disponible para registro.\n');

    // 2. Registro Exitoso
    console.log('2. Registrando nuevo usuario...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    if (!registerRes.ok) {
        const err = await registerRes.text();
        throw new Error(`Fallo en registro: ${registerRes.status} - ${err}`);
    }
    
    const registerData = await registerRes.json();
    console.log('✅ Registro exitoso. Respuesta:', JSON.stringify(registerData, null, 2));
    
    const userId = registerData.user?.id;
    console.log(`🆔 User ID recibido: "${userId}" (Type: ${typeof userId})`);

    if (!userId) {
        throw new Error('❌ El ID de usuario es undefined o nulo en la respuesta del registro.');
    }

    // 3. Verificando consistencia en BD...
    console.log('\n3. Verificando consistencia en BD...');

    // Validar UUID antes de consultar (o Nanoid si es el caso)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(userId);
    const isNanoid = /^[A-Za-z0-9_-]{21}$/.test(userId);

    if (!isUuid && !isNanoid) {
        console.warn(`⚠️ ADVERTENCIA: El ID recibido no es un UUID estándar ni un Nanoid (21 chars): ${userId}`);
    } else {
        console.log(`✅ Formato de ID válido (${isUuid ? 'UUID' : 'Nanoid'})`);
    }

    // Verificar en Auth (usando listUsers para evitar validación de UUID en getUserById)
    /* 
       Nota: getUserById falla si el ID no es UUID. Usamos listUsers filtrando por email.
    */
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (authError) throw new Error(`Error consultando Auth: ${authError.message}`);
    
    console.log(`🔍 Total usuarios en Auth: ${users.length}`);
    const authUser = users.find(u => u.id === userId);

    if (!authUser) {
        console.warn('⚠️ Usuario NO encontrado por ID. Buscando por email...');
        const userByEmail = users.find(u => u.email === testUser.email);
        if (userByEmail) {
            console.log(`✅ Usuario encontrado por email! ID en lista: "${userByEmail.id}" vs ID devuelto: "${userId}"`);
            if (userByEmail.id !== userId) {
                console.error('❌ CRÍTICO: El ID devuelto por createUser NO coincide con el ID en listUsers.');
            }
        } else {
            // Debug: listar algunos IDs
             console.log('IDs disponibles (primeros 5):', users.slice(0, 5).map(u => u.id));
             throw new Error('❌ Usuario no encontrado en Auth (ni por ID ni por email).');
         }
     } else {
         console.log('✅ Usuario encontrado en Auth por ID.');
     }

    // Verificar en Memberships
    const { data: member, error: dbError } = await supabase
        .from('memberships')
        .select('*')
        .eq('id', userId)
        .single();

    if (dbError) throw new Error(`Error consultando Memberships: ${dbError.message}`);
    if (!member) throw new Error('❌ Usuario no encontrado en tabla memberships.');
    
    console.log('✅ Usuario encontrado en Memberships.');
    console.log(`   - Status: ${member.status}`);
    console.log(`   - Role: ${member.role}`);

    // Validar status por defecto
    if (member.status !== 'pending_payment' && member.status !== 'disabled') {
         console.warn(`⚠️ Status inesperado: ${member.status} (esperado: pending_payment o disabled)`);
    } else {
        console.log('✅ Status inicial correcto.');
    }

    // 4. Intentar registro duplicado (Email)
    console.log('\n4. Probando registro duplicado (Email)...');
    const newNumericDni = Math.floor(Math.random() * 100000000).toString();
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, dni: newNumericDni, firstName: 'Dup', lastName: 'Email' }) // DNI diferente, mismo email
    });
    
    if (dupRes.status === 409) {
        console.log('✅ Registro duplicado rechazado correctamente (Email).');
    } else {
        const txt = await dupRes.text();
        console.error(`❌ Fallo: Se permitió registro duplicado (Email). Status: ${dupRes.status}. Body: ${txt}`);
    }

    // 5. Intentar registro duplicado (DNI)
    console.log('\n5. Probando registro duplicado (DNI)...');
    const dupDniRes = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...testUser, email: `new_${nanoid(5)}@example.com` }) // Email diferente, mismo DNI
    });

    if (dupDniRes.status === 409) {
        console.log('✅ Registro duplicado rechazado correctamente (DNI).');
    } else {
        const txt = await dupDniRes.text();
        console.error(`❌ Fallo: Se permitió registro duplicado (DNI). Status: ${dupDniRes.status} Resp: ${txt}`);
    }

    // 6. Limpieza
    console.log('\n6. Limpiando datos de prueba...');
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) console.error('Error borrando usuario Auth:', deleteError);
    else console.log('✅ Usuario eliminado de Auth.');
    
    // Memberships se borra en cascada si hay FK con delete cascade, sino hay que borrar manual.
    // Asumimos FK ON DELETE CASCADE en tabla memberships -> user_id?
    // Si no, borramos manual.
    const { error: delMemberError } = await supabase.from('memberships').delete().eq('id', userId);
    if (!delMemberError) console.log('✅ Usuario eliminado de Memberships.');

    console.log('\n✨ Pruebas completadas exitosamente.');

  } catch (error) {
    console.error('\n❌ Error en las pruebas:', error);
    // Intentar limpieza de emergencia
    if (testUser.email) {
        // Buscar ID por email si falló antes de tener ID
    }
  }
}

runTests();
