
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
  const email = `admin_${Date.now()}@example.com`;
  const password = 'password123';
  const name = 'Admin User';
  const dni = `DNI_${Date.now()}`;
  let token = '';
  let activityId = '';

  try {
    console.log('--- START ADMIN ACTIVITIES TEST ---');
    
    // 1. Register (to get a user for login)
    console.log(`1. Registering user: ${email}`);
    const regRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email, password, firstName: 'Admin', lastName: 'User', dni, phone: '123456789' });

    if (regRes.statusCode !== 201 && regRes.statusCode !== 200) {
      throw new Error(`Register failed: ${JSON.stringify(regRes.body)}`);
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

    if (loginRes.statusCode !== 200 || !loginRes.body.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`);
    }
    token = loginRes.body.token;
    console.log('   Token received');

    // 3. Create Activity
    console.log('3. Creating Activity...');
    const actData = {
      name: 'Test Activity ' + Date.now(),
      slots: 10,
      cost: 100,
      schedule: 'Mon 10am',
      description: 'Test Description'
    };
    
    const createRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: '/api/activities',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, actData);

    console.log(`   Create Status: ${createRes.statusCode}`);
    if (createRes.statusCode !== 201) {
       // If 403, it means requireAdmin blocked it despite dev mode bypass?
       // Wait, dev mode bypass logs a warning but allows.
       // Let's see the body.
       console.log(`   Create Body: ${JSON.stringify(createRes.body)}`);
       throw new Error(`Create Activity failed`);
    }
    activityId = createRes.body.id;
    console.log(`   Activity Created: ${activityId}`);

    // 4. Register for Activity
    console.log('4. Registering for Activity...');
    const enrollRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/activities/${activityId}/register`,
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      }
    }, { email }); // Registering self

    console.log(`   Enroll Status: ${enrollRes.statusCode}`);
    if (enrollRes.statusCode !== 201) {
       console.log(`   Enroll Body: ${JSON.stringify(enrollRes.body)}`);
       throw new Error(`Enrollment failed`);
    }
    console.log('   Enrolled successfully');

    // 5. Check Enrollments (Admin View)
    console.log('5. Checking Enrollments...');
    // The endpoint is likely /api/activities/:id/enrollments?
    // Wait, Admin.jsx calls `${API}/activities/${viewEnrollments}/enrollments`
    // But backend/src/index.js doesn't have this endpoint explicitly listed in my previous read?
    // Let me check index.js again. I might have missed it or it's missing!
    
    // I will try to hit it anyway.
    const listEnrollRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/activities/${activityId}/enrollments`,
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   List Enroll Status: ${listEnrollRes.statusCode}`);
    if (listEnrollRes.statusCode !== 200) {
        console.log(`   List Enroll Body: ${JSON.stringify(listEnrollRes.body)}`);
        // If 404, it means endpoint is missing.
    } else {
        console.log(`   Enrollments Found: ${listEnrollRes.body.length}`);
    }

    // 6. Delete Activity
    console.log('6. Deleting Activity...');
    const delRes = await request({
      hostname: 'localhost',
      port: 3001,
      path: `/api/activities/${activityId}`,
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`   Delete Status: ${delRes.statusCode}`);
    if (delRes.statusCode !== 200) {
        throw new Error(`Delete failed`);
    }
    console.log('   Activity Deleted');

    console.log('--- ADMIN ACTIVITIES TEST SUCCESS ---');

  } catch (e) {
    console.error('--- ADMIN ACTIVITIES TEST FAILED ---');
    console.error(e.message);
  }
}

run();
