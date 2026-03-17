import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { 
    getAllMembers, 
    getMemberCard, 
    getMemberPayments, 
    processManualPayment,
    createMember,
    updateMember,
    deleteMember
} from '../controllers/memberController.js';

const router = express.Router();

router.get('/', requireAuth, requireAdmin, getAllMembers);
router.post('/', requireAuth, requireAdmin, createMember);
router.put('/:id', requireAuth, requireAdmin, updateMember);
router.delete('/:id', requireAuth, requireAdmin, deleteMember);

router.get('/:id/card', getMemberCard);
router.get('/:id/payments', requireAuth, getMemberPayments);
router.post('/:id/pay', requireAuth, processManualPayment);

export default router;
