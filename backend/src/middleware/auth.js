import jwt from 'jsonwebtoken';
import supabase from '../supabase.js';
const isProd = process.env.NODE_ENV === 'production';
const JWT_SECRET = process.env.JWT_SECRET || (isProd ? '' : 'super-secret-key-change-in-prod');

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const requireAdmin = async (req, res, next) => {
  try {
    // We can trust the JWT role if we set it in metadata, but better check the admins table
    const { data: adminUser, error } = await supabase
      .from('admins')
      .select('role, enabled')
      .eq('user_id', req.user.id)
      .eq('enabled', true)
      .single();

    if (error || !adminUser) {
        // Fallback for dev environment or initial admin setup
        // Allow access if the user's role in the JWT is 'admin' (set during login based on memberships/metadata)
        if (req.user.role === 'admin' || (process.env.NODE_ENV !== 'production' && req.user.email === 'admin@localhost')) {
            console.warn(`⚠️ Admin check bypassed for ${req.user.email} (JWT Role fallback)`);
            return next();
        }
        return res.status(403).json({ error: 'forbidden_not_admin' });
    }
    
    return next();
  } catch(e) {
    console.error('Auth error:', e);
    return res.status(401).json({ error: 'unauthorized_exception' });
  }
};
