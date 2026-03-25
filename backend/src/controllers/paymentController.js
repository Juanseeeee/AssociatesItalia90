import { MercadoPagoConfig, PreApproval, Payment, Preference } from 'mercadopago';
import supabase from '../supabase.js';
import { nanoid } from 'nanoid';
import { sendPaymentReceipt } from '../services/emailService.js';

// Configuración de Mercado Pago
const client = new MercadoPagoConfig({ 
    accessToken: process.env.MP_ACCESS_TOKEN || 'TEST-8266203530397333-102513-5a401275213670603704812674313626-179373979' 
});

export const createPaymentPreference = async (req, res) => {
    try {
        const { title, quantity, price, email, userId, enrollment_id, name, docNumber } = req.body;

        const clientUrl = process.env.CLIENT_URL || process.env.BASE_URL || 'http://localhost:5173';
        
        console.log('Creating Preference with Client URL:', clientUrl);

        const preference = new Preference(client);

        const body = {
            items: [
                {
                    title: title || 'Membresía Club Italia 90',
                    quantity: quantity || 1,
                    unit_price: Number(price) || 12000,
                    currency_id: 'ARS',
                }
            ],
            payer: {
                email: email
            },
            external_reference: enrollment_id ? `ENROLL_${enrollment_id}` : userId,
            metadata: {
                enrollment_id: enrollment_id || null,
                name: name || null,
                doc_number: docNumber || null
            },
            back_urls: {
                success: `${clientUrl}/dashboard`,
                failure: `${clientUrl}/dashboard`,
                pending: `${clientUrl}/dashboard`
            },
            notification_url: process.env.WEBHOOK_URL ? `${process.env.WEBHOOK_URL}/api/payments/webhook` : undefined
        };

        console.log('Preference Body:', JSON.stringify(body, null, 2));

        const result = await preference.create({ body });

        res.json({ id: result.id, init_point: result.init_point });
    } catch (error) {
        console.error('Error creating preference:', error);
        res.status(500).json({ 
            error: 'Error al crear la preferencia de pago', 
            details: error.message || error.response?.data || error
        });
    }
};

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
            back_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`,
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
            try {
                // Instanciar el cliente Payment solo si es necesario y ver si el problema viene de ahÃ
                console.log('Intentando obtener info del pago:', id);
                const payment = new Payment(client);
                const paymentInfo = await payment.get({ id });
                
                console.log('Payment Info from MP:', JSON.stringify(paymentInfo, null, 2));
                
                if (paymentInfo.status === 'approved') {
                    const extRef = paymentInfo.external_reference;
                    if (extRef && extRef.startsWith('ENROLL_')) {
                        const enrollmentId = extRef.replace('ENROLL_', '');
                        await activateEnrollment(enrollmentId, paymentInfo);
                    } else {
                        await activateUser(extRef, paymentInfo, 'payment');
                    }
                }
            } catch (mpError) {
                console.error(`Error al obtener pago ${id} de Mercado Pago:`, mpError.message);
                console.error(`Error details:`, mpError);
                // Si el pago no existe en MP o hay un error de auth (ej. pruebas locales), no fallamos el webhook
                if (mpError.message?.includes('not found') || mpError.message?.includes('404') || mpError.status === 404 || mpError.message?.includes('invalid access token') || mpError.status === 401) {
                    console.log('Ignorando error esperado de Mercado Pago (pago inexistente o token inválido en pruebas)');
                    return res.sendStatus(200);
                }
                throw mpError;
            }
        }

        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error general:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

const activateUser = async (userId, mpData, source = 'subscription') => {
    if (!userId) {
        console.error('activateUser: No userId provided');
        return;
    }

    try {
        console.log(`Intentando activar usuario: ${userId} via ${source}`);
        
        // 0. Check idempotency
        const externalId = mpData.id?.toString();
        if (externalId) {
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('id')
                .eq('external_id', externalId)
                .maybeSingle();
                
            if (existingPayment) {
                console.log(`Pago ${externalId} ya fue procesado anteriormente para el usuario. Omitiendo.`);
                return;
            }
        }

        // 1. Obtener membresía actual
        const { data: member, error: fetchError } = await supabase
            .from('memberships')
            .select('*')
            .eq('id', userId)
            .single();

        if (fetchError || !member) {
            console.error(`Member ${userId} not found for activation. Error:`, fetchError);
            return;
        }

        console.log(`Usuario encontrado: ${member.email}, actualizando estado...`);

        // 2. Calcular nueva fecha de expiración
        const now = new Date();
        const nextMonth = new Date(now.setMonth(now.getMonth() + 1));

        // 3. Actualizar membresía
        const { error: updateError } = await supabase
            .from('memberships')
            .update({ 
                status: 'active',
                last_payment: new Date().toISOString(),
                expiration_date: nextMonth.toISOString(),
                payment_info: {
                    method: source,
                    payment_id: mpData.id?.toString()
                }
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating membership status:', updateError);
        } else {
            console.log('Membership status updated successfully');
        }

        // 4. Registrar pago en historial
        const { error: insertError } = await supabase.from('payments').insert([{
            user_id: userId,
            email: member.email,
            amount: mpData.transaction_amount || 0,
            status: 'aprobado',
            concept: source === 'subscription' ? 'Suscripción Mensual' : 'Pago Único',
            external_id: mpData.id?.toString(),
            payment_method: source,
            created_at: new Date().toISOString()
        }]);

        if (insertError) {
            console.error('Error inserting payment record:', insertError);
        } else {
            console.log('Payment record inserted successfully');
        }

        console.log(`User ${userId} activated successfully via ${source}`);

    } catch (e) {
        console.error('Error activating user:', e);
    }
};

const activateEnrollment = async (enrollmentId, mpData) => {
    if (!enrollmentId) {
        console.error('activateEnrollment: No enrollmentId provided');
        return;
    }

    if (String(enrollmentId).startsWith('mock-')) {
        console.log(`Mock enrollment ${enrollmentId} activated via MP webhook.`);
        return;
    }

    try {
        console.log(`Intentando activar inscripción: ${enrollmentId}`);
        
        // 0. Check idempotency
        const externalId = mpData.id?.toString();
        if (externalId) {
            const { data: existingPayment } = await supabase
                .from('payments')
                .select('id')
                .eq('external_id', externalId)
                .maybeSingle();
                
            if (existingPayment) {
                console.log(`Pago ${externalId} ya fue procesado anteriormente para la inscripción. Omitiendo.`);
                return;
            }
        }

        const { data: enrollment, error } = await supabase
            .from('activity_enrollments')
            .update({ status: 'active' })
            .eq('id', enrollmentId)
            .select('*, activities(name), memberships!activity_enrollments_enrolled_by_fkey(email)')
            .single();

        if (error || !enrollment) {
            console.error(`Enrollment ${enrollmentId} not found or error:`, error);
            return;
        }

        console.log(`Inscripción actualizada, registrando pago...`);
        const metadata = mpData.metadata || {};
        
        const { error: paymentError } = await supabase.from('payments').insert([{
            user_id: enrollment.enrolled_by,
            email: metadata.email || enrollment.memberships?.email,
            amount: mpData.transaction_amount || 0,
            status: 'aprobado',
            concept: `Inscripción - ${enrollment.activities?.name}`,
            external_id: mpData.id?.toString(),
            payment_method: 'mercadopago',
            created_at: new Date().toISOString()
        }]);

        if (paymentError) {
            console.error('Error registering enrollment payment:', paymentError);
        } else {
            console.log('Enrollment payment registered successfully');
        }

        await sendPaymentReceipt(metadata.email || enrollment.memberships?.email, {
            concept: `Inscripción - ${enrollment.activities?.name}`,
            amount: mpData.transaction_amount || 0,
            memberName: metadata.name || '',
            memberDni: metadata.doc_number || '',
            transactionId: mpData.id?.toString()
        });

        console.log(`Enrollment ${enrollmentId} activated successfully`);
    } catch (e) {
        console.error('Error activating enrollment:', e);
    }
};

export const processPayment = async (req, res) => {
    try {
        const { concept, amount, email, card, docNumber, name, enrollment_id } = req.body;

        console.log(`Processing direct payment for ${email}: ${amount} (${concept})`);

        let userId = null;
        let isActivityEnrollment = false;
        
        // If no user_id is provided, try to find by email
        if (email) {
             const { data: user } = await supabase
                .from('memberships')
                .select('id')
                .eq('email', email)
                .single();
             if (user) userId = user.id;
        }

        // Check if enrollment_id is an activity enrollment
        if (enrollment_id) {
             if (String(enrollment_id).startsWith('mock-')) {
                 isActivityEnrollment = true;
             } else {
                 const { data: enrollment, error: enrollError } = await supabase
                    .from('activity_enrollments')
                    .select('id')
                    .eq('id', enrollment_id)
                    .maybeSingle();
                 if (enrollment) {
                     isActivityEnrollment = true;
                 } else if (enrollError && enrollError.code === 'PGRST205') {
                     // Table missing, but it's not a mock ID? Treat as activity enrollment to be safe
                     isActivityEnrollment = true;
                 } else {
                     // Fallback if it was used as userId previously
                     userId = enrollment_id;
                 }
             }
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
        }

        // If it's a membership payment, activate user
        if (userId && (concept.toLowerCase().includes('inscripción') || concept.toLowerCase().includes('cuota') || concept.toLowerCase().includes('suscripción')) && !isActivityEnrollment) {
             const now = new Date();
             const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
             await supabase
                .from('memberships')
                .update({ 
                    status: 'active',
                    last_payment: new Date().toISOString(),
                    expiration_date: nextMonth.toISOString()
                })
                .eq('id', userId);
        }

        if (isActivityEnrollment) {
             if (!String(enrollment_id).startsWith('mock-')) {
                 await supabase
                    .from('activity_enrollments')
                    .update({ status: 'active' })
                    .eq('id', enrollment_id);
             } else {
                 console.log(`Simulated enrollment ${enrollment_id} payment processed.`);
             }
        }

        // Send Email Receipt
        await sendPaymentReceipt(email, {
            concept,
            amount: Number(amount),
            memberName: name || '',
            memberDni: docNumber || '',
            transactionId: data?.id || paymentData.external_id
        });

        res.json({ status: 'aprobado', id: data?.id || nanoid() });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'Error processing payment' });
    }
};

export const getPayments = async (req, res) => {
    const { data, error } = await supabase
        .from('payments')
        .select('*, memberships(email, name, first_name, last_name)')
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    
    // Flatten the response for easier frontend consumption
    const payments = data.map(p => {
        let userName = p.memberships?.name;
        if (!userName && p.memberships?.first_name) {
            userName = `${p.memberships.first_name} ${p.memberships.last_name || ''}`.trim();
        }
        const methodRaw = p.payment_method || p.method;
        const methodLabel = methodRaw === 'mercadopago' ? 'Mercado Pago' 
            : methodRaw === 'credit_card_simulated' ? 'Tarjeta' 
            : methodRaw === 'manual' ? 'Manual' 
            : methodRaw || 'Otro';
        return {
            ...p,
            email: p.email || p.memberships?.email,
            user_name: userName,
            createdAt: p.created_at || p.date || null,
            method_label: methodLabel
        };
    });
    
    res.json(payments);
};

export const getPaymentsByEmail = async (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const { data, error } = await supabase.from('payments').select('*').eq('email', email).order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
};

export const getPaymentReceipt = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).send('Missing payment id');
        
        // Find payment by id OR external_id
        const { data: payment, error } = await supabase
            .from('payments')
            .select('*')
            .or(`id.eq.${id},external_id.eq.${id}`)
            .order('created_at', { ascending: false })
            .maybeSingle();
        if (error || !payment) return res.status(404).send('Payment not found');
        
        // Fetch member info (best-effort)
        let memberName = '';
        if (payment.user_id) {
            const { data: member } = await supabase
                .from('memberships')
                .select('email, name, first_name, last_name, dni')
                .eq('id', payment.user_id)
                .maybeSingle();
            memberName = member?.name || `${member?.first_name || ''} ${member?.last_name || ''}`.trim();
        }
        
        const concept = payment.concept || 'Cuota Social';
        const amount = Number(payment.amount || 0).toLocaleString('es-AR');
        const date = new Date(payment.created_at || payment.date || Date.now()).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
        const method = (payment.payment_method || '—').replace('_', ' ');
        const status = String(payment.status || 'aprobado').toUpperCase();
        const txId = payment.external_id || payment.id || '—';
        const email = payment.email || '—';
        const dni = payment.dni || '';
        
        const styles = `
            @page { size: A4; margin: 24mm; }
            body { font-family: Inter, Arial, sans-serif; color: #0f172a; }
            .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #f42b29; padding-bottom: 12px; margin-bottom: 16px; }
            .brand { font-family: 'Bebas Neue', Inter, sans-serif; font-size: 24px; letter-spacing: 0.5px; text-transform: uppercase; color: #070571; }
            .title { font-family: 'Bebas Neue', Inter, sans-serif; font-size: 20px; text-transform: uppercase; letterSpacing: 0.5px; margin: 0; color: #0f172a; }
            .meta { font-size: 12px; color: #64748b; margin-top: 4px; }
            .table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            .table th, .table td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .table th { text-align: left; color: #64748b; font-weight: 600; }
            .amount { font-weight: 700; }
            .status { font-weight: 700; color: #049756; }
            .footer { margin-top: 24px; font-size: 11px; color: #64748b; }
            .logo { height: 48px; }
        `;
        
        const html = `
            <!doctype html>
            <html lang="es">
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                <title>Comprobante de Pago</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="header">
                <img class="logo" src="/logo-italia90.png" alt="Italia 90" />
                <div>
                    <div class="brand">Club Italia 90</div>
                    <h1 class="title">Comprobante de Pago</h1>
                    <div class="meta">Documento válido como constancia de pago</div>
                </div>
                </div>
                <table class="table">
                <tr><th>Socio</th><td>${memberName || '—'}</td></tr>
                <tr><th>DNI</th><td>${dni || '—'}</td></tr>
                <tr><th>Concepto</th><td>${concept}</td></tr>
                <tr><th>Fecha</th><td>${date}</td></tr>
                <tr><th>Método</th><td>${method}</td></tr>
                <tr><th>Monto</th><td class="amount">$${amount}</td></tr>
                <tr><th>Estado</th><td class="status">${status}</td></tr>
                <tr><th>ID de Transacción</th><td>${txId}</td></tr>
                <tr><th>Email</th><td>${email}</td></tr>
                </table>
                <div class="footer">
                Ante cualquier consulta, comunicarse con administración del Club Italia 90.<br/>
                Este documento puede ser presentado como comprobante de pago. Emitido automáticamente por el sistema.
                </div>
                <script>window.onload = () => { window.print(); }</script>
            </body>
            </html>
        `;
        
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (e) {
        console.error('Receipt error:', e);
        return res.status(500).send('Error generating receipt');
    }
};
