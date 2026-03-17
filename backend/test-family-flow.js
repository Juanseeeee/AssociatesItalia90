import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3003/api';
const LOG_FILE = 'test-family-result.txt';

// Ensure dummy image
const dummyImagePath = path.join(__dirname, 'dummy_family.jpg');
if (!fs.existsSync(dummyImagePath)) {
    fs.writeFileSync(dummyImagePath, Buffer.from('dummy image content'));
}

function log(message) {
    console.log(message);
    try { fs.appendFileSync(LOG_FILE, message + '\n'); } catch(e){}
}

async function runTest() {
    try { 
        fs.writeFileSync(LOG_FILE, `Test started at ${new Date().toISOString()}\n`); 
    } catch(e){}

    const email = `family_test_${Date.now()}@example.com`;
    const password = 'Password123!';
    let token = null;
    let userId = null;
    let familyMemberId = null;

    try {
        // 1. Register User
        log(`1. Registering user ${email}...`);
        const regForm = new FormData();
        regForm.append('email', email);
        regForm.append('password', password);
        regForm.append('firstName', 'Parent');
        regForm.append('lastName', 'User');
        regForm.append('dni', `DNI${Date.now()}`);
        regForm.append('phone', '1234567890');
        
        // Mock file for user photo
        regForm.append('photo', fs.createReadStream(dummyImagePath));
        regForm.append('frontDni', fs.createReadStream(dummyImagePath));
        regForm.append('backDni', fs.createReadStream(dummyImagePath));

        const regRes = await axios.post(`${API_URL}/auth/register`, regForm, { 
            headers: { ...regForm.getHeaders() } 
        });
        log('User registered.');
        userId = regRes.data.user.id;

        // 2. Login
        log('2. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, { email, password });
        token = loginRes.data.token;
        log('Logged in. Token received.');

        // 3. Add Family Member
        log('3. Adding family member...');
        const famForm = new FormData();
        famForm.append('firstName', 'Child');
        famForm.append('lastName', 'User');
        famForm.append('dni', `KID${Date.now()}`);
        famForm.append('birthDate', '2015-05-20');
        famForm.append('relation', 'child');
        famForm.append('medicalInfo', 'None');
        
        famForm.append('photo', fs.createReadStream(dummyImagePath));
        famForm.append('dni_copy', fs.createReadStream(dummyImagePath));
        famForm.append('school_cert', fs.createReadStream(dummyImagePath));
        famForm.append('auth_parents', fs.createReadStream(dummyImagePath));

        const famRes = await axios.post(`${API_URL}/user/family`, famForm, {
            headers: {
                ...famForm.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });

        log(`Family Member Added. Status: ${famRes.status}`);
        familyMemberId = famRes.data.id;
        log(`Member ID: ${familyMemberId}`);

        // 4. Register Family Member to Activity
        log('4. Registering family member to activity (futbol)...');
        // Assuming 'futbol' activity exists as per db seed
        const activityId = 'futbol'; 
        
        try {
            const enrollRes = await axios.post(`${API_URL}/activities/${activityId}/register`, {
                memberId: familyMemberId
            }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            log(`Enrollment Status: ${enrollRes.status}`);
            log(`Enrollment Data: ${JSON.stringify(enrollRes.data)}`);
            
            if (enrollRes.status === 201) {
                log('SUCCESS: Family member enrolled in activity.');
            } else {
                log('FAILURE: Unexpected status code.');
            }

        } catch (enrollError) {
            log(`Enrollment Failed: ${enrollError.message}`);
            if (enrollError.response) {
                log(`Enrollment Error Data: ${JSON.stringify(enrollError.response.data)}`);
            }
        }

    } catch (error) {
        log('TEST FAILED');
        if (error.response) {
            log(`Status: ${error.response.status}`);
            log(`Data: ${JSON.stringify(error.response.data)}`);
        } else {
            log(`Error: ${error.message}`);
        }
    }
}

runTest();
