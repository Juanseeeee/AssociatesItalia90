import axios from 'axios';

const API_URL = 'http://localhost:3003/api';

async function testTravelAuthFlow() {
  try {
    console.log('--- Testing Travel Authorization Flow ---');

    // 1. Create Authorization (Parent 1)
    console.log('\n1. Creating Authorization Request...');
    const authData = {
      type: 'travel_auth',
      data: {
        minorName: 'Test Minor',
        minorDni: '12345678',
        destination: 'Mar del Plata',
        startDate: '2024-01-01',
        endDate: '2024-01-15',
        parent1Name: 'Parent One',
        parent1Dni: '87654321',
        parent1Email: 'parent1@test.com'
      },
      signatures: {
        parent1: {
          signed: true,
          timestamp: new Date().toISOString(),
          method: 'biometric_mobile'
        },
        parent2: null
      }
    };

    const createRes = await axios.post(`${API_URL}/travel-authorizations`, authData);
    const authId = createRes.data.id;
    console.log('Authorization Created. ID:', authId);

    // 2. Verify Initial Status
    console.log('\n2. Verifying Initial Status...');
    const getRes1 = await axios.get(`${API_URL}/travel-authorizations/${authId}`);
    if (getRes1.data.status !== 'pending_parent2') {
      throw new Error(`Expected status 'pending_parent2', got '${getRes1.data.status}'`);
    }
    console.log('Status Verified: pending_parent2');

    // 3. Sign Authorization (Parent 2)
    console.log('\n3. Signing Authorization (Parent 2)...');
    const signData = {
      parent2_data: {
        name: 'Parent Two',
        dni: '11223344',
        email: 'parent2@test.com'
      },
      signature: 'data:image/png;base64,fakeSignatureData'
    };

    const signRes = await axios.post(`${API_URL}/travel-authorizations/${authId}/sign`, signData);
    console.log('Signature Submitted.');

    // 4. Verify Final Status
    console.log('\n4. Verifying Final Status...');
    const getRes2 = await axios.get(`${API_URL}/travel-authorizations/${authId}`);
    if (getRes2.data.status !== 'approved') {
      throw new Error(`Expected status 'approved', got '${getRes2.data.status}'`);
    }
    console.log('Status Verified: approved');
    console.log('Parent 2 Data:', getRes2.data.parent2_data);

    console.log('\n--- Test Passed Successfully ---');

  } catch (error) {
    console.error('\n--- Test Failed ---');
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    process.exit(1);
  }
}

testTravelAuthFlow();
