import express from 'express';
import { checkDuplicate, register, login, adminLogin, getMe, forgotPassword } from '../controllers/authController.js';
import multer from 'multer';

const router = express.Router();

// Multer setup (could be shared, but defining here for isolation)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Middleware local (o importar desde middleware compartido)
// Por simplicidad, asumimos que requireAuth se pasará o se importará si se mueve a un archivo separado.
// Como getMe requiere autenticación, necesitamos el middleware.
// Vamos a mover los middlewares a src/middleware/auth.js para compartir.

import { requireAuth } from '../middleware/auth.js';

router.get('/check-duplicate', checkDuplicate);
router.post('/register', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'frontDni', maxCount: 1 },
  { name: 'backDni', maxCount: 1 }
]), register);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.get('/me', requireAuth, getMe);

export default router;
