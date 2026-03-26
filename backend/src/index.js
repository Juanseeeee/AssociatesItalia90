import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';
import supabase from './supabase.js';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import paymentRoutes from './routes/payment.js';
import authRoutes from './routes/auth.js';
import membersRoutes from './routes/members.js';
import activityRoutes from './routes/activities.js';
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
    const { error } = await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details: details || {}
    }]);
    if (error) console.error('Audit log error:', error);
  }
};

const app = express();
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!isProd) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use('/api/payments', paymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/activities', activityRoutes);

// Multer setup
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// --- Endpoints ---
// Basic Security Headers without external deps
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Simple in-memory rate limiter (per-IP & route), conservative limits
const rateState = new Map();
app.use((req, res, next) => {
  const key = `${req.ip}:${req.path}`;
  const now = Date.now();
  const windowMs = 60 * 1000;
  const limit = req.path.startsWith('/api/auth') || req.path.startsWith('/api/payments')
    ? 30 // stricter for auth and payments
    : 120;
  let entry = rateState.get(key);
  if (!entry || (now - entry.start) > windowMs) {
    entry = { start: now, count: 0 };
  }
  entry.count++;
  rateState.set(key, entry);
  if (entry.count > limit) {
    return res.status(429).json({ error: 'Too Many Requests' });
  }
  next();
});

app.get('/api/user/family', requireAuth, async (req, res) => {
  const { data: family, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('parent_id', req.user.id);
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(family || []);
});

app.get('/api/user/family/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .eq('parent_id', req.user.id)
    .single();
    
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
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

app.put('/api/user/family/:id', requireAuth, upload.fields([
    { name: 'photo', maxCount: 1 }, 
    { name: 'dni_copy', maxCount: 1 },
    { name: 'school_cert', maxCount: 1 },
    { name: 'auth_parents', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, dni, birthDate, medicalInfo, relation } = req.body;
  
  // Verify ownership
  const { data: existing, error: checkError } = await supabase
    .from('family_members')
    .select('id')
    .eq('id', id)
    .eq('parent_id', req.user.id)
    .single();

  if (checkError || !existing) {
    return res.status(403).json({ error: 'No autorizado para editar este miembro' });
  }

  const updates = {};
  if (firstName) updates.first_name = firstName;
  if (lastName) updates.last_name = lastName;
  if (dni) updates.dni = dni;
  if (birthDate) updates.birth_date = birthDate;
  if (medicalInfo !== undefined) updates.medical_info = medicalInfo;
  if (relation) updates.relation = relation;

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
        
        if (key === 'photo') updates.photo_url = `/uploads/${filename}`;
        if (key === 'dni_copy') updates.dni_url = `/uploads/${filename}`;
        if (key === 'school_cert') updates.school_cert_url = `/uploads/${filename}`;
        if (key === 'auth_parents') updates.auth_parents_url = `/uploads/${filename}`;
      } catch (e) {
        console.error('File save error during update:', e);
      }
    }
  }

  const { data, error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
    
  if (error) return res.status(500).json({ error: error.message });
  
  await logAudit(req, 'UPDATE_MINOR', 'user', req.user.id, { minorId: id });
  res.json(data);
});

app.delete('/api/user/family/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  
  // Verify ownership
  const { data: existing, error: checkError } = await supabase
    .from('family_members')
    .select('id')
    .eq('id', id)
    .eq('parent_id', req.user.id)
    .single();

  if (checkError || !existing) {
    return res.status(403).json({ error: 'No autorizado para eliminar este miembro' });
  }

  const { error } = await supabase.from('family_members').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  await logAudit(req, 'DELETE_MINOR', 'user', req.user.id, { minorId: id });
  res.json({ success: true });
});

// --- Members Routes moved to routes/members.js ---

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

// --- Admin Requests Endpoint (sync with real DB, with robust fallbacks) ---
app.get('/api/requests', requireAuth, requireAdmin, async (req, res) => {
  try {
    // Try primary table: membership_requests
    const { data: requests, error: reqErr } = await supabase
      .from('membership_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    let combined = Array.isArray(requests) ? requests : [];
    
    // If table missing or error, gracefully fallback
    if (reqErr) {
      // Fallback 1: pending minors requiring review
      const { data: minors } = await supabase
        .from('family_members')
        .select('*')
        .eq('membership_status', 'pending');
      
      if (Array.isArray(minors) && minors.length > 0) {
        combined = combined.concat(minors.map(m => ({
          id: m.id,
          type: 'minor_pending',
          first_name: m.first_name,
          last_name: m.last_name,
          dni: m.dni,
          created_at: m.created_at,
          relation: m.relation,
        })));
      }
      
      // Fallback 2: members with pending/inactive status that need admin review
      const { data: pendMembers } = await supabase
        .from('memberships')
        .select('id, email, first_name, last_name, status, created_at')
        .in('status', ['pending_payment', 'disabled']);
      
      if (Array.isArray(pendMembers) && pendMembers.length > 0) {
        combined = combined.concat(pendMembers.map(m => ({
          id: m.id,
          type: 'membership_pending',
          email: m.email,
          first_name: m.first_name,
          last_name: m.last_name,
          status: m.status,
          created_at: m.created_at,
        })));
      }
    }
    
    res.json(combined);
  } catch (e) {
    console.error('Requests endpoint error:', e);
    res.status(500).json({ error: 'Error loading requests' });
  }
});

// --- Admin Activity Feed ---
app.get('/api/admin/activity-feed', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 20);
    const offset = Number(req.query.offset || 0);
    const typeFilter = (req.query.type || '').toString();
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;
    const events = [];
    
    const [{ data: payments }, { data: members }, { data: enrollments }, { data: activities }, { data: news }] = await Promise.all([
      supabase.from('payments').select('id, concept, amount, status, created_at, email').order('created_at', { ascending: false }).limit(200),
      supabase.from('memberships').select('id, email, first_name, last_name, status, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('activity_enrollments').select('id, member_id, status, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('activities').select('id, name, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('news').select('id, title, published_at').order('published_at', { ascending: false }).limit(200),
    ]);
    
    if (Array.isArray(payments)) {
      payments.forEach(p => events.push({ type: 'payment', ts: p.created_at, payload: p }));
    }
    if (Array.isArray(members)) {
      members.forEach(m => events.push({ type: 'member_created', ts: m.created_at, payload: m }));
    }
    if (Array.isArray(enrollments)) {
      enrollments.forEach(e => events.push({ type: 'enrollment', ts: e.created_at, payload: e }));
    }
    if (Array.isArray(activities)) {
      activities.forEach(a => events.push({ type: 'activity_created', ts: a.created_at, payload: a }));
    }
    if (Array.isArray(news)) {
      news.forEach(n => events.push({ type: 'news_published', ts: n.published_at, payload: n }));
    }
    
    let sorted = events
      .filter(e => e.ts)
      .sort((a, b) => new Date(b.ts) - new Date(a.ts))
    
    if (typeFilter) {
      sorted = sorted.filter(e => e.type === typeFilter);
    }
    if (from) {
      sorted = sorted.filter(e => new Date(e.ts) >= from);
    }
    if (to) {
      sorted = sorted.filter(e => new Date(e.ts) <= to);
    }
    
    const total = sorted.length;
    const page = sorted.slice(offset, offset + limit);
      
    res.json({ items: page, total, has_more: offset + limit < total });
  } catch (e) {
    console.error('Activity feed error:', e);
    res.status(500).json({ error: 'Error loading activity feed' });
  }
});

// --- Admin KPIs ---
app.get('/api/admin/kpis', requireAuth, requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthStart = new Date(y, m, 1).toISOString();
    const monthEnd = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
    
    const [membersRes, paymentsRes, minorsRes, pendMembersRes] = await Promise.all([
      supabase.from('memberships').select('id,status,membership_status,created_at').order('created_at', { ascending: false }).limit(2000),
      supabase.from('payments').select('id,amount,status,created_at').gte('created_at', monthStart).lte('created_at', monthEnd).order('created_at', { ascending: false }).limit(5000),
      supabase.from('family_members').select('id, created_at').eq('membership_status', 'pending').limit(2000),
      supabase.from('memberships').select('id,status,created_at').in('status', ['pending_payment', 'disabled']).limit(2000),
    ]);
    
    const members = membersRes.data || [];
    const payments = paymentsRes.data || [];
    const minorsPend = minorsRes.data || [];
    const pendMembers = pendMembersRes.data || [];
    
    const totalMembers = members.length;
    const activeMembers = members.filter(m => (m.status === 'active') || (m.membership_status === 'active')).length;
    const pendingRequests = minorsPend.length + pendMembers.length;
    const monthlyRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const statusCounts = payments.reduce((acc, p) => {
      const s = String(p.status || '').toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    
    const revenueByDay = [];
    const byDate = {};
    payments.forEach(p => {
      if (!p.created_at) return;
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      byDate[key] = (byDate[key] || 0) + Number(p.amount || 0);
    });
    Object.entries(byDate).forEach(([date, amount]) => revenueByDay.push({ date, amount }));
    revenueByDay.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      totals: { totalMembers, activeMembers, pendingRequests, monthlyRevenue },
      paymentsStatusCounts: statusCounts,
      revenueByDay
    });
  } catch (e) {
    console.error('KPIs error:', e);
    res.status(500).json({ error: 'Error loading KPIs' });
  }
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

const uploadNews = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.post('/api/news', requireAdmin, uploadNews.single('image'), async (req, res) => {
  const { title, excerpt, image } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  
  let imageUrl = image || '';
  if (req.file) {
    try {
      const filename = `news/${Date.now()}-${nanoid(6)}.webp`;
      const processed = await sharp(req.file.buffer)
        .resize(800, 600, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 85 })
        .toBuffer();
      const { error: upErr } = await supabase
        .storage
        .from('news')
        .upload(filename, processed, { contentType: 'image/webp', upsert: true });
      if (upErr) return res.status(500).json({ error: 'Error saving image' });
      const { data: pub } = supabase.storage.from('news').getPublicUrl(filename);
      imageUrl = pub?.publicUrl || '';
    } catch (e) {
      console.error('Error saving image:', e);
      return res.status(500).json({ error: 'Error saving image' });
    }
  }

  const newsItem = {
    id: randomUUID(),
    title,
    excerpt: excerpt || '',
    image: imageUrl,
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase.from('news').insert([newsItem]).select();
  if (error) return res.status(500).json({ error: error.message });
  
  const created = Array.isArray(data) ? data[0] : data;
  await logAudit(req, 'CREATE', 'news', created?.id, { title });
  res.status(201).json(created);
});

app.put('/api/news/:id', requireAuth, requireAdmin, uploadNews.single('image'), async (req, res) => {
  const { id } = req.params;
  const { title, excerpt, image } = req.body;
  
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (excerpt !== undefined) updates.excerpt = excerpt;

  if (req.file) {
    try {
      const filename = `news/${Date.now()}-${nanoid(6)}.webp`;
      const processed = await sharp(req.file.buffer)
        .resize(800, 600, { fit: 'cover', withoutEnlargement: false })
        .webp({ quality: 85 })
        .toBuffer();
      const { error: upErr } = await supabase
        .storage
        .from('news')
        .upload(filename, processed, { contentType: 'image/webp', upsert: true });
      if (upErr) return res.status(500).json({ error: 'Error saving image' });
      const { data: pub } = supabase.storage.from('news').getPublicUrl(filename);
      updates.image = pub?.publicUrl || '';
    } catch (e) {
      console.error('Error saving image:', e);
      return res.status(500).json({ error: 'Error saving image' });
    }
  } else if (image !== undefined) {
    updates.image = image;
  }

  const { data, error } = await supabase.from('news')
    .update(updates)
    .eq('id', id)
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  const updated = Array.isArray(data) ? data[0] : data;
  await logAudit(req, 'UPDATE', 'news', id, { title });
  res.json(updated || { id, title, excerpt, image });
});

app.delete('/api/news/:id', requireAuth, requireAdmin, async (req, res) => {
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
    id: randomUUID(),
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

app.put('/api/fixtures/:id', requireAuth, requireAdmin, async (req, res) => {
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
    id: randomUUID(),
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

app.put('/api/services/:id', requireAuth, requireAdmin, async (req, res) => {
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

// Serve frontend static files in production (MUST BE LAST)
const distDir = path.join(__dirname, '../../app/dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // Handle SPA routing
  app.get('*', (req, res) => {
    // Check if request is for API, if so, 404
    if (req.path.startsWith('/api')) {
       return res.status(404).json({ error: 'Not Found' });
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

// Start Server (only if not running in Vercel serverless environment)
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL_SERVER === 'true') {
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Supabase Connected: ${!!supabase}`);
  });
}

export default app;
