const axios = require('axios');

async function testQuantumDirect() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;

    const payload = {
        qasm: 'OPENQASM 2.0; include "qelib1.inc"; qreg q[1]; creg c[1]; measure q[0] -> c[0];',
        backend: { name: 'ibm_fez' },
        hub: 'ibm-q', group: 'open', project: 'main',
        shots: 1
    };

    // Use the direct target domain
    const url = 'https://quantum.ibm.com/api/Jobs';
    console.log(`Submitting to: ${url}`);
    
    try {
        const res = await axios.post(url, payload, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        console.log('SUCCESS:', res.status, res.data.id || res.data.jobId);
    } catch (e) {
        console.log('FAILED:', e.response ? e.response.status : e.message);
        if (e.response && typeof e.response.data === 'string' && e.response.data.includes('html')) {
            console.log('Got HTML Login Page');
            // Check if there are any specific error headers
        } else if (e.response) {
            console.log('Error Data:', JSON.stringify(e.response.data));
        }
    }
}

testQuantumDirect();
