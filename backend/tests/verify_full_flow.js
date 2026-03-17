
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3003/api';

// Create a valid PNG buffer (1x1 transparent pixel)
const pngBuffer = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2d480000000049454e44ae426082', 'hex');

async function runTest() {
  try {
    console.log('--- STARTING FULL FLOW TEST ---');

    // 1. Create Membership Request (Minor)
    console.log('\n1. Creating Membership Request (Minor)...');
    const form = new FormData();
    form.append('type', 'minor');
    
    const personalData = {
      firstName: 'TestMinor',
      lastName: 'Flow',
      email: `minor.flow.${Date.now()}@test.com`,
      phone: '1122334455',
      dni: '99887766',
      birthDate: '2015-01-01',
      address: 'Test Address 123',
      guardianName: 'Test Guardian',
      guardianDni: '11223344',
      guardianRelation: 'Father'
    };
    
    form.append('personal_data', JSON.stringify(personalData));
    form.append('recommendations', '[]');
    form.append('signature', JSON.stringify({ method: 'biometric_mobile', timestamp: new Date().toISOString() }));
    
    // Append files
    form.append('photo', pngBuffer, { filename: 'photo.png', contentType: 'image/png' });
    form.append('medical_cert', pngBuffer, { filename: 'medical.png', contentType: 'image/png' });
    form.append('consent', pngBuffer, { filename: 'consent.png', contentType: 'image/png' });
    form.append('image_auth', pngBuffer, { filename: 'auth.png', contentType: 'image/png' });

    const createRes = await fetch(`${API_URL}/membership-requests`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    if (!createRes.ok) {
        const errText = await createRes.text();
        throw new Error(`Create Request Failed: ${createRes.status} ${errText}`);
    }

    const createData = await createRes.json();
    console.log('Request Created. ID:', createData.id);
    const requestId = createData.id;

    // 2. Approve Request (Admin)
    console.log('\n2. Approving Request...');
    // Mock admin auth if needed, or dev bypass
    const approveRes = await fetch(`${API_URL}/membership-requests/${requestId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dev-token'
      },
      body: JSON.stringify({ status: 'approved' })
    });

    if (!approveRes.ok) {
        const errText = await approveRes.text();
        throw new Error(`Approve Request Failed: ${approveRes.status} ${errText}`);
    }

    const approveData = await approveRes.json();
    console.log('Request Approved. Member ID:', approveData.memberId);
    const memberId = approveData.memberId;

    if (!memberId) {
        throw new Error('Member ID not returned after approval');
    }

    // 3. Verify Digital ID Data
    console.log('\n3. Verifying Digital ID Data...');
    const cardRes = await fetch(`${API_URL}/members/${memberId}/card`);
    
    if (!cardRes.ok) {
        const errText = await cardRes.text();
        throw new Error(`Get Card Failed: ${cardRes.status} ${errText}`);
    }

    const cardData = await cardRes.json();
    console.log('Card Data:', cardData);

    // Assertions
    if (cardData.name !== 'TestMinor Flow') throw new Error(`Name mismatch: ${cardData.name} vs TestMinor Flow`);
    if (cardData.category !== 'Socio Cadete') throw new Error(`Category mismatch: ${cardData.category} vs Socio Cadete`); // Minor -> Socio Cadete
    if (cardData.qr_data !== 'MEMBER-99887766') throw new Error(`QR Data mismatch: ${cardData.qr_data} vs MEMBER-99887766`);

    console.log('\n--- TEST PASSED SUCCESSFULLY ---');

  } catch (error) {
    console.error('\n--- TEST FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

runTest();
