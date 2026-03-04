import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { nanoid } from 'nanoid';
import supabase from './supabase.js';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';

// Configuración de Mercado Pago
// Reemplazar con el Access Token de producción o pruebas
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-8266203530397333-102513-5a401275213670603704812674313626-179373979' });

// Email Simulator
const sendEmail = async (to, subject, text) => {
  console.log(`[EMAIL SIMULATION] To: ${to}, Subject: ${subject}, Body: ${text}`);
  // In production, use nodemailer or similar
};

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'], credentials: false }));
app.use(express.json());
app.use(morgan('dev'));

const db = {
  users: [],
  activities: [
    { id: 'futbol', name: 'Fútbol 5', slots: 24 },
    { id: 'tenis', name: 'Tenis', slots: 12 },
    { id: 'natacion', name: 'Natación', slots: 30 },
  ],
  memberships: [],
  payments: [],
  enrollments: [],
  news: [
    { id: nanoid(), title: 'Italia 90 presenta su campaña de socios 2026', excerpt: 'Beneficios exclusivos, actividades y más.', image: '' },
    { id: nanoid(), title: 'Nuevo torneo de fútbol 5', excerpt: 'Inscripciones abiertas para equipos.', image: '' },
    { id: nanoid(), title: 'Clínica de tenis con profesores invitados', excerpt: 'Turnos limitados.', image: '' },
  ],
  services: [
    { id: nanoid(), name: 'Gimnasio', description: 'Salas equipadas y clases guiadas.', category: 'Fitness' },
    { id: nanoid(), name: 'Natación', description: 'Piscina climatizada, clases para todas las edades.', category: 'Acuáticos' },
    { id: nanoid(), name: 'Tenis', description: 'Canchas y escuela de tenis.', category: 'Racket' },
    { id: nanoid(), name: 'Fútbol 5', description: 'Alquiler de canchas y torneos.', category: 'Fútbol' },
    { id: nanoid(), name: 'Yoga', description: 'Clases de bienestar y relajación.', category: 'Bienestar' },
    { id: nanoid(), name: 'Colonia de Vacaciones', description: 'Actividades para niños en temporada.', category: 'Infantil' }
  ],
  audit_logs: [],
  fixtures: [
    { id: nanoid(), sport: 'Fútbol', opponent: 'Club Atlético Centro', date: new Date().toISOString(), venue: 'Complejo Italia 90' },
    { id: nanoid(), sport: 'Tenis', opponent: 'Escuela Municipal', date: new Date(Date.now()+86400000).toISOString(), venue: 'Cancha 2' },
  ]
};

// Helper for audit logging
const logAudit = async (req, action, entity, entityId, details) => {
  const userId = req.user?.id;
  const entry = { 
    id: nanoid(), 
    user_id: userId, 
    action, 
    entity, 
    entity_id: entityId, 
    details: details || {}, 
    created_at: new Date().toISOString() 
  };
  
  if (supabase && userId) {
    await supabase.from('audit_logs').insert([{
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      details: details || {}
    }]).catch(e => console.error('Audit log error:', e));
  }
  
  db.audit_logs = db.audit_logs || [];
  db.audit_logs.unshift(entry);
};

// Seed de ejemplo para contemplar tipos estatutarios
db.memberships.push(
  { id: nanoid(), name: 'Socio Vitalicio', dni: '10000000', email: 'vitalicio@italia90.club', phone: '', plan: 'vitalicio', price: 0, memberType: 'vitalicio', rights: { political: true, activities: true }, paysFee: true, joinedAt: Date.now()-86400000*365*30 },
  { id: nanoid(), name: 'Socio Honorario', dni: '20000000', email: 'honorario@italia90.club', phone: '', plan: 'honorario', price: 0, memberType: 'honorario', rights: { political: false, activities: true }, paysFee: false, joinedAt: Date.now()-86400000*100 }
);

app.get('/api/kpi', (req, res) => {
  const activeMembers = db.memberships.length;
  const paymentsCount = db.payments.length;
  const activitiesCount = db.activities.filter(a => !a.deleted_at).length;
  res.json({ memberships: activeMembers, payments: paymentsCount, activities: activitiesCount });
});

app.get('/api/activities', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('activities')
      .select('*')
      .is('deleted_at', null)
      .order('created_at',{ascending:false})
      .limit(100);
    if (!error) return res.json(data || []);
  }
  res.json(db.activities.filter(a => !a.deleted_at));
});

app.get('/api/news', async (req, res) => {
  if (supabase) {
    const { data, error } = await supabase.from('news')
      .select('*')
      .is('deleted_at', null)
      .order('published_at',{ascending:false})
      .limit(100);
    if (!error) return res.json(data || []);
  }
  res.json(db.news.filter(n => !n.deleted_at));
});

app.get('/api/fixtures', (req, res) => res.json(db.fixtures));

app.get('/api/services', async (req, res) => {
  if (supabase) {
    // Check if services table exists in supabase first or just return memory
    const { data, error } = await supabase.from('services')
      .select('*')
      .is('deleted_at', null)
      .order('created_at',{ascending:false})
      .limit(100);
    if (!error) return res.json(data || []);
  }
  res.json(db.services.filter(s => !s.deleted_at));
});

// Admin guard backed by Supabase Auth and 'admins' table
const requireAdmin = async (req, res, next) => {
  if (!supabase) return res.status(503).json({ error: 'service_unavailable' });
  
  try {
    const auth = String(req.headers.authorization || '');
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
    
    if (!token) return res.status(401).json({ error: 'unauthorized_missing_token' });
    
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    
    if (userErr || !userData?.user) return res.status(401).json({ error: 'unauthorized_invalid_token' });
    
    const uid = userData.user.id;
    // Check if user is in admins table and enabled
    const { data: rows, error: qErr } = await supabase.from('admins')
      .select('role,enabled')
      .eq('user_id', uid)
      .eq('enabled', true)
      .single();
      
    if (qErr || !rows) return res.status(403).json({ error: 'forbidden_not_admin' });
    
    req.user = userData.user; // Attach user to request
    return next();
  } catch(e) {
    console.error('Auth error:', e);
    return res.status(401).json({ error: 'unauthorized_exception' });
  }
};

app.post('/api/news', requireAdmin, async (req, res) => {
  const { title, excerpt, image } = req.body || {};
  if (!title) return res.status(400).json({ error: 'title required' });
  const item = { id: nanoid(), title, excerpt: excerpt || '', image: image || '', published_at: new Date().toISOString() };
  if (supabase) {
    const { data, error } = await supabase.from('news').insert([{ id: item.id, title: item.title, excerpt: item.excerpt, image: item.image, published_at: item.published_at }]).select('*').single();
    if (!error) {
      await logAudit(req, 'CREATE', 'news', data.id, { title });
      return res.status(201).json(data);
    }
  }
  db.news.unshift(item);
  await logAudit(req, 'CREATE', 'news', item.id, { title });
  res.status(201).json(item);
});

app.put('/api/news/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, excerpt, image } = req.body || {};
  if (supabase) {
    const { data, error } = await supabase.from('news').update({ title, excerpt, image }).eq('id', id).select('*').single();
    if (!error) {
      await logAudit(req, 'UPDATE', 'news', id, { title, excerpt });
      return res.json(data);
    }
  }
  const idx = db.news.findIndex(n=>n.id===id);
  if (idx===-1) return res.status(404).json({ error:'not_found' });
  db.news[idx] = { ...db.news[idx], title: title ?? db.news[idx].title, excerpt: excerpt ?? db.news[idx].excerpt, image: image ?? db.news[idx].image };
  await logAudit(req, 'UPDATE', 'news', id, { title });
  res.json(db.news[idx]);
});

app.delete('/api/news/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const ts = new Date().toISOString();
  if (supabase) {
    const { error } = await supabase.from('news').update({ deleted_at: ts }).eq('id', id);
    if (!error) {
      await logAudit(req, 'DELETE', 'news', id, { deleted_at: ts });
      return res.json({ ok:true });
    }
  }
  const item = db.news.find(n => n.id === id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  item.deleted_at = ts;
  await logAudit(req, 'DELETE', 'news', id, { deleted_at: ts });
  res.json({ ok:true });
});

app.post('/api/services', requireAdmin, async (req, res) => {
  const { name, description, category } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const item = { id: nanoid(), name, description: description || '', category: category || '', created_at: new Date().toISOString() };
  if (supabase) {
     const { data, error } = await supabase.from('services').insert([item]).select('*').single();
     if (!error) {
       await logAudit(req, 'CREATE', 'service', data.id, { name });
       return res.status(201).json(data);
     }
  }
  db.services.unshift(item);
  await logAudit(req, 'CREATE', 'service', item.id, { name });
  res.status(201).json(item);
});

app.put('/api/services/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, category } = req.body || {};
  if (supabase) {
    const { data, error } = await supabase.from('services').update({ name, description, category }).eq('id', id).select('*').single();
    if (!error) {
      await logAudit(req, 'UPDATE', 'service', id, { name });
      return res.json(data);
    }
  }
  const idx = db.services.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  db.services[idx] = { ...db.services[idx], name: name ?? db.services[idx].name, description: description ?? db.services[idx].description, category: category ?? db.services[idx].category };
  await logAudit(req, 'UPDATE', 'service', id, { name });
  res.json(db.services[idx]);
});

app.delete('/api/services/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const ts = new Date().toISOString();
  if (supabase) {
    const { error } = await supabase.from('services').update({ deleted_at: ts }).eq('id', id);
    if (!error) {
      await logAudit(req, 'DELETE', 'service', id, { deleted_at: ts });
      return res.json({ ok: true });
    }
  }
  const item = db.services.find(s => s.id === id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  item.deleted_at = ts;
  await logAudit(req, 'DELETE', 'service', id, { deleted_at: ts });
  res.json({ ok: true });
});

app.post('/api/activities', requireAdmin, async (req, res) => {
  const { name, description, slots, image } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const item = { id: nanoid(), name, description: description || '', slots: Number(slots||0), image: image || '', created_at: new Date().toISOString() };
  if (supabase) {
    const { data, error } = await supabase.from('activities').insert([{ id: item.id, name: item.name, description: item.description, slots: item.slots, image: item.image }]).select('*').single();
    if (!error) {
      await logAudit(req, 'CREATE', 'activity', data.id, { name });
      return res.status(201).json(data);
    }
  }
  db.activities.unshift(item);
  await logAudit(req, 'CREATE', 'activity', item.id, { name });
  res.status(201).json(item);
});

app.put('/api/activities/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, slots, image } = req.body || {};
  if (supabase) {
    const { data, error } = await supabase.from('activities').update({ name, description, slots, image }).eq('id', id).select('*').single();
    if (!error) {
      await logAudit(req, 'UPDATE', 'activity', id, { name });
      return res.json(data);
    }
  }
  const idx = db.activities.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not_found' });
  db.activities[idx] = { ...db.activities[idx], name: name ?? db.activities[idx].name, description: description ?? db.activities[idx].description, slots: slots ?? db.activities[idx].slots, image: image ?? db.activities[idx].image };
  await logAudit(req, 'UPDATE', 'activity', id, { name });
  res.json(db.activities[idx]);
});

app.delete('/api/activities/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const ts = new Date().toISOString();
  if (supabase) {
    const { error } = await supabase.from('activities').update({ deleted_at: ts }).eq('id', id);
    if (!error) {
      await logAudit(req, 'DELETE', 'activity', id, { deleted_at: ts });
      return res.json({ ok:true });
    }
  }
  const item = db.activities.find(a => a.id === id);
  if (!item) return res.status(404).json({ error: 'not_found' });
  item.deleted_at = ts;
  await logAudit(req, 'DELETE', 'activity', id, { deleted_at: ts });
  res.json({ ok:true });
});

// Admin restore and audit
app.get('/api/admin/audit', requireAdmin, async (req, res) => {
  if (supabase) {
    const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) return res.json(data);
  }
  res.json(db.audit_logs || []);
});

app.get('/api/admin/trash/:entity', requireAdmin, async (req, res) => {
  const { entity } = req.params;
  const validEntities = ['news', 'activities', 'services'];
  if (!validEntities.includes(entity)) return res.status(400).json({ error: 'invalid_entity' });
  
  if (supabase) {
    const { data } = await supabase.from(entity)
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (data) return res.json(data);
  }
  
  const list = db[entity];
  if (list) {
    const deleted = list.filter(x => x.deleted_at);
    return res.json(deleted);
  }
  res.json([]);
});

app.post('/api/admin/restore/:entity/:id', requireAdmin, async (req, res) => {
  const { entity, id } = req.params;
  const validEntities = ['news', 'activities', 'services'];
  if (!validEntities.includes(entity)) return res.status(400).json({ error: 'invalid_entity' });
  
  // Plural to singular map if needed, but db keys are plural here except for supabase table names which are also plural
  const table = entity; 
  
  if (supabase) {
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq('id', id);
    if (!error) {
      await logAudit(req, 'RESTORE', entity, id, {});
      return res.json({ ok: true });
    }
  }
  
  // Memory restore
  const list = db[entity];
  if (list) {
    const item = list.find(x => x.id === id);
    if (item) {
      item.deleted_at = null;
      await logAudit(req, 'RESTORE', entity, id, {});
      return res.json({ ok: true });
    }
  }
  res.status(404).json({ error: 'not_found' });
});

app.post('/api/auth/register', (req, res) => {
  const { email, pass, name } = req.body || {};
  if (!email || !pass) return res.status(400).json({ error: 'email/pass required' });
  if (db.users.some(u => u.email === email)) return res.status(409).json({ error: 'exists' });
  db.users.push({ id: nanoid(), email, pass, name });
  res.status(201).json({ ok: true });
});

app.post('/api/auth/login', (req, res) => {
  const { email, pass } = req.body || {};
  const u = db.users.find(x => x.email === email && x.pass === pass);
  if (!u) return res.status(401).json({ error: 'invalid' });
  res.json({ email: u.email, name: u.name });
});

app.get('/api/activities/:id/enrollments', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const enrollments = db.enrollments.filter(e => e.activity_id === id);
  // Join with member info
  const result = enrollments.map(e => {
    const member = db.memberships.find(m => m.id === e.member_id);
    const payment = db.payments.find(p => p.id === e.payment_id);
    return {
      ...e,
      member_name: member?.name || 'Unknown',
      payment_date: payment?.date,
      payment_amount: payment?.amount,
      payment_method: payment?.method
    };
  });
  res.json(result);
});

app.post('/api/activities/:id/enroll', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { member_id, payment_method, amount } = req.body;
  
  if (!member_id || !payment_method || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check activity existence
  const activity = db.activities.find(a => a.id === id);
  if (!activity) return res.status(404).json({ error: 'Activity not found' });

  // Create payment
  const payment = {
    id: nanoid(),
    member_id,
    amount,
    method: payment_method,
    date: new Date().toISOString(),
    status: 'paid',
    activity_id: id,
    description: `Inscripción a ${activity.name}`
  };
  db.payments.push(payment);

  // Create enrollment
  const enrollment = {
    id: nanoid(),
    member_id,
    activity_id: id,
    payment_id: payment.id,
    status: 'confirmed',
    created_at: new Date().toISOString()
  };
  db.enrollments.push(enrollment);

  logAudit(req, 'ENROLL', 'activity', id, { member_id, payment_id: payment.id });

  res.json({ enrollment, payment });
});

// Enhanced Members List
app.get('/api/members', requireAdmin, (req, res) => {
  const { filter, status } = req.query;
  let result = db.memberships;
  
  if (filter) {
    const lowerFilter = filter.toLowerCase();
    result = result.filter(m => 
      m.name.toLowerCase().includes(lowerFilter) || 
      m.email.toLowerCase().includes(lowerFilter)
    );
  }
  
  if (status) {
    result = result.filter(m => m.status === status);
  }

  // Calculate dynamic status if not present
  result = result.map(m => {
    // Logic to determine status if not explicit
    // Default to active for seeded, logic for others
    if (!m.status) {
      // If last payment > 30 days ago, debt?
      // For demo purposes, we'll keep it simple
      m.status = m.status || 'active';
    }
    return m;
  });

  res.json(result);
});

// Member Registration with Payment
app.post('/api/members', async (req, res) => {
  const { name, email, phone, plan, payment_method, amount } = req.body;
  
  if (!name || !email || !plan || !payment_method) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const newMember = {
    id: nanoid(),
    name,
    email,
    phone,
    plan,
    status: payment_method === 'mercadopago' ? 'pending_payment' : 'active',
    last_payment_date: payment_method === 'mercadopago' ? null : new Date().toISOString(),
    joinedAt: Date.now(),
    contact_info: { phone, email }
  };

  db.memberships.push(newMember);

  if (payment_method === 'mercadopago') {
    try {
      const preference = new Preference(client);
      const result = await preference.create({
        body: {
          items: [
            {
              title: `Membresía ${plan}`,
              quantity: 1,
              unit_price: Number(amount),
              currency_id: 'ARS',
            },
          ],
          payer: { email },
          back_urls: {
            success: `http://localhost:5173/payment/success`,
            failure: `http://localhost:5173/payment/failure`,
            pending: `http://localhost:5173/payment/pending`,
          },
          auto_return: 'approved',
          external_reference: newMember.id,
        }
      });
      return res.json({ member: newMember, init_point: result.init_point });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Error creating preference' });
    }
  }

  // Simulate Payment Gateway
  const payment = {
    id: nanoid(),
    amount,
    method: payment_method,
    date: new Date().toISOString(),
    status: 'paid',
    description: `Membresía ${plan}`
  };
  
  payment.member_id = newMember.id;
  db.payments.push(payment);
  
  // Log audit if admin (or system)
  // logAudit(req, 'REGISTER', 'member', newMember.id, { plan });

  res.json({ member: newMember, payment });
});

// Mercado Pago Preference
app.post('/api/payments/create_preference', async (req, res) => {
  const { title, quantity, unit_price, member_id, email } = req.body;

  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            title: title,
            quantity: Number(quantity),
            unit_price: Number(unit_price),
            currency_id: 'ARS',
          },
        ],
        payer: {
          email: email,
        },
        back_urls: {
          success: `http://localhost:5173/payment/success`,
          failure: `http://localhost:5173/payment/failure`,
          pending: `http://localhost:5173/payment/pending`,
        },
        auto_return: 'approved',
        external_reference: member_id, // Usamos esto para identificar al socio/pago
      }
    });

    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error creating preference' });
  }
});

// Mercado Pago Webhook
app.post('/api/payments/webhook', async (req, res) => {
  const { type, data } = req.body;
  
  console.log('Webhook received:', JSON.stringify(req.body));

  if (type === 'payment') {
    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: data.id });
      
      console.log('Payment status:', paymentData.status);

      if (paymentData.status === 'approved') {
        const memberId = paymentData.external_reference;
        const member = db.memberships.find(m => m.id === memberId);
        
        if (member) {
          member.status = 'active';
          member.last_payment_date = new Date().toISOString();
          
          // Registrar pago si no existe
          if (!db.payments.some(p => p.id === String(paymentData.id))) {
             const amount = paymentData.transaction_amount;
             db.payments.push({
               id: String(paymentData.id),
               member_id: memberId,
               amount: amount,
               method: 'mercadopago',
               date: new Date().toISOString(),
               status: 'approved',
               description: paymentData.description || 'Cuota Social'
             });
             
             // Enviar email de comprobante
             await sendEmail(
               member.email, 
               'Comprobante de Pago - Italia 90', 
               `Hola ${member.name}, recibimos tu pago de $${amount}. Tu estado es ahora ACTIVO. Gracias por ser parte de Italia 90.`
             );
          }
          console.log(`Pago aprobado y registrado para socio ${memberId}`);
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error.message);
    }
  }
  res.sendStatus(200);
});

// Test Webhook (Simulate MP notification for local dev)
app.post('/api/payments/test-webhook', async (req, res) => {
  const { id, status, member_id } = req.body;
  
  if (!id || !status || !member_id) return res.status(400).json({ error: 'Missing fields' });
  
  const member = db.memberships.find(m => m.id === member_id);
  if (member) {
    if (status === 'approved') {
       member.status = 'active';
       member.last_payment_date = new Date().toISOString();
    }
    
    db.payments.push({
      id: id,
      member_id: member_id,
      amount: 1000, // Mock amount
      method: 'mercadopago_test',
      date: new Date().toISOString(),
      status: status,
      description: 'Test Payment'
    });
    
    return res.json({ success: true, message: `Payment ${status} simulated for member ${member_id}` });
  }
  
  res.status(404).json({ error: 'Member not found' });
});

// Payment Processing Endpoint
app.post('/api/payments/process', async (req, res) => {
  const { member_id, amount, method, description } = req.body;
  
  // Mock Gateway Logic
  // In real life: interact with Stripe/Getnet here
  
  const payment = {
    id: nanoid(),
    member_id,
    amount,
    method,
    date: new Date().toISOString(),
    status: 'paid',
    transaction_id: `tx_${nanoid()}`,
    description
  };
  
  db.payments.push(payment);
  
  // Update member status
  const member = db.memberships.find(m => m.id === member_id);
  if (member) {
    member.last_payment_date = payment.date;
    member.status = 'active';
  }

  res.json({ success: true, payment });
});

app.post('/api/notify', requireAdmin, async (req, res) => {
  const { memberId, type } = req.body;
  if (!memberId || !type) return res.status(400).json({ error: 'Missing fields' });

  // Simular envío de email
  console.log(`Sending notification type ${type} to member ${memberId}`);
  
  await logAudit(req, 'NOTIFY', 'member', memberId, { type });
  
  res.json({ success: true, message: 'Notification sent' });
});

app.get('/api/memberships', (req, res) => res.json(db.memberships));
app.post('/api/memberships', async (req, res) => {
  const m = req.body || {};
  const id = nanoid();
  const memberType = (m.memberType || 'activo').toLowerCase();
  const rights = {
    political: memberType === 'activo' || memberType === 'vitalicio',
    activities: true
  };
  const paysFee = memberType !== 'honorario';
  const rec = { id, ...m, memberType, rights, paysFee, joinedAt: Date.now() };
  if (supabase) {
    const { error } = await supabase.from('memberships').insert([{ id: rec.id, name: rec.name, dni: rec.dni, email: rec.email, phone: rec.phone, plan: rec.plan, price: rec.price, memberType: rec.memberType, rights: rec.rights, paysFee: rec.paysFee, joinedAt: new Date(rec.joinedAt).toISOString() }]);
    if (!error) return res.status(201).json({ id });
  }
  db.memberships.push(rec);
  res.status(201).json({ id });
});
app.get('/api/memberships/by-email', (req, res) => {
  const email = String(req.query.email || '').toLowerCase();
  if(!email) return res.status(400).json({ error: 'email required' });
  const ms = db.memberships.filter(m => (m.email||'').toLowerCase() === email);
  res.json(ms);
});

app.get('/api/payments', (req, res) => res.json(db.payments));
app.post('/api/payments', async (req, res) => {
  const { concept, amount, card, email } = req.body || {};
  if (concept === 'cuota' && email) {
    const mem = db.memberships.find(m => (m.email||'').toLowerCase() === String(email).toLowerCase());
    if (mem && mem.memberType === 'honorario') {
      const id = nanoid();
      const rec = { id, concept, amount: 0, ts: Date.now(), status: 'exento', brand: 'N/A', email };
      if (supabase) {
        await supabase.from('payments').insert([{ id: rec.id, concept: rec.concept, amount: rec.amount, ts: new Date(rec.ts).toISOString(), status: rec.status, brand: rec.brand, email: rec.email }]);
      }
      db.payments.unshift(rec);
      return res.status(201).json({ id, status: 'exento' });
    }
  }
  const ok = String(card || '').replace(/\s+/g,'').startsWith('4');
  const id = nanoid();
  const brand = /^4/.test(card||'') ? 'Visa' : 'Tarjeta';
  const rec = { id, concept, amount: Number(amount||0), ts: Date.now(), status: ok ? 'aprobado' : 'rechazado', brand, email };
  if (supabase) {
    await supabase.from('payments').insert([{ id: rec.id, concept: rec.concept, amount: rec.amount, ts: new Date(rec.ts).toISOString(), status: rec.status, brand: rec.brand, email: rec.email }]);
  }
  db.payments.unshift(rec);
  res.status(201).json({ id, status: ok ? 'aprobado' : 'rechazado', brand });
});
// Intento de cargo real vía Getnet si está configurado; si no, usa la lógica local
app.post('/api/payments/charge', async (req, res) => {
  const { concept, amount, card, name, exp, cvv, email } = req.body || {};
  const useGetnet = !!process.env.GETNET_BASE_URL && !!process.env.GETNET_CLIENT_ID && !!process.env.GETNET_CLIENT_SECRET && !!process.env.GETNET_MERCHANT_ID;
  if (!useGetnet) {
    // Fallback a la lógica existente
    req.url = '/api/payments';
    return app._router.handle(req, res);
  }
  try {
    const base = process.env.GETNET_BASE_URL;
    const authUrl = process.env.GETNET_AUTH_URL || `${base}/auth/oauth/v2/token`;
    const paymentsUrl = process.env.GETNET_PAYMENTS_URL || `${base}/v1/payments/credit`;
    const basic = Buffer.from(`${process.env.GETNET_CLIENT_ID}:${process.env.GETNET_CLIENT_SECRET}`).toString('base64');
    const tokRes = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Authorization': `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'scope=oob&grant_type=client_credentials'
    });
    if (!tokRes.ok) {
      return res.status(502).json({ error: 'getnet_auth_failed' });
    }
    const tok = await tokRes.json();
    const id = nanoid();
    const [mm,yy] = String(exp||'').split('/').map(s=>s.trim());
    const payload = {
      seller_id: process.env.GETNET_MERCHANT_ID,
      amount: Math.round(Number(amount||0)*100),
      currency: process.env.GETNET_CURRENCY || 'ARS',
      order: { order_id: id, sales_tax: 0 },
      customer: { customer_id: email || 'guest', name: name || '' },
      credit: {
        delayed: false,
        save_card_data: false,
        transaction_type: 'FULL',
        number_token: card, // En producción debe ir tokenizada; aquí se asume token ya generado
        cardholder_name: name || '',
        security_code: cvv || '',
        brand: (/^4/.test(card||'')) ? 'Visa' : 'Unknown',
        expiration_month: mm,
        expiration_year: yy && (yy.length===2 ? `20${yy}` : yy)
      }
    };
    const payRes = await fetch(paymentsUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await payRes.json().catch(()=> ({}));
    if (!payRes.ok) {
      return res.status(502).json({ error: 'getnet_charge_failed', details: data?.message || 'unknown' });
    }
    // Registrar en memoria como aprobado
    db.payments.unshift({ id, concept, amount: Number(amount||0), ts: Date.now(), status: 'aprobado', brand: payload.credit.brand, email });
    return res.status(201).json({ id, status: 'aprobado', provider: 'getnet' });
  } catch (e) {
    return res.status(502).json({ error: 'getnet_unexpected' });
  }
});
app.get('/api/payments/by-email', (req, res) => {
  const email = String(req.query.email || '').toLowerCase();
  if(!email) return res.status(400).json({ error: 'email required' });
  const ps = db.payments.filter(p => (p.email||'').toLowerCase() === email);
  res.json(ps);
});

const port = 3001;
app.listen(port, () => console.log(`Italia90 backend running on http://localhost:${port}`));
