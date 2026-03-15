const axios = require('axios');

async function debugRedirect() {
    const apiToken = '8PvkXgHvSfqZ2tMZHHMFaC5Psc4MrnboCSMdJ5ZqIWqi';
    const backend = 'ibm_fez';
    const hub = 'ibm-q', group = 'open', project = 'main';

    console.log('Obtaining Token...');
    // Try IAM exchange for this token
    const params = new URLSearchParams();
    params.set('grant_type', 'urn:ibm:params:oauth:grant-type:apikey');
    params.set('apikey', apiToken);
    const iamRes = await axios.post('https://iam.cloud.ibm.com/identity/token', params);
    const accessToken = iamRes.data.access_token;
    console.log('IAM Token Success.');

    const payload = {
        qasm: 'OPENQASM 2.0; include "qelib1.inc"; qreg q[1]; creg c[1]; measure q[0] -> c[0];',
        backend: { name: backend },
        hub, group, project,
        shots: 10
    };

    const url = 'https://quantum-computing.ibm.com/api/Jobs';
    console.log(`Submitting to: ${url}`);
    
    try {
        const res = await axios.post(url, payload, {
            headers: { 
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            maxRedirects: 0 // Don't follow to see where it goes
        });
        console.log('SUCCESS:', res.status);
    } catch (e) {
        console.log('FAILED:', e.response ? e.response.status : e.message);
        if (e.response && e.response.headers.location) {
            console.log('Redirecting to:', e.response.headers.location);
        }
        if (e.response && typeof e.response.data === 'string' && e.response.data.includes('html')) {
            console.log('Body is HTML');
        }
    }
}

debugRedirect();
