import supabase from '../supabase.js';
import { nanoid } from 'nanoid';
import { randomUUID } from 'crypto';

export const getAllMembers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMemberCard = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: member, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !member) return res.status(404).json({ error: 'Member not found' });
    
    const qrData = `http://localhost:5173/verificar/${member.id}`;
    
    // Handle inconsistencies in DB schema (name vs first_name/last_name)
    const fullName = member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Socio';
    
    res.json({
      id: member.id,
      name: fullName,
      category: member.category || member.member_type || 'Socio',
      status: member.status,
      joinedAt: member.joined_at,
      expiration: member.expiration_date || member.expiration, // Handle both naming conventions
      photo: member.photo_url || member.photo, // Handle photo_url vs photo
      qr_data: qrData,
      lastPayment: member.last_payment_date || member.last_payment,
      payment_status: member.payment_status,
      dni: member.dni
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMemberPayments = async (req, res) => {
  const { id } = req.params;
  try {
    const { data: history, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', id) // Changed from member_id to user_id based on previous file reads
      .order('created_at', { ascending: false }); // Changed from date to created_at
    
    if (error) throw error;
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processManualPayment = async (req, res) => {
  const { id } = req.params;
  const { amount, method } = req.body;
  
  try {
    // 1. Get Member
    const { data: member } = await supabase.from('memberships').select('*').eq('id', id).single();
    if (!member) return res.status(404).json({ error: 'Member not found' });

    // 2. Update Member
    const currentExp = member.expiration_date ? new Date(member.expiration_date) : new Date();
    const now = new Date();
    const baseDate = currentExp > now ? currentExp : now;
    baseDate.setMonth(baseDate.getMonth() + 1);

    await supabase.from('memberships').update({
        status: 'active',
        payment_status: 'completed',
        last_payment_date: new Date().toISOString(),
        expiration_date: baseDate.toISOString(),
        payment_method: method || 'manual',
        payment_id: nanoid()
    }).eq('id', id);

    // 3. Record Payment
    const payment = {
      user_id: id,
      email: member.email,
      amount: amount || 5000,
      status: 'aprobado',
      concept: 'Cuota Social (Manual)',
      payment_method: method || 'manual',
      external_id: nanoid(),
      created_at: new Date().toISOString()
    };
    
    const { data: paymentData, error: paymentError } = await supabase.from('payments').insert([payment]).select().single();
    if (paymentError) throw paymentError;

    res.json({ success: true, member: { ...member, status: 'active' }, payment: paymentData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createMember = async (req, res) => {
  const { name, email, phone, dni, status, plan } = req.body;
  
  try {
    // Note: This creates a member in the DB but NOT an Auth User. 
    // They won't be able to login unless an Auth User is created separately.
    const newMember = {
      id: randomUUID(), // Generates a UUID since we don't have an Auth ID yet
      name,
      email,
      phone,
      dni,
      status: status || 'pending_payment',
      member_type: plan || 'standard',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from('memberships').insert([newMember]).select().single();
    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMember = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  try {
    const { data, error } = await supabase
      .from('memberships')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteMember = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabase.from('memberships').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
