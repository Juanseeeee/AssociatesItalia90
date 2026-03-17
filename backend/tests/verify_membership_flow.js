const API = 'http://localhost:3003/api';

async function run() {
    try {
        console.log('1. Creating Membership Request...');
        const reqData = {
            firstName: 'Test',
            lastName: 'User',
            email: `test${Date.now()}@example.com`,
            phone: '123456789',
            docNumber: `DNI-${Date.now()}`,
            birthDate: '1990-01-01',
            address: 'Calle Falsa 123'
        };
        
        let reqId;
        try {
            const res1 = await fetch(`${API}/membership-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reqData)
            });
            if (res1.ok) {
                const data = await res1.json();
                console.log('Request Created:', data);
                reqId = data.id;
            } else {
                console.log('JSON POST failed:', res1.status, await res1.text());
            }
        } catch (e) {
            console.log('Creation failed, trying existing requests...', e.message);
        }

        if (!reqId) {
             const resList = await fetch(`${API}/membership-requests`);
             if (resList.ok) {
                 const list = await resList.json();
                 if (list.length > 0) {
                     const pending = list.find(r => r.status === 'pending');
                     if (pending) {
                         reqId = pending.id;
                         console.log('Using existing pending request ID:', reqId);
                     } else {
                         console.log('No pending requests found.');
                         return;
                     }
                 } else {
                     console.log('No requests available.');
                     return;
                 }
             }
        }

        console.log(`2. Approving Request ${reqId}...`);
        const res2 = await fetch(`${API}/membership-requests/${reqId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved' })
        });
        
        const data2 = await res2.json();
        console.log('Approve Response:', res2.status, data2);

        console.log('3. Verifying Member Creation...');
        let memberId = data2.memberId;
        
        if (!memberId) {
            const membersRes = await fetch(`${API}/members`);
            const members = await membersRes.json();
            const sorted = members.sort((a,b) => new Date(b.joinedAt) - new Date(a.joinedAt));
            if (sorted.length > 0) {
                memberId = sorted[0].id;
                console.log('Assuming last created member is the one:', memberId);
            }
        } else {
            console.log('Member ID returned:', memberId);
        }

        if (memberId) {
            console.log('4. Fetching Digital ID...');
            try {
                const res3 = await fetch(`${API}/members/${memberId}/card`);
                const data3 = await res3.json();
                console.log('Digital ID Data:', data3);
                
                if (data3.status) {
                    console.log('SUCCESS: Digital ID fetched correctly');
                } else {
                    console.error('FAILURE: Digital ID data incomplete');
                }
            } catch (e) {
                console.error('Failed to fetch card:', e.message);
            }
        } else {
            console.error('Could not determine Member ID');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

run();