import supabase from '../supabase.js';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

export const checkDuplicate = async (req, res) => {
  const { email, dni } = req.query;
  
  try {
    if (email) {
      const { data, error } = await supabase
        .from('memberships')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (data) return res.json({ exists: true, field: 'email', message: 'El correo electrónico ya está registrado.' });
    }
    
    if (dni) {
      const { data, error } = await supabase
        .from('memberships')
        .select('id')
        .eq('dni', dni)
        .maybeSingle();
        
      if (data) return res.json({ exists: true, field: 'dni', message: 'El DNI ya está registrado.' });
    }
    
    res.json({ exists: false });
  } catch (error) {
    console.error('Check duplicate error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

export const register = async (req, res) => {
  const { email, password, firstName, lastName, dni, phone, role, address, province, city, zipCode, encryptedData } = req.body;
  
  // 1. Basic Validation
    if (!email || !password || !firstName || !lastName || !dni) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Password Strength Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.' });
    }

    // DNI Validation (numeric)
    if (!/^\d+$/.test(dni)) {
        return res.status(400).json({ error: 'El DNI debe contener solo números.' });
    }

    // 2. Pre-check duplication (Database level)
  try {
    const { data: existing } = await supabase
        .from('memberships')
        .select('id')
        .or(`email.eq.${email},dni.eq.${dni}`)
        .maybeSingle();

    if (existing) {
        return res.status(409).json({ error: 'El usuario ya existe (DNI o Email duplicado)' });
    }
  } catch (err) {
      console.error('Error checking duplicates:', err);
      return res.status(500).json({ error: 'Error interno verificando duplicados' });
  }

  let userId = null;

  try {
    // 3. Process Files
    const fileUrls = {};
    if (req.files) {
      for (const [key, fileArray] of Object.entries(req.files)) {
        const file = fileArray[0];
        const filename = `users/${Date.now()}-${nanoid(6)}${path.extname(file.originalname)}`;
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
          console.error(`Error saving file ${key}:`, e);
          // Continue execution, file might be missing but we proceed
        }
      }
    }

    // 4. Create Auth User in Supabase
    // Usamos admin.createUser para asegurar creación backend-side sin restricciones de cliente (captcha, confirmación)
    console.log(`Attempting to create user with email: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email para permitir login inmediato
      user_metadata: { firstName, lastName, dni, phone }
    });
    
    console.log('Auth Data received:', JSON.stringify(authData, null, 2));

    if (authError) {
        // Handle "User already registered" specifically
        if (authError.message.includes('already registered')) {
            return res.status(409).json({ error: 'El correo electrónico ya está registrado en el sistema de autenticación.' });
        }
        throw new Error(`Auth Error: ${authError.message}`);
    }
    
    if (!authData.user || !authData.user.id) {
        console.error('CRITICAL: User created but no ID returned:', JSON.stringify(authData));
        throw new Error('Error crítico: Usuario creado sin ID válido.');
    }

    userId = authData.user.id;
    console.log(`User created in Auth: ${userId}`);

    // 5. Create Membership Profile
    const paymentSuccess = !!encryptedData;
    const expirationDate = new Date();
    // Si hay pago exitoso, activamos por 1 año, si no, estado 'disabled' o 'pending_payment'
    // La migración 05 añade el enum membership_status ('active', 'inactive', 'pending_payment', 'disabled')
    // Por defecto es 'disabled'.
    
    let status = 'disabled';
    if (paymentSuccess) {
        status = 'active';
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
        // Si no hay pago, lo dejamos como 'pending_payment' para indicar que falta completar
        status = 'pending_payment';
    }

    const newMember = {
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      dni,
      phone,
      address,
      city,
      province,
      zip_code: zipCode,
      role: 'user', // Default role
      membership_number: nanoid(8).toUpperCase(), // Temporary
      expiration_date: paymentSuccess ? expirationDate : null,
      status: status, // New field from migration
      created_at: new Date()
    };

    const { error: memberError } = await supabase.from('memberships').insert([newMember]);
    
    if (memberError) {
        console.error('Error inserting membership, rolling back Auth:', memberError);
        
        // Check for specific schema errors
        if (memberError.message.includes('Could not find the') || memberError.code === '42703') { // 42703 is undefined_column
             // Try to rollback
             await supabase.auth.admin.deleteUser(userId);
             return res.status(500).json({ 
                 error: 'Error de configuración de base de datos: Faltan columnas en la tabla memberships. Por favor ejecute la migración 05_add_status_and_audit.sql.',
                 details: memberError.message
             });
        }

        throw new Error(`Membership Error: ${memberError.message}`);
    }

    // 6. Record Initial Payment if applicable
    if (paymentSuccess) {
      const { error: paymentError } = await supabase.from('payments').insert([{
          id: nanoid(),
          member_id: userId,
          amount: 5000,
          date: new Date().toISOString(),
          concept: 'Cuota Social Inicial',
          method: 'credit_card',
          status: 'aprobado'
      }]);
      
      if (paymentError) {
          console.error('Error recording initial payment (non-fatal):', paymentError);
          // We don't rollback user for payment log error, just log it.
      }
    }
    
    const token = jwt.sign({ id: userId, email, role: role || 'user' }, JWT_SECRET, { expiresIn: '24h' });
    
    res.status(201).json({ user: { ...newMember, id: userId }, token });

  } catch (error) {
    console.error('Registration failed:', error.message);
    
    // ROLLBACK STRATEGY
    if (userId) {
        try {
            // Attempt to delete the user from Auth to maintain consistency
            // This requires SERVICE_ROLE_KEY to be set in supabase.js client
            const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
            if (deleteError) {
                console.error('CRITICAL: Failed to rollback (delete) user in Auth:', deleteError);
            } else {
                console.log(`Rollback successful: User ${userId} deleted from Auth.`);
            }
        } catch (rollbackError) {
            console.error('CRITICAL: Exception during rollback:', rollbackError);
        }
    }

    // Determine status code based on error
    const statusCode = error.message.includes('Auth Error') ? 400 : 500;
    res.status(statusCode).json({ error: error.message || 'Error en el proceso de registro' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: 'Credenciales inválidas' });
    
    const userId = data.user.id;
    
    // Fetch profile
    const { data: member, error: memberError } = await supabase
        .from('memberships')
        .select('*')
        .eq('id', userId)
        .single();

    if (memberError && memberError.code !== 'PGRST116') {
        console.error('Login profile fetch error:', memberError);
    }

    const userProfile = member || {
        id: userId,
        email: data.user.email,
        role: 'user',
        firstName: data.user.user_metadata?.firstName,
        lastName: data.user.user_metadata?.lastName
    };

    const token = jwt.sign({ id: userId, email: userProfile.email, role: 'user' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ user: userProfile, token });
  } catch (e) {
      console.error('Login error:', e);
      res.status(500).json({ error: 'Error interno al iniciar sesión' });
  }
};

export const getMe = async (req, res) => {
    try {
        const { data: member, error } = await supabase
            .from('memberships')
            .select('*')
            .eq('id', req.user.id)
            .single();
        
        if (error || !member) return res.status(404).json({ error: 'Usuario no encontrado' });
        res.json(member);
    } catch (e) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email es requerido' });

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:5173/reset-password', // Adjust for production
        });

        if (error) throw error;
        
        res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });
    } catch (e) {
        console.error('Forgot Password error:', e);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
};
