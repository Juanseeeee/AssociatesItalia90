
const fetch = require('node-fetch'); // Assuming node-fetch is available or using built-in fetch in Node 18+

const API_URL = 'http://localhost:3001/api';

async function runSmokeTest() {
  console.log('🚀 Starting Smoke Test...');

  // 1. Check Server Health (using activities endpoint as health check)
  try {
    const res = await fetch(`${API_URL}/activities`);
    if (!res.ok) throw new Error('Server not reachable');
    console.log('✅ Backend is running');
  } catch (e) {
    console.error('❌ Backend is NOT running. Please start the server first.');
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
    // Simulate NO payment initially to test pending state
    // encryptedData: null 
  };

  console.log(`\n👤 Registering user: ${newUser.email}...`);
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
    console.log('✅ Registration successful. User ID:', userId);
    
    // Check initial status (should be pending_payment because we sent no encryptedData)
    // Wait, the backend logic: const paymentSuccess = !!encryptedData; -> status: paymentSuccess ? 'active' : 'pending_payment'
    // But verify via /api/members/:id/card
    const cardRes = await fetch(`${API_URL}/members/${userId}/card`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const cardData = await cardRes.json();
    
    if (cardData.status === 'pending_payment') {
      console.log('✅ Initial status is "pending_payment" (Correct)');
    } else {
      console.error('❌ Initial status is', cardData.status, '(Expected pending_payment)');
    }

  } catch (e) {
    console.error('❌ Registration failed:', e.message);
    return;
  }

  // 3. Process Payment
  console.log('\n💳 Processing Payment...');
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
        console.log('✅ Payment successful. Member status updated to "active".');
        console.log('   New Expiration:', payData.member.expiration);
    } else {
        console.error('❌ Payment response invalid:', payData);
    }

  } catch (e) {
    console.error('❌ Payment failed:', e.message);
  }

  // 4. Verify Digital ID Data after Payment
  console.log('\n🆔 Verifying Digital ID Data...');
  try {
    const cardRes = await fetch(`${API_URL}/members/${userId}/card`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const cardData = await cardRes.json();
    
    if (cardData.status === 'active' && cardData.qr_data && cardData.lastPayment) {
        console.log('✅ Digital ID data is complete and active.');
        console.log('   QR Data:', cardData.qr_data);
    } else {
        console.error('❌ Digital ID data incomplete or inactive:', cardData);
    }
  } catch (e) {
    console.error('❌ Digital ID verification failed:', e.message);
  }
  
  // 5. Verify Duplicate Check
  console.log('\n🔍 Verifying Anti-Duplicate Logic...');
  try {
      const dupRes = await fetch(`${API_URL}/auth/check-duplicate?email=${newUser.email}`);
      const dupData = await dupRes.json();
      if (dupData.exists && dupData.field === 'email') {
          console.log('✅ Duplicate Email detected correctly.');
      } else {
          console.error('❌ Duplicate Email NOT detected.');
      }

      const dupDniRes = await fetch(`${API_URL}/auth/check-duplicate?dni=${newUser.dni}`);
      const dupDniData = await dupDniRes.json();
      if (dupDniData.exists && dupDniData.field === 'dni') {
          console.log('✅ Duplicate DNI detected correctly.');
      } else {
          console.error('❌ Duplicate DNI NOT detected.');
      }
  } catch (e) {
      console.error('❌ Duplicate check failed:', e.message);
  }

  console.log('\n✨ Smoke Test Completed.');
}

runSmokeTest();
