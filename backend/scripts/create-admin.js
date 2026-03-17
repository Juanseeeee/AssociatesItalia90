import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const adminUser = {
  email: 'admin@italia90.com',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'System',
  dni: '00000000',
  phone: '0000000000'
};

async function createAdmin() {
  console.log(`Creando usuario administrador: ${adminUser.email}...`);

  try {
    // 1. Verificar si ya existe
    const { data: existingUser, error: checkError } = await supabase.auth.admin.listUsers();
    const userExists = existingUser?.users?.find(u => u.email === adminUser.email);

    let userId;

    if (userExists) {
        console.log('El usuario ya existe en Auth. Actualizando contraseña y permisos...');
        userId = userExists.id;
        
        await supabase.auth.admin.updateUserById(userId, {
            password: adminUser.password,
            email_confirm: true,
            user_metadata: { firstName: adminUser.firstName, lastName: adminUser.lastName, role: 'admin' }
        });
    } else {
        // 2. Crear usuario en Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: adminUser.email,
          password: adminUser.password,
          email_confirm: true,
          user_metadata: { firstName: adminUser.firstName, lastName: adminUser.lastName, role: 'admin' }
        });

        if (authError) throw new Error(`Error Auth: ${authError.message}`);
        userId = authData.user.id;
        console.log(`✅ Usuario Auth creado con ID: ${userId}`);
    }

    // 3. Crear perfil en Memberships (requerido para login general y getMe)
    const newMember = {
        id: userId,
        email: adminUser.email,
        first_name: adminUser.firstName,
        last_name: adminUser.lastName,
        dni: adminUser.dni,
        phone: adminUser.phone,
        role: 'admin',
        status: 'active',
        membership_number: 'ADMIN-01',
        created_at: new Date().toISOString()
    };

    const { error: memberError } = await supabase.from('memberships').upsert([newMember]);
    if (memberError) {
        console.error('⚠️ Advertencia: No se pudo crear/actualizar el perfil en memberships:', memberError.message);
    } else {
        console.log('✅ Perfil creado/actualizado en tabla memberships.');
    }

    // 4. Agregar a tabla admins (crítico para permisos RLS y acceso a panel)
    const { error: adminError } = await supabase.from('admins').upsert([{
        user_id: userId,
        role: 'admin',
        enabled: true,
        created_at: new Date().toISOString()
    }]);

    if (adminError) throw new Error(`Error insertando en tabla admins: ${adminError.message}`);
    console.log('✅ Usuario agregado a la tabla admins con éxito.');

    console.log('\n=============================================');
    console.log('🎉 ADMINISTRADOR LISTO PARA USAR');
    console.log('=============================================');
    console.log(`Email:    ${adminUser.email}`);
    console.log(`Password: ${adminUser.password}`);
    console.log('=============================================');
    console.log('Puedes usar estas credenciales en el panel de administrador.');

  } catch (error) {
    console.error('\n❌ Error al crear el administrador:', error);
  }
}

createAdmin();