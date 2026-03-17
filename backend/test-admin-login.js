
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3003/api';

async function testAdminLogin() {
  console.log('Testing Admin Login...');
  try {
    const res = await fetch(`${API_URL}/auth/admin-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@italia90.com',
        password: 'AdminPassword123!'
      })
    });

    if (res.ok) {
      const data = await res.json();
      console.log('Admin Login SUCCESS');
      console.log('Token:', data.token ? 'Received' : 'Missing');
      console.log('User Role:', data.user?.role);
      
      if (data.user?.role === 'admin') {
        console.log('TEST PASSED: User is admin.');
      } else {
        console.error('TEST FAILED: User is NOT admin.');
      }
    } else {
      const err = await res.text();
      console.error('Admin Login FAILED:', res.status, err);
    }
  } catch (e) {
    console.error('Exception:', e);
  }
}

testAdminLogin();
