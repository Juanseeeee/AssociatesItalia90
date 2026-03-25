import dotenv from 'dotenv';
dotenv.config();
import { handleWebhook } from './src/controllers/paymentController.js';

const req = {
    body: { type: 'payment', data: { id: '12345' } },
    query: { topic: 'payment', id: '12345' }
};

const res = {
    sendStatus: (code) => console.log('sendStatus:', code),
    status: (code) => ({ json: (data) => console.log('status:', code, 'json:', data) })
};

handleWebhook(req, res).then(() => console.log('Done')).catch(e => console.error(e));
