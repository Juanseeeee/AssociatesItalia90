
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body || '{}') });
        } catch (e) {
            resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Test User';
  const dni = `DNI_${Date.now()}`;

  try {
    console.log('--- START AUTH TEST ---');
    // 1. Register
    console.log(`1. Registering user: ${email}`);
    const regRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password, name, dni, phone: '123456789' });

    console.log(`   Register Status: ${regRes.statusCode}`);
    if (regRes.statusCode !== 201 && regRes.statusCode !== 200) {
      console.log(`   Register Body: ${JSON.stringify(regRes.body)}`);
      throw new Error(`Register failed`);
    }

    // 2. Login
    console.log('2. Logging in...');
    const loginRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password });

    console.log(`   Login Status: ${loginRes.statusCode}`);
    if (loginRes.statusCode !== 200 || !loginRes.body.token) {
      console.log(`   Login Body: ${JSON.stringify(loginRes.body)}`);
      throw new Error(`Login failed`);
    }
    const token = loginRes.body.token;
    console.log('   Token received successfully');

    // 3. Get Me
    console.log('3. Getting profile (Me)...');
    const meRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`   Get Me Status: ${meRes.statusCode}`);
    if (meRes.statusCode !== 200) {
      console.log(`   Get Me Body: ${JSON.stringify(meRes.body)}`);
      throw new Error(`Get Me failed`);
    }
    console.log(`   Profile Name: ${meRes.body.name}`);
    
    console.log('--- AUTH TEST SUCCESS ---');

  } catch (e) {
    console.error('--- AUTH TEST FAILED ---');
    console.error(e.message);
  }
}

run();
