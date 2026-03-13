import express from 'express';
import { createSubscription, handleWebhook, processPayment, getPayments, getPaymentsByEmail } from '../controllers/paymentController.js';

const router = express.Router();

router.get('/', getPayments);
router.post('/', processPayment);
router.get('/by-email', getPaymentsByEmail);
router.post('/subscribe', createSubscription);
router.post('/webhook', handleWebhook);

export default router;
