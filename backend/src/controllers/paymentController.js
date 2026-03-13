import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import supabase from '../supabase.js';
import { nanoid } from 'nanoid';

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-8266203530397333-102513-5a401275213670603704812674313626-179373979' 
});

export const createSubscription = async (req, res) => {
    try {
        const { email, reason, amount } = req.body;
        
        // Buscar usuario en Supabase (memberships table holds profile info including email)
        const { data: user, error } = await supabase
            .from('memberships')
            .select('id, email')
            .eq('email', email)
            .single();
        
        if (error || !user) {
            console.error('User not found for subscription:', email);
            return res.status(404).json({ error: 'User not found' });
        }

        const preapproval = new PreApproval(client);

        const subscriptionData = {
            reason: reason || 'Suscripción Mensual - Club Italia 90',
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: amount || 12000,
                currency_id: 'ARS'
            },
            back_url: process.env.CLIENT_URL || 'http://localhost:5173/dashboard',
            payer_email: email,
            external_reference: user.id, // Vinculamos la suscripción al ID del usuario (Auth ID)
            status: 'pending'
        };

        const result = await preapproval.create({ body: subscriptionData });
        
        console.log(`Suscripción creada para ${email}: ${result.init_point}`);

        res.json({ init_point: result.init_point, id: result.id });
    } catch (error) {
        console.error('Error creating subscription:', error);
        res.status(500).json({ error: 'Error al crear la suscripción', details: error.message });
    }
};

export const handleWebhook = async (req, res) => {
    const { type, data } = req.body;
    const topic = req.query.topic || type;
    const id = req.query.id || data?.id;

    console.log(`Webhook recibido: ${topic} - ID: ${id}`);

    try {
        if (topic === 'preapproval') {
            const preapproval = new PreApproval(client);
            const subscription = await preapproval.get({ id });
            
            if (subscription.status === 'authorized') {
                await activateUser(subscription.external_reference, subscription);
            }
        } else if (topic === 'payment') {
            const payment = new Payment(client);
            const paymentInfo = await payment.get({ id });
            
            if (paymentInfo.status === 'approved') {
                await activateUser(paymentInfo.external_reference, paymentInfo, 'payment');
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
};

const activateUser = async (userId, mpData, source = 'subscription') => {
    if (!userId) return;

    try {
        // 1. Obtener membresía actual
        const { data: member, error: fetchError } = await supabase
            .from('memberships')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !member) {
            console.error(`Member ${userId} not found for activation`);
            return;
        }

        // 2. Calcular nueva fecha de expiración
        const now = new Date();
        const nextMonth = new Date(now.setMonth(now.getMonth() + 1));

        // 3. Actualizar membresía
        await supabase
            .from('memberships')
            .update({ 
                status: 'active',
                last_payment_date: new Date().toISOString(),
                expiration_date: nextMonth.toISOString()
            })
            .eq('id', userId);

        // 4. Registrar pago en historial
        await supabase.from('payments').insert([{
            user_id: userId,
            amount: mpData.transaction_amount || 0,
            status: 'aprobado',
            concept: source === 'subscription' ? 'Suscripción Mensual' : 'Pago Único',
            external_id: mpData.id?.toString(),
            payment_method: source
        }]);

        console.log(`User ${userId} activated successfully via ${source}`);

    } catch (e) {
        console.error('Error activating user:', e);
    }
};

// --- New Endpoints for Direct Payment ---

export const processPayment = async (req, res) => {
    try {
        const { concept, amount, email, card, docNumber, name, enrollment_id } = req.body;

        console.log(`Processing direct payment for ${email}: ${amount} (${concept})`);

        // Insert into Supabase payments table
        // We might not have user_id if it's a new registration not yet in memberships
        // But enrollment_id might be passed.
        
        let userId = enrollment_id;
        
        // If no enrollment_id, try to find by email
        if (!userId && email) {
             const { data: user } = await supabase
                .from('memberships')
                .select('id')
                .eq('email', email)
                .single();
             if (user) userId = user.id;
        }

        const paymentData = {
            user_id: userId || null, // Can be null if guest payment
            email,
            amount: Number(amount),
            concept,
            status: 'aprobado',
            payment_method: 'credit_card_simulated',
            external_id: nanoid(),
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('payments')
            .insert([paymentData])
            .select()
            .single();

        if (error) {
            console.error('Error saving payment to DB:', error);
            // We continue to return success to frontend for simulation purposes
            // even if DB write fails (e.g. schema mismatch)
        }

        // If it's a membership payment, activate user
        if (userId && (concept.toLowerCase().includes('inscripción') || concept.toLowerCase().includes('cuota') || concept.toLowerCase().includes('suscripción'))) {
             // Re-use activate logic but simplified
             const now = new Date();
             const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
             await supabase
                .from('memberships')
                .update({ 
                    status: 'active',
                    last_payment_date: new Date().toISOString(),
                    expiration_date: nextMonth.toISOString()
                })
                .eq('id', userId);
        }

        res.json({ status: 'aprobado', id: data?.id || nanoid() });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'Error processing payment' });
    }
};

export const getPayments = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getPaymentsByEmail = async (req, res) => {
    const { email } = req.query;
    if (!email) return res.json([]);
    
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('email', email)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
