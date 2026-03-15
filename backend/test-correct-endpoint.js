const axios = require('axios');

async function testCorrectEndpoint() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const qasmCode = 'OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[2];\ncreg c[2];\nh q[0];\ncx q[0],q[1];\nmeasure q -> c;';

    const payload = {
        program_id: 'sampler',
        backend: 'ibm_fez',
        params: {
            pubs: [[qasmCode, null, 1024]]
        }
    };

    const endpoints = [
        'https://quantum.cloud.ibm.com/api/v1/jobs',
        'https://us-east.quantum-computing.cloud.ibm.com/jobs'
    ];

    for (const url of endpoints) {
        console.log(`\nTesting POST: ${url}`);
        try {
            const res = await axios.post(url, payload, {
                headers: { 
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'IBM-API-Version': '2025-01-01'
                }
            });
            console.log('SUCCESS!', res.status);
            console.log('Job ID:', res.data.id);
            console.log('Status:', res.data.status);
            break; // Stop on first success
        } catch (e) {
            console.log('FAILED:', e.response ? `${e.response.status} - ${JSON.stringify(e.response.data).substring(0, 200)}` : e.message);
        }
    }
}

testCorrectEndpoint();
