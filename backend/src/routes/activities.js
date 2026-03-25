import express from 'express';
import { getActivities, createActivity, updateActivity, deleteActivitySoft, enrollMember, getEnrollments, getActivityEnrollments } from '../controllers/activityController.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';

const router = express.Router();

// Multer setup for activity images
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Public/Member routes
router.get('/', getActivities);
router.get('/enrollments', requireAuth, getEnrollments);
router.post('/:id/enroll', requireAuth, enrollMember);

// Admin routes
router.get('/:id/enrollments', requireAuth, requireAdmin, getActivityEnrollments);
router.post('/', requireAuth, requireAdmin, upload.single('image'), createActivity);
router.put('/:id', requireAuth, requireAdmin, upload.single('image'), updateActivity);
router.delete('/:id', requireAuth, requireAdmin, deleteActivitySoft);

export default router;
