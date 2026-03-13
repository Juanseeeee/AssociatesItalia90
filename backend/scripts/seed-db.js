
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { db } from '../src/db.js';

// Load env vars
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seedDatabase() {
  console.log('🌱 Iniciando carga de datos semilla en Supabase...');

  // 1. Activities
  if (db.activities && db.activities.length > 0) {
    console.log(`\nProcesando ${db.activities.length} actividades...`);
    const { error } = await supabase.from('activities').upsert(
      db.activities.map(a => ({
        ...a,
        // Ensure format matches Supabase schema if needed
        deleted_at: null
      }))
    );
    if (error) console.error('❌ Error insertando actividades:', error.message);
    else console.log('✅ Actividades insertadas correctamente.');
  }

  // 2. News
  if (db.news && db.news.length > 0) {
    console.log(`\nProcesando ${db.news.length} noticias...`);
    const { error } = await supabase.from('news').upsert(db.news);
    if (error) {
        if (error.code === '42P01') console.warn('⚠️ Tabla news no existe.');
        else console.error('❌ Error insertando noticias:', error.message);
    }
    else console.log('✅ Noticias insertadas correctamente.');
  }

  // 3. Services (Check existence first implicitly via upsert)
  if (db.services && db.services.length > 0) {
    console.log(`\nProcesando ${db.services.length} servicios...`);
    const { error } = await supabase.from('services').upsert(db.services);
    if (error) {
        if (error.code === '42P01') console.warn('⚠️ Tabla services no existe.');
        else console.error('❌ Error insertando servicios:', error.message);
    }
    else console.log('✅ Servicios insertados correctamente.');
  }

  // 4. Memberships (Vitalicio/Honorario)
  // Skipped to avoid Foreign Key violations if users don't exist in Auth.
  // Real users should register via the app.
  /*
  if (db.memberships && db.memberships.length > 0) {
    console.log(`\nProcesando ${db.memberships.length} membresías iniciales...`);
    // Note: memberships table might have different schema or strict FKs. 
    // We try to insert but handle errors.
    const { error } = await supabase.from('memberships').upsert(
        db.memberships.map(m => ({
            id: m.id,
            user_id: m.id, // Assuming ID matches or mapping strategy
            plan: m.plan,
            status: 'active',
            // Adapt fields as necessary
        }))
    );
    if (error) {
         // This often fails due to user_id FK constraints if users don't exist in auth.users
         console.warn('⚠️ No se pudieron insertar membresías (probablemente falta usuario en Auth):', error.message);
    } else {
        console.log('✅ Membresías insertadas.');
    }
  }
  */

  console.log('\n🏁 Proceso finalizado.');
}

seedDatabase();
