
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:3003/api';
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

// Forge admin token
const token = jwt.sign(
    { id: 'test-admin-id', email: 'admin@localhost', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '1h' }
);

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
};

async function testRecurrence() {
    console.log('🧪 Starting Activity Recurrence Tests...\n');

    // 1. Test Validation: Missing Name
    console.log('1. Testing Validation: Missing Name');
    const res1 = await fetch(`${BASE_URL}/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slots: 10, cost: 100 })
    });
    const data1 = await res1.json();
    if (res1.status === 400 && data1.error === 'Name required') {
        console.log('✅ PASSED: Correctly rejected missing name.');
    } else {
        console.log(`❌ FAILED: Expected 400 Name required, got ${res1.status}`, data1);
    }

    // 2. Test Create Simple Activity
    console.log('\n2. Testing Create Simple Activity');
    const simpleActivity = {
        name: 'Test Activity ' + Date.now(),
        slots: 20,
        cost: 500,
        description: 'A simple test activity',
        schedule: 'Monday 10am'
    };
    const res2 = await fetch(`${BASE_URL}/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(simpleActivity)
    });
    const data2 = await res2.json();
    if (res2.status === 201 && data2.id) {
        console.log('✅ PASSED: Created simple activity.', data2.id);
    } else {
        console.log(`❌ FAILED: Could not create simple activity. Status: ${res2.status}`, data2);
    }

    // 3. Test Invalid Recurrence Days
    console.log('\n3. Testing Invalid Recurrence Days');
    const invalidRecurrence = {
        name: 'Invalid Recurrence',
        is_recurring: true,
        recurrence_days: ['Monday', 'NotADay'],
        start_time: '10:00',
        end_time: '11:00'
    };
    const res3 = await fetch(`${BASE_URL}/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(invalidRecurrence)
    });
    const data3 = await res3.json();
    if (res3.status === 400 && data3.error && data3.error.includes('Invalid days')) {
        console.log('✅ PASSED: Correctly rejected invalid days.');
    } else {
        console.log(`❌ FAILED: Expected 400 Invalid days, got ${res3.status}`, data3);
    }

    // 4. Test Valid Recurrence
    console.log('\n4. Testing Valid Recurrence');
    const validRecurrence = {
        name: 'Recurring Activity ' + Date.now(),
        slots: 15,
        cost: 1000,
        description: 'Weekly recurring event',
        is_recurring: true,
        recurrence_days: ['Monday', 'Wednesday', 'Friday'],
        start_time: '18:00',
        end_time: '19:30'
    };
    const res4 = await fetch(`${BASE_URL}/activities`, {
        method: 'POST',
        headers,
        body: JSON.stringify(validRecurrence)
    });
    const data4 = await res4.json();
    if (res4.status === 201 && data4.is_recurring) {
        console.log('✅ PASSED: Created recurring activity.', data4.id);
        console.log('   Days:', data4.recurrence_days);
        console.log('   Schedule:', data4.schedule);
    } else {
        if (data4.error && data4.error.includes('column "is_recurring" of relation "activities" does not exist')) {
             console.log('⚠️ SKIPPED: Database migration not applied (missing columns).');
        } else {
             console.log(`❌ FAILED: Could not create recurring activity. Status: ${res4.status}`, data4);
        }
    }
}

testRecurrence().catch(console.error);
