
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const adminEmail = 'admin@italia90.com';
const adminPassword = 'AdminPassword123!';

async function createAdmin() {
  console.log('Checking for existing admin user...');
  
  // 1. Check if user exists in Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  let adminUser = users.find(u => u.email === adminEmail);
  
  if (!adminUser) {
    console.log('Creating admin user in Auth...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { firstName: 'Admin', lastName: 'System', role: 'admin' }
    });
    
    if (error) {
      console.error('Error creating admin user:', error);
      return;
    }
    adminUser = data.user;
    console.log('Admin user created in Auth:', adminUser.id);
  } else {
    console.log('Admin user already exists in Auth:', adminUser.id);
    // Update password just in case
    await supabase.auth.admin.updateUserById(adminUser.id, { password: adminPassword });
    console.log('Admin password updated.');
  }

  // 2. Ensure user is in memberships table with admin role
  console.log('Upserting admin in memberships table...');
  const { error: upsertError } = await supabase
    .from('memberships')
    .upsert({
      id: adminUser.id,
      email: adminEmail,
      role: 'admin',
      first_name: 'Admin',
      last_name: 'System',
      dni: '00000000',
      status: 'active'
    })
    .select()
    .single();

  if (upsertError) {
    console.error('Error upserting membership:', upsertError);
  } else {
    console.log('Admin membership confirmed.');
  }
}

createAdmin();
