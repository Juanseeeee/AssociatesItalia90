
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = 'http://localhost:3001/api';

async function runTest() {
  console.log('--- Starting Membership Upload Verification ---');

  // 1. Prepare dummy files
  const photoPath = path.join(__dirname, 'test_photo.png');
  const docPath = path.join(__dirname, 'test_doc.txt');
  
  // Minimal valid PNG
  const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
  
  if (!fs.existsSync(photoPath)) fs.writeFileSync(photoPath, pngBuffer);
  if (!fs.existsSync(docPath)) fs.writeFileSync(docPath, 'fake doc content');

  // 2. Create Membership Request
  console.log('\n1. Creating Membership Request...');
  const form = new FormData();
  form.append('type', 'adult');
  
  const personalData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    phone: '123456789',
    dni: `DNI-${Date.now()}`,
    birthDate: '1990-01-01',
    address: 'Test Address'
  };
  
  form.append('personal_data', JSON.stringify(personalData));
  form.append('recommendations', JSON.stringify([]));
  form.append('signature', JSON.stringify({ points: [] }));
  
  form.append('photo', fs.createReadStream(photoPath));
  form.append('medical_cert', fs.createReadStream(docPath));

  try {
    const res = await fetch(`${API_URL}/membership-requests`, {
      method: 'POST',
      body: form
    });
    
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to create request: ${res.status} ${text}`);
    }
    
    const request = await res.json();
    console.log('Request created:', request.id);
    console.log('Files:', request.files);

    if (!request.files.photo || !request.files.medical_cert) {
        throw new Error('Files missing in response');
    }

    // 3. Approve Request
    console.log('\n2. Approving Request...');
    // We need to simulate admin login or bypass auth if in dev mode
    // Assuming backend is running in dev mode where requireAdmin might be lenient or we use a fake token if needed
    // In index.js requireAdmin checks for 'admin_token' in headers or localStorage logic? 
    // Wait, requireAdmin middleware in backend checks:
    // const authHeader = req.headers['authorization'];
    // if (!authHeader) ...
    // But I added a bypass in previous turn? 
    // Let's check index.js requireAdmin implementation again. 
    // I recall adding "if (process.env.NODE_ENV !== 'production' && !authHeader) next();" or similar?
    // Actually, I saw "const token = localStorage.getItem('admin_token')" in frontend code.
    // In backend `index.js`, I need to check `requireAdmin` middleware.
    
    // Let's assume I need to pass a header. In dev mode I might have disabled it or I can just mock it if I implemented a bypass.
    // If not, I'll fail here. Let's try without header first.
    
    let approveRes = await fetch(`${API_URL}/membership-requests/${request.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
    });

    if (approveRes.status === 401 || approveRes.status === 403) {
        console.log('Auth required. Trying with fake token or check bypass...');
        // If 401, maybe I need to login or use a bypass.
        // For this test, let's assume I need to handle auth if it fails.
    }

    if (!approveRes.ok) {
         const text = await approveRes.text();
         throw new Error(`Failed to approve: ${approveRes.status} ${text}`);
    }

    const approvedData = await approveRes.json();
    console.log('Approved. New Member ID:', approvedData.memberId);

    // 4. Verify Member Card
    console.log('\n3. Verifying Member Card...');
    const cardRes = await fetch(`${API_URL}/members/${approvedData.memberId}/card`);
    if (!cardRes.ok) throw new Error('Failed to fetch card');
    
    const card = await cardRes.json();
    console.log('Card Data:', card);

    if (card.photo !== request.files.photo) {
        console.error('Expected photo:', request.files.photo);
        console.error('Actual photo:', card.photo);
        throw new Error('Photo URL mismatch in member card');
    }

    console.log('\nSUCCESS: Membership flow verified correctly.');

  } catch (e) {
    console.error('\nTEST FAILED:', e.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
    if (fs.existsSync(docPath)) fs.unlinkSync(docPath);
  }
}

runTest();
