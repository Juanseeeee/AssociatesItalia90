import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import supabase from './supabase.js';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import paymentRoutes from './routes/payment.js';
import authRoutes from './routes/auth.js';
import { requireAuth, requireAdmin } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Helper for audit logging
const logAudit = async (req, action, entity, entityId, details) => {
  const userId = req.user?.id;
  if (userId) {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details: details || {}
    }]).catch(e => console.error('Audit log error:', e));
  }
};

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// --- Endpoints ---

app.get('/api/user/family', requireAuth, async (req, res) => {
  const { data: family, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('parent_id', req.user.id);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(family || []);
});

app.post('/api/user/family', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'dni_copy', maxCount: 1 },
    { name: 'school_cert', maxCount: 1 },
    { name: 'auth_parents', maxCount: 1 }
]), async (req, res) => {
  const { firstName, lastName, dni, birthDate, medicalInfo, relation } = req.body;
  
  if (!firstName || !lastName || !dni || !birthDate || !relation) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  const fileUrls = {};
  if (req.files) {
    for (const [key, fileArray] of Object.entries(req.files)) {
      const file = fileArray[0];
      const filename = `family/${Date.now()}-${nanoid(6)}${path.extname(file.originalname)}`;
      const filepath = path.join(uploadDir, filename);
      
      const dir = path.dirname(filepath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      try {
        if (file.mimetype.startsWith('image/')) {
          await sharp(file.buffer)
            .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
            .toFile(filepath);
        } else {
          fs.writeFileSync(filepath, file.buffer);
        }
        fileUrls[key] = `/uploads/${filename}`;
      } catch (e) {
        console.error('File save error:', e);
      }
    }
  }

  const newMinor = {
    id: nanoid(),
    parent_id: req.user.id,
    first_name: firstName,
    last_name: lastName,
    dni,
    birth_date: birthDate,
    medical_info: medicalInfo,
    relation,
    photo_url: fileUrls['photo'] || null,
    dni_url: fileUrls['dni_copy'] || null,
    school_cert_url: fileUrls['school_cert'] || null,
    auth_parents_url: fileUrls['auth_parents'] || null,
    membership_status: 'pending',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('family_members').insert([newMinor]).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'ADD_MINOR', 'user', req.user.id, { minorId: data.id, name: `${firstName} ${lastName}` });
  
  res.status(201).json(data);
});

app.get('/api/members/:id/card', async (req, res) => {
  const { id } = req.params;
  const { data: member, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error || !member) return res.status(404).json({ error: 'Member not found' });
  
  const qrData = `http://localhost:5173/verificar/${member.id}`;
  
  res.json({
    id: member.id,
    name: member.name,
    category: member.category || 'Socio',
    status: member.status,
    joinedAt: member.joined_at,
    expiration: member.expiration,
    photo: member.photo,
    qr_data: qrData,
    lastPayment: member.last_payment
  });
});

app.get('/api/members/:id/payments', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data: history, error } = await supabase
    .from('payments')
    .select('*')
    .eq('member_id', id)
    .order('date', { ascending: false });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(history);
});

app.post('/api/members/:id/pay', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { amount, method } = req.body;
  
  // 1. Get Member
  const { data: member } = await supabase.from('memberships').select('*').eq('id', id).single();
  if (!member) return res.status(404).json({ error: 'Member not found' });

  // 2. Update Member
  const currentExp = member.expiration ? new Date(member.expiration) : new Date();
  const now = new Date();
  const baseDate = currentExp > now ? currentExp : now;
  baseDate.setMonth(baseDate.getMonth() + 1);

  await supabase.from('memberships').update({
      status: 'active',
      last_payment: new Date().toISOString(),
      expiration: baseDate.toISOString()
  }).eq('id', id);

  // 3. Record Payment
  const payment = {
    id: nanoid(),
    member_id: id,
    amount: amount || 5000,
    date: new Date().toISOString(),
    concept: 'Cuota Social',
    method: method || 'credit_card',
    status: 'aprobado'
  };
  
  await supabase.from('payments').insert([payment]);

  res.json({ success: true, member: { ...member, status: 'active' }, payment });
});

app.get('/api/kpi', async (req, res) => {
  try {
    const { count: activeMembers } = await supabase.from('memberships').select('*', { count: 'exact', head: true });
    const { count: paymentsCount } = await supabase.from('payments').select('*', { count: 'exact', head: true });
    const { count: activitiesCount } = await supabase.from('activities').select('*', { count: 'exact', head: true }).is('deleted_at', null);
    
    res.json({ memberships: activeMembers || 0, payments: paymentsCount || 0, activities: activitiesCount || 0 });
  } catch (e) {
    res.status(500).json({ error: 'KPI error' });
  }
});

app.get('/api/activities', async (req, res) => {
  const { data, error } = await supabase.from('activities')
    .select('*')
    .is('deleted_at', null)
    .order('created_at',{ascending:false})
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/activities', requireAuth, requireAdmin, async (req, res) => {
  const { name, slots, cost, schedule, description, image } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const activity = {
    id: nanoid(),
    name,
    slots: parseInt(slots) || 0,
    cost: parseFloat(cost) || 0,
    schedule: schedule || '',
    description: description || '',
    image: image || '',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('activities').insert([activity]).select('*').single();
  
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'CREATE', 'activity', data.id, { name });
  res.status(201).json(data);
});

app.put('/api/activities/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, slots, cost, schedule, description, image } = req.body || {};
  
  const { data, error } = await supabase.from('activities')
    .update({ name, slots, cost, schedule, description, image })
    .eq('id', id)
    .select('*')
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'UPDATE', 'activity', id, { name });
  return res.json(data);
});

app.delete('/api/activities/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('activities')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    await logAudit(req, 'DELETE', 'activity', id, {});
    res.json({ success: true });
});

// --- News Endpoints ---

app.get('/api/news', async (req, res) => {
  const { data, error } = await supabase.from('news')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/news', requireAdmin, async (req, res) => {
  const { title, excerpt, image } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  
  const newsItem = {
    id: nanoid(),
    title,
    excerpt: excerpt || '',
    image: image || '',
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('news').insert([newsItem]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'CREATE', 'news', data.id, { title });
  res.status(201).json(data);
});

app.put('/api/news/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, excerpt, image } = req.body;
  
  const { data, error } = await supabase.from('news')
    .update({ title, excerpt, image })
    .eq('id', id)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req, 'UPDATE', 'news', id, { title });
  res.json(data);
});

app.delete('/api/news/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('news').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req, 'DELETE', 'news', id, {});
  res.json({ success: true });
});

// --- Fixtures Endpoints ---

app.get('/api/fixtures', async (req, res) => {
  const { data, error } = await supabase.from('fixtures')
    .select('*')
    .order('date', { ascending: true }); // Próximos partidos primero? O pasados? Usually future games first or distinct lists. Let's do ascending.
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/fixtures', requireAuth, requireAdmin, async (req, res) => {
  const { home_team, away_team, date, location } = req.body;
  if (!home_team || !away_team || !date) return res.status(400).json({ error: 'Teams and date required' });

  const fixture = {
    id: nanoid(),
    home_team,
    away_team,
    date,
    location: location || '',
    status: 'scheduled',
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('fixtures').insert([fixture]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'CREATE', 'fixture', data.id, { home_team, away_team });
  res.status(201).json(data);
});

app.put('/api/fixtures/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { home_team, away_team, date, location, status, home_score, away_score } = req.body;

  const { data, error } = await supabase.from('fixtures')
    .update({ home_team, away_team, date, location, status, home_score, away_score })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req, 'UPDATE', 'fixture', id, { home_team, away_team });
  res.json(data);
});

app.delete('/api/fixtures/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('fixtures').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req, 'DELETE', 'fixture', id, {});
  res.json({ success: true });
});

// --- Services Endpoints ---

app.get('/api/services', async (req, res) => {
  const { data, error } = await supabase.from('services')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

app.post('/api/services', requireAuth, requireAdmin, async (req, res) => {
  const { title, description, image } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const service = {
    id: nanoid(),
    title,
    description: description || '',
    image: image || '',
    active: true,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('services').insert([service]).select().single();
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'CREATE', 'service', data.id, { title });
  res.status(201).json(data);
});

app.put('/api/services/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, image, active } = req.body;

  const { data, error } = await supabase.from('services')
    .update({ title, description, image, active })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req, 'UPDATE', 'service', id, { title });
  res.json(data);
});

app.delete('/api/services/:id', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  await logAudit(req, 'DELETE', 'service', id, {});
  res.json({ success: true });
});

// Start Server
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Supabase Connected: ${!!supabase}`);
});
