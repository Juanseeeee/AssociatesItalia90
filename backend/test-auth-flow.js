import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dummy image exists
const dummyImagePath = path.join(__dirname, 'dummy_test.jpg');
if (!fs.existsSync(dummyImagePath)) {
    fs.writeFileSync(dummyImagePath, Buffer.from('dummy image content'));
}

const API_URL = 'http://localhost:3003/api';
const LOG_FILE = 'test-auth-result.txt';

function log(message) {
    console.log(message);
    fs.appendFileSync(LOG_FILE, message + '\n');
}

async function runTest() {
    fs.writeFileSync(LOG_FILE, `Test started at ${new Date().toISOString()}\n`);

    const email = `testuser${Date.now()}@example.com`;
    const password = 'TestPassword123!';
    let token = null;

    try {
        // 1. REGISTER
        log(`\n--- 1. Testing Registration for ${email} ---`);
        const form = new FormData();
        form.append('email', email);
        form.append('password', password);
        form.append('firstName', 'Test');
        form.append('lastName', 'User');
        form.append('dni', Date.now().toString().slice(-8));
        form.append('phone', '1234567890');
        form.append('role', 'member');
        form.append('address', 'Calle Falsa 123');
        form.append('province', 'Buenos Aires');
        form.append('city', 'La Plata');
        form.append('zipCode', '1900');
        form.append('encryptedData', 'bW9ja0VuY3J5cHRlZERhdGE='); // mock base64

        form.append('photo', fs.createReadStream(dummyImagePath));
        form.append('frontDni', fs.createReadStream(dummyImagePath));
        form.append('backDni', fs.createReadStream(dummyImagePath));

        const regRes = await axios.post(`${API_URL}/auth/register`, form, {
            headers: { ...form.getHeaders() }
        });

        log(`Registration Status: ${regRes.status}`);
        if (regRes.data.token) {
            log('Registration Success: Token received');
            token = regRes.data.token;
        } else {
            log('Registration Warning: No token returned');
        }

        // 2. LOGIN
        log(`\n--- 2. Testing Login for ${email} ---`);
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email,
            password
        });
        
        log(`Login Status: ${loginRes.status}`);
        if (loginRes.data.token) {
            log('Login Success: Token received');
            token = loginRes.data.token; // Update token just in case
        } else {
            log('Login Failed: No token');
        }

        // 3. GET PROFILE
        log(`\n--- 3. Testing Get Profile (/me) ---`);
        const meRes = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        log(`Get Profile Status: ${meRes.status}`);
        log(`User Email: ${meRes.data.email}`);
        log(`User Role: ${meRes.data.role}`);

        log('\n--- TEST COMPLETED SUCCESSFULLY ---');

    } catch (error) {
        log('\n--- TEST FAILED ---');
        if (error.response) {
            log(`Status: ${error.response.status}`);
            log(`Data: ${JSON.stringify(error.response.data)}`);
        } else {
            log(`Error: ${error.message}`);
        }
    }
}

runTest();
