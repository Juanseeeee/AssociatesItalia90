
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFile = path.join(__dirname, 'smoke_test.log');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
}

// Clear log file
fs.writeFileSync(logFile, '');

const API_URL = 'http://localhost:3001/api';

async function runSmokeTest() {
  log('🚀 Starting Smoke Test...');

  // 1. Check Server Health (using activities endpoint as health check)
  try {
    const res = await fetch(`${API_URL}/activities`);
    if (!res.ok) throw new Error('Server not reachable');
    log('✅ Backend is running');
  } catch (e) {
    log('❌ Backend is NOT running. Please start the server first.');
    log(e.message);
    process.exit(1);
  }

  // 2. Register a new user (simulate frontend call)
  const uniqueId = Date.now();
  const newUser = {
    firstName: 'Test',
    lastName: `User${uniqueId}`,
    email: `test${uniqueId}@example.com`,
    password: 'password123',
    dni: `9${uniqueId}`.slice(0, 8), // Ensure 8 chars approx
    phone: '1234567890',
    address: 'Calle Falsa 123',
    province: 'CABA',
    city: 'Belgrano',
    zipCode: '1428',
    birthDate: '01/01/1990', // Required by frontend validation logic
    // Simulate NO payment initially to test pending state
    // encryptedData: null 
  };

  log(`\n👤 Registering user: ${newUser.email}...`);
  let token = '';
  let userId = '';

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    const data = await res.json();
    
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    
    token = data.token;
    userId = data.user.id;
    log(`✅ Registration successful. User ID: ${userId}`);
    
    // Check initial status (should be pending_payment because we sent no encryptedData)
    const cardRes = await fetch(`${API_URL}/members/${userId}/card`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cardData = await cardRes.json();
    
    if (cardData.status === 'pending_payment') {
      log('✅ Initial status is "pending_payment" (Correct)');
    } else {
      log(`❌ Initial status is ${cardData.status} (Expected pending_payment)`);
    }

  } catch (e) {
    log(`❌ Registration failed: ${e.message}`);
    // Don't exit, try to continue if possible or return
    return;
  }

  // 3. Process Payment
  log('\n💳 Processing Payment...');
  try {
    const payRes = await fetch(`${API_URL}/members/${userId}/pay`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 5000, method: 'credit_card' })
    });
    const payData = await payRes.json();
    
    if (!payRes.ok) throw new Error(payData.error || 'Payment failed');
    
    if (payData.success && payData.member.status === 'active') {
        log('✅ Payment successful. Member status updated to "active".');
        log(`   New Expiration: ${payData.member.expiration}`);
    } else {
        log(`❌ Payment response invalid: ${JSON.stringify(payData)}`);
    }

  } catch (e) {
    log(`❌ Payment failed: ${e.message}`);
  }

  // 4. Verify Digital ID Data after Payment
  log('\n🆔 Verifying Digital ID Data...');
  try {
    const cardRes = await fetch(`${API_URL}/members/${userId}/card`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const cardData = await cardRes.json();
    
    if (cardData.status === 'active' && cardData.qr_data && cardData.lastPayment) {
        log('✅ Digital ID data is complete and active.');
        log(`   QR Data: ${cardData.qr_data}`);
    } else {
        log(`❌ Digital ID data incomplete or inactive: ${JSON.stringify(cardData)}`);
    }
  } catch (e) {
    log(`❌ Digital ID verification failed: ${e.message}`);
  }
  
  // 5. Verify Duplicate Check
  log('\n🔍 Verifying Anti-Duplicate Logic...');
  try {
      const dupRes = await fetch(`${API_URL}/auth/check-duplicate?email=${newUser.email}`);
      const dupData = await dupRes.json();
      if (dupData.exists && dupData.field === 'email') {
          log('✅ Duplicate Email detected correctly.');
      } else {
          log('❌ Duplicate Email NOT detected.');
      }

      const dupDniRes = await fetch(`${API_URL}/auth/check-duplicate?dni=${newUser.dni}`);
      const dupDniData = await dupDniRes.json();
      if (dupDniData.exists && dupDniData.field === 'dni') {
          log('✅ Duplicate DNI detected correctly.');
      } else {
          log('❌ Duplicate DNI NOT detected.');
      }
  } catch (e) {
      log(`❌ Duplicate check failed: ${e.message}`);
  }

  log('\n✨ Smoke Test Completed.');
}

runSmokeTest();
